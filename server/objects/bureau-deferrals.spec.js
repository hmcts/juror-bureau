(function() {
  'use strict';

  var bureauDeferralsObject = require('./bureau-deferrals').bureauDeferralsObject
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

  describe('Bureau deferrals API object:', function() {

    it('should call the correct endpoint to fetch the number of bureau deferrals available', function() {
      var testUri = bureauDeferralsObject.get(rpStub, appStub, 'test-token', '415', '2023-01-01')
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/pool-create/bureau-deferrals?locationCode=415&deferredTo=2023-01-01'
        ),
        queryParams;

      queryParams = Object.fromEntries(new URL(testUri.uri).searchParams);

      expect(queryParams.hasOwnProperty('locationCode')).to.be.true;
      expect(queryParams.locationCode).to.equal('415');

      expect(queryParams.hasOwnProperty('deferredTo')).to.be.true;
      expect(queryParams.deferredTo).to.equal('2023-01-01');

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('GET');
    });

  });

})();
