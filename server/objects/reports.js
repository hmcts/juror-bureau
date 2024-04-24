const { DAO } = require('./dataAccessObject');

(() => {
  'use strict';

  const rp = require('request-promise');
  const urljoin = require('url-join');
  const config = require('../config/environment')();
  const { mapCamelToSnake, mapSnakeToCamel } = require('../lib/mod-utils');

  module.exports.standardReportDAO = {
    post: function(req, app, requestConfig) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/reports/standard'),
        method: 'POST',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
        body: mapCamelToSnake({
          ...requestConfig,
        }),
        transform: mapSnakeToCamel,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.incompleteService = new DAO('/moj/reports/incomplete-service', {
    get: function(options) {
      const uri = `${this.resource}?location=${options.location}&cut-off-date=${options.date}`;

      return { uri, transform: mapSnakeToCamel };
    },
  });

})();
