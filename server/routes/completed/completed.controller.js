;(function(){
  'use strict';

  var responsesObj = require('../../objects/responses').object
    , utils = require('../../lib/utils');

  module.exports.index = function(app) {
    return function(req, res) {
      var successCB = function(response) {
          app.logger.info('Fetched and parsed list of completed responses: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            response: response,
          });

          req.session.sourceUrl = req.path;

          response.items = utils.sortCompletedResponseData(response.items, 'rawCompletedAt', true);

          res.locals.todoCount = response.counts.todo;
          res.locals.workCount = response.counts.todo + response.counts.pending;

          return res.render('completed.njk', {
            responses: response,
          });
        }

        , errorCB = function(err) {
          app.logger.crit('Failed to fetch and parse list of completed responses: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('index.njk');
        };

      responsesObj
        .query(req, 'completed')
        .then(successCB)
        .catch(errorCB);
    };
  };
})();
