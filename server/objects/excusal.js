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

    , responseObject = {
      resource: 'bureau/juror/excuse',
      get: function(rp, app, jwtToken) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },

      reject: function(rp, app, jwtToken, jurorNumber, version, excusalCode) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'POST';
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, 'reject', jurorNumber);
        reqOptions.body = {
          description: '',
          excusalCode: excusalCode,
          version: version,
        };

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },

      accept: function(rp, app, jwtToken, jurorNumber, version, excusalCode) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'POST';
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, jurorNumber);
        reqOptions.body = {
          description: '',
          excusalCode: excusalCode,
          version: version,
        };

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },

      getNew: function(rp, app, jwtToken) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
        });

        reqOptions.transform = function(response) {
          const sortedCodes = {
              original: response.data.sort((a, b) => a.excusalCode.localeCompare(b.excusalCode)),
            },
            defaultArr = [{value: '', text: 'Select a reason...', selected: true}];

          sortedCodes.formatted = sortedCodes.original.reduce((prev, reason) => {
            prev.push({ value: reason.excusalCode, text: `${reason.excusalCode} - ${reason.description}` });
            return prev;
          }, defaultArr);

          return sortedCodes;
        };

        return rp(reqOptions);
      },
    };

  module.exports.object = responseObject;
})();
