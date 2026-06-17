;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const utils = require('../lib/utils');
  const { mapCamelToSnake, mapSnakeToCamel } = require('../lib/mod-utils');

  const courtLocationsTransform = (data) => {
    const courts = data.data || [];

    delete data._headers;
    return {
      ...mapSnakeToCamel(data),
      courts: mapSnakeToCamel(courts),
    };
  };

  module.exports.fetchCourts = new DAO('moj/pool-request/court-locations', {
    get: function() {
      return { transform: courtLocationsTransform };
    },
  });

  module.exports.fetchAllCourts = new DAO('moj/court-location/all-court-locations', {
    get: function() {
      return { transform: courtLocationsTransform };
    },
  });

  module.exports.generatePoolNumber = new DAO('moj/pool-request/generate-pool-number', {
    get: function(locationCode, attendanceDate) {
      return {
        uri: `${this.resource}?locationCode=${locationCode}&attendanceDate=${attendanceDate}`,
        transform: utils.basicDataTransform,
      }
    }
  });

  module.exports.createPoolRequest = new DAO('moj/pool-request/new-pool', {
    post: function(body) {
      if (body.attendanceTime) {
        body.attendanceTime = body.attendanceTime.hour + ':' + body.attendanceTime.minute;
      }

      body.numberRequested = body.numberRequested || 0;
      body.locationCode = body.courtCode;
      delete body.courtCode;

      return {
        uri: this.resource,
        body: mapCamelToSnake(body),
      }
    }
  });

  module.exports.checkDayType = new DAO('moj/pool-request/day-type', {
    get: function(locationCode, attendanceDate) {
      return {
        uri: `${this.resource}?locationCode=${locationCode}&attendanceDate=${attendanceDate}`,
        transform: utils.basicDataTransform2,
      }
    }
  });

  module.exports.fetchCourtDeferrals = new DAO('moj/pool-request/deferrals', {
    get: function(locationCode, attendanceDate) {
      return {
        uri: `${this.resource}?locationCode=${locationCode}&deferredTo=${attendanceDate}`,
        transform: utils.basicDataTransform,
      }
    }
  });

  module.exports.fetchPoolNumbers = new DAO('moj/pool-request/pool-numbers', {
    get: function(poolNumberPrefix) {
      return {
        uri: `${this.resource}?poolNumberPrefix=${poolNumberPrefix}`,
        transform: utils.basicDataTransform,
      }
    }
  });

  module.exports.addCoronerCitizens = new DAO('moj/pool-create/add-citizens');

  module.exports.fetchPoolsAtCourt = new DAO('moj/pool-request/pools-at-court', {
    get: function(locCode) {
      return { 
        uri: `${this.resource}?locCode=${locCode}`,
        transform: (data) => {
          const poolsAtCourtLocation = data.data || [];

          delete data._headers;
          return {
            ...mapSnakeToCamel(data),
            poolsAtCourtLocation: mapSnakeToCamel(poolsAtCourtLocation),
          };
        },
      };
    }
  });

  module.exports.fetchCourtsDAO = new DAO('moj/pool-request/court-locations', {
    get: function() {
      return { transform: courtLocationsTransform };
    },
  });

  module.exports.fetchAllCourtsDAO = new DAO('moj/court-location/all-court-locations', {
    get: function() {
      return { transform: courtLocationsTransform };
    },
  });

  module.exports.createCoronerPoolDAO = new DAO('moj/pool-create/create-coroner-pool', {
    post: function(body) {
      return { body };
    },
  });

  module.exports.fetchCoronerPoolDAO = new DAO('moj/pool-create/coroner-pool', {
    get: function(poolNumber, etag = null) {
      const uri = urljoin(this.resource, '?poolNumber=' + poolNumber);
      const headers = {};

      if (etag) {
        headers['If-None-Match'] = `${etag}`;
      }

      return {
        uri,
        headers,
        transform: (data) => {
          delete data._headers;
          return mapSnakeToCamel(data);
        },
      };
    },
  });

})();
