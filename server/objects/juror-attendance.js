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
  const { replaceAllObjKeys } = require('../lib/mod-utils');

  module.exports.jurorsAttending = {
    resource: 'moj/juror-management/appearance',
    get: function(__, app, jwtToken, locationCode, attendanceDate, group) {
      const reqOptions = _.clone(options);

      reqOptions.headers.Authorization = jwtToken;
      reqOptions.uri = urljoin(reqOptions.uri,
        this.resource,
        `?locationCode=${locationCode}`,
        `&attendanceDate=${attendanceDate}`,
        `&group=${group}`);
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
    }
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
  module.exports.poolAttedanceAuditDAO = new DAO('moj/audit/{date}/pool', {
    get: function(date) {
      return {
        uri: this.resource.replace('{date}', date),
        transform: (data) => { delete data['_headers']; return Object.values(data)},
      };
    },
  });
  module.exports.unconfirmedJurorAttendancesDAO = new DAO('moj/juror-management/unconfirmed-jurors/{locCode}', {
    get: function(locCode, date) {
      return {
        uri: this.resource.replace('{locCode}', locCode) + `?attendanceDate=${date}`,
        transform: (data) => { delete data['_headers']; return replaceAllObjKeys(data.jurors, _.camelCase); },
      };
    },
  });
  module.exports.confirmJurorAttendanceDAO = new DAO('moj/juror-management/confirm-attendance');

})();
