;(function(){
  'use strict';

  const responsesObj = require('../../objects/responses').object;
  const utils = require('../../lib/utils');
  const isCourtUser = require('../../components/auth/user-type').isCourtUser;

  module.exports.index = function(app) {
    return function(req, res) {
      var successCB = function(response) {
          app.logger.info('Fetched and parsed list of pending responses: ', {
            auth: req.session.authentication,
          });

          response.items = utils.sortResponseData(response.items, 'rawReceivedAt', false);

          // set alert details
          response.items.forEach(function(item) {
            item.alert = utils.getResponseAlert(item);
          });

          req.session.sourceUrl = req.path;

          res.locals.todoCount = response.counts.todo;
          res.locals.workCount = response.counts.todo + response.counts.pending;

          return res.render('pending.njk', {
            responses: response,
          });
        }

        , errorCB = function(err) {
          app.logger.crit('Failed to fetch and parse list of pending responses: ', {
            auth: req.session.authentication,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('index.njk');
        }

      let courtLocCode;

      if (isCourtUser(req)){
        courtLocCode = req.session.authentication.locCode;
      }
      responsesObj
        .query(req, 'pending', courtLocCode)
        .then(successCB)
        .catch(errorCB);
    };
  };
})();
