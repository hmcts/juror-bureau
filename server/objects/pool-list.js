;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.poolRequestsDAO = new DAO('moj/pool-request/pools-', { 'get' :
    function(opts) {
      const status = {
        created: 'active',
        requested: 'requested',
      };
      const order = (opts.sortOrder === 'descending') ? 'desc' : 'asc';

      let uri = urljoin(this.resource + status[opts.status],
        '?status=' + opts.status,
        '&tab=' + opts.tab,
        '&offset=' + (opts.page - 1).toString(),
        '&sortBy=' + opts.sortBy,
        '&sortOrder=' + order);

      if (typeof opts.locCode !== 'undefined') {
        uri += '&locCode=' + opts.locCode;
      }

      return { uri };
    }}
  );
})();
