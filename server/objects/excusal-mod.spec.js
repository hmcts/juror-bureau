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

      expect(testUri.uri).toEqual(realUri);
      expect(testUri.method).toEqual('PUT');

      expect(testUri.body.hasOwnProperty('excusalDecision')).toEqual(true);
      expect(testUri.body.excusalDecision).toEqual('REFUSE');

      expect(testUri.body.hasOwnProperty('excusalReasonCode')).toEqual(true);
      expect(testUri.body.excusalReasonCode).toEqual('A');

      expect(testUri.body.hasOwnProperty('replyMethod')).toEqual(true);
      expect(testUri.body.replyMethod).toEqual('PAPER');
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

      expect(testUri.uri).toEqual(realUri);
      expect(testUri.method).toEqual('PUT');

      expect(testUri.body.hasOwnProperty('excusalDecision')).toEqual(true);
      expect(testUri.body.excusalDecision).toEqual('GRANT');

      expect(testUri.body.hasOwnProperty('excusalReasonCode')).toEqual(true);
      expect(testUri.body.excusalReasonCode).toEqual('B');

      expect(testUri.body.hasOwnProperty('replyMethod')).toEqual(true);
      expect(testUri.body.replyMethod).toEqual('DIGITAL');
    });

  });

})();
