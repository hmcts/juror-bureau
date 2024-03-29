const responsesObj = require('../../objects/responses').object;
const utils = require('../../lib/utils');

module.exports.index = function (app) {
  return function (req, res) {
    const successCB = function (response) {
      app.logger.info('Fetched and parsed list of pending responses: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        response: response,
      });

      response.items = utils.sortResponseData(response.items, 'rawReceivedAt', false);

      // set alert details
      response.items.forEach(function (item) {
        item.alert = utils.getResponseAlert(item);
      });

      req.session.sourceUrl = req.path;

      return res.render('pending.njk', {
        responses: response,
      });
    };

    const errorCB = function (err) {
      app.logger.crit('Failed to fetch and parse list of pending responses: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('index.njk');
    };

    responsesObj
      .query(require('request-promise'), app, req.session.authToken, 'pending', req.session.hasModAccess)
      .then(successCB)
      .catch(errorCB);
  };
};
