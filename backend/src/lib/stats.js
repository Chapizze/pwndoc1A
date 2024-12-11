var Audit = require('../models/audit');
var User = require('../models/user');
var VulnerabilityCategory = require('../models/vulnerability-category');
var CVSS31 = require('./cvsscalc31.js');




async function getFindingByCategory(isAllowed, userId) {
    const categories = await VulnerabilityCategory.getAll();
    const audits = await Audit.getAudits(isAllowed, userId);

    const data = [];

    for (const smallaudit of audits) {
        const audit = await Audit.getAudit(isAllowed, smallaudit.id, userId);
        const year = new Date(audit.updatedAt).getFullYear();
        for (const finding of audit.findings) {
            const category = categories.find(cat => cat.name === finding.category);
            if (category) {
                const index = data.findIndex(d => d.year === year);
                if (index === -1) {
                    data.push({ year: year, data: [] });
                }
                const yearData = data.find(d => d.year === year);
                const index2 = yearData.data.findIndex(d => d.category === category.name);
                if (index2 === -1) {
                    yearData.data.push({ category: category.name, count: 1 });
                } else {
                    yearData.data[index2].count++;
                }
            }
        }
    }
    const formattedData = data.map(d => ({
        name: d.year,
        data: d.data.map(item => item.count)
    }))

    return formattedData;
}
exports.getFindingByCategory = getFindingByCategory;

async function getFindingBySeverity(isAllowed, userId, year) {
    return new Promise(async (resolve, reject) => {

        const audits = await Audit.getAudits(isAllowed, userId);

        
        if (isNaN(year) || year < 2020 || year > 2030) {
                reject("Invalid year parameter");
        }

        var filteredAuditsByYear = []
        audits.forEach(audit => {
            const auditYear = new Date(audit.createdAt).getFullYear();
            if(auditYear == year){
                filteredAuditsByYear.push(audit)
            }
        })

        var data = [0,0,0,0];
        var criticalfindingcount = 0;
        var highfindingcount = 0;
        var mediumfindingcount = 0;
        var lowfindingcount = 0;


        for (const smallaudit of filteredAuditsByYear) {
            const audit = await Audit.getAudit(isAllowed, smallaudit.id, userId);

            for(const finding of audit.findings) {
                const sev = getFindingSeverity(finding, audit)
                
                switch(sev) {
					case "Low": 
						lowfindingcount += 1;
                        break;
					case "Medium":
						mediumfindingcount += 1;
                        break;
					case "High":
						highfindingcount += 1;
                        break;
					case "Critical":
						criticalfindingcount += 1;
                        break;
					default:
						break;
				}
                
            }
        }
        data[0] = criticalfindingcount;
        data[1] = highfindingcount;
        data[2] = mediumfindingcount;
        data[3] = lowfindingcount;
        
        resolve(data)
    })
}
exports.getFindingBySeverity = getFindingBySeverity
const getFindingSeverity = (finding, audit) => {
    let severity = "None"
    let cvss = CVSS31.calculateCVSSFromVector(finding.cvssv3)
    if (cvss.success) {
        severity = cvss.baseSeverity

        let category = finding.category || "No Category"
        let sortOption = audit.sortFindings.find(e => e.category === category)

        if (sortOption) {
            if (sortOption.sortValue === "cvssEnvironmentalScore")
                severity = cvss.environmentalSeverity
            else if (sortOption.sortValue === "cvssTemporalScore")
                severity = cvss.temporalSeverity
        }
    }
    return severity
};
exports.getFindingSeverity = getFindingSeverity;
