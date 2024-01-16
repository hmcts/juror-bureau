;(function() {
  'use strict';

  var nilPoolObject = require('./nil-pool')
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

  describe('Create a nil pool API Object:', function() {

    it('should call the correct endpoint to check if the nil pool can be created', function() {
      var bodyStub = {
          attendanceDate: '2023-01-01',
          attendanceTime: '09:15',
          selectedCourtCode: '415',
          selectedCourtName: 'Court Name',
          poolType: 'CRO',
        }
        , testObj = nilPoolObject.nilPoolCheck.post(rpStub, appStub, 'test-token', bodyStub)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/pool-create/nil-pool-check');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('POST');

      expect(testObj.body.hasOwnProperty('attendanceDate')).to.equal(true);
      expect(testObj.body.attendanceDate).to.equal('2023-01-01');

      expect(testObj.body.hasOwnProperty('attendanceTime')).to.equal(true);
      expect(testObj.body.attendanceTime).to.equal('09:15');

      expect(testObj.body.hasOwnProperty('courtCode')).to.equal(true);
      expect(testObj.body.courtCode).to.equal('415');

      expect(testObj.body.hasOwnProperty('courtName')).to.equal(true);
      expect(testObj.body.courtName).to.equal('Court Name');

      expect(testObj.body.hasOwnProperty('poolType')).to.equal(true);
      expect(testObj.body.poolType).to.equal('CRO');
    });

    it('should call the correct endpoint to create a nil pool', function() {
      var bodyStub = {
          attendanceDate: '2023-01-01',
          attendanceTime: '09:15',
          courtCode: '415',
          courtName: 'Court Name',
          poolType: 'CRO',
          poolNumber: '415230101',
        }
        , testObj = nilPoolObject.nilPoolCreate.post(rpStub, appStub, 'test-token', bodyStub)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/pool-create/nil-pool-create');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('POST');

      expect(testObj.body.hasOwnProperty('attendanceDate')).to.equal(true);
      expect(testObj.body.attendanceDate).to.equal('2023-01-01');

      expect(testObj.body.hasOwnProperty('attendanceTime')).to.equal(true);
      expect(testObj.body.attendanceTime).to.equal('09:15');

      expect(testObj.body.hasOwnProperty('courtCode')).to.equal(true);
      expect(testObj.body.courtCode).to.equal('415');

      expect(testObj.body.hasOwnProperty('courtName')).to.equal(true);
      expect(testObj.body.courtName).to.equal('Court Name');

      expect(testObj.body.hasOwnProperty('poolType')).to.equal(true);
      expect(testObj.body.poolType).to.equal('CRO');

      expect(testObj.body.hasOwnProperty('poolNumber')).to.equal(true);
      expect(testObj.body.poolNumber).to.equal('415230101');
    });

    it('should call the correct endpoint to convert a nil pool to an active pool', function() {
      var bodyStub = {
          attendanceDate: '2023-01-01',
          attendanceTime: '09:15',
          courtCode: '415',
          deferralsUsed: 10,
          numberRequested: 100,
          poolNumber: '415230101',
          poolType: 'CRO',
        }
        , testObj = nilPoolObject.nilPoolConvert.put(rpStub, appStub, 'test-token', bodyStub)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/pool-create/nil-pool-convert');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('PUT');

      expect(testObj.body.hasOwnProperty('attendanceDate')).to.equal(true);
      expect(testObj.body.attendanceDate).to.equal('2023-01-01');

      expect(testObj.body.hasOwnProperty('attendanceTime')).to.equal(true);
      expect(testObj.body.attendanceTime).to.equal('09:15');

      expect(testObj.body.hasOwnProperty('courtCode')).to.equal(true);
      expect(testObj.body.courtCode).to.equal('415');

      expect(testObj.body.hasOwnProperty('deferralsUsed')).to.equal(true);
      expect(testObj.body.deferralsUsed).to.equal(10);

      expect(testObj.body.hasOwnProperty('numberRequested')).to.equal(true);
      expect(testObj.body.numberRequested).to.equal(100);

      expect(testObj.body.hasOwnProperty('poolNumber')).to.equal(true);
      expect(testObj.body.poolNumber).to.equal('415230101');

      expect(testObj.body.hasOwnProperty('poolType')).to.equal(true);
      expect(testObj.body.poolType).to.equal('CRO');

    });

  });

})();
