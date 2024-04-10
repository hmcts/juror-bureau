const { deleteDeferralObject } = require('./deferral-mod');

;(function() {
  'use strict';

  var deferralObject = require('./deferral-mod').deferralObject
    , deferralPoolsObject = require('./deferral-mod').deferralPoolsObject
    , changeDeferralObject = require('./deferral-mod').changeDeferralObject
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

  describe('Deferral API Object:', function() {

    it('Should call the correct endpoint for processing a reply as a ‘deferral’ post-summons', function() {
      var bodyObj = {
          deferralDecision: 'REFUSE',
          deferralReason: 'C',
          jurorNumber: '111000006',
        }
        , testObj = deferralObject.put(rpStub, appStub, 'test-token', bodyObj)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/deferral-response/juror');

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('PUT');

      expect(testObj.body.hasOwnProperty('deferralDecision')).toEqual(true);
      expect(testObj.body.deferralDecision).toEqual('REFUSE');

      expect(testObj.body.hasOwnProperty('deferralReason')).toEqual(true);
      expect(testObj.body.deferralReason).toEqual('C');

      expect(testObj.body.hasOwnProperty('jurorNumber')).toEqual(true);
      expect(testObj.body.jurorNumber).toEqual('111000006');
    });

    // eslint-disable-next-line max-len
    it('Should call the correct endpoint for processing a reply as a ‘deferral’ - into deferral maintenance', function() {
      let jurorNumber = '111222333'
        , poolNumber = null
        , deferralDate = '2023-01-01'
        , deferralReason = 'O'
        , replyMethod = 'PAPER'
        // eslint-disable-next-line max-len
        , testObj = deferralObject.post(rpStub, appStub, 'test-token', jurorNumber, poolNumber, deferralDate, deferralReason, replyMethod)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/deferral-maintenance/juror/defer/', jurorNumber);

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('POST');

      expect(testObj.body.hasOwnProperty('deferralDate')).toEqual(true);
      expect(testObj.body.deferralDate).toEqual('2023-01-01');

      expect(testObj.body.hasOwnProperty('excusalReasonCode')).toEqual(true);
      expect(testObj.body.excusalReasonCode).toEqual('O');

      expect(testObj.body.hasOwnProperty('replyMethod')).toEqual(true);
      expect(testObj.body.replyMethod).toEqual('PAPER');

      expect(testObj.body.hasOwnProperty('poolNumber')).toEqual(false);
    });

    it('Should call the correct endpoint for processing a reply as a ‘deferral’ - into pool', function() {
      let jurorNumber = '111222333'
        , poolNumber = '415220401'
        , deferralDate = '2023-01-01'
        , deferralReason = 'O'
        , replyMethod = 'PAPER'
        // eslint-disable-next-line max-len
        , testObj = deferralObject.post(rpStub, appStub, 'test-token', jurorNumber, poolNumber, deferralDate, deferralReason, replyMethod)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/deferral-maintenance/juror/defer/', jurorNumber);

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('POST');

      expect(testObj.body.hasOwnProperty('poolNumber')).toEqual(true);
      expect(testObj.body.poolNumber).toEqual('415220401');

      expect(testObj.body.hasOwnProperty('deferralDate')).toEqual(true);
      expect(testObj.body.deferralDate).toEqual('2023-01-01');

      expect(testObj.body.hasOwnProperty('excusalReasonCode')).toEqual(true);
      expect(testObj.body.excusalReasonCode).toEqual('O');

      expect(testObj.body.hasOwnProperty('replyMethod')).toEqual(true);
      expect(testObj.body.replyMethod).toEqual('PAPER');
    });

  });

  describe('Retrieve available pools to defer a juror to:', function() {

    it('Should call the correct endpoint for retrieving the available pool to defer a juror to', function() {
      let jurorNumber = '111222333',
        deferralDates = ['2023-01-01'],
        testObj = deferralPoolsObject.post(rpStub, appStub, 'test-token', deferralDates, jurorNumber),
        realUri = urljoin('http://localhost:8080/api/v1', 'moj/deferral-maintenance/available-pools', jurorNumber);

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('POST');

      expect(testObj.body.hasOwnProperty('deferralDates')).toEqual(true);
      expect(testObj.body.deferralDates).toEqual(deferralDates);
    });
  });

  describe('Change a juror\'s deferral date and/or reason:', function() {

    it('Should call the correct endpoint for changing a juror\'s deferral details', function() {
      let jurorNumber = '111222333',
        deferralDate = '2023-01-01',
        poolNumber = '123456789',
        excusalReasonCode = 'A',
        testObj = changeDeferralObject.post(rpStub, appStub, 'test-token', jurorNumber, deferralDate, poolNumber,
          excusalReasonCode),
        realUri = urljoin('http://localhost:8080/api/v1', 'moj/deferral-maintenance/deferrals/change-deferral-date',
          jurorNumber);

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('POST');

      expect(testObj.body.hasOwnProperty('deferralDate')).toEqual(true);
      expect(testObj.body.deferralDate).toEqual(deferralDate);

      expect(testObj.body.hasOwnProperty('poolNumber')).toEqual(true);
      expect(testObj.body.poolNumber).toEqual(poolNumber);

      expect(testObj.body.hasOwnProperty('excusalReasonCode')).toEqual(true);
      expect(testObj.body.excusalReasonCode).toEqual(excusalReasonCode);
    });
  });

  describe('Delete a juror\'s deferral:', function() {

    it('Should call the correct endpoint for deleting a juror\'s deferral', function() {
      let jurorNumber = '111222333',
        testObj = deleteDeferralObject.delete(rpStub, appStub, 'test-token', jurorNumber),
        realUri = urljoin('http://localhost:8080/api/v1', 'moj/deferral-maintenance/delete-deferral',
          jurorNumber);

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('DELETE');
    });
  });

})();
