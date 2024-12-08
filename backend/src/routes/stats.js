module.exports = function (app) {

    var Response = require('../lib/httpResponse.js');
    var Stats = require('../lib/stats.js');
    var acl = require('../lib/auth').acl;


    app.get('/api/stats/findingByCategory', acl.hasPermission('audits:read-all'), async function (req, res) {
        try {
            var data = await Stats.getFindingByCategory(acl.isAllowed(req.decodedToken.role, 'audits:read-all'), req.decodedToken.id)
            Response.Ok(res, data)
        }
        catch (err) {
            Response.Internal(res, err)
        }

    });

    app.get('/api/stats/findingBySeverity/:year', acl.hasPermission('audits:read-all'), async function (req, res) {
        try {
            var data = await Stats.getFindingBySeverity(acl.isAllowed(req.decodedToken.role, 'audits:read-all'), req.decodedToken.id, req.params.year)
            Response.Ok(res, data)
        }
        catch (err) {
            Response.Internal(res, err)
        }

    });
}
