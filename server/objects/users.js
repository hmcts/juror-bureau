;(function() {
  'use strict';

  const rp = require('request-promise');

  var _ = require('lodash')
    , urljoin = require('url-join')
    , config = require('../config/environment')();

  module.exports.usersDAO = {
    getUsers: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/users'),
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
    createUser: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/users/create'),
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
    getUserRecord: function(app, req, username) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/users', username),
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
    assignCourts: function(app, req, username, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/users', username, 'courts'),
        method: 'PATCH',
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
    removeCourts: function(app, req, username, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/users', username, 'courts'),
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
    editUser: function(app, req, username, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/users', username),
        method: 'PUT',
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
    editUserType: function(app, req, username, userType) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/users', username, 'type', userType),
        method: 'PATCH',
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
