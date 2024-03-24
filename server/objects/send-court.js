;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.sendCourtDAO = new DAO('bureau/juror/tocourt', {
    post: function(jurorNumber, version) {
      const uri = urljoin(this.resource, jurorNumber);
      const body = {
        jurorId: jurorNumber,
        version,
      };

      return { uri, body };
    }}
  );
})();
