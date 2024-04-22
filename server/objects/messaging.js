(function() {
  'use strict';

  const _ = require('lodash')
    , config = require('../config/environment')()
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json',
      },
      json: true,
    };

  const urljoin = require('url-join');
  const rp = require('request-promise');

  module.exports.messageTemplateDAO = {
    get: function(app, req, messageType, locCode) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/messages/view', messageType, locCode),
        method: 'GET',
        headers: {
          Authorization: req.session.authToken,
          'Content-Type': 'application/vnd.api+json',
        },
        json: true,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.populatedMessageDAO = {
    post: function(app, req, messageType, locCode, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint,
          'moj/messages/view/{messageType}/{locCode}/populated'
            .replace('{messageType}', messageType)
            .replace('{locCode}', locCode)
        ),
        method: 'POST',
        headers: {
          Authorization: req.session.authToken,
          'Content-Type': 'application/vnd.api+json',
        },
        json: true,
        body,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.jurorSearchDAO = {
    post: function(app, req, locCode, body, simpleResponse) {
      let _locCode = locCode;

      if (body.court_name) {
        _locCode = body.court_name.match(/\d+/g)[0];
      }

      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/messages/search', _locCode),
        method: 'POST',
        headers: {
          Authorization: req.session.authToken,
          'Content-Type': 'application/vnd.api+json',
        },
        json: true,
      };

      if (simpleResponse) {
        payload.uri = urljoin(payload.uri, '?simple_response=true');
      }

      payload.body = _.mapKeys(body, (__, key) => _.snakeCase(key));

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  const sendMessage = {
    resource: 'moj/messages/send',

    post: function(app, jwtToken, messageType, locCode, body) {
      const reqOptions = _.clone(options);
      let tmpBody = _.clone(body);

      reqOptions.headers.Authorization = jwtToken;
      reqOptions.method = 'POST';
      reqOptions.uri = urljoin(
        reqOptions.uri,
        this.resource,
        messageType,
        locCode,
      );

      tmpBody = _.mapKeys(tmpBody, (__, key) => _.snakeCase(key));

      reqOptions.body = tmpBody;

      app.logger.debug('Sending request to API: ', {
        uri: reqOptions.uri,
        headers: reqOptions.headers,
        method: reqOptions.method,
        body: reqOptions.body,
      });

      return rp(reqOptions);
    },
  };

  module.exports.downloadCSVDAO = {
    post: function(app, req, locCode, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/messages/csv', locCode),
        method: 'POST',
        headers: {
          Authorization: req.session.authToken,
          'Content-Type': 'application/json',
          'Accept': 'text/csv',
        },
        json: true,
        body,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.sendMessage = sendMessage;
})();
