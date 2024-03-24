;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.excuseDAO = new DAO('bureau/juror/excuse');

  module.exports.excusalAcceptDAO = new DAO('bureau/juror/excuse', {
    post: function(jurorNumber, version, excusalCode) {
      const uri = urljoin(this.resource, jurorNumber);
      const body = {
        description: '',
        excusalCode: excusalCode,
        version: version,
      };

      return { uri, body };
    }}
  );

  module.exports.excusalRejectDAO = new DAO('bureau/juror/excuse/reject', {
    post: function(req, jurorNumber, version, excusalCode) {
      const uri = urljoin(this.resource, jurorNumber);
      const body = {
        description: '',
        excusalCode: excusalCode,
        version: version,
      };

      return { uri, body };
    }}
  );
})();
