;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.disqualifyDAO = new DAO('bureau/juror/disqualify', {
    post: function(jurorNumber, version, code) {
      const uri = urljoin(this.resource, jurorNumber);
      const body = {
        disqualifyCode: code,
        description: '',
        version: version,
      };

      return { uri, body };
    }}
  );
})();
