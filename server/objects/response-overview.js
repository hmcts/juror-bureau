;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.responseOverviewDAO = new DAO('/bureau/responses/overview', {
    get: function(login) {
      const uri = urljoin(this.resource, login);

      return { uri };
    }}
  );
})();
