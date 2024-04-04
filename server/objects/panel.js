(() => {
  'use strict';

  const rp = require('request-promise');
  const config = require('../config/environment')();
  const urljoin = require('url-join');
  const { DAO } = require('./dataAccessObject');

  module.exports.generatePanelDAO = {
    post: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/trial/panel/create-panel'),
        method: 'POST',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
        body,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.panelMemberStatusDAO = new DAO('moj/trial/panel/status', {
    get: function(trialNumber, courtLocationCode) {
      const uri = urljoin(this.resource, `?trial_number=${trialNumber}&court_location_code=${courtLocationCode}`);

      return { uri };
    },
  });

  module.exports.addPanelMembersDAO = new DAO('moj/trial/panel/add-panel-members', {
    post: function(body) {
      return { body };
    },
  });

  module.exports.panelListDAO = {
    get: function(app, req, trialNumber, courtLocationCode) {
      const payload = {
        uri: urljoin(
          config.apiEndpoint,
          `moj/trial/panel/list?trial_number=${trialNumber}&court_location_code=${courtLocationCode}`,
        ),
        method: 'GET',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.requestPanelDAO = {
    get: function(app, req, trialNumber, courtLocationCode, numberRequested) {
      const payload = {
        uri: urljoin(
          config.apiEndpoint,
          `moj/trial/panel/list?trial_number=${
            trialNumber
          }&court_location_code=${
            courtLocationCode
          }&number_requested=${
            numberRequested
          }`,
        ),
        method: 'GET',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.empanelJurorsDAO = {
    post: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/trial/panel/process-empanelled'),
        method: 'POST',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
        body,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.availableJurorsDAO = {
    get: function(app, req, courtLocationCode) {
      const payload = {
        uri: urljoin(
          config.apiEndpoint,
          `moj/trial/panel/available-jurors?court_location_code=${courtLocationCode}`,
        ),
        method: 'GET',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

})();
