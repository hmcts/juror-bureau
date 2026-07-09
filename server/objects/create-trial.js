(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject')
  const urljoin = require('url-join')
  const { mapCamelToSnake, mapSnakeToCamel } = require('../lib/mod-utils');

  function mapTrialSummaryResponse(data) {
    const trial = mapSnakeToCamel(data);

    if (typeof trial.courtroom !== 'undefined' && typeof trial.courtroomsDto === 'undefined') {
      trial.courtroomsDto = trial.courtroom;
    }

    if (typeof trial.protected !== 'undefined' && typeof trial.protectedTrial === 'undefined') {
      trial.protectedTrial = trial.protected;
    }

    return trial;
  }

  module.exports.trialDetailsObject = new DAO('moj/trial/summary', {
    get: function(trialNumber, locationCode) {
      const params = new URLSearchParams({ 'trial_number': trialNumber, 'location_code': locationCode });

      return {
        uri: urljoin(this.resource, `?${params.toString()}`),
        transform: mapTrialSummaryResponse,
      }
    }
  });

  module.exports.courtroomsObject = new DAO('moj/trial/courtrooms/list', {
    get: function() {
      return {
        uri: this.resource,
        transform: (data) => { delete data._headers; return Object.values(mapSnakeToCamel(data)); },
      };
    }
  });

  module.exports.judgesObject = new DAO('moj/trial/judge/list', {
    get: function() {
      return {
        uri: this.resource,
        transform: mapSnakeToCamel,
      };
    }
  });

  module.exports.createTrialObject = new DAO('moj/trial/create', {
    post: function(body) {
      return {
        body: mapCamelToSnake(body),
        transform: mapTrialSummaryResponse,
      };
    }
  });

  module.exports.editTrialDAO = new DAO('moj/trial/edit', {
    patch: function(body) {
      return {
        body: mapCamelToSnake(body),
        transform: mapTrialSummaryResponse,
      };
    }
  });

  module.exports.trialsListDAO = new DAO('moj/trial/list', {
    post: function(body) {
      return {
        body: mapCamelToSnake(body),
        transform: mapSnakeToCamel,
      };
    }
  });

})();
