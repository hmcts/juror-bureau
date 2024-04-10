; (function() {
  'use strict';

  var jurorUndeliverableObject = require('./juror-undeliverable.js').jurorUndeliverableObject
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

  describe('Juror undeliverable API object:', function() {

    it('Should call the correct endpoints to mark a summons as undeliverable', function() {
      var jurorNumber = '111000006'
        , testObj = jurorUndeliverableObject.put(rpStub, appStub, 'test-token', jurorNumber)
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          '/moj/undeliverable-response',
          jurorNumber
        );

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('PUT');
    });

  });

})();
