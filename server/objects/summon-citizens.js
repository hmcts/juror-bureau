(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const dateFilter = require('../components/filters').dateFilter;

  module.exports.summonCitizenDAO = new DAO('moj/pool-create', {
    post: function(body, endpoint) {
      const uri = urljoin(this.resource, endpoint);
      const payload = {...body};

      if (endpoint === 'create-pool') {
        payload.startDate = dateFilter(new Date(payload.courtDate), null, 'YYYY-MM-DD');
        payload.attendTime = [payload.startDate, '09:00'].join(' ');
      }

      delete payload.courtDate;
      delete payload._csrf;

      // if we only select one postcode it will not be an array
      // make it an array then to pass backend validation
      if (payload.postcodes instanceof Array === false) {
        payload.postcodes = [payload.postcodes];
      }

      return { uri, body: payload };
    }}
  );
})();
