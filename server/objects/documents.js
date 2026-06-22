(function() {
  'use strict';

  const _ = require('lodash');
  const { DAO } = require('./dataAccessObject');
  const { mapCamelToSnake, mapSnakeToCamel } = require('../lib/mod-utils');
  const urljoin = require('url-join');

  module.exports.reissueLetterDAO = {
    getList: function(req, body) {
      const dao = new DAO('moj/letter/reissue-letter-list', {
        post: function(body) {
          return {
            body: mapCamelToSnake(_.cloneDeep(body)),
            transform: (data) => {
              delete data['_headers'];
              return mapSnakeToCamel(data);
            },
          };
        },
      });

      return dao.post(req, body);
    },

    getListCourt: function(req, body) {
      const dao = new DAO('moj/letter/court-letter-list', {
        post: function(body) {
          return {
            body: mapCamelToSnake(_.cloneDeep(body)),
            transform: (data) => {
              delete data['_headers'];
              return mapSnakeToCamel(data);
            },
          };
        },
      });

      return dao.post(req, body);
    },

    getDuringServiceList: function(req, letterType, includePrinted) {
      const dao = new DAO('moj/letter/court-letter-list', {
        get: function(letterType, includePrinted) {
          return {
            uri: urljoin(this.resource, letterType, includePrinted),
            transform: (data) => {
              delete data['_headers'];
              return mapSnakeToCamel(data);
            },
          };
        },
      });

      return dao.get(req, letterType, includePrinted);
    },

    postList: function(req, body) {
      const dao = new DAO('moj/letter/reissue-letter', {
        post: function(body) {
          return {
            body: _.cloneDeep(body),
            transform: (data) => {
              delete data['_headers'];
              return mapSnakeToCamel(data);
            },
          };
        },
      });

      return dao.post(req, body);
    },

    printCourtLetters: function(req, body) {
      const dao = new DAO('moj/letter/print-court-letter', {
        post: function(body) {
          return {
            uri: this.resource,
            body: mapCamelToSnake(_.cloneDeep(body)),
            transform: (data) => {
              delete data['_headers'];
              return mapSnakeToCamel(Object.values(data));
            },
          };
        },
      });

      return dao.post(req, body);
    },

    deletePending: function(req, body) {
      const dao = new DAO('moj/letter/delete-pending-letter', {
        delete: function(body) {
          return {
            body: _.cloneDeep(body),
          };
        },
      });

      return dao.delete(req, body);
    },

    getJurorInfo: function(req, body) {
      const dao = new DAO('moj/letter/request-information', {
        post: function(body) {
          return {
            body,
            transform: mapSnakeToCamel,
          };
        },
      });

      return dao.post(req, body);
    },
  };

  module.exports.certificateOfExemptionDAO = {
    getTrialExemptionList: function(req, courtLocationCode) {
      const dao = new DAO('moj/letter/trials-exemption-list', {
        get: function(courtLocationCode) {
          return {
            uri: `${this.resource}?court_location=${courtLocationCode}`,
            transform: (data) => { delete data['_headers']; return mapSnakeToCamel(Object.values(data)); },
          };
        },
      });

      return dao.get(req, courtLocationCode);
    },
    getJurorsForExemptionList: function(req, caseNumber, courtLocationCode) {
      const dao = new DAO('moj/letter/jurors-exemption-list', {
        get: function(caseNumber, courtLocationCode) {
          return {
            uri: `${this.resource}?case_number=${caseNumber}&court_location=${courtLocationCode}`,
            transform: (data) => {
              delete data['_headers'];
              return mapSnakeToCamel(Object.values(data));
            },
          };
        },
      });

      return dao.get(req, caseNumber, courtLocationCode);
    },
    postPrintLetter: function(req, body) {
      const dao = new DAO('moj/letter/print-certificate-of-exemption', {
        post: function(body) {
          return {
            uri: this.resource,
            body: mapCamelToSnake(_.cloneDeep(body)),
            transform: (data) => {
              delete data['_headers'];
              return mapSnakeToCamel(Object.values(data));
            },
          };
        },
      });

      return dao.post(req, body);
    },

  };

})();
