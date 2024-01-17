; (function() {
  'use strict';

  var poolMemebersObject = require('./pool-members.js').poolMemebersObject
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

  describe('Pool Members API object:', function() {

    it('Should call the correct endpoints to display the members of a pool', function() {
      var testUri = poolMemebersObject.get(rpStub, appStub, 'test-token', '416221101')
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          '/moj/pool-create/members?poolNumber=416221101'
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
