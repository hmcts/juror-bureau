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
    , includeHeaders = function(body, response) {
      return { 'headers': response.headers, 'data': body };
    }

    , fetchCourts = {
      resource: 'moj/pool-request/court-locations',
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

    , fetchAllCourts = {
      resource: 'moj/court-location/all-court-locations',
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

    , fetchCourtDeferrals = {
      resource: 'moj/pool-request/deferrals',
      get: function(rp, app, jwtToken, locationCode, attendanceDate) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'GET';
        reqOptions.uri = urljoin(
          reqOptions.uri,
          this.resource,
          '?locationCode=' + locationCode,
          '&deferredTo=' + attendanceDate);

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        return rp(reqOptions);
      },
    }

    , checkDayType = {
      resource: 'moj/pool-request/day-type',
      get: function(rp, app, jwtToken, locationCode, attendanceDate) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'GET';
        reqOptions.uri = urljoin(
          reqOptions.uri,
          this.resource,
          '?locationCode=' + locationCode,
          '&attendanceDate=' + attendanceDate);

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        return rp(reqOptions);
      },
    }

    , generatePoolNumber = {
      resource: 'moj/pool-request/generate-pool-number',
      get: function(rp, app, jwtToken, locationCode, attendanceDate) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'GET';
        reqOptions.uri = urljoin(
          reqOptions.uri,
          this.resource,
          '?locationCode=' + locationCode,
          '&attendanceDate=' + attendanceDate);

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        return rp(reqOptions);
      },
    }

    , fetchPoolNumbers = {
      resource: 'moj/pool-request/pool-numbers',
      get: function(rp, app, jwtToken, poolNumberPrefix) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.method = 'GET';
        reqOptions.uri = urljoin(
          reqOptions.uri,
          this.resource,
          '?poolNumberPrefix=' + poolNumberPrefix);

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        return rp(reqOptions);
      },
    }

    , createPoolRequest = {
      resource: 'moj/pool-request/new-pool',
      post: function(rp, app, jwtToken, body) {
        var reqOptions = _.clone(options)
          , tmpBody = _.clone(body);

        if (tmpBody.attendanceTime) {
          tmpBody.attendanceTime = tmpBody.attendanceTime.hour + ':' + tmpBody.attendanceTime.minute;
        }

        tmpBody.numberRequested = tmpBody.numberRequested || 0;

        delete tmpBody._csrf;
        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'POST';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },
    }

    , createCoronerPool = {
      resource: 'moj/pool-create/create-coroner-pool',
      post: function(rp, app, jwtToken, body) {
        var reqOptions = _.clone(options)
          , tmpBody = _.clone(body);

        delete tmpBody._csrf;
        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'POST';
        reqOptions.body = tmpBody;
        reqOptions.transform = includeHeaders;

        app.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },
    }

    , fetchCoronerPool = {
      resource: 'moj/pool-create/coroner-pool',
      get: function(rp, app, jwtToken, poolNumber, etag = null) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, '?poolNumber=' + poolNumber);
        reqOptions.method = 'GET';

        app.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: {
            poolNumber: poolNumber,
          },
        });

        if (etag) {
          reqOptions.headers['If-None-Match'] = `${etag}`;
        }

        reqOptions.transform = (response, incomingRequest) => {
          const headers = _.cloneDeep(incomingRequest.headers);
  
          return { response, headers };
        };

        return rp(reqOptions);
      },
    }

    , addCoronerCitizens = {
      resource: 'moj/pool-create/add-citizens',
      post: function(rp, app, jwtToken, payload) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'POST';
        reqOptions.body = payload;

        app.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: payload,
        });

        return rp(reqOptions);
      },
    }

    , fetchPoolsAtCourt = {
      resource: 'moj/pool-request/pools-at-court',
      get: function(rp, app, jwtToken, locCode) {
        const reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, '?locCode=' + locCode);
        reqOptions.method = 'GET';

        app.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        return rp(reqOptions);
      },
    };

  module.exports.fetchCourts = fetchCourts;
  module.exports.fetchAllCourts = fetchAllCourts;
  module.exports.generatePoolNumber = generatePoolNumber;
  module.exports.createPoolRequest = createPoolRequest;
  module.exports.checkDayType = checkDayType;
  module.exports.fetchCourtDeferrals = fetchCourtDeferrals;
  module.exports.fetchPoolNumbers = fetchPoolNumbers;
  module.exports.createCoronerPool = createCoronerPool;
  module.exports.fetchCoronerPool = fetchCoronerPool;
  module.exports.addCoronerCitizens = addCoronerCitizens;
  module.exports.fetchPoolsAtCourt = fetchPoolsAtCourt;

  // new DAOs
  const { DAO } = require('./dataAccessObject');

  module.exports.fetchCourtsDAO = new DAO('moj/pool-request/court-locations');
  module.exports.fetchAllCourtsDAO = new DAO('moj/court-location/all-court-locations');

})();
