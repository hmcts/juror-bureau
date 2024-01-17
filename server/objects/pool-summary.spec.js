; (function() {
  'use strict';

  var poolSummaryObject = require('./pool-summary.js').poolSummaryObject
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

  describe('Pool Overview API object:', function() {

    it('Should call the correct endpoints to display the overview of a pool', function() {
      var testUri = poolSummaryObject.get(rpStub, appStub, 'test-token', '416221101')
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/manage-pool/summary?poolNumber=416221101'
        ),
        queryParams;

      queryParams = Object.fromEntries(new URL(testUri.uri).searchParams);

      expect(queryParams.hasOwnProperty('poolNumber')).to.equal(true);
      expect(queryParams.poolNumber).to.equal('416221101');
      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('GET');
    });

  });

})();
