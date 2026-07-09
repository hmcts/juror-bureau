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

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('PUT');

      expect(testObj.body.hasOwnProperty('juror_numbers')).to.equal(true);
      expect(testObj.body.juror_numbers[0]).to.equal('111111111');

      expect(testObj.body.hasOwnProperty('receiving_court_loc_code')).to.equal(true);
      expect(testObj.body.receiving_court_loc_code).to.equal('433');

      expect(testObj.body.hasOwnProperty('service_start_date')).to.equal(true);
      expect(testObj.body.service_start_date).to.equal('2023-07-05');

      expect(testObj.body.hasOwnProperty('sending_court_loc_code')).to.equal(true);
      expect(testObj.body.sending_court_loc_code).to.equal('415');

      expect(testObj.body.hasOwnProperty('source_pool_number')).to.equal(true);
      expect(testObj.body.source_pool_number).to.equal('415230701');

    });

  });

})();
