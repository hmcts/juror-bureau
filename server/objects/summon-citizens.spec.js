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

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('POST');

      expect(testObj.body.hasOwnProperty('startDate')).to.equal(true);
      expect(testObj.body.startDate).to.equal('2022-12-30');

      expect(testObj.body.hasOwnProperty('citizensToSummon')).to.equal(true);
      expect(testObj.body.citizensToSummon).to.equal('150');

      expect(testObj.body.hasOwnProperty('postcodes')).to.equal(true);
      expect(testObj.body.postcodes).to.equal(bodyObj.postcodes);

      expect(testObj.body.hasOwnProperty('bureauDeferrals')).to.equal(true);
      expect(testObj.body.bureauDeferrals).to.equal('2');

      expect(testObj.body.hasOwnProperty('numberRequired')).to.equal(true);
      expect(testObj.body.numberRequired).to.equal('118');

      expect(testObj.body.hasOwnProperty('attendTime')).to.equal(true);
      expect(testObj.body.attendTime).to.equal('2022-12-30 09:00');

      expect(testObj.body.hasOwnProperty('catchmentArea')).to.equal(true);
      expect(testObj.body.catchmentArea).to.equal('415');

      expect(testObj.body.hasOwnProperty('noRequested')).to.equal(true);
      expect(testObj.body.noRequested).to.equal('120');

      expect(testObj.body.hasOwnProperty('poolNumber')).to.equal(true);
      expect(testObj.body.poolNumber).to.equal('415221201');

      expect(testObj.body.hasOwnProperty('courtDate')).to.equal(false);
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

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('POST');

      expect(testObj.body.hasOwnProperty('bureauDeferrals')).to.be.true;
      expect(testObj.body.bureauDeferrals).to.equal(2);

      expect(testObj.body.hasOwnProperty('catchmentArea')).to.be.true;
      expect(testObj.body.catchmentArea).to.equal('415');

      expect(testObj.body.hasOwnProperty('citizensSummoned')).to.be.true;
      expect(testObj.body.citizensSummoned).to.equal(10);

      expect(testObj.body.hasOwnProperty('citizensToSummon')).to.be.true;
      expect(testObj.body.citizensToSummon).to.equal(25);

      expect(testObj.body.hasOwnProperty('noRequested')).to.be.true;
      expect(testObj.body.noRequested).to.equal(15);

      expect(testObj.body.hasOwnProperty('poolNumber')).to.be.true;
      expect(testObj.body.poolNumber).to.equal('415230101');

      expect(testObj.body.hasOwnProperty('postcodes')).to.be.true;
      expect(testObj.body.postcodes instanceof Array).to.be.true;
      expect(testObj.body.postcodes).to.be.length(3);
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

      expect(testObj.body.hasOwnProperty('postcodes')).to.be.true;
      expect(testObj.body.postcodes instanceof Array).to.be.true;
      expect(testObj.body.postcodes).to.be.length(1);
    });

  });

})();
