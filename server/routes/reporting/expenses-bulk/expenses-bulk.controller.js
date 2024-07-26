(function() {
  'use strict';

  const { financialAuditDAO } = require('../../../objects/reports');
  const { render } = require('../../../lib/reports/financial-audit');

  const { generateDocument } = require('../../../lib/reports/single-generator');

  module.exports.generateBulk = function(app) {
    return async function(req, res) {
      const { auditNumbers } = req.query;
      const requests = [];

      for (let auditNumber of auditNumbers.split(',')) {
        requests.push(() => financialAuditDAO.get(req, auditNumber));
      }
      let expenses = await Promise.all(requests.map((r) => r()));

      const bulkData = [];

      for (let expense of expenses) {
        bulkData.push(render(expense));
      }

      try {
        const document = await generateDocument(bulkData, {
          pageOrientation: 'landscape',
        });

        app.logger.info('Generated bulk financial audit report', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: {
            auditNumbers,
          },
        });

        res.contentType('application/pdf');
        return res.send(document);
      } catch (err) {
        app.logger.crit('Error generating bulk financial audit report', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
        
        return res.render('_errors/generic.njk');
      }
    };
  };

})();
