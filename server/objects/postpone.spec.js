;(function() {
  'use strict';

  var postpone = require('./postpone').postponeObject
    , urljoin = require('url-join').default
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

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('POST');

      expect(testObj.body.hasOwnProperty('juror_numbers')).to.equal(true);
      expect(testObj.body.juror_numbers[0]).to.equal('641500001');

      expect(testObj.body.hasOwnProperty('deferralDate')).to.equal(true);
      expect(testObj.body.deferralDate).to.equal('2024-04-02');

      expect(testObj.body.hasOwnProperty('poolNumber')).to.equal(true);
      expect(testObj.body.poolNumber).to.equal('415240401');

      expect(testObj.body.hasOwnProperty('excusalReasonCode')).to.equal(true);
      expect(testObj.body.excusalReasonCode).to.equal('P');


    });

  });

})();
