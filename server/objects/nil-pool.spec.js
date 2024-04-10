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

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('POST');

      expect(testObj.body.hasOwnProperty('attendanceDate')).toEqual(true);
      expect(testObj.body.attendanceDate).toEqual('2023-01-01');

      expect(testObj.body.hasOwnProperty('attendanceTime')).toEqual(true);
      expect(testObj.body.attendanceTime).toEqual('09:15');

      expect(testObj.body.hasOwnProperty('courtCode')).toEqual(true);
      expect(testObj.body.courtCode).toEqual('415');

      expect(testObj.body.hasOwnProperty('courtName')).toEqual(true);
      expect(testObj.body.courtName).toEqual('Court Name');

      expect(testObj.body.hasOwnProperty('poolType')).toEqual(true);
      expect(testObj.body.poolType).toEqual('CRO');
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

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('POST');

      expect(testObj.body.hasOwnProperty('attendanceDate')).toEqual(true);
      expect(testObj.body.attendanceDate).toEqual('2023-01-01');

      expect(testObj.body.hasOwnProperty('attendanceTime')).toEqual(true);
      expect(testObj.body.attendanceTime).toEqual('09:15');

      expect(testObj.body.hasOwnProperty('courtCode')).toEqual(true);
      expect(testObj.body.courtCode).toEqual('415');

      expect(testObj.body.hasOwnProperty('courtName')).toEqual(true);
      expect(testObj.body.courtName).toEqual('Court Name');

      expect(testObj.body.hasOwnProperty('poolType')).toEqual(true);
      expect(testObj.body.poolType).toEqual('CRO');

      expect(testObj.body.hasOwnProperty('poolNumber')).toEqual(true);
      expect(testObj.body.poolNumber).toEqual('415230101');
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

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('PUT');

      expect(testObj.body.hasOwnProperty('attendanceDate')).toEqual(true);
      expect(testObj.body.attendanceDate).toEqual('2023-01-01');

      expect(testObj.body.hasOwnProperty('attendanceTime')).toEqual(true);
      expect(testObj.body.attendanceTime).toEqual('09:15');

      expect(testObj.body.hasOwnProperty('courtCode')).toEqual(true);
      expect(testObj.body.courtCode).toEqual('415');

      expect(testObj.body.hasOwnProperty('deferralsUsed')).toEqual(true);
      expect(testObj.body.deferralsUsed).toEqual(10);

      expect(testObj.body.hasOwnProperty('numberRequested')).toEqual(true);
      expect(testObj.body.numberRequested).toEqual(100);

      expect(testObj.body.hasOwnProperty('poolNumber')).toEqual(true);
      expect(testObj.body.poolNumber).toEqual('415230101');

      expect(testObj.body.hasOwnProperty('poolType')).toEqual(true);
      expect(testObj.body.poolType).toEqual('CRO');

    });

  });

})();
