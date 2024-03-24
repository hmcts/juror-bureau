;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.catchmentStatusDAO = new DAO('bureau/juror/court/catchment/', {
    get: function(id) {
      const uri = urljoin(this.resource, id);

      return { uri };
    }}
  );
})();
