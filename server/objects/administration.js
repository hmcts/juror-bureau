const { get, put } = require('request');

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

  module.exports.expenseRatesAndLimitsDAO = new DAO('moj/administration/expenses/rates', {
    get: function(etag = null) {
      const headers = {};

      if (etag) {
        headers['If-None-Match'] = `${etag}`;
      }

      return { uri: this.resource, headers};
    },
  });

  module.exports.transportRatesDAO = new DAO('moj/court-location/{locCode}/rates', {
    get: function(locCode, etag = null) {
      const headers = {};

      if (etag) {
        headers['If-None-Match'] = `${etag}`;
      }

      return { uri: this.resource.replace('{locCode}', locCode), headers};
    },
    put: function(locCode, body) {
      return { uri: `moj/administration/courts/${locCode}/rates`, body};
    }
  });

  module.exports.courtsDAO = new DAO('moj/administration/courts', {
    get: function() {
      return { transform: (data) => { delete data['_headers']; return Object.values(data) } };
    }
  });

  module.exports.courtroomsDAO = new DAO('moj/administration/court-rooms', {
    get: function(locCode) {
      console.log(locCode);
      return { 
        uri: urljoin(this.resource, locCode),
        transform: (data) => { delete data['_headers']; return Object.values(data) }
      };
    },
    put: function(locCode, id, body) {
      return { uri: urljoin(this.resource, locCode, id), body };
    },
    post: function(locCode, body) {
      return { uri: urljoin(this.resource, locCode), body };
    },
  })

  module.exports.courtroomDetailsDAO = new DAO('moj/administration/court-rooms/{locCode}/{id}', {
    get: function(locCode, id, etag = null) {
      const headers = {};

      if (etag) {
        headers['If-None-Match'] = `${etag}`;
      }

      return { uri: this.resource.replace('{locCode}', locCode).replace('{id}', id), headers};
    }
  });

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
