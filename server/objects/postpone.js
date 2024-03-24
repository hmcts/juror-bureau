;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.postponeDAO = new DAO('moj/deferral-maintenance/juror/postpone', {
    post: function(jurorNumber, body) {
      const uri = urljoin(this.resource, jurorNumber);

      return { uri, body };
    }}
  );
})();
