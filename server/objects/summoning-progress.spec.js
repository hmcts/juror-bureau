;(function() {
  'use strict';

  var summoningProgressObject = require('./summoning-progress').summoningProgressObject
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

  describe('Summoning progress API Object:', function() {

    it('Should call the correct endpoint to retrieve the summoning progress for a specific court and pool type',
      function() {
        let testUri = summoningProgressObject.get(rpStub, appStub, 'test-token', {locCode: '415', poolType: 'CRO'})
          , realUri = urljoin(
            'http://localhost:8080/api/v1',
            'moj/manage-pool/summoning-progress/415/CRO'
          );

        expect(testUri.uri).toEqual(realUri);
        expect(testUri.method).toEqual('GET');
      });

  });

})();
