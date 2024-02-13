(function() {
  'use strict';

  const _ = require('lodash')
    , config = require('../config/environment')()
    , urljoin = require('url-join')
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json',
      },
      json: true,
    },

    messageTemplateDAO = {
      resource: 'moj/messages/view',

      get: function(rp, app, jwtToken, messageType, locCode) {
        const reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'GET';
        reqOptions.uri = urljoin(
          reqOptions.uri,
          this.resource,
          messageType,
          locCode
        );

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        return rp(reqOptions);
      },
    },

    populatedMessageDAO = {
      resource: 'moj/messages/view/{messageType}/{locCode}/populated',

      post: function(rp, app, jwtToken, messageType, locCode, payload) {
        const reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'POST';
        reqOptions.uri = urljoin(
          reqOptions.uri,
          this.resource.replace('{messageType}', messageType).replace('{locCode}', locCode),
        );
        reqOptions.body = payload;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        return rp(reqOptions);
      },
    },

    jurorSearchDAO = {
      resource: 'moj/messages/search',

      post: function(rp, app, jwtToken, locCode, opts, simpleResponse) {
        const reqOptions = _.clone(options);
        let tmpBody = _.clone(opts);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'POST';
        reqOptions.uri = urljoin(
          reqOptions.uri,
          this.resource,
          locCode,
        );
        if (simpleResponse) {
          reqOptions.uri = urljoin(reqOptions.uri, '?simple_response=true');
        }

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
    },

    sendMessage = {
      resource: 'moj/messages/send',

      post: function(rp, app, jwtToken, messageType, locCode, body) {
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

  module.exports.messageTemplateDAO = messageTemplateDAO;
  module.exports.populatedMessageDAO = populatedMessageDAO;
  module.exports.jurorSearchDAO = jurorSearchDAO;
  module.exports.sendMessage = sendMessage;
})();
