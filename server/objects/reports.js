((() => {
  'use strict';

  const rp = require('request-promise');
  const urljoin = require('url-join');

  module.exports.standardReportDAO = {
    post: function(app, req, endpoint, config) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/reports/standard'),
        method: 'POST',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

}))();
