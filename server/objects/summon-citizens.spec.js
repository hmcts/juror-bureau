;(function() {
  'use strict';

  var summonCitizenObject = require('./summon-citizens').summonCitizenObject
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

  describe('Summon Citizens API Object:', function() {

    it('should call the correct endpoint to create a pool', function() {
      var bodyObj = {
          citizensToSummon: '150',
          postcodes: ['CH1', 'CH2'],
          noRequested: '120',
          bureauDeferrals: '2',
          numberRequired: '118',
          catchmentArea: '415',
          poolNumber: '415221201',
          courtDate: 'Friday 30 Dec 2022'
        }
        , testObj = summonCitizenObject.post(rpStub, appStub, 'test-token', bodyObj, 'create-pool')
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/pool-create/create-pool');

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('POST');

      expect(testObj.body.hasOwnProperty('startDate')).toEqual(true);
      expect(testObj.body.startDate).toEqual('2022-12-30');

      expect(testObj.body.hasOwnProperty('citizensToSummon')).toEqual(true);
      expect(testObj.body.citizensToSummon).toEqual('150');

      expect(testObj.body.hasOwnProperty('postcodes')).toEqual(true);
      expect(testObj.body.postcodes).toEqual(bodyObj.postcodes);

      expect(testObj.body.hasOwnProperty('bureauDeferrals')).toEqual(true);
      expect(testObj.body.bureauDeferrals).toEqual('2');

      expect(testObj.body.hasOwnProperty('numberRequired')).toEqual(true);
      expect(testObj.body.numberRequired).toEqual('118');

      expect(testObj.body.hasOwnProperty('attendTime')).toEqual(true);
      expect(testObj.body.attendTime).toEqual('2022-12-30 09:00');

      expect(testObj.body.hasOwnProperty('catchmentArea')).toEqual(true);
      expect(testObj.body.catchmentArea).toEqual('415');

      expect(testObj.body.hasOwnProperty('noRequested')).toEqual(true);
      expect(testObj.body.noRequested).toEqual('120');

      expect(testObj.body.hasOwnProperty('poolNumber')).toEqual(true);
      expect(testObj.body.poolNumber).toEqual('415221201');

      expect(testObj.body.hasOwnProperty('courtDate')).toEqual(false);
    });

    it('should call the correct endpoint to summon additional citizens', function() {
      var bodyStub = {
          bureauDeferrals: 2,
          catchmentArea: '415',
          citizensSummoned: 10,
          citizensToSummon: 25,
          noRequested: 15,
          poolNumber: '415230101',
          postcodes: ['CH1', 'CH2', 'CH10']
        }
        , testObj = summonCitizenObject.post(rpStub, appStub, 'test-token', bodyStub, 'additional-summons')
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/pool-create/additional-summons'
        );

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('POST');

      expect(testObj.body.hasOwnProperty('bureauDeferrals')).toEqual(true);
      expect(testObj.body.bureauDeferrals).toEqual(2);

      expect(testObj.body.hasOwnProperty('catchmentArea')).toEqual(true);
      expect(testObj.body.catchmentArea).toEqual('415');

      expect(testObj.body.hasOwnProperty('citizensSummoned')).toEqual(true);
      expect(testObj.body.citizensSummoned).toEqual(10);

      expect(testObj.body.hasOwnProperty('citizensToSummon')).toEqual(true);
      expect(testObj.body.citizensToSummon).toEqual(25);

      expect(testObj.body.hasOwnProperty('noRequested')).toEqual(true);
      expect(testObj.body.noRequested).toEqual(15);

      expect(testObj.body.hasOwnProperty('poolNumber')).toEqual(true);
      expect(testObj.body.poolNumber).toEqual('415230101');

      expect(testObj.body.hasOwnProperty('postcodes')).toEqual(true);
      expect(testObj.body.postcodes instanceof Array).toEqual(true);
      expect(testObj.body.postcodes).toHaveLength(3);
    });

    it('should transform a single postcode string into an array', function() {
      var bodyStub = {
          bureauDeferrals: 2,
          catchmentArea: '415',
          citizensSummoned: 10,
          citizensToSummon: 25,
          noRequested: 15,
          poolNumber: '415230101',
          postcodes: 'CH1',
        }
        , testObj;

      testObj = summonCitizenObject.post(rpStub, appStub, 'test-token', bodyStub, 'additional-summons');

      expect(testObj.body.hasOwnProperty('postcodes')).toEqual(true);
      expect(testObj.body.postcodes instanceof Array).toEqual(true);
      expect(testObj.body.postcodes).toHaveLength(1);
    });

  });

})();
