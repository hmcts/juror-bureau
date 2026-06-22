;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform2 } = require('../lib/utils');
  const { mapCamelToSnake } = require('../lib/mod-utils');

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
        transform: basicDataTransform2,
        body,
      }
    }
  });
  module.exports.nilPoolCreate = new DAO('moj/pool-create/nil-pool-create');

  module.exports.nilPoolConvert = new DAO('moj/pool-create/nil-pool-convert', {
    put: function(body) {
      body.locationCode = body.courtCode;
      delete body.courtCode;

      return {
        body: mapCamelToSnake(body),
      };
    }
  });
})();
