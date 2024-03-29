
(function() {
  'use strict';
  
  const { constants, mapSnakeToCamel, mapCamelToSnake } = require('../lib/mod-utils');
  var _ = require('lodash')
    , urljoin = require('url-join')
    , config = require('../config/environment')()
    , utils = require('../lib/utils')
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json',
      },
      json: true,
      transform: mapSnakeToCamel,
    }

    , poolMemebersObject = {
      resource: 'moj/pool-create/members',
      get: function(rp, app, jwtToken, poolNumber) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri,
          this.resource,
          poolNumber
        );
        reqOptions.method = 'GET';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        return rp(reqOptions);
      },
      post: function(rp, app, jwtToken, body) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri,
          this.resource,
        );
        reqOptions.method = 'POST';
        reqOptions.body = body;

        reqOptions.body['page_number'] = reqOptions.body['page_number'] || 1;
        reqOptions.body['page_limit'] = constants.PAGE_SIZE;
        reqOptions.body['sort_method'] = reqOptions.body['sort_method'] === 'ascending' ? 'ASC' : 'DESC';
        reqOptions.body['sort_field'] = mapCamelToSnake(reqOptions.body['sort_field'])?.toUpperCase();

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body,
        });

        return rp(reqOptions);
      },
    };

  module.exports.poolMemebersObject = poolMemebersObject;

})();
