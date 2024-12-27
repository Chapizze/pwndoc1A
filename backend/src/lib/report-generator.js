var fs = require('fs');
var Docxtemplater = require('docxtemplater');
var PizZip = require("pizzip");
var expressions = require('./report-filters');
let expressionParser = require('docxtemplater/expressions.js')
var ImageModule = require('docxtemplater-image-module-pwndoc');
var sizeOf = require('image-size');
var customGenerator = require('./custom-generator');
var utils = require('./utils');
var _ = require('lodash');
var Image = require('mongoose').model('Image');
var Settings = require('mongoose').model('Settings');
var CVSS31 = require('./cvsscalc31.js');
var translate = require('../translate')
var $t
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
var Stats = require('./stats')
const Chart = require('chart.js/auto');


// Generate document with docxtemplater
async function generateDoc(audit, userId) {
    var templatePath = `${__basedir}/../report-templates/${audit.template.name}.${audit.template.ext || 'docx'}`
    var content = fs.readFileSync(templatePath, "binary");

    var zip = new PizZip(content);

    translate.setLocale(audit.language)
    $t = translate.translate

    var settings = await Settings.getAll();
    var preppedAudit = await prepAuditData(audit, settings)

    var opts = {};
    // opts.centered = true;
    opts.getImage = function (tagValue, tagName) {
        if (tagValue !== "undefined") {
            tagValue = tagValue.split(",")[1];
            return Buffer.from(tagValue, 'base64');
        }
        // return fs.readFileSync(tagValue, {encoding: 'base64'});
    }
    opts.getSize = function (img, tagValue, tagName) {
        if (img) {
            var sizeObj = sizeOf(img);
            var width = sizeObj.width;
            var height = sizeObj.height;
            if (tagName === "company.logo_small") {
                var divider = sizeObj.height / 37;
                height = 37;
                width = Math.floor(sizeObj.width / divider);
            }
            else if (tagName === "company.logo") {
                var divider = sizeObj.height / 250;
                height = 250;
                width = Math.floor(sizeObj.width / divider);
                if (width > 400) {
                    divider = sizeObj.width / 400;
                    height = Math.floor(sizeObj.height / divider);
                    width = 400;
                }
            }
            else if (sizeObj.width > 600) {
                var divider = sizeObj.width / 600;
                width = 600;
                height = Math.floor(sizeObj.height / divider);
            }
            return [width, height];
        }
        return [0, 0];
    }

    if (settings.report.private.imageBorder && settings.report.private.imageBorderColor)
        opts.border = settings.report.private.imageBorderColor.replace('#', '')

    try {
        var imageModule = new ImageModule(opts);
    }
    catch (err) {
        console.log(err)
    }
    expressionParser.filters = { ...expressions, ...customGenerator.expressions }
    var doc = new Docxtemplater(zip, {
        parser: parser,
        paragraphLoop: true,
        linebreaks: true,
        modules: [imageModule]
    });
    customGenerator.apply(preppedAudit);

    try {
        doc.render({
            ...preppedAudit,
            ...(await prepChartData(audit, userId))
        });
    }
    catch (error) {
        if (error.properties.id === 'multi_error') {
            error.properties.errors.forEach(function (err) {
                console.log(err);
            });
        }
        else
            console.log(error)
        if (error.properties && error.properties.errors instanceof Array) {
            const errorMessages = error.properties.errors.map(function (error) {
                return `Explanation: ${error.properties.explanation}\nScope: ${JSON.stringify(error.properties.scope).substring(0, 142)}...`
            }).join("\n\n");
            // errorMessages is a humanly readable message looking like this :
            // 'The tag beginning with "foobar" is unopened'
            throw `Template Error:\n${errorMessages}`;
        }
        else {
            throw error
        }
    }
    var buf = doc.getZip().generate({ type: "nodebuffer" });

    return buf;
}
exports.generateDoc = generateDoc;

async function prepChartData(audit, userId) {
    async function fetchData() {

        const findingNumbers = await Stats.getFindingByCategoryAudit(true, audit._id, userId)

        const categories = []
        for (const finding of audit.findings) {
            if (finding.category && !categories.includes(finding.category)) {
                categories.push(finding.category)
            }
        }
        const data = {
            categories: categories,
            findingNumbers: findingNumbers[0].data
        }
        return data;
    }

    async function fetchSeverityData(audit) {
        const severityLevels = ['Critical', 'High', 'Medium', 'Low'];
        const severityCounts = {
            'Critical': 0,
            'High': 0,
            'Medium': 0,
            'Low': 0
        };

        // Count findings by severity
        for (const finding of audit.findings) {
            const sev = Stats.getFindingSeverity(finding, audit)
            if (sev && severityLevels.includes(sev)) {
                severityCounts[sev]++;
            }
        }

        // Convert to array for easier charting
        const severityData = severityLevels.map(level => severityCounts[level]);
        const totalFindings = severityData.reduce((a, b) => a + b, 0);


        return { severityData, totalFindings, severityLevels };
    }

    // Create Column Chart

    const createColumnChart = async (data, labels) => {
        // Chart configuration with modern Chart.js approach
        const configuration = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Findings by Category',
                    data: data,
                    backgroundColor: 'rgba(0, 0, 255, 0.7)', // Blue with opacity
                    borderColor: 'blue',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Findings by Category',
                        font: {
                            size: 16,
                            family: 'Arial, sans-serif',
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Findings',
                            font: {
                                size: 12,
                                family: 'Arial, sans-serif',
                                color: 'black'
                            }
                        },
                        ticks: {
                            stepSize: 1,
                            font: {
                                family: 'Arial, sans-serif',
                                size: 10
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Categories',
                            font: {
                                size: 12,
                                family: 'Arial, sans-serif'
                            }
                        },
                        ticks: {
                            font: {
                                family: 'Arial, sans-serif',
                                size: 10
                            }
                        }
                    }
                }
            },
            plugins: [{
                // Custom plugin to ensure crisp rendering
                id: 'crispEdges',
                beforeDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.imageSmoothingEnabled = false;
                    ctx.webkitImageSmoothingEnabled = false;
                }
            }]
        };

        // Create canvas with updated configuration
        const width = 600;
        const height = 300;
        const chartCanvas = new ChartJSNodeCanvas({
            width,
            height,
            backgroundColour: 'white'
        });

        // Configure defaults globally (if needed)
        Chart.defaults.font.family = 'Arial, sans-serif';
        Chart.defaults.font.size = 12;

        // Render to buffer with high quality
        const buffer = await chartCanvas.renderToBuffer(configuration);

        // Convert to base64
        return buffer.toString('base64');
    };

    const createDonutChart = async (data, totalFindings, severityLevels) => {
        // Severity colors mapping
        const colors = {
            'Critical': 'black',
            'High': 'red',
            'Medium': 'orange',
            'Low': 'green'
        };

        // Convert severity levels to colors
        const backgroundColor = severityLevels.map(severity => colors[severity]);

        // Create canvas context
        const width = 500;
        const height = 500; // Increased height to accommodate lower legend
        const chartCanvas = new ChartJSNodeCanvas({
            width,
            height,
            backgroundColour: 'white'
        });

        // Configuration for donut chart
        const configuration = {
            type: 'doughnut',
            data: {
                labels: severityLevels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColor,
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: false,
                cutout: '60%', // Creates donut effect
                plugins: {
                    title: {
                        display: true,
                        text: 'Findings by Severity',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            },
            plugins: [
                {
                    // Custom plugin to add data labels inside the donut segments
                    id: 'dataLabels',
                    afterDraw: (chart) => {
                        const ctx = chart.ctx;
                        const chartArea = chart.chartArea;
                        const datasets = chart.data.datasets[0];
                        const total = datasets.data.reduce((a, b) => a + b, 0);

                        chart.data.datasets[0].data.forEach((value, index) => {
                            const meta = chart.getDatasetMeta(0);
                            const arc = meta.data[index];

                            // Skip if arc is not visible
                            if (!arc.active) {
                                const percentage = ((value / total) * 100).toFixed(1);

                                if (value !== 0 && percentage !== '0.0') {

                                    // Calculate position
                                    const centerX = (chartArea.left + chartArea.right) / 2;
                                    const centerY = (chartArea.top + chartArea.bottom) / 2;

                                    // Get arc properties
                                    const startAngle = arc.startAngle;
                                    const endAngle = arc.endAngle;
                                    const innerRadius = arc.innerRadius;
                                    const outerRadius = arc.outerRadius;

                                    // Calculate midpoint angle
                                    const midAngle = (startAngle + endAngle) / 2;

                                    // Position label slightly inside the donut
                                    const x = centerX + (innerRadius + (outerRadius - innerRadius) * 0.5) * Math.cos(midAngle);
                                    const y = centerY + (innerRadius + (outerRadius - innerRadius) * 0.5) * Math.sin(midAngle);

                                    // Draw the label
                                    ctx.save();
                                    ctx.textAlign = 'center';
                                    ctx.textBaseline = 'middle';
                                    ctx.font = 'bold 14px Arial';
                                    ctx.fillStyle = 'white';
                                    ctx.fillText(`${value} (${percentage}%)`, x, y);
                                    ctx.restore();
                                }
                            }
                        });
                    }
                },
                {
                    // Plugin to draw total findings
                    beforeDraw: (chart) => {
                        const ctx = chart.ctx;
                        const width = chart.width;
                        const height = chart.height;

                        // Draw total findings
                        ctx.save();
                        ctx.font = 'bold 18px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(`Total Findings: ${totalFindings}`, width / 2, height - 30);
                        ctx.restore();
                    }
                }
            ]
        };

        try {
            // Render to buffer
            const buffer = await chartCanvas.renderToBuffer(configuration, 'image/png');

            // Optional: Save to file for debugging
            fs.writeFileSync('debug-donut-chart.png', buffer);

            // Convert to base64
            return buffer.toString('base64');
        } catch (error) {
            console.error('Donut chart rendering error:', error);
            throw error;
        }
    };

    // Fetch categories and numbers dynamically


    const data = await fetchData()
    const categories = data.categories
    const findingNumbers = data.findingNumbers

    // Create base64 Column Image
    const base64ColumnImage = await createColumnChart(findingNumbers, categories);

    // Convert to base64
    const columnImageSrc = `data:image;base64,${base64ColumnImage}`;
    const severityData = await fetchSeverityData(audit);
    const base64Donut = await createDonutChart(
        severityData.severityData,
        severityData.totalFindings,
        severityData.severityLevels
    );
    //const base64DonutsSvg= Buffer.from(donutSvg).toString('base64');
    const donutImageSrc = `data:image;base64,${base64Donut}`;
    return {
        chart: {
            text: ` `,
            images: [
                {
                    image: columnImageSrc,
                    caption: 'Findings by Categories'
                },
                {
                    image: donutImageSrc,
                    caption: 'Findings by Severity'
                }
            ]
        }
    };
}

// Filters helper: handles the use of preformated easilly translatable strings.
// Source: https://www.tutorialstonight.com/javascript-string-format.php
String.prototype.format = function () {
    let args = arguments;
    return this.replace(/{([0-9]+)}/g, function (match, index) {
        return typeof args[index] == 'undefined' ? match : args[index];
    });
};


function parser(tag) {
    // We write an exception to handle the tag "$pageBreakExceptLast"
    if (tag === "$pageBreakExceptLast") {
        return {
            get(scope, context) {
                const totalLength = context.scopePathLength[context.scopePathLength.length - 1];
                const index = context.scopePathItem[context.scopePathItem.length - 1];
                const isLast = index === totalLength - 1;
                if (!isLast) {
                    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
                }
                else {
                    return '';
                }
            }
        }
    }
    // We use the angularParser as the default fallback
    // If you don't wish to use the angularParser,
    // you can use the default parser as documented here:
    // https://docxtemplater.readthedocs.io/en/latest/configuration.html#default-parser
    return expressionParser(tag);
}
function cvssStrToObject(cvss) {
    var initialState = 'Not Defined'
    var res = { AV: initialState, AC: initialState, PR: initialState, UI: initialState, S: initialState, C: initialState, I: initialState, A: initialState, E: initialState, RL: initialState, RC: initialState, CR: initialState, IR: initialState, AR: initialState, MAV: initialState, MAC: initialState, MPR: initialState, MUI: initialState, MS: initialState, MC: initialState, MI: initialState, MA: initialState };
    if (cvss) {
        var temp = cvss.split('/');
        for (var i = 0; i < temp.length; i++) {
            var elt = temp[i].split(':');
            switch (elt[0]) {
                case "AV":
                    if (elt[1] === "N") res.AV = "Network"
                    else if (elt[1] === "A") res.AV = "Adjacent Network"
                    else if (elt[1] === "L") res.AV = "Local"
                    else if (elt[1] === "P") res.AV = "Physical"
                    res.AV = $t(res.AV)
                    break;
                case "AC":
                    if (elt[1] === "L") res.AC = "Low"
                    else if (elt[1] === "H") res.AC = "High"
                    res.AC = $t(res.AC)
                    break;
                case "PR":
                    if (elt[1] === "N") res.PR = "None"
                    else if (elt[1] === "L") res.PR = "Low"
                    else if (elt[1] === "H") res.PR = "High"
                    res.PR = $t(res.PR)
                    break;
                case "UI":
                    if (elt[1] === "N") res.UI = "None"
                    else if (elt[1] === "R") res.UI = "Required"
                    res.UI = $t(res.UI)
                    break;
                case "S":
                    if (elt[1] === "U") res.S = "Unchanged"
                    else if (elt[1] === "C") res.S = "Changed"
                    res.S = $t(res.S)
                    break;
                case "C":
                    if (elt[1] === "N") res.C = "None"
                    else if (elt[1] === "L") res.C = "Low"
                    else if (elt[1] === "H") res.C = "High"
                    res.C = $t(res.C)
                    break;
                case "I":
                    if (elt[1] === "N") res.I = "None"
                    else if (elt[1] === "L") res.I = "Low"
                    else if (elt[1] === "H") res.I = "High"
                    res.I = $t(res.I)
                    break;
                case "A":
                    if (elt[1] === "N") res.A = "None"
                    else if (elt[1] === "L") res.A = "Low"
                    else if (elt[1] === "H") res.A = "High"
                    res.A = $t(res.A)
                    break;
                case "E":
                    if (elt[1] === "U") res.E = "Unproven"
                    else if (elt[1] === "P") res.E = "Proof-of-Concept"
                    else if (elt[1] === "F") res.E = "Functional"
                    else if (elt[1] === "H") res.E = "High"
                    res.E = $t(res.E)
                    break;
                case "RL":
                    if (elt[1] === "O") res.RL = "Official Fix"
                    else if (elt[1] === "T") res.RL = "Temporary Fix"
                    else if (elt[1] === "W") res.RL = "Workaround"
                    else if (elt[1] === "U") res.RL = "Unavailable"
                    res.RL = $t(res.RL)
                    break;
                case "RC":
                    if (elt[1] === "U") res.RC = "Unknown"
                    else if (elt[1] === "R") res.RC = "Reasonable"
                    else if (elt[1] === "C") res.RC = "Confirmed"
                    res.RC = $t(res.RC)
                    break;
                case "CR":
                    if (elt[1] === "L") res.CR = "Low"
                    else if (elt[1] === "M") res.CR = "Medium"
                    else if (elt[1] === "H") res.CR = "High"
                    res.CR = $t(res.CR)
                    break;
                case "IR":
                    if (elt[1] === "L") res.IR = "Low"
                    else if (elt[1] === "M") res.IR = "Medium"
                    else if (elt[1] === "H") res.IR = "High"
                    res.IR = $t(res.IR)
                    break;
                case "AR":
                    if (elt[1] === "L") res.AR = "Low"
                    else if (elt[1] === "M") res.AR = "Medium"
                    else if (elt[1] === "H") res.AR = "High"
                    res.AR = $t(res.AR)
                    break;
                case "MAV":
                    if (elt[1] === "N") res.MAV = "Network"
                    else if (elt[1] === "A") res.MAV = "Adjacent Network"
                    else if (elt[1] === "L") res.MAV = "Local"
                    else if (elt[1] === "P") res.MAV = "Physical"
                    res.MAV = $t(res.MAV)
                    break;
                case "MAC":
                    if (elt[1] === "L") res.MAC = "Low"
                    else if (elt[1] === "H") res.MAC = "High"
                    res.MAC = $t(res.MAC)
                    break;
                case "MPR":
                    if (elt[1] === "N") res.MPR = "None"
                    else if (elt[1] === "L") res.MPR = "Low"
                    else if (elt[1] === "H") res.MPR = "High"
                    res.MPR = $t(res.MPR)
                    break;
                case "MUI":
                    if (elt[1] === "N") res.MUI = "None"
                    else if (elt[1] === "R") res.MUI = "Required"
                    res.MUI = $t(res.MUI)
                    break;
                case "MS":
                    if (elt[1] === "U") res.MS = "Unchanged"
                    else if (elt[1] === "C") res.MS = "Changed"
                    res.MS = $t(res.MS)
                    break;
                case "MC":
                    if (elt[1] === "N") res.MC = "None"
                    else if (elt[1] === "L") res.MC = "Low"
                    else if (elt[1] === "H") res.MC = "High"
                    res.MC = $t(res.MC)
                    break;
                case "MI":
                    if (elt[1] === "N") res.MI = "None"
                    else if (elt[1] === "L") res.MI = "Low"
                    else if (elt[1] === "H") res.MI = "High"
                    res.MI = $t(res.MI)
                    break;
                case "MA":
                    if (elt[1] === "N") res.MA = "None"
                    else if (elt[1] === "L") res.MA = "Low"
                    else if (elt[1] === "H") res.MA = "High"
                    res.MA = $t(res.MA)
                    break;
                default:
                    break;
            }
        }
    }
    return res
}

async function prepAuditData(data, settings) {
    /** CVSS Colors for table cells */
    var noneColor = settings.report.public.cvssColors.noneColor.replace('#', ''); //default of blue ("#4A86E8")
    var lowColor = settings.report.public.cvssColors.lowColor.replace('#', ''); //default of green ("#008000")
    var mediumColor = settings.report.public.cvssColors.mediumColor.replace('#', ''); //default of yellow ("#f9a009")
    var highColor = settings.report.public.cvssColors.highColor.replace('#', ''); //default of red ("#fe0000")
    var criticalColor = settings.report.public.cvssColors.criticalColor.replace('#', ''); //default of black ("#212121")

    var cellNoneColor = '<w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="' + noneColor + '"/></w:tcPr>';
    var cellLowColor = '<w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="' + lowColor + '"/></w:tcPr>';
    var cellMediumColor = '<w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="' + mediumColor + '"/></w:tcPr>';
    var cellHighColor = '<w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="' + highColor + '"/></w:tcPr>';
    var cellCriticalColor = '<w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="' + criticalColor + '"/></w:tcPr>';

    var result = {}
    result.name = data.name || "undefined"
    result.auditType = $t(data.auditType) || "undefined"
    result.date = data.date || "undefined"
    result.date_start = data.date_start || "undefined"
    result.date_end = data.date_end || "undefined"
    if (data.customFields) {
        for (var field of data.customFields) {
            var fieldType = field.customField.fieldType
            var label = field.customField.label

            if (fieldType === 'text')
                result[_.deburr(label.toLowerCase()).replace(/\s/g, '')] = await splitHTMLParagraphs(field.text)
            else if (fieldType !== 'space')
                result[_.deburr(label.toLowerCase()).replace(/\s/g, '')] = field.text
        }
    }

    result.company = {}
    if (data.company) {
        result.company.name = data.company.name || "undefined"
        result.company.shortName = data.company.shortName || result.company.name
        result.company.logo = data.company.logo || "undefined"
        result.company.logo_small = data.company.logo || "undefined"
    }

    result.client = {}
    if (data.client) {
        result.client.email = data.client.email || "undefined"
        result.client.firstname = data.client.firstname || "undefined"
        result.client.lastname = data.client.lastname || "undefined"
        result.client.phone = data.client.phone || "undefined"
        result.client.cell = data.client.cell || "undefined"
        result.client.title = data.client.title || "undefined"
    }

    result.collaborators = []
    data.collaborators.forEach(collab => {
        result.collaborators.push({
            username: collab.username || "undefined",
            firstname: collab.firstname || "undefined",
            lastname: collab.lastname || "undefined",
            email: collab.email || "undefined",
            phone: collab.phone || "undefined",
            role: collab.role || "undefined"
        })
    })
    result.language = data.language || "undefined"
    result.scope = data.scope || []

    result.findings = []
    for (var finding of data.findings) {
        var tmpCVSS;
        if(finding.cvssv3) tmpCVSS = CVSS31.calculateCVSSFromVector(finding.cvssv3);
        else if (finding.cvss.cvssv3) tmpCVSS = CVSS31.calculateCVSSFromVector(finding.cvss.cvssv3);
        var tmpFinding = {
            title: finding.title || "",
            vulnType: $t(finding.vulnType) || "",
            description: await splitHTMLParagraphs(finding.description),
            observation: await splitHTMLParagraphs(finding.observation),
            remediation: await splitHTMLParagraphs(finding.remediation),
            remediationComplexity: finding.remediationComplexity || "",
            priority: finding.priority || "",
            references: finding.references || [],
            poc: await splitHTMLParagraphs(finding.poc),
            affected: finding.scope || "",
            status: finding.status || "",
            category: $t(finding.category) || $t("No Category"),
            identifier: "IDX-" + utils.lPad(finding.identifier),
            retestStatus: finding.retestStatus || "",
            retestDescription: await splitHTMLParagraphs(finding.retestDescription)
        }
        // Handle CVSS
        tmpFinding.cvss = {
            vectorString: tmpCVSS.vectorString || "",
            baseMetricScore: tmpCVSS.baseMetricScore || "",
            baseSeverity: tmpCVSS.baseSeverity || "",
            temporalMetricScore: tmpCVSS.temporalMetricScore || "",
            temporalSeverity: tmpCVSS.temporalSeverity || "",
            environmentalMetricScore: tmpCVSS.environmentalMetricScore || "",
            environmentalSeverity: tmpCVSS.environmentalSeverity || ""
        }
        if (tmpCVSS.baseImpact)
            tmpFinding.cvss.baseImpact = CVSS31.roundUp1(tmpCVSS.baseImpact)
        else
            tmpFinding.cvss.baseImpact = ""
        if (tmpCVSS.baseExploitability)
            tmpFinding.cvss.baseExploitability = CVSS31.roundUp1(tmpCVSS.baseExploitability)
        else
            tmpFinding.cvss.baseExploitability = ""

        if (tmpCVSS.environmentalModifiedImpact)
            tmpFinding.cvss.environmentalModifiedImpact = CVSS31.roundUp1(tmpCVSS.environmentalModifiedImpact)
        else
            tmpFinding.cvss.environmentalModifiedImpact = ""
        if (tmpCVSS.environmentalModifiedExploitability)
            tmpFinding.cvss.environmentalModifiedExploitability = CVSS31.roundUp1(tmpCVSS.environmentalModifiedExploitability)
        else
            tmpFinding.cvss.environmentalModifiedExploitability = ""

        if (tmpCVSS.baseSeverity === "Low") tmpFinding.cvss.cellColor = cellLowColor
        else if (tmpCVSS.baseSeverity === "Medium") tmpFinding.cvss.cellColor = cellMediumColor
        else if (tmpCVSS.baseSeverity === "High") tmpFinding.cvss.cellColor = cellHighColor
        else if (tmpCVSS.baseSeverity === "Critical") tmpFinding.cvss.cellColor = cellCriticalColor
        else tmpFinding.cvss.cellColor = cellNoneColor

        if (tmpCVSS.temporalSeverity === "Low") tmpFinding.cvss.temporalCellColor = cellLowColor
        else if (tmpCVSS.temporalSeverity === "Medium") tmpFinding.cvss.temporalCellColor = cellMediumColor
        else if (tmpCVSS.temporalSeverity === "High") tmpFinding.cvss.temporalCellColor = cellHighColor
        else if (tmpCVSS.temporalSeverity === "Critical") tmpFinding.cvss.temporalCellColor = cellCriticalColor
        else tmpFinding.cvss.temporalCellColor = cellNoneColor

        if (tmpCVSS.environmentalSeverity === "Low") tmpFinding.cvss.environmentalCellColor = cellLowColor
        else if (tmpCVSS.environmentalSeverity === "Medium") tmpFinding.cvss.environmentalCellColor = cellMediumColor
        else if (tmpCVSS.environmentalSeverity === "High") tmpFinding.cvss.environmentalCellColor = cellHighColor
        else if (tmpCVSS.environmentalSeverity === "Critical") tmpFinding.cvss.environmentalCellColor = cellCriticalColor
        else tmpFinding.cvss.environmentalCellColor = cellNoneColor

        tmpFinding.cvssObj = cvssStrToObject(tmpCVSS.vectorString)

        if (finding.customFields) {
            for (field of finding.customFields) {
                // For retrocompatibility of findings with old customFields
                // or if custom field has been deleted, last saved custom fields will be available
                if (field.customField) {
                    var fieldType = field.customField.fieldType
                    var label = field.customField.label
                }
                else {
                    var fieldType = field.fieldType
                    var label = field.label
                }
                if (fieldType === 'text')
                    tmpFinding[_.deburr(label.toLowerCase()).replace(/\s/g, '').replace(/[^\w]/g, '_')] = await splitHTMLParagraphs(field.text)
                else if (fieldType !== 'space')
                    tmpFinding[_.deburr(label.toLowerCase()).replace(/\s/g, '').replace(/[^\w]/g, '_')] = field.text
            }
        }
        result.findings.push(tmpFinding)
    }

    result.categories = _
        .chain(result.findings)
        .groupBy("category")
        .map((value, key) => { return { categoryName: key, categoryFindings: value } })
        .value()

    result.creator = {}
    if (data.creator) {
        result.creator.username = data.creator.username || "undefined"
        result.creator.firstname = data.creator.firstname || "undefined"
        result.creator.lastname = data.creator.lastname || "undefined"
        result.creator.email = data.creator.email || "undefined"
        result.creator.phone = data.creator.phone || "undefined"
        result.creator.role = data.creator.role || "undefined"
    }

    for (var section of data.sections) {
        var formatSection = {
            name: $t(section.name)
        }
        if (section.text) // keep text for retrocompatibility
            formatSection.text = await splitHTMLParagraphs(section.text)
        else if (section.customFields) {
            for (field of section.customFields) {
                var fieldType = field.customField.fieldType
                var label = field.customField.label
                if (fieldType === 'text')
                    formatSection[_.deburr(label.toLowerCase()).replace(/\s/g, '').replace(/[^\w]/g, '_')] = await splitHTMLParagraphs(field.text)
                else if (fieldType !== 'space')
                    formatSection[_.deburr(label.toLowerCase()).replace(/\s/g, '').replace(/[^\w]/g, '_')] = field.text
            }
        }
        result[section.field] = formatSection
    }
    replaceSubTemplating(result)
    return result
}

async function splitHTMLParagraphs(data) {
    var result = []
    if (!data)
        return result

    var splitted = data.split(/(<img.+?src=".*?".+?alt=".*?".*?>)/)

    for (var value of splitted) {
        if (value.startsWith("<img")) {
            var src = value.match(/<img.+src="(.*?)"/) || ""
            var alt = value.match(/<img.+alt="(.*?)"/) || ""
            if (src && src.length > 1) src = src[1]
            if (alt && alt.length > 1) alt = _.unescape(alt[1])

            if (!src.startsWith('data')) {
                try {
                    src = (await Image.getOne(src)).value
                } catch (error) {
                    src = "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA="
                }
            }
            if (result.length === 0)
                result.push({ text: "", images: [] })
            result[result.length - 1].images.push({ image: src, caption: alt })
        }
        else if (value === "") {
            continue
        }
        else {
            result.push({ text: value, images: [] })
        }
    }
    return result
}

async function processChartImageForDocx(svg) {
    // Convert SVG to base64
    const base64Image = Buffer.from(svg).toString('base64');
    const imageSrc = `data:image/svg+xml;base64,${base64Image}`;

    // Create a simple image paragraph
    const imageParagraph = `<p><img src="${imageSrc}" alt="Chart" width="600" height="300" /></p>`;

    return [imageParagraph];
}

function replaceSubTemplating(o, originalData = o) {
    var regexp = /\{_\{([a-zA-Z0-9\[\]\_\.]{1,})\}_\}/gm;
    if (Array.isArray(o))
        o.forEach(key => replaceSubTemplating(key, originalData))
    else if (typeof o === 'object' && !!o) {
        Object.keys(o).forEach(key => {
            if (typeof o[key] === 'string') o[key] = o[key].replace(regexp, (match, word) => _.get(originalData, word.trim(), ''))
            else replaceSubTemplating(o[key], originalData)
        })
    }
}
