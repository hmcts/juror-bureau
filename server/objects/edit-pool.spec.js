(function() {
  'use strict';

  var editNoRequested = require('./edit-pool').editNoRequested
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
    }

  describe('Edit a pool API object:', function() {

    it('should send call the correct endpoint to edit a pool (bureau user)', function() {
      var bodyStub = {
          noOfJurors: 20,
          poolNumber: '415230101',
          reasonForChange: 'some reason here',
        }
        , testUri = editNoRequested.put(rpStub, appStub, 'test-token', bodyStub, '400')
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/manage-pool/edit-pool'
        );

      expect(testUri.uri).toEqual(realUri);
      expect(testUri.method).toEqual('PUT');

      expect(testUri.body.hasOwnProperty('totalRequired')).toEqual(false);

      expect(testUri.body.hasOwnProperty('noRequested')).toEqual(true);
      expect(testUri.body.noRequested).toEqual(20);

      expect(testUri.body.hasOwnProperty('poolNumber')).toEqual(true);
      expect(testUri.body.poolNumber).toEqual('415230101');

      expect(testUri.body.hasOwnProperty('reasonForChange')).toEqual(true);
      expect(testUri.body.reasonForChange).toEqual('some reason here');

      expect(testUri.body.hasOwnProperty('_csrf')).toEqual(false);
    });

    it('should send call the correct endpoint to edit a pool (court user)', function() {
      var bodyStub = {
          noOfJurors: 20,
          poolNumber: '415230101',
          reasonForChange: 'some reason here',
        }
        , testUri = editNoRequested.put(rpStub, appStub, 'test-token', bodyStub, '401')
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/manage-pool/edit-pool'
        );

      expect(testUri.uri).toEqual(realUri);
      expect(testUri.method).toEqual('PUT');

      expect(testUri.body.hasOwnProperty('noRequested')).toEqual(false);

      expect(testUri.body.hasOwnProperty('totalRequired')).toEqual(true);
      expect(testUri.body.totalRequired).toEqual(20);

      expect(testUri.body.hasOwnProperty('poolNumber')).toEqual(true);
      expect(testUri.body.poolNumber).toEqual('415230101');

      expect(testUri.body.hasOwnProperty('reasonForChange')).toEqual(true);
      expect(testUri.body.reasonForChange).toEqual('some reason here');

      expect(testUri.body.hasOwnProperty('_csrf')).toEqual(false);
    });

  });

})();
