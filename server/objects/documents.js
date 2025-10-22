(function() {
  'use strict';

  const { axiosClient } = require('./axios-instance');
  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join').default;

  module.exports.reissueLetterDAO = {
    getList: function(req, body) {
      return axiosClient('post', 'moj/letter/reissue-letter-list', req.session.authToken, { body });
    },

    getListCourt: function(req, body) {
      return axiosClient('post', 'moj/letter/court-letter-list', req.session.authToken, { body });
    },

    getDuringServiceList: function(req, letterType, includePrinted) {
      return axiosClient('get', urljoin('moj/letter/court-letter-list', letterType, includePrinted), req.session.authToken);
    },

    postList: function(req, body) {
      return axiosClient('post', 'moj/letter/reissue-letter', req.session.authToken, { body });
    },

    printCourtLetters: function(req, body) {
      const dao = new DAO('moj/letter/print-court-letter', {
        post: function(body) {
          return {
            uri: this.resource,
            body,
            transform: (data) => { delete data['_headers']; return Object.values(data) },
          };
        },
      });

      return dao.post(req, body);
    },

    deletePending: function(req, body) {
      return axiosClient('delete', 'moj/letter/delete-pending-letter', req.session.authToken, { body });
    },

    getJurorInfo: function(req, body) {
      return axiosClient('post', 'moj/letter/request-information', req.session.authToken, { body });
    },
  };

  module.exports.certificateOfExemptionDAO = {
    getTrialExemptionList: function(req, courtLocationCode) {
      const dao = new DAO('moj/letter/trials-exemption-list', {
        get: function(courtLocationCode) {
          return {
            uri: `${this.resource}?court_location=${courtLocationCode}`,
            transform: (data) => { delete data['_headers']; return Object.values(data) },
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
            transform: (data) => { delete data['_headers']; return Object.values(data) },
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
            body,
            transform: (data) => { delete data['_headers']; return Object.values(data) },
          };
        },
      });

      return dao.post(req, body);
    },

  };

})();
