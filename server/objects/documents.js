(function() {
  'use strict';

  const config = require('../config/environment')();
  const urljoin = require('url-join');
  const rp = require('request-promise');

  const _rp = (res) => Promise.resolve(res);

  module.exports.reissueLetterDAO = {
    getList: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/letter/reissue-letter-list'),
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

    getListCourt: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/letter/court-letter-list'),
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

    getDuringServiceList: function(app, req, letterType, includePrinted) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/letter/court-letter-list', letterType, includePrinted),
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

    postList: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/letter/reissue-letter'),
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

    printCourtLetters: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/letter/print-court-letter'),
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

    deletePending: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/letter/delete-pending-letter'),
        method: 'DELETE',
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

    getJurorInfo: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/letter/request-information'),
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

      return _rp(payload);
    },
  };

  module.exports.certificateOfExemptionDAO = {
    getTrialExemptionList: function(app, req, courtLocationCode) {
      const payload = {
        uri: urljoin(
          config.apiEndpoint,
          `moj/letter/trials-exemption-list?court_location=${courtLocationCode}`),
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
    getJurorsForExemptionList: function(app, req, caseNumber, courtLocationCode) {
      const payload = {
        uri: urljoin(
          config.apiEndpoint,
          `moj/letter/jurors-exemption-list?case_number=${caseNumber}&court_location=${courtLocationCode}`),
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
    postPrintLetter: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/letter/print-certificate-of-exemption'),
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

})();
