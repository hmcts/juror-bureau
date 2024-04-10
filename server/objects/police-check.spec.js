;(function() {
  'use strict';

  const { manualPoliceCheck } = require('./police-check')
    , urljoin = require('url-join')
    , rpStub = function(options) {
      return options;
    }
    , appStub = {
      logger: {
        debug: function() {
          return;
        },
      },
    };

  describe('Manually run police check API object:', function() {

    it('should call the correct endpoint to manually run a police check', function() {
      const jurorNumber = '111000006'
        , testObj = manualPoliceCheck.patch(rpStub, appStub, 'test-token', jurorNumber)
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/pnc/manual?juror_number=111000006'
        );

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('PATCH');

    });

  });

})();
