(function() {
  'use strict';

  const { sendPaperSummonsPackDAO } = require('../../../objects/documents');

  module.exports.getSendPaperSummons = (app) => {
    return function(req, res) {
      const { jurorNumber } = req.params;
      const processUrl = app.namedRoutes.build('juror-management.send-paper-summons.post', {
        jurorNumber,
      });
      const cancelUrl = app.namedRoutes.build('juror-record.details.get', {
        jurorNumber,
      });

      return res.render('juror-management/send-paper-summons/send-paper-summons.njk', {
        jurorNumber,
        processUrl,
        cancelUrl,
      });
    };
  };

  module.exports.postSendPaperSummons = (app) => {
    return async function(req, res) {
      const { jurorNumber } = req.params;
      try {
        await sendPaperSummonsPackDAO.post(req, jurorNumber);

        app.logger.info('Sent paper summons pack to juror: ', {
          auth: req.session.authentication,
          data: { jurorNumber },
        });

        req.session.bannerMessage = 'Paper summons sent';
      } catch (err) {
        app.logger.crit('Failed to send paper summons pack to juror: ', {
          auth: req.session.authentication,
          data: { jurorNumber },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }

      return res.redirect(app.namedRoutes.build('juror-record.details.get', {
        jurorNumber,
      }));
    };
  };

})();
