(function () {
  'use strict';

  const _ = require('lodash');
  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const { extractDataAndHeadersFromResponse, replaceAllObjKeys } = require('../lib/mod-utils');
  const { basicDataTransform2 } = require('../lib/utils');

  module.exports.systemCodesDAO = new DAO('moj/administration/codes', {
    get: function (codeType) {
      return {
        uri: this.resource + `/${codeType}`,
        transform: data => {
          delete data['_headers'];
          return replaceAllObjKeys(Object.values(data), _.camelCase);
        },
      };
    },
  });

  module.exports.deletePoolObject = new DAO('moj/manage-pool/delete', {
    delete: function (poolNumber) {
      return {
        uri: this.resource + `?poolNumber=${poolNumber}`,
      };
    },
  });

  module.exports.expenseRatesAndLimitsDAO = new DAO('moj/administration/expenses/rates', {
    get: function (etag = null) {
      const headers = {};

      if (etag) {
        headers['If-None-Match'] = `${etag}`;
      }

      return {
        uri: this.resource,
        headers,
        transform: extractDataAndHeadersFromResponse(),
      };
    },
  });

  module.exports.transportRatesDAO = new DAO('moj/court-location/{locCode}/rates', {
    get: function (locCode, etag = null) {
      const headers = {};

      if (etag) {
        headers['If-None-Match'] = `${etag}`;
      }

      return {
        uri: this.resource.replace('{locCode}', locCode),
        headers,
        transform: extractDataAndHeadersFromResponse(),
      };
    },
    put: function (locCode, body) {
      return { uri: `moj/administration/courts/${locCode}/rates`, body };
    },
  });

  module.exports.courtsDAO = new DAO('moj/administration/courts', {
    get: function () {
      return {
        transform: data => {
          delete data['_headers'];
          return Object.values(data);
        },
      };
    },
  });

  module.exports.courtroomsDAO = new DAO('moj/administration/court-rooms', {
    get: function (locCode) {
      return {
        uri: urljoin(this.resource, locCode),
        transform: data => {
          delete data['_headers'];
          return Object.values(data);
        },
      };
    },
    put: function (locCode, id, body) {
      return { uri: urljoin(this.resource, locCode, id), body };
    },
    post: function (locCode, body) {
      return { uri: urljoin(this.resource, locCode), body };
    },
  });

  module.exports.courtroomDetailsDAO = new DAO('moj/administration/court-rooms/{locCode}/{id}', {
    get: function (locCode, id, etag = null) {
      const headers = {};

      if (etag) {
        headers['If-None-Match'] = `${etag}`;
      }

      return {
        uri: this.resource.replace('{locCode}', locCode).replace('{id}', id),
        headers,
        transform: extractDataAndHeadersFromResponse(),
      };
    },
  });

  module.exports.judgesDAO = new DAO('moj/administration/judges', {
    get: function (isActive) {
      return {
        uri: this.resource + `?is_active=${isActive}`,
        transform: data => {
          delete data['_headers'];
          return replaceAllObjKeys(Object.values(data), _.camelCase);
        },
      };
    },
    put: function (judgeId, body) {
      return {
        uri: this.resource + `/${judgeId}`,
        body: replaceAllObjKeys(body, _.snakeCase),
      };
    },
    post: function (body) {
      return {
        uri: this.resource,
        body: replaceAllObjKeys(body, _.snakeCase),
      };
    },
    delete: function (judgeId) {
      return { uri: this.resource + `/${judgeId}` };
    },
  });

  module.exports.judgeDetailsDAO = new DAO('moj/administration/judges/{judgeId}', {
    get: function (judgeId) {
      return {
        uri: this.resource.replace('{judgeId}', judgeId),
        transform: basicDataTransform2,
      };
    },
  });

  module.exports.bankHolidaysDAO = new DAO('moj/administration/bank-holidays', {
    get: function () {
      return {
        uri: this.resource,
        transform: data => {
          delete data['_headers'];
          return replaceAllObjKeys(data, _.camelCase);
        },
      };
    },
  });

  module.exports.nonSittingDayDAO = new DAO('moj/administration/non-sitting-days/{locCode}', {
    get: function (locCode) {
      return {
        uri: this.resource.replace('{locCode}', locCode),
        transform: data => {
          delete data['_headers'];
          return replaceAllObjKeys(Object.values(data), _.camelCase);
        },
      };
    },
    post: function (locCode, body) {
      return {
        uri: this.resource.replace('{locCode}', locCode),
        body: replaceAllObjKeys(body, _.snakeCase),
      };
    },
    delete: function (locCode, date) {
      return { uri: this.resource.replace('{locCode}', locCode) + `/${date}` };
    },
  });

  module.exports.courtDetailsDAO = new DAO('moj/administration/courts/{locCode}', {
    get: function (locCode, etag = null) {
      const headers = {};

      if (etag) {
        headers['If-None-Match'] = `${etag}`;
      }

      return {
        uri: this.resource.replace('{locCode}', locCode),
        headers,
        transform: extractDataAndHeadersFromResponse(),
      };
    },
    put: function (locCode, body) {
      return { uri: this.resource.replace('{locCode}', locCode), body };
    },
  });
})();
