; (function() {
  'use strict';

  const urljoin = require('url-join');
  const { DAO } = require('./dataAccessObject');

  module.exports.fetchCourtsDAO = new DAO('moj/pool-request/court-locations', 'get');

  module.exports.fetchAllCourtsDAO = new DAO('moj/court-location/all-court-locations', 'get');

  module.exports.fetchCourtDeferralsDAO = new DAO('moj/pool-request/deferrals', { get:
    function(locationCode, attendanceDate) {
      const uri = urljoin(
        this.resource,
        '?locationCode=' + locationCode,
        '&deferredTo=' + attendanceDate);

      return { uri };
    }}
  );

  module.exports.checkDayTypeDAO = new DAO('moj/pool-request/day-type', { get:
    (locationCode, attendanceDate) => {
      const uri = urljoin(
        this.resource,
        '?locationCode=' + locationCode,
        '&attendanceDate=' + attendanceDate);

      return { uri };
    }}
  );

  module.exports.generatePoolNumberDAO = new DAO('moj/pool-request/generate-pool-number', { get:
    function(locationCode, attendanceDate) {
      const uri = urljoin(
        this.resource,
        '?locationCode=' + locationCode,
        '&attendanceDate=' + attendanceDate);

      return { uri };
    }}
  );

  module.exports.fetchPoolNumbersDAO = new DAO('moj/pool-request/pool-numbers', { get:
    function(poolNumberPrefix) {
      const uri = urljoin(
        this.resource,
        '?poolNumberPrefix=' + poolNumberPrefix);

      return { uri };
    }}
  );

  module.exports.createPoolRequestDAO = new DAO('moj/pool-request/new-pool', { post:
    function(body) {
      const data = {...body};

      data.attendanceTime = data.attendanceTime.hour + ':' + data.attendanceTime.minute;
      delete data._csrf;
      data.numberRequested = data.numberRequested || 0;


      return { body: data };
    }}
  );

  module.exports.createCoronerPoolDAO = new DAO('moj/pool-create/create-coroner-pool', 'post');

  module.exports.fetchCoronerPoolDAO = new DAO('moj/pool-create/coroner-pool', { get:
    function(poolNumber) {
      const uri = urljoin(
        this.resource,
        '?poolNumber=' + poolNumber);

      return { uri };
    }}
  );

  module.exports.addCoronerCitizensDAO = new DAO('moj/pool-create/add-citizens', 'post');
})();
