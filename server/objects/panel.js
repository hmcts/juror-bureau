(() => {
  'use strict';

  const urljoin = require('url-join');
  const { DAO } = require('./dataAccessObject');

  module.exports.generatePanelDAO = new DAO('moj/trial/panel/create-panel');

  module.exports.panelMemberStatusDAO = new DAO('moj/trial/panel/status', {
    get: function(trialNumber, courtLocationCode) {
      const params = new URLSearchParams({ 'trial_number': trialNumber, 'court_location_code': courtLocationCode });
      const uri = urljoin(this.resource, `?${params.toString()}`);

      return { uri };
    },
  });

  module.exports.addPanelMembersDAO = new DAO('moj/trial/panel/add-panel-members', {
    post: function(body) {
      return { body };
    },
  });

  module.exports.panelListDAO = new DAO('moj/trial/panel/list', {
    get: function(trialNumber, courtLocationCode) {
      const params = new URLSearchParams({ 'trial_number': trialNumber, 'court_location_code': courtLocationCode });
      const uri = urljoin(this.resource, `?${params.toString()}`);

      return { 
        uri,
        transform: (data) => { delete data._headers; return Object.values(data); }
      };
    }
  });

  module.exports.requestPanelDAO = new DAO('moj/trial/panel/list', {
    get: function(trialNumber, courtLocationCode, numberRequested) {
      const params = new URLSearchParams({
        'trial_number': trialNumber,
        'court_location_code': courtLocationCode,
        'number_requested': numberRequested,
      });
      const uri = urljoin(this.resource, `?${params.toString()}`);

      return { 
        uri,
        transform: (data) => { delete data._headers; return Object.values(data); }
      };
    }
  })

  module.exports.empanelJurorsDAO = new DAO('moj/trial/panel/process-empanelled');

  module.exports.availableJurorsDAO = new DAO('moj/trial/panel/available-jurors', {
    get: function(courtLocationCode) {
      return{
        uri: `${this.resource}?court_location_code=${courtLocationCode}`,
        transform: (data) => { delete data._headers; return Object.values(data); }
      }
    }
  });

})();
