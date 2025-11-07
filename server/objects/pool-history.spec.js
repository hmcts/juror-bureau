; (function() {
  'use strict';

  var poolHistoryObject = require('./pool-history.js').poolHistoryObject
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
    }

  describe('Pool History API object:', function() {

    it('Should call the correct endpoints to display the history of a pool', function() {
      var testUri = poolHistoryObject.get(rpStub, appStub, 'test-token', '416221101')
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/pool-history/416221101'
        );

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('GET');
    });

  });

})();
