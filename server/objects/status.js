;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.statusDAO = new DAO('moj/juror-response/update-status', {
    post: function(jurorNumber, newStatus, version, hasModAccess) {
      const uri = hasModAccess ? urljoin(this.resource, jurorNumber) : 'bureau/status';

      const body = {
        status: newStatus,
        version: parseInt(version, 10),
      };

      if (hasModAccess) {
        body.jurorNumber = jurorNumber;
      }
      return { uri, body };
    }}
  );
})();
