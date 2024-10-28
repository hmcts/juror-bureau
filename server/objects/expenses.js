;(function() {
  'use strict';

  const rp = require('request-promise');
  const _ = require('lodash');
  const urljoin = require('url-join');
  const config = require('../config/environment')();
  const utils = require('../lib/utils');
  const modUtils = require('../lib/mod-utils');
  const options = {
    uri: config.apiEndpoint,
    headers: {
      'User-Agent': 'Request-Promise',
      'Content-Type': 'application/vnd.api+json',
    },
    json: true,
    transform: utils.basicDataTransform,
  };
  const { DAO } = require('./dataAccessObject');

  module.exports.fetchUnpaidExpenses = new DAO('moj/expenses/{locCode}/unpaid-summary/', {
    get: function(locCode, opts) {
      const parameters = [];

      parameters.push('page_number=' + opts.pageNumber);
      parameters.push('sort_by=' + opts.sortBy);
      parameters.push('sort_order=' + opts.sortOrder);

      if (opts.minDate) {
        parameters.push('min_date=' + opts.minDate);
      }
      if (opts.maxDate) {
        parameters.push('max_date=' + opts.maxDate);
      }

      return {
        uri: this.resource.replace('{locCode}', locCode) + '?' + parameters.join('&'),
      }
    },
    post: function(locCode, body) {
      return {
        uri: urljoin(config.apiEndpoint, `moj/expenses/${locCode}/unpaid-summary`),
        body: modUtils.mapCamelToSnake(body),
      };
    },
  })

  module.exports.jurorDetailsDAO = new DAO('moj/juror-record/details');

  module.exports.defaultExpensesDAO = new DAO('moj/expenses/{locCode}/{jurorNumber}/default-expenses', {
    get: function(locCode, jurorNumber) {
      return {
        uri: urljoin(this.resource.replace('{locCode}', locCode).replace('{jurorNumber}', jurorNumber)),
      };
    },
    post: function(locCode, jurorNumber, body) {
      return {
        uri: urljoin(this.resource.replace('{locCode}', locCode).replace('{jurorNumber}', jurorNumber)),
        body: modUtils.mapCamelToSnake(body),
      }
    }
  });

  module.exports.jurorBankDetailsDAO = new DAO('moj/juror-record/{jurorNumber}/bank-details', {
    get: function(jurorNumber, etag = null) {
      const headers = {};

      if (etag) {
        headers['If-None-Match'] = `${etag}`;
      }

      return { 
        uri: this.resource.replace('{jurorNumber}', jurorNumber),
        headers,
        transform: modUtils.extractDataAndHeadersFromResponse(),
      };
    },
    patch: function(body){
      return {
        uri: 'moj/juror-record/update-bank-details',
        body,
      };
    }
  });

  module.exports.approveExpensesDAO = new DAO('moj/expenses/{locCode}/{paymentMethod}', {
    get: function(locCode, paymentMethod, dates) {
      const uri = urljoin(this.resource, 'pending-approval')
        .replace('{locCode}', locCode)
        .replace('{paymentMethod}', paymentMethod)
          + (dates ? `?from=${dates.from}&to=${dates.to}` : '');

      return {
        uri,
      };
    },
    post: function(locCode, paymentMethod, body) {
      const uri = urljoin(this.resource, 'approve')
        .replace('{locCode}', locCode).replace('{paymentMethod}', paymentMethod);

      return {
        uri,
        body,
      };
    },
  });

})();
