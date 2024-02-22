/* eslint-disable camelcase */
;(function() {
  'use strict';

  var _ = require('lodash')
    , urljoin = require('url-join')
    , config = require('../config/environment')()
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json',
      },
      json: true,
    }

    , uncompleteJurorSearchObject = {
      resource: 'moj/complete-service',
      post: function(rp, app, jwtToken, searchParams) {
        var reqOptions = _.clone(options)
          , tmpBody = {};

        if (typeof searchParams.juror_number !== 'undefined' && searchParams.juror_number !== '') {
          tmpBody.juror_number = searchParams.juror_number;
        }

        if (typeof searchParams.pool_number !== 'undefined' && searchParams.pool_number !== '') {
          tmpBody.pool_number = searchParams.pool_number;
        }

        if (typeof searchParams.juror_name !== 'undefined' && searchParams.juror_name !== '') {
          tmpBody.juror_name = searchParams.juror_name;
        }

        if (typeof searchParams.postcode !== 'undefined' && searchParams.postcode !== '') {
          tmpBody.postcode = searchParams.postcode;
        }

        if (typeof searchParams.sort_by !== 'undefined' && searchParams.sort_by !== '') {
          tmpBody.sort_by = searchParams.sort_by;
        }

        if (typeof searchParams.sort_method !== 'undefined' && searchParams.sort_method !== '') {
          tmpBody.sort_method = searchParams.sort_method;
        }

        if (typeof searchParams.page_number !== 'undefined' && searchParams.page_number !== '') {
          tmpBody.page_number = searchParams.page_number;
        }

        if (typeof searchParams.page_limit !== 'undefined' && searchParams.page_limit !== '') {
          tmpBody.page_limit = searchParams.page_limit;
        }

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'POST';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: reqOptions.body,
        });

        return rp(reqOptions);
      },
    }

    , uncompleteJurorObject = {
      resource: 'moj/complete-service/uncomplete',
      patch: function(rp, app, jwtToken, body) {
        let reqOptions = _.cloneDeep(options),
          tmpBody = _.clone(body);

        delete tmpBody._csrf;

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri,
          this.resource);
        reqOptions.method = 'PATCH';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: {
            body: tmpBody,
          },
        });

        return rp(reqOptions);
      },
    };

  module.exports.uncompleteJurorSearchObject = uncompleteJurorSearchObject;

  module.exports.uncompleteJurorObject = uncompleteJurorObject;
})();
