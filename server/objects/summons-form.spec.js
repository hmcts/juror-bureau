;(function() {
  'use strict';

  var summonsFormObject = require('./summons-form')
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

  describe('Summons form API Object:', function() {

    it('Should call the correct endpoint to pull defferals, jurors required and postcodes', function() {
      var bodyObj = {
          poolDetails: {
            poolNumber: '755221201',
            courtStartDate: 'Friday 30 Dec 2022',
          },
          bureauSummoning: {
            required: 150,
          },
          currentCatchmentArea: '415'
        }
        , testObj = summonsFormObject.poolSummaryObject.post(rpStub, appStub, 'test-token', bodyObj)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/pool-create/summons-form');

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('POST');

      expect(testObj.body.hasOwnProperty('attendTime')).toEqual(true);
      expect(testObj.body.attendTime).toEqual('2022-12-30 00:00');

      expect(testObj.body.hasOwnProperty('catchmentArea')).toEqual(true);
      expect(testObj.body.catchmentArea).toEqual('415');

      expect(testObj.body.hasOwnProperty('nextDate')).toEqual(true);
      expect(testObj.body.nextDate).toEqual('2022-12-30');

      expect(testObj.body.hasOwnProperty('noRequested')).toEqual(true);
      expect(testObj.body.noRequested).toEqual(150);

      expect(testObj.body.hasOwnProperty('poolNumber')).toEqual(true);
      expect(testObj.body.poolNumber).toEqual('755221201');
    });

  });

})();
