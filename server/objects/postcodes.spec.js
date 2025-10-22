(function() {
  'use strict';

  var additionalSummonsObject = require('./postcodes').postCodesObject
    , urljoin = require('url-join').default
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

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('GET');

      expect(queryParams.hasOwnProperty('areaCode')).to.equal(true);
      expect(queryParams.areaCode).to.equal(areaCode);
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

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('GET');

      expect(queryParams.hasOwnProperty('areaCode')).to.equal(true);
      expect(queryParams.areaCode).to.equal(areaCode);
    });

  });

})();
