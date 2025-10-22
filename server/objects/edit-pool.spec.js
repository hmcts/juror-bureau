(function() {
  'use strict';

  var editNoRequested = require('./edit-pool').editNoRequested
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

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('PUT');

      expect(testUri.body.hasOwnProperty('totalRequired')).to.be.false;

      expect(testUri.body.hasOwnProperty('noRequested')).to.be.true;
      expect(testUri.body.noRequested).to.equal(20);

      expect(testUri.body.hasOwnProperty('poolNumber')).to.be.true;
      expect(testUri.body.poolNumber).to.equal('415230101');

      expect(testUri.body.hasOwnProperty('reasonForChange')).to.be.true;
      expect(testUri.body.reasonForChange).to.equal('some reason here');

      expect(testUri.body.hasOwnProperty('_csrf')).to.be.false;
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

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('PUT');

      expect(testUri.body.hasOwnProperty('noRequested')).to.be.false;

      expect(testUri.body.hasOwnProperty('totalRequired')).to.be.true;
      expect(testUri.body.totalRequired).to.equal(20);

      expect(testUri.body.hasOwnProperty('poolNumber')).to.be.true;
      expect(testUri.body.poolNumber).to.equal('415230101');

      expect(testUri.body.hasOwnProperty('reasonForChange')).to.be.true;
      expect(testUri.body.reasonForChange).to.equal('some reason here');

      expect(testUri.body.hasOwnProperty('_csrf')).to.be.false;
    });

  });

})();
