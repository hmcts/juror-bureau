(function() {
  'use strict';

  const _ = require('lodash')
    , { DAO } = require('./dataAccessObject')
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

    , trialDetailsObject = {
      resource: 'moj/trial/summary',
      get: function(rp, app, jwtToken, trialNumber, locationCode) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(
          reqOptions.uri,
          this.resource,
          '?trial_number=' + trialNumber,
          '&location_code=' + locationCode
        );
        reqOptions.method = 'GET';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: {
            trialNumber,
            locationCode,
          },
        });

        return rp(reqOptions);
      },
    }

    , courtroomsObject = {
      resource: 'moj/trial/courtrooms/list',
      get: function(rp, app, jwtToken) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'GET';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        return rp(reqOptions);
      },
    }

    , judgesObject = {
      resource: 'moj/trial/judge/list',
      get: function(rp, app, jwtToken) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'GET';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        return rp(reqOptions);
      },
    }

    , createTrialObject = {
      resource: 'moj/trial/create',
      post: function(rp, app, jwtToken, payload) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'POST';
        reqOptions.body = payload;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },
    };

  module.exports.trialDetailsObject = trialDetailsObject;
  module.exports.courtroomsObject = courtroomsObject;
  module.exports.judgesObject = judgesObject;
  module.exports.createTrialObject = createTrialObject;
  module.exports.editTrialDAO = new DAO('moj/trial/edit');
  module.exports.trialsListDAO = new DAO('moj/trial/list');

})();
