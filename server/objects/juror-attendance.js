const { DAO } = require('./dataAccessObject');

(function() {
  'use strict';

  const urljoin = require('url-join');

  module.exports.attendingJurorsDAO = new DAO('moj/juror-management/appearance', {
    get: function(locationCode, attendanceDate) {
      const uri = urljoin(
        this.resource,
        `?locationCode=${locationCode}`,
        `&attendanceDate=${attendanceDate}`,
      );

      return { uri };
    }}
  );
})();
