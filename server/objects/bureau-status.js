;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.bureauStatusDAO = new DAO('bureau/juror', {
    post: function(jurorNumber, newStatus, version) {
      const uri = urljoin(this.resource, jurorNumber, 'response/status');
      const body = {
        status: newStatus,
        version: parseInt(version, 10),
      };

      return { uri, body };
    }}
  );
})();
