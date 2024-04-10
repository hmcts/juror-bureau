;(function() {
  'use strict';

  var jurorDeceasedObject = require('./juror-deceased').jurorDeceasedObject
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

  describe('Juror deceased API Object:', function() {

    it('Should call the correct endpoint to mark a juror as deceased', function() {
      var bodyObj = {
          jurorDeceased: 'Juror has passed away'
        }
        , jurorNumber = '111000006'
        , testObj = jurorDeceasedObject.post(rpStub, appStub, 'test-token', bodyObj, jurorNumber)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/deceased-response/excuse-deceased-juror');

      expect(testObj.uri).toEqual(realUri);
      expect(testObj.method).toEqual('POST');

      expect(testObj.body.hasOwnProperty('deceasedComment')).toEqual(true);
      expect(testObj.body.deceasedComment).toEqual('Juror has passed away');

      expect(testObj.body.hasOwnProperty('jurorNumber')).toEqual(true);
      expect(testObj.body.jurorNumber).toEqual('111000006');

      expect(testObj.body.hasOwnProperty('paperResponseExists')).toEqual(true);
      expect(testObj.body.paperResponseExists).toEqual(false);
    });

  });

})();
