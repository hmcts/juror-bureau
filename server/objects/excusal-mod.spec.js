(function() {
  'use strict';

  var excusalObject = require('./excusal-mod').excusalObject
    , urljoin = require('url-join')
    , rpStub = function(options) {
      return options;
    }
    , appStub = {
      logger: {
        info: function() {
          return;
        },
      },
    };

  describe('Grant or Refusal of an excusal:', function() {

    it('should send call the correct endpoint to REFUSE an excusal', function() {
      var body = {
          excusalDecision: 'REFUSE',
          excusalCode: 'A',
        }
        , jurorNumber = '111000002'
        , replyMethod = 'PAPER'
        , testUri = excusalObject.put(rpStub, appStub, 'test-token', body, jurorNumber, replyMethod)
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/excusal-response/juror/',
          jurorNumber
        );

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('PUT');

      expect(testUri.body.hasOwnProperty('excusalDecision')).to.be.true;
      expect(testUri.body.excusalDecision).to.equal('REFUSE');

      expect(testUri.body.hasOwnProperty('excusalReasonCode')).to.be.true;
      expect(testUri.body.excusalReasonCode).to.equal('A');

      expect(testUri.body.hasOwnProperty('replyMethod')).to.be.true;
      expect(testUri.body.replyMethod).to.equal('PAPER');
    });

    it('should send call the correct endpoint to GRANT an excusal', function() {
      var body = {
          excusalDecision: 'GRANT',
          excusalCode: 'B',
        }
        , jurorNumber = '111000005'
        , replyMethod = 'DIGITAL'
        , testUri = excusalObject.put(rpStub, appStub, 'test-token', body, jurorNumber, replyMethod)
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/excusal-response/juror/',
          jurorNumber
        );

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('PUT');

      expect(testUri.body.hasOwnProperty('excusalDecision')).to.be.true;
      expect(testUri.body.excusalDecision).to.equal('GRANT');

      expect(testUri.body.hasOwnProperty('excusalReasonCode')).to.be.true;
      expect(testUri.body.excusalReasonCode).to.equal('B');

      expect(testUri.body.hasOwnProperty('replyMethod')).to.be.true;
      expect(testUri.body.replyMethod).to.equal('DIGITAL');
    });

  });

})();
