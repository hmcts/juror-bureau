(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const { basicDataTransform } = require('../lib/utils');
  const { mapCamelToSnake, mapSnakeToCamel } = require('../lib/mod-utils');

  module.exports.deferralMaintenance = {
    deferrals: new DAO('moj/deferral-maintenance/deferrals', {
      get: function(locationCode) {
        return {
          uri: urljoin(this.resource, locationCode.toString()),
          transform: mapSnakeToCamel,
        }
      }
    }),
    allocateJurors: new DAO('moj/deferral-maintenance/deferrals/allocate-jurors-to-pool', {
      post: function(jurors, poolNumber) {
        return {
          uri: this.resource,
          body: {
            poolNumber: poolNumber,
            jurors: jurors,
          },
          transform: basicDataTransform
        }
      }
    }),
    availablePools: {
      get: availablePools.bind({ resource: 'moj/deferral-maintenance/available-pools/{}' }),
      post: availablePools.bind({ resource: 'moj/deferral-maintenance/available-pools/{}', method: 'POST' }),
    },
    moveCourt: new DAO('moj/deferral-maintenance/juror/move-deferred', {
      post: function(payload) {
        return {
          uri: this.resource,
          body: payload,
          transform: basicDataTransform
        }
      }
    }),
  };


  module.exports.reassignJurors = {
    availablePools: {
      get: availablePools.bind({ resource: 'moj/manage-pool/available-pools/{}?is-reassign=true' }),
    },
    availableCourtOwnedPools: {
      get: availablePools.bind({ resource: 'moj/manage-pool/available-pools-court-owned/{}' }),
    },
    reassignJuror: new DAO('moj/manage-pool/reassign-jurors', {
      put: function(body) {
        return {
          body: mapCamelToSnake(body),
          transform: mapSnakeToCamel,
        };
      }
    }),
  };

  module.exports.validateMovement = {
    validateMovement: new DAO('moj/manage-pool/movement/validation', {
      put: function(body) {
        return {
          body: mapCamelToSnake(body),
          transform: mapSnakeToCamel,
        };
      }
    })
  };

  async function availablePools(req, locationCode, deferralDates) {
    const uri = this.resource.replace('{}', locationCode);

    let body;
    if (deferralDates) {
      body = {
        deferralDates,
      };
    }

    const dao = new DAO(uri, {
      get: function(body) {
        return {
          body,
          transform: mapSnakeToCamel,
        };
      },
      post: function(body) {
        return {
          body,
          transform: mapSnakeToCamel,
        };
      },
    });

    if (this.method === 'POST') {
      return await dao.post(req, body);
    }

    return await dao.get(req, body);
  }

})();
