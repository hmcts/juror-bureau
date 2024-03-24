(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');

  module.exports.trialListDAO = new DAO('moj/trial/list', {
    get: function(opts) {
      const uri = urljoin(this.resource,
        '?page_number=' + (opts.pageNumber - 1).toString(),
        '&sort_by=' + opts.sortBy,
        '&sort_order=' + opts.sortOrder,
        '&is_active=' + opts.isActive
      );

      return { uri };
    }}
  );

  module.exports.trialDetailsDAO = new DAO('moj/trial/summary', {
    get: function(trialNumber, locationCode) {
      const uri = urljoin(
        this.resource,
        '?trial_number=' + trialNumber,
        '&location_code=' + locationCode
      );

      return { uri };
    }}
  );

  module.exports.courtroomsDAO = new DAO('moj/trial/courtrooms/list');

  module.exports.judgesDAO = new DAO('moj/trial/judge/list');

  module.exports.createTrialDAO = new DAO('moj/trial/create');
})();
