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
          'trial_end_date': dateFilter(endTrialDate, 'DD/MM/YYYY', 'YYYY-MM-DD'),
          'trial_number': 'T10000000',
          'location_code': '415',
        }
        , testObj = endTrialObject.patch(rpStub, appStub, 'test-token', payload)
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/trial/end-trial'
        );

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('PATCH');
    });
  });

})();
