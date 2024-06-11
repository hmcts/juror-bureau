const { DAO } = require('./dataAccessObject');

(() => {
  'use strict';

  const rp = require('request-promise');
  const urljoin = require('url-join');
  const config = require('../config/environment')();
  const { mapCamelToSnake, mapSnakeToCamel } = require('../lib/mod-utils');

  module.exports.standardReportDAO = {
    post: function(req, app, requestConfig) {
      const payload = {
        uri: urljoin(config.apiEndpoint, 'moj/reports/standard'),
        method: 'POST',
        headers: {
          'User-Agent': 'Request-Promise',
          'Content-Type': 'application/vnd.api+json',
          Authorization: req.session.authToken,
        },
        json: true,
        body: mapCamelToSnake({
          ...requestConfig,
        }),
        transform: mapSnakeToCamel,
      };

      app.logger.info('Sending request to API: ', payload);

      return rp(payload);
    },
  };

  module.exports.financialAuditDAO = new DAO('moj/reports/financial-audit', {
    get: function(number) {
      return {
        uri: `${this.resource}?audit-number=${number}`,
        transform: mapSnakeToCamel,
      };
    },
  });

  module.exports.dailyUtilisationDAO = new DAO('moj/reports/daily-utilisation', {
    get: function(locCode, fromDate, toDate) {
      return {
        uri: `${this.resource}/${locCode}?reportFromDate=${fromDate}&reportToDate=${toDate}`,
        transform: mapSnakeToCamel,
      };
    },
  });

  module.exports.dailyUtilisationJurorsDAO = new DAO('moj/reports/daily-utilisation-jurors', {
    get: function(locCode, date) {
      return {
        uri: `${this.resource}/${locCode}?reportDate=${date}`,
        transform: mapSnakeToCamel,
      };
    },
  });

  module.exports.generateMonthlyUtilisationDAO = new DAO('moj/reports/generate-monthly-utilisation', {
    get: function(locCode, reportDate) {
      return {
        uri: `${this.resource}/${locCode}?reportDate=${reportDate}`,
        transform: mapSnakeToCamel,
      };
    },
  });

  module.exports.monthlyUtilisationReportsDAO = new DAO('moj/reports/monthly-utilisation-reports', {
    get: function(locCode) {
      return {
        uri: `${this.resource}/${locCode}`,
        transform: mapSnakeToCamel,
      };
    },
  });

  module.exports.viewMonthlyUtilisationDAO = new DAO('moj/reports/view-monthly-utilisation', {
    get: function(locCode, reportDate, previousMonths = 'false') {
      return {
        uri: `${this.resource}/${locCode}?reportDate=${reportDate}&previousMonths=${previousMonths}`,
        transform: mapSnakeToCamel,
      };
    },
  });

  module.exports.jurySummoningMonitorDAO = new DAO('moj/reports/jury-summoning-monitor', {
    post: function(body) {
      return {
        body,
        transform: mapSnakeToCamel,
      };
    },
  });
  
  module.exports.yieldPerformanceDAO = new DAO('moj/reports/yield-performance', {
    post: function(body) {
      return {
        body,
        transform: mapSnakeToCamel,
      };
    },
  });

})();
