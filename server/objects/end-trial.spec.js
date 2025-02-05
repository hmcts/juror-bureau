;(function() {
  'use strict';

  const { endTrialObject } = require('./end-trial')
    , { dateFilter } = require('../components/filters')
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

  describe('End a trial API object:', function() {

    it('should call the correct endpoint to end a trial', function() {
      const endTrialDate = '29/01/2024'
        , payload = {
          'trialEndDate': dateFilter(endTrialDate, 'DD/MM/YYYY', 'YYYY-MM-DD'),
          'trialNumber': 'T10000000',
          'locationCode': '415',
        }
        , testObj = endTrialObject.patch(rpStub, appStub, 'test-token', payload)
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/trial/end-trial'
        );

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('PATCH');
    });
  });

})();
