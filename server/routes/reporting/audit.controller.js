const { render } = require('../../lib/reports/financial-audit');
const { generateDocument } = require('../../lib/reports/single-generator');

(() => {
  'use strict';

  const { financialAuditDAO } = require('../../objects/reports');

  const financialAudit = (app) => async(req, res) => {
    try {
      const auditData = await financialAuditDAO.get(req, req.params.auditNumber);

      console.log('got audit');
      console.log(JSON.stringify(auditData, null, 2));
      // console.log(JSON.stringify(render(auditData), null, 2));

      const document = await generateDocument(render(auditData), {pageOrientation: 'landscape'});

      res.contentType('application/pdf');
      return res.send(document);
    } catch (err) {
      console.log('in error');
      console.log(err);
      app.logger.crit('Failed to render financial audit', {
        auth: req.session.authentication,
        token: req.session.authToken,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      return res.render('_errors/generic');
    }
  };

  module.exports = {
    financialAudit,
  };
})();
