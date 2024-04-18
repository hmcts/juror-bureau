(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const _ = require('lodash');
  const config = require('../config/environment')();
  const utils = require('../lib/utils');
  const urljoin = require('url-join');
  const options = {
    uri: config.apiEndpoint,
    headers: {
      'User-Agent': 'Request-Promise',
      'Content-Type': 'application/vnd.api+json',
    },
    json: true,
    transform: utils.basicDataTransform,
  };
  const rp = require('request-promise');

  module.exports.jurorsAttending = {
    resource: 'moj/juror-management/appearance',
    get: function(__, app, jwtToken, locationCode, attendanceDate) {
      const reqOptions = _.clone(options);

      reqOptions.headers.Authorization = jwtToken;
      reqOptions.uri = urljoin(reqOptions.uri,
        this.resource,
        `?locationCode=${locationCode}`,
        `&attendanceDate=${attendanceDate}`);
      reqOptions.method = 'GET';

      app.logger.info('Sending request to API: ', {
        uri: reqOptions.uri,
        headers: reqOptions.headers,
        method: reqOptions.method,
      });

      return rp(reqOptions);
    },
    put: function(__, app, jwtToken, data) {
      const reqOptions = _.clone(options);

      reqOptions.headers.Authorization = jwtToken;
      reqOptions.uri = urljoin(reqOptions.uri, this.resource);
      reqOptions.method = 'PUT';
      reqOptions.body = data;

      app.logger.info('Sending request to API: ', {
        uri: reqOptions.uri,
        headers: reqOptions.headers,
        method: reqOptions.method,
        data,
      });

      return rp(reqOptions);
    },
  };

  module.exports.jurorAttendanceDao = {
    get: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/juror-management/attendance'),
        method: 'GET',
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
    patch: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/juror-management/attendance'),
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
    delete: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/juror-management/attendance'),
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
  };

  module.exports.changeNextDueAtCourtDAO = {
    patch: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/juror-management/attendance/attendance-date'),
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
  };

  module.exports.jurorNonAttendanceDao = {
    post: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/juror-management/non-attendance'),
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

  module.exports.jurorAddAttendanceDao = {
    post: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/juror-management/add-attendance-day'),
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

  // new DAO
  module.exports.modifyJurorAttendance = new DAO('moj/juror-management/attendance/modify-attendance');

})();
