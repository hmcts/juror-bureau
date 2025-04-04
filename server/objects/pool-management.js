(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');


  module.exports.deferralMaintenance = {
    deferrals: new DAO('moj/deferral-maintenance/deferrals', {
      get: function(locationCode) {
        return {
          uri: urljoin(this.resource, locationCode.toString()),
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
          }
        }
      }
    }),
    availablePools: {
      get: availablePools.bind({ resource: 'moj/deferral-maintenance/available-pools/{}' }),
      post: availablePools.bind({ resource: 'moj/deferral-maintenance/available-pools/{}', method: 'POST' }),
    },
    moveCourt: new DAO('moj/deferral-maintenance/juror/move-deferred')
  };

  module.exports.reassignJurors = {
    availablePools: {
      get: availablePools.bind({ resource: 'moj/manage-pool/available-pools/{}?is-reassign=true' }),
    },
    availableCourtOwnedPools: {
      get: availablePools.bind({ resource: 'moj/manage-pool/available-pools-court-owned/{}' }),
    },
    reassignJuror: new DAO('moj/manage-pool/reassign-jurors'),
  };

  module.exports.validateMovement = {
    validateMovement: new DAO('moj/manage-pool/movement/validation')
  };

  async function availablePools(req, locationCode, deferralDates) {
    const uri = this.resource.replace('{}', locationCode);

    let body;
    if (deferralDates) {
      body = {
        deferralDates,
      };
    }

    const dao = new DAO(uri);

    if (this.method === 'POST') {
      return await dao.post(req, body);
    }

    return await dao.get(req, body);
  }

})();
