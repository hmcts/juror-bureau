const responsesObj = require('../../objects/responses').object;
const utils = require('../../lib/utils');

module.exports.index = function (app) {
  return function (req, res) {
    const successCB = function (response) {
      app.logger.info('Fetched and parsed list of completed responses: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        response: response,
      });

      req.session.sourceUrl = req.path;

      response.items = utils.sortCompletedResponseData(response.items, 'rawCompletedAt', true);
      return res.render('completed.njk', {
        responses: response,
      });
    };

    const errorCB = function (err) {
      app.logger.crit('Failed to fetch and parse list of completed responses: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('index.njk');
    };

    responsesObj
      .query(require('request-promise'), app, req.session.authToken, 'completed', req.session.hasModAccess)
      .then(successCB)
      .catch(errorCB);
  };
};
