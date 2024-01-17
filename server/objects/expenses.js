;(function() {
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

    , fetchUnpaidExpenses = {
      resource: 'moj/expenses/unpaid-summary/',
      get: function(rp, app, jwtToken, locCode, opts) {
        var reqOptions = _.clone(options);

        var parameters = [];

        parameters.push('page_number=' + opts.pageNumber);
        parameters.push('sort_by=' + opts.sortBy);
        parameters.push('sort_order=' + opts.sortOrder);

        if (opts.minDate) {
          parameters.push('min_date=' + opts.minDate);
        }
        if (opts.maxDate) {
          parameters.push('max_date=' + opts.maxDate);
        }
        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'GET';
        reqOptions.uri = urljoin(reqOptions.uri, this.resource + locCode + '?' + parameters.join('&'));

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: opts,
        });

        return rp(reqOptions);
      },
    };

  module.exports.fetchUnpaidExpenses = fetchUnpaidExpenses;

})();
