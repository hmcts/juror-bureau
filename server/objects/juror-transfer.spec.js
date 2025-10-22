;(function() {
  'use strict';

  var jurorTransfer = require('./juror-transfer').jurorTransfer
    , urljoin = require('url-join').default
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

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('PUT');

      expect(testObj.body.hasOwnProperty('jurorNumbers')).to.equal(true);
      expect(testObj.body.jurorNumbers[0]).to.equal('111111111');

      expect(testObj.body.hasOwnProperty('receivingCourtLocCode')).to.equal(true);
      expect(testObj.body.receivingCourtLocCode).to.equal('433');

      expect(testObj.body.hasOwnProperty('targetServiceStartDate')).to.equal(true);
      expect(testObj.body.targetServiceStartDate).to.equal('2023-07-05');

      expect(testObj.body.hasOwnProperty('sendingCourtLocCode')).to.equal(true);
      expect(testObj.body.sendingCourtLocCode).to.equal('415');

      expect(testObj.body.hasOwnProperty('sourcePoolNumber')).to.equal(true);
      expect(testObj.body.sourcePoolNumber).to.equal('415230701');

    });

  });

})();
