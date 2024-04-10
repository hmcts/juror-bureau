(function() {
  'use strict';

  var additionalSummonsObject = require('./postcodes').postCodesObject
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

  describe('Postcodes API object:', function() {

    it('should call the correct endpoint to fetch all available postcodes', function() {
      var areaCode = '100'
        , testObj = additionalSummonsObject.get(rpStub, appStub, 'test-token', areaCode, false)
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/pool-create/postcodes',
          '?areaCode=' + areaCode,
          '&isCoronersPool=false'
        ),
        queryParams;

      queryParams = Object.fromEntries(new URL(testObj.uri).searchParams);

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('GET');

      expect(queryParams.hasOwnProperty('areaCode')).toEqual(true);
      expect(queryParams.areaCode).toEqual(areaCode);
    });

    it('should call the correct endpoint to fetch all available postcodes - coroners court pool', function() {
      var areaCode = '100'
        , testObj = additionalSummonsObject.get(rpStub, appStub, 'test-token', areaCode, true)
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/pool-create/postcodes',
          '?areaCode=' + areaCode,
          '&isCoronersPool=true'
        ),
        queryParams;

      queryParams = Object.fromEntries(new URL(testObj.uri).searchParams);

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('GET');

      expect(queryParams.hasOwnProperty('areaCode')).toEqual(true);
      expect(queryParams.areaCode).toEqual(areaCode);
    });

  });

})();
