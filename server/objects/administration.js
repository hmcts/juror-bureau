;(function() {
  'use strict';

  const rp = require('request-promise');
  const { DAO } = require('./dataAccessObject');

  var _ = require('lodash')
    , urljoin = require('url-join')
    , config = require('../config/environment')();

  module.exports.systemCodesDAO = new DAO('moj/administration/codes', {
    get: function(codeType) {
      return {
        uri: this.resource + `/${codeType}`,
        transform: (data) => { delete data['_headers']; return Object.values(data) },
      };
    }
  })

  module.exports.deletePoolObject = new DAO('moj/manage-pool/delete', {
    delete: function(poolNumber) {
      return {
        uri: this.resource + `?poolNumber=${poolNumber}`,
      };
    },
  });

  module.exports.expenseRatesAndLimitsDAO = {
    get: function(app, req, etag = null) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/expenses/rates'),
        method: 'GET',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
      };

      if (etag) {
        payload.headers['If-None-Match'] = `${etag}`;
      }

      app.logger.info('Sending request to API: ', payload);

      payload.transform = (response, incomingRequest) => {
        const headers = _.cloneDeep(incomingRequest.headers);

        return { response, headers };
      };

      return rp(payload);
    },
    put: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/expenses/rates'),
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
  };

  module.exports.transportRates = {
    get: function(app, req, locCode, etag = null) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/court-location', locCode, 'rates'),
        method: 'GET',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
      };

      if (etag) {
        payload.headers['If-None-Match'] = `${etag}`;
      }

      app.logger.info('Sending request to API: ', payload);

      payload.transform = (response, incomingRequest) => {
        const headers = _.cloneDeep(incomingRequest.headers);

        return { response, headers };
      };

      return rp(payload);
    },
    put: function(app, req, loc, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/courts/', loc, 'rates'),
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
  };

  module.exports.courtsDAO = {
    get: function(app, req) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/courts'),
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

  module.exports.courtroomsDAO = {
    get: function(app, req, loc) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/court-rooms', loc),
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
    getDetails: function(app, req, loc, id, etag = null) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/court-rooms', loc, id),
        method: 'GET',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
      };

      if (etag) {
        payload.headers['If-None-Match'] = `${etag}`;
      }

      app.logger.info('Sending request to API: ', payload);

      payload.transform = (response, incomingRequest) => {
        const headers = _.cloneDeep(incomingRequest.headers);

        return { response, headers };
      };

      return rp(payload);
    },
    put: function(app, req, loc, id, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/court-rooms', loc, id),
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
    post: function(app, req, loc, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/court-rooms', loc),
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

  module.exports.judgesDAO = {
    getJudges: function(app, req, isActive) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/judges?is_active=' + isActive),
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
    getJudgeDetails: function(app, req, judgeId) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/judges', judgeId),
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
    put: function(app, req, judgeId, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/judges', judgeId),
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
    post: function(app, req, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/judges'),
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
    delete: function(app, req, judgeId) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/judges', judgeId),
        method: 'DELETE',
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

  module.exports.bankHolidaysDAO = {
    get: function(app, req, etag = null) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/bank-holidays'),
        method: 'GET',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
      };

      if (etag) {
        payload.headers['If-None-Match'] = `${etag}`;
      }

      app.logger.info('Sending request to API: ', payload);

      payload.transform = (response, incomingRequest) => {
        const headers = _.cloneDeep(incomingRequest.headers);

        return { response, headers };
      };

      return rp(payload);
    },
  };

  module.exports.nonSittingDayDAO = {
    get: function(app, req, locCode) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/non-sitting-days', locCode),
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
    post: function(app, req, locCode, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/non-sitting-days', locCode),
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

    delete: function(app, req, locCode, date) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/non-sitting-days', locCode, date),
        method: 'DELETE',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
        date,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.courtDetailsDAO = {
    get: function(app, req, loc, etag = null) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/courts', loc),
        method: 'GET',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
      };

      if (etag) {
        payload.headers['If-None-Match'] = `${etag}`;
      }

      app.logger.info('Sending request to API: ', payload);

      payload.transform = (response, incomingRequest) => {
        const headers = _.cloneDeep(incomingRequest.headers);

        return { response, headers };
      };

      return rp(payload);
    },
    put: function(app, req, loc, body) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/administration/courts', loc),
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
  };

})();
