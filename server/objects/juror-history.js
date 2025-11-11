const { mapSnakeToCamel } = require('../lib/mod-utils');

(() => {
  'use strict';

  const urljoin = require('url-join');
  const { DAO } = require('./dataAccessObject');

  const jurorHistoryDAO = new DAO('moj/juror-record/', {
    get: function(jurorNumber) {
      return { 
        uri: urljoin(this.resource, jurorNumber, 'history'),
        transform: mapSnakeToCamel,
      };
    },
  });

  const jurorPaymentsHistoryDAO = new DAO('moj/juror-record/', {
    get: function(jurorNumber) {
      return {
        uri: urljoin(this.resource, jurorNumber, 'payments'),
        transform: mapSnakeToCamel,
      };
    },
  });

  module.exports = {
    jurorHistoryDAO,
    jurorPaymentsHistoryDAO,
  };
})();
