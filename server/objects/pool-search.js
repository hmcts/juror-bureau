const { DAO } = require('./dataAccessObject');

;(function() {
  'use strict';

  const makeArray = (arg) => Array.isArray(arg)
    ? arg
    : arg.split(',');

  module.exports.poolSearchDAO = new DAO('moj/pool-search', {
    post: function(searchParams) {
      const body = {};

      if (searchParams.locCode) {
        body.locCode = searchParams.locCode;
      }
      if (searchParams.poolNumber) {
        body.poolNumber = searchParams.poolNumber;
      }
      if (searchParams.serviceStartDate) {
        body.serviceStartDate = searchParams.serviceStartDate;
      }
      if (searchParams.date) {
        body.date = searchParams.date;
      }
      if (searchParams.poolStatus) {
        body.poolStatus = makeArray(searchParams.poolStatus);
      }
      if (searchParams.poolStage) {
        body.poolStage = makeArray(searchParams.poolStage);
      }
      if (searchParams.poolType) {
        body.poolType = makeArray(searchParams.poolType);
      }
      body.offset = searchParams.page - 1 || 0;
      body.sortDirection = 'ASC';
      body.sortColumn = 'POOL_NO';

      return { body };
    }}
  );
})();
