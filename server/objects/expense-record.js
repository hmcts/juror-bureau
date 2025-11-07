;(function(){
  'use strict';

  const urljoin = require('url-join').default;
  const { DAO } = require('./dataAccessObject');
  const { extractDataAndHeadersFromResponse } = require('../lib/mod-utils');

  const endpoint = '/moj/expenses/{locCode}';

  module.exports.getDraftExpensesDAO = new DAO(endpoint, {
    get: function(jurorNumber, locCode, etag = null) {
      const headers = {};

      if (etag) {
        headers['If-None-Match'] = `${etag}`;
      }

      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, 'DRAFT/view'),
        headers,
        transform: extractDataAndHeadersFromResponse(),
      };
    }
  })

  module.exports.submitDraftExpenses = new DAO(endpoint, {
    post: function(locCode, jurorNumber, attendanceDates) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, 'submit-for-approval'),
        body: {
          dates: attendanceDates,
        },
      };
    },
  });

  module.exports.getEnteredExpensesDAO = new DAO(endpoint, {
    post: function(locCode, jurorNumber, body) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, 'entered'),
        body,
        transform: (data) => { delete data._headers; return Object.values(data); }
      }
    }
  });

  module.exports.postEditedExpensesDAO = new DAO(endpoint, {
    put: function(locCode, jurorNumber, expenseType, body) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, expenseType, 'edit'),
        body,
      };
    },
  });

  module.exports.getExpenseRecordsDAO = new DAO(endpoint, {
    get: function(locCode, expenseType, jurorNumber) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, expenseType, 'view/simplified'),
      }
    }
  });

  module.exports.postRecalculateSummaryTotalsDAO = new DAO(endpoint, {
    post: function(locCode, jurorNumber, body) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, 'calculate/totals'),
        body,
      };
    }
  });

  module.exports.addSmartcardSpend = new DAO(endpoint, {
    patch: function(locCode, jurorNumber, body) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, 'smartcard'),
        body,
      };
    }
  })


  // TODO: This still needs migrating to Axios DAO - currently getting accessDenied error
  module.exports.getExpenseCountDAO = {
    get: function(app) {
      return async function(req, res, next) {
        const { jurorNumber, locCode } = req.params;

        const dao = new DAO(urljoin(endpoint.replace('{locCode}', locCode), jurorNumber, 'counts'));

        try {
          const response = await dao.get(req);
          req.expensesCount = response;
          return next();
        } catch (err) {
          app.logger.crit('Failed to fetch expense counts', {
            auth: req.session.authentication,
            data: {
              jurorNumber,
              locCode,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic', { err });
        }
      };
    },
  };

  module.exports.getApprovalExpenseListDAO = new DAO(endpoint, {
    post: function(locCode, jurorNumber, body) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, 'view'),
        body,
      };
    }
  });

  module.exports.editApprovalExpenseListDAO = new DAO(endpoint, {
    post: function(locCode, jurorNumber, type, body) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, 'edit', type),
        body,
      }
    }
  });

})();
