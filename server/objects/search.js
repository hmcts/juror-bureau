;(function(){
  'use strict';

  const rp = require('request-promise');
  const config = require('../config/environment')();
  const urljoin = require('url-join');

  module.exports.searchResponsesDAO = {
    post: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/juror-response/retrieve'),
        method: 'POST',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
        body,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

})();
