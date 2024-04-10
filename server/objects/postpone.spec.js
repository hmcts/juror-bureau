;(function() {
  'use strict';

  var postpone = require('./postpone').postponeObject
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

  describe('Postpone API Object:', function() {

    it('Should call the correct endpoint to postpone jurors', function() {

      var postponePayload = {
        //eslint-disable-next-line
          juror_numbers: [ '641500001' ],
          deferralDate: '2024-04-02',
          poolNumber: '415240401',
          excusalReasonCode: 'P',
        }
        , testObj = postpone.post(rpStub
          , appStub
          , 'test-token'
          , postponePayload)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/deferral-maintenance/juror/postpone');

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('POST');

      expect(testObj.body.hasOwnProperty('juror_numbers')).toEqual(true);
      expect(testObj.body.juror_numbers[0]).toEqual('641500001');

      expect(testObj.body.hasOwnProperty('deferralDate')).toEqual(true);
      expect(testObj.body.deferralDate).toEqual('2024-04-02');

      expect(testObj.body.hasOwnProperty('poolNumber')).toEqual(true);
      expect(testObj.body.poolNumber).toEqual('415240401');

      expect(testObj.body.hasOwnProperty('excusalReasonCode')).toEqual(true);
      expect(testObj.body.excusalReasonCode).toEqual('P');


    });

  });

})();
