;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils');

  module.exports.nilPoolCheck = new DAO('moj/pool-create/nil-pool-check', {
    post: function(payload) {
      const body = {};
      body.attendanceDate = payload.attendanceDate;
      body.attendanceTime = payload.attendanceTime;
      body.courtCode = payload.selectedCourtCode;
      body.courtName = payload.selectedCourtName;
      body.poolType = payload.poolType;

      return {
        uri: this.resource,
        transform: basicDataTransform,
        body,
      }
    }
  });
  module.exports.nilPoolCreate = new DAO('moj/pool-create/nil-pool-create');

  module.exports.nilPoolConvert = new DAO('moj/pool-create/nil-pool-convert');
})();
