;(function(){
  'use strict';

  const _ = require('lodash')
  const responsesObj = require('../../objects/responses').object
  const utils = require('../../lib/utils')
  const isCourtUser = require('../../components/auth/user-type').isCourtUser;

  module.exports.index = function(app) {
    return function(req, res) {
      var highPriorityCount = 0
        , standardPriorityCount  = 0
        , successCB = function(response) {
          var responseWasActioned;

          app.logger.info('Fetched and parsed list of todo responses: ', {
            auth: req.session.authentication,
          });

          response.items = utils.sortResponseData(response.items, 'rawReceivedAt', false);

          // set alert details, counts
          response.items.forEach(function(item) {

            item.alert = utils.getResponseAlert(item);

            if ((item.isUrgent === true) || (item.slaOverdue === true)) {
              highPriorityCount++;
            } else {
              standardPriorityCount++;
            }
          });

          req.session.sourceUrl = req.path;

          if (typeof req.session.responseWasActioned !== 'undefined') {
            responseWasActioned = _.clone(req.session.responseWasActioned);
            delete req.session.responseWasActioned;
          }

          res.locals.todoCount = response.counts.todo;
          res.locals.workCount = response.counts.todo + response.counts.pending;

          return res.render('inbox.njk', {
            responses: response,
            counts: {
              highPriority: highPriorityCount,
              standardPriority: standardPriorityCount,
              total: response.items.length
            },
            responseWasActioned: responseWasActioned,
          });
        }

        , errorCB = function(err) {
          app.logger.crit('Failed to fetch and parse list of to do responses: ', {
            auth: req.session.authentication,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('index.njk');
        }

      // Clear session data
      delete req.session.searchResponse;
      delete req.session.formFields;
      delete req.session.errors;
      delete req.session.nav;

      let courtLocCode;

      if (isCourtUser(req)){
        courtLocCode = req.session.authentication.locCode;
      }
      responsesObj
        .query(req, 'todo', courtLocCode)
        .then(successCB)
        .catch(errorCB);
      
    };
  };
})();
