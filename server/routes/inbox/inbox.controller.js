const _ = require('lodash');
const responsesObj = require('../../objects/responses').object;
const utils = require('../../lib/utils');

module.exports.index = function (app) {
  return function (req, res) {
    let highPriorityCount = 0;
    let standardPriorityCount = 0;

    const successCB = function (response) {
      let responseWasActioned;

      app.logger.info('Fetched and parsed list of todo responses: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        response: response,
      });

      response.items = utils.sortResponseData(response.items, 'rawReceivedAt', false);

      // set alert details, counts
      response.items.forEach(function (item) {

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

      return res.render('inbox.njk', {
        responses: response,
        counts: {
          highPriority: highPriorityCount,
          standardPriority: standardPriorityCount,
          total: response.items.length,
        },
        responseWasActioned: responseWasActioned,
      });
    };

    const errorCB = function (err) {
      app.logger.crit('Failed to fetch and parse list of to do responses: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('index.njk');
    };

    // Clear session data
    delete req.session.searchResponse;
    delete req.session.formFields;
    delete req.session.errors;
    delete req.session.nav;

    responsesObj
      .query(require('request-promise'), app, req.session.authToken, 'todo', req.session.hasModAccess)
      .then(successCB)
      .catch(errorCB);
  };
};
