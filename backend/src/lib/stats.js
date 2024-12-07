var Audit = require('../models/audit');
var User = require('../models/user');
var VulnerabilityCategory = require('../models/vulnerability-category');




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