module.exports = function(app) {

    var Response = require('../lib/httpResponse.js')
    var AI = require('../lib/ai.js')
    var acl = require('../lib/auth.js').acl

    // Get Attachment
    app.post("/api/ai/rephrase", acl.hasPermission('audits:update'), async function(req, res) {
        if(!req.body.content) {
            Response.BadParameters(res, 'Missing some required parameters: content');
            return;
        }
        if(typeof(req.body.content) !== 'string') {
            Response.BadParameters(res, 'content must be a string');
            return;
        }

        try { 
            var newContent = await AI.rephrase(req.body.content)
            Response.Ok(res, newContent)
        }
        catch (error) {
            Response.Internal(res, error)
        }
        

    })
      

}