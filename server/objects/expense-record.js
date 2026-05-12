;(function(){
  'use strict';

  const urljoin = require('url-join');
  const { DAO } = require('./dataAccessObject');
  const { extractDataAndHeadersFromResponse, mapSnakeToCamel, extractDataAndHeadersFromResponse2, mapCamelToSnake } = require('../lib/mod-utils');
  const { transform } = require('lodash');
  const { basicDataTransform2 } = require('../lib/utils');

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
        transform: extractDataAndHeadersFromResponse2(),
      };
    }
  })

  module.exports.submitDraftExpenses = new DAO(endpoint, {
    post: function(locCode, jurorNumber, attendanceDates) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, 'submit-for-approval'),
        body: mapCamelToSnake({
          dates: attendanceDates,
        }),
        transform: basicDataTransform2,
      };
    },
  });

  module.exports.getEnteredExpensesDAO = new DAO(endpoint, {
    post: function(locCode, jurorNumber, body) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, 'entered'),
        body: mapCamelToSnake(body),
        transform: (data) => { delete data._headers; return Object.values(mapSnakeToCamel(data)); }
      }
    }
  });

  module.exports.postEditedExpensesDAO = new DAO(endpoint, {
    put: function(locCode, jurorNumber, expenseType, body) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, expenseType, 'edit'),
        body: mapCamelToSnake(body),
        transform: basicDataTransform2,
      };
    },
  });

  module.exports.getExpenseRecordsDAO = new DAO(endpoint, {
    get: function(locCode, expenseType, jurorNumber) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, expenseType, 'view/simplified'),
        transform: mapSnakeToCamel,
      }
    }
  });

  module.exports.postRecalculateSummaryTotalsDAO = new DAO(endpoint, {
    post: function(locCode, jurorNumber, body) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, 'calculate/totals'),
        body: mapCamelToSnake(body),
        transform: basicDataTransform2,
      };
    }
  });

  module.exports.addSmartcardSpend = new DAO(endpoint, {
    patch: function(locCode, jurorNumber, body) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, 'smartcard'),
        body: mapCamelToSnake(body),
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
          const response = mapSnakeToCamel(await dao.get(req));
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
        body: mapCamelToSnake(body),
        transform: basicDataTransform2,
      };
    }
  });

  module.exports.editApprovalExpenseListDAO = new DAO(endpoint, {
    post: function(locCode, jurorNumber, type, body) {
      return { 
        uri: urljoin(this.resource.replace('{locCode}', locCode), jurorNumber, 'edit', type),
        body: mapCamelToSnake(body),
        transform: basicDataTransform2,
      }
    }
  });

})();
