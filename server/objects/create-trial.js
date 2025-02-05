(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject')
  const urljoin = require('url-join')

  module.exports.trialDetailsObject = new DAO('moj/trial/summary', {
    get: function(trialNumber, locationCode) {
      const params = new URLSearchParams({ 'trialNumber': trialNumber, 'locationCode': locationCode });

      return {
        uri: urljoin(this.resource, `?${params.toString()}`),
      }
    }
  });

  module.exports.courtroomsObject = new DAO('moj/trial/courtrooms/list', {
    get: function() {
      return {
        uri: this.resource,
        transform: (data) => { delete data._headers; return Object.values(data); },
      };
    }
  });

  module.exports.judgesObject = new DAO('moj/trial/judge/list');

  module.exports.createTrialObject = new DAO('moj/trial/create');

  module.exports.editTrialDAO = new DAO('moj/trial/edit');

  module.exports.trialsListDAO = new DAO('moj/trial/list');

})();
