;(function() {
  'use strict';

  const rp = require('request-promise');

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
      get: function(app, jwtToken, locCode, opts) {
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

  module.exports.expensesDAO = {
    get: function(app, req, jurors) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/expenses'),
        method: 'GET',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
        body: jurors,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.jurorDetailsDAO = {
    post: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/juror-record/details'),
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
