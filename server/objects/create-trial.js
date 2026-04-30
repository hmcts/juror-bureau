(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject')
  const urljoin = require('url-join')
  const { mapCamelToSnake, mapSnakeToCamel } = require('../lib/mod-utils');

  module.exports.trialDetailsObject = new DAO('moj/trial/summary', {
    get: function(trialNumber, locationCode) {
      const params = new URLSearchParams({ 'trial_number': trialNumber, 'location_code': locationCode });

      return {
        uri: urljoin(this.resource, `?${params.toString()}`),
        transform: mapSnakeToCamel,
      }
    }
  });

  module.exports.courtroomsObject = new DAO('moj/trial/courtrooms/list', {
    get: function() {
      return {
        uri: this.resource,
        transform: (data) => { delete data._headers; return mapSnakeToCamel(Object.values(data)); },
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
        transform: mapSnakeToCamel,
      };
    }
  });

  module.exports.editTrialDAO = new DAO('moj/trial/edit', {
    patch: function(body) {
      return {
        body: mapCamelToSnake(body),
        transform: mapSnakeToCamel,
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
