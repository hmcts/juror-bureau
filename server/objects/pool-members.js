
(function() {
  'use strict';
  
  const { constants } = require('../lib/mod-utils');
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
      transform: utils.snakeToCamel,
    }

    , poolMemebersObject = {
      resource: 'moj/pool-create/members',
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
        reqOptions.body['sort_field'] = utils.camelToSnake(reqOptions.body['sort_field'])?.toUpperCase();

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
