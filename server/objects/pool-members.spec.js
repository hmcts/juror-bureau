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

    it.skip('Should call the correct endpoints to display the members of a pool', function() {
      var testUri = poolMemebersObject.post(rpStub, appStub, 'test-token', {'pool_number': '416221101'})
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          '/moj/pool-create/members?poolNumber=416221101'
        ),
        queryParams;

      queryParams = Object.fromEntries(new URL(testUri.uri).searchParams);

      expect(queryParams.hasOwnProperty('pool_number')).toEqual(true);
      expect(queryParams.poolNumber).toEqual('416221101');
      expect(testUri.uri).toEqual(realUri);
      expect(testUri.method).toEqual('GET');
    });

  });

})();
