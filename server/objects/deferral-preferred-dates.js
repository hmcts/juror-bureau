;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join').default;

  module.exports.preferredDatesObj = new DAO('moj/deferral-maintenance/deferral-dates', {
    get: function(jurorNumber) {
      return {
        uri: urljoin(this.resource, jurorNumber),
        transform: (data) => { delete data._headers; return Object.values(data); },
      }
    }
  });

})();
