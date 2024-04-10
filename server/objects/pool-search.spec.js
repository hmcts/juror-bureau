;(function() {
  'use strict';

  var poolSearchObject = require('./pool-search')
    , urljoin = require('url-join')
    , rpStub = function(options) {
      return options;
    }
    , appStub = {
      logger: {
        debug: function() {
          return;
        }
      }
    };

  describe('Pool search API Object:', function() {

    it('Should call the correct endpoint to pull the pool list accroding to search parameters', function() {
      var bodyObj = {
          poolNumber: '415220110',
          locCode: '415',
          serviceStartDate: '2023-02-15'
        }
        , testObj = poolSearchObject.poolSearchObject.post(rpStub, appStub, 'test-token', bodyObj)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/pool-search');

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('POST');

      expect(testObj.body.hasOwnProperty('locCode')).toEqual(true);
      expect(testObj.body.locCode).toEqual('415');

      expect(testObj.body.hasOwnProperty('serviceStartDate')).toEqual(true);
      expect(testObj.body.serviceStartDate).toEqual('2023-02-15');

      expect(testObj.body.hasOwnProperty('poolNumber')).toEqual(true);
      expect(testObj.body.poolNumber).toEqual('415220110');
    });

  });

})();
