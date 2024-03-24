;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');

  module.exports.nilPoolCheckDAO = new DAO('moj/pool-create/nil-pool-check', {
    post: function(body) {
      const payload = {
        attendanceDate:  body.attendanceDate,
        attendanceTime:  body.attendanceTime,
        courtCode:  body.selectedCourtCode,
        courtName:  body.selectedCourtName,
        poolType:  body.poolType,
      };

      return { body: payload };
    }}
  );

  module.exports.nilPoolCreateDAO = new DAO('moj/pool-create/nil-pool-create', {
    post: function(body) {
      const payload = {...body};

      delete payload._csrf;

      return { body: payload };
    }}
  );

  module.exports.nilPoolConvertDAO = new DAO('moj/pool-create/nil-pool-convert', {
    put: function(body) {
      const payload = {...body};

      delete payload._csrf;

      return { body: payload };
    }}
  );
})();
