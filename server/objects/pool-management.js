(function() {
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
      method: 'GET',
      json: true,
      transform: utils.basicDataTransform,
    }
    , deferralMaintenance = {
      deferrals: {
        resource: 'moj/deferral-maintenance/deferrals/{}',
        get: function(rp, app, jwtToken, locationCode) {
          var reqOptions = _.clone(options);

          reqOptions.headers.Authorization = jwtToken;
          reqOptions.uri = urljoin(reqOptions.uri, this.resource.replace('{}', locationCode));

          app.logger.info('Sending request to API: ', {
            uri: reqOptions.uri,
            headers: reqOptions.headers,
            method: reqOptions.method,
            locationCode: locationCode,
          });

          return rp(reqOptions);
        },
      },
      allocateJurors: {
        resource: 'moj/deferral-maintenance/deferrals/allocate-jurors-to-pool',
        post: function(rp, app, jwtToken, jurors, poolNumber) {
          var reqOptions = _.clone(options)
            , body = {
              poolNumber: poolNumber,
              jurors: jurors, // jurors needs to be an array
            };

          reqOptions.headers.Authorization = jwtToken;
          reqOptions.uri = urljoin(reqOptions.uri, this.resource);
          reqOptions.method = 'POST';
          reqOptions.body = body;

          app.logger.info('Sending request to API: ', {
            uri: reqOptions.uri,
            headers: reqOptions.headers,
            method: reqOptions.method,
            data: body,
          });

          return rp(reqOptions);
        },
      },
      availablePools: {
        get: availablePools.bind({ resource: 'moj/deferral-maintenance/available-pools/{}' }),
        post: availablePools.bind({ resource: 'moj/deferral-maintenance/available-pools/{}', method: 'POST' }),
      },
    }

    , reassignJurors = {
      availablePools: {
        get: availablePools.bind({ resource: 'moj/manage-pool/available-pools/{}?is-reassign=true' }),
      },
      availableCourtOwnedPools: {
        get: availablePools.bind({ resource: 'moj/manage-pool/available-pools-court-owned/{}' }),
      },
      reassignJuror: {
        resource: 'moj/manage-pool/reassign-jurors',
        put: function(rp, app, jwtToken, payload) {
          var reqOptions = _.clone(options);

          reqOptions.headers.Authorization = jwtToken;
          reqOptions.uri = urljoin(reqOptions.uri, this.resource);
          reqOptions.method = 'PUT';
          reqOptions.body = payload;

          app.logger.info('Sending request to API: ', {
            uri: reqOptions.uri,
            headers: reqOptions.headers,
            method: reqOptions.method,
            body: payload,
          });

          return rp(reqOptions);
        },
      },
    }

    , validateMovement = {
      validateMovement: {
        resource: 'moj/manage-pool/movement/validation',
        put: function(rp, app, jwtToken, payload) {
          var reqOptions = _.clone(options);

          reqOptions.headers.Authorization = jwtToken;
          reqOptions.uri = urljoin(reqOptions.uri, this.resource);
          reqOptions.method = 'PUT';
          reqOptions.body = payload;

          app.logger.info('Sending request to API: ', {
            uri: reqOptions.uri,
            headers: reqOptions.headers,
            method: reqOptions.method,
            body: payload,
          });

          return rp(reqOptions);
        },
      },
    };


  function availablePools(rp, app, jwtToken, locationCode, deferralDates) {
    var reqOptions = _.clone(options);

    reqOptions.headers.Authorization = jwtToken;
    reqOptions.uri = urljoin(reqOptions.uri, this.resource.replace('{}', locationCode));

    if (this.method === 'POST') {
      reqOptions.method = 'POST';
    }

    if (deferralDates) {
      reqOptions.body = {
        deferralDates,
      };
    }

    app.logger.info('Sending request to API: ', {
      uri: reqOptions.uri,
      headers: reqOptions.headers,
      method: reqOptions.method,
      locationCode: locationCode,
    });

    return rp(reqOptions);
  }

  module.exports.deferralMaintenance = deferralMaintenance;
  module.exports.reassignJurors = reassignJurors;
  module.exports.validateMovement = validateMovement;

})();
