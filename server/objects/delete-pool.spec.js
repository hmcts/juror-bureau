;(function() {
  'use strict';

  var deletePoolObject = require('./delete-pool').deletePoolObject
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
    }

  describe('Delete a pool API object:', function() {

    it('should call the correct endpoint to delete a pool', function() {
      var testUri = deletePoolObject.delete(rpStub, appStub, 'test-token', '415230101')
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/manage-pool/delete?poolNumber=415230101'
        ),
        queryParams;

      queryParams = Object.fromEntries(new URL(testUri.uri).searchParams);

      expect(queryParams.hasOwnProperty('poolNumber')).toEqual(true);
      expect(queryParams.poolNumber).toEqual('415230101');
      expect(testUri.uri).toEqual(realUri);
      expect(testUri.method).toEqual('DELETE');
    });

  });

})();
