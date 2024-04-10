;(function() {
  'use strict';

  var jurorTransfer = require('./juror-transfer').jurorTransfer
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

  describe('Juror transfer API Object:', function() {

    it('Should call the correct endpoint to tranfer a juror', function() {
      var jurorNumbers = '111111111'
        , receivingCourtLocCode = '433'
        , newServiceStartDate = '2023-07-05'
        , sourcePoolNumber = '415230701'
        , testObj = jurorTransfer.put(rpStub
          , appStub
          , 'test-token'
          , jurorNumbers
          , receivingCourtLocCode
          , newServiceStartDate
          , sourcePoolNumber)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/manage-pool/transfer');

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('PUT');

      expect(testObj.body.hasOwnProperty('jurorNumbers')).toEqual(true);
      expect(testObj.body.jurorNumbers[0]).toEqual('111111111');

      expect(testObj.body.hasOwnProperty('receivingCourtLocCode')).toEqual(true);
      expect(testObj.body.receivingCourtLocCode).toEqual('433');

      expect(testObj.body.hasOwnProperty('targetServiceStartDate')).toEqual(true);
      expect(testObj.body.targetServiceStartDate).toEqual('2023-07-05');

      expect(testObj.body.hasOwnProperty('sendingCourtLocCode')).toEqual(true);
      expect(testObj.body.sendingCourtLocCode).toEqual('415');

      expect(testObj.body.hasOwnProperty('sourcePoolNumber')).toEqual(true);
      expect(testObj.body.sourcePoolNumber).toEqual('415230701');

    });

  });

})();
