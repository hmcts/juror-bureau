
(() => {
  'use strict';

  const urljoin = require('url-join');
  const { DAO } = require('./dataAccessObject');

  const jurorHistoryDAO = new DAO('path/to/api', {
    get: function(jurorNumber) {
      return { uri: urljoin(this.resource, jurorNumber) };
    },
  });

  const codeMap = {
    FADD: 'Appearance Payments',
  };

  const jurorHistoryMock = {
    get: (app, jurorNumber) => Promise.resolve([{
      dateCreated: new Date().toISOString(),
      historyCode: 'FADD',
      userId: 'Mock user',
      otherInformation: '',
      poolNumber: '123456789',
    }]),
  };

  module.exports = {
    historyCodes: codeMap,
    jurorHistoryDAO: jurorHistoryMock,
  };
})();
