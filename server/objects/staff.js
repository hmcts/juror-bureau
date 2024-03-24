;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.staffDAO = new DAO('bureau/staff');

  module.exports.individualStaffDAO = new DAO('bureau/staff', {
    get: function(staffLogin) {
      const uri = urljoin(this.resource, staffLogin);

      return { uri };
    },
    put: function(staffLogin, putBody) {
      const uri = urljoin(this.resource, staffLogin);

      return { uri, body: putBody };
    },
  });
})();
