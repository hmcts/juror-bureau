;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const dateFilter = require('../components/filters').dateFilter;

  module.exports.summonsFormDAO = new DAO('moj/pool-create/summons-form', {
    post: function(pd) {
      const body = {};

      body.poolNumber = pd.poolDetails.poolNumber;
      body.nextDate = dateFilter(new Date(pd.poolDetails.courtStartDate), null, 'YYYY-MM-DD');
      body.catchmentArea = pd.currentCatchmentArea;
      body.attendTime = body.nextDate + ' 00:00';
      body.noRequested = pd.bureauSummoning.required;

      return { body };
    }}
  );
})();
