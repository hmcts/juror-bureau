;(function() {
  'use strict';

  describe('Request a pool Controller:', function() {

    it('should build a poolNumberPrefix with from a given court code and attendance date', function() {
      var poolNumberPrefixBuilder = require('./request-pool.controller').poolNumberPrefixBuilder
        , poolNumberPrefix
        , sessionStub = {
          courtCode: '415',
          attendanceDate: '2022-01-01'
        };

      poolNumberPrefix = poolNumberPrefixBuilder(sessionStub);

      expect(poolNumberPrefix).to.equal('4152201');
    });

  });


})();
