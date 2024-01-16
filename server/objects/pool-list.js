;(function(){
  'use strict';

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
      transform: utils.basicDataTransform,
    }

    , poolRequests = {
      resource: 'moj/pool-request/pools-',
      get: function(rp, app, jwtToken, opts) {
        var reqOptions = _.clone(options)
          , status = {
            created: 'active',
            requested: 'requested',
          }
          , order = (opts.sortOrder === 'descending') ? 'desc' : 'asc';

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri,
          this.resource + status[opts.status],
          '?status=' + opts.status,
          '&tab=' + opts.tab,
          '&offset=' + (opts.page - 1).toString(),
          '&sortBy=' + opts.sortBy,
          '&sortOrder=' + order);
        reqOptions.method = 'GET';

        // NOTE: tests will say this is 2 way if but the second way is not covered
        if (typeof opts.locCode !== 'undefined') {
          reqOptions.uri += '&locCode=' + opts.locCode;
        }

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: opts,
        });

        return rp(reqOptions);
      },
    };

  module.exports.poolRequests = poolRequests;
})();
