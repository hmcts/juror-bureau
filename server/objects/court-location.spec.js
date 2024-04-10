(function() {
  'use strict';

  const courtLocationObject = require('./court-location'),
    urljoin = require('url-join'),
    rpStub = function(options) {
      return options;
    },
    appStub = {
      logger: {
        debug: function() {
          return;
        },
      },
    };

  describe('Court Location API Object:', function() {

    it('Should call the correct endpoint for requesting a list of court locations for a given postcode', function() {
      const postCode = 'AB1',
        testObj = courtLocationObject.courtLocationsFromPostcodeObj.get(rpStub, appStub, 'test-token', postCode),
        realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/court-location/catchment-areas?postcode=AB1'
        );

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('GET');
    });
  });
})();
