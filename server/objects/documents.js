(function() {
  'use strict';

  const config = require('../config/environment')();
  const urljoin = require('url-join');
  const documentStore = require('../stores/documents-list');
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

      const tempResponse = documentStore.documentData(body.document, true);

      return _rp(tempResponse);
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

})();
