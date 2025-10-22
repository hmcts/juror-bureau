;(function() {
  'use strict';

  var jurorDeceasedObject = require('./juror-deceased').jurorDeceasedObject
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

  describe('Juror deceased API Object:', function() {

    it('Should call the correct endpoint to mark a juror as deceased', function() {
      var bodyObj = {
          jurorDeceased: 'Juror has passed away'
        }
        , jurorNumber = '111000006'
        , testObj = jurorDeceasedObject.post(rpStub, appStub, 'test-token', bodyObj, jurorNumber)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/deceased-response/excuse-deceased-juror');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('POST');

      expect(testObj.body.hasOwnProperty('deceasedComment')).to.equal(true);
      expect(testObj.body.deceasedComment).to.equal('Juror has passed away');

      expect(testObj.body.hasOwnProperty('jurorNumber')).to.equal(true);
      expect(testObj.body.jurorNumber).to.equal('111000006');

      expect(testObj.body.hasOwnProperty('paperResponseExists')).to.equal(true);
      expect(testObj.body.paperResponseExists).to.equal(false);
    });

  });

})();
