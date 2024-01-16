(function() {
  'use strict';

  var updateStatusObj = require('./status').object
    , urljoin = require('url-join')
    , rpStub = function(options) {
      return options;
    }
    , appStub = {
      logger: {
        info: function() {
          return;
        }
      }
    };

  it('should transform a single postcode string into an array', function() {
    var jurorNumber = '123456789'
      , newStatus = 'AWAITING_CONTACT'
      , version = 10
      , uri = {
        mod: 'moj/juror-response/update-status/',
        legacy: 'bureau/status',
      }
      , testObj;

    testObj = updateStatusObj.post(rpStub, appStub, 'test-token', jurorNumber, newStatus, version, true);
    expect(testObj.uri).to.equal(urljoin('http://localhost:8080/api/v1', uri.mod, jurorNumber));
    expect(testObj.body.hasOwnProperty('jurorNumber')).to.be.true;

    testObj = updateStatusObj.post(rpStub, appStub, 'test-token', jurorNumber, newStatus, version, false);
    expect(testObj.uri).to.equal(urljoin('http://localhost:8080/api/v1', uri.legacy, jurorNumber));
    expect(testObj.body.hasOwnProperty('jurorNumber')).to.be.false;
  });

})();
