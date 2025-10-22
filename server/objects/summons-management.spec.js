(function() {
  'use strict';

  var summonsManagementObj = require('./summons-management')
    , urljoin = require('url-join').default
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

  describe('Summons management API Object:', function() {

    it('Should call the correct endpoint to post the requested info', function() {
      var jurorNumber = '123456789'
        , replyMethod = 'PAPER'
        , testBody = ['RESIDENCY']
        // eslint-disable-next-line max-len
        , testObj = summonsManagementObj.requestInfoObject.post(rpStub, appStub, 'test-token', jurorNumber, testBody, replyMethod)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/letter/request-information');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('POST');

      expect(testObj.body.hasOwnProperty('replyMethod')).to.equal(true);
      expect(testObj.body.replyMethod).to.equal('PAPER');

      expect(testObj.body.hasOwnProperty('informationRequired')).to.equal(true);
      expect(testObj.body.informationRequired[0]).to.equal('RESIDENCY');

      expect(testObj.body.hasOwnProperty('jurorNumber')).to.equal(true);
      expect(testObj.body.jurorNumber).to.equal('123456789');
    });

    it('Should call the correct endpoint to update the awaiting information status', function() {
      var jurorNumber = '123456789'
        , status = 'AWAITING_CONTACT'
        // eslint-disable-next-line max-len
        , testObj = summonsManagementObj.updateStatus.put(rpStub, appStub, 'test-token', jurorNumber, status)
        // eslint-disable-next-line max-len
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/juror-paper-response/update-status/', jurorNumber, status);

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('PUT');
    });

    it('Should call the correct endpoint to update the paper summons - Personal Details', function() {
      const jurorNumber = 123456789;
      const part = 'PERSONAL';
      const testObj = summonsManagementObj
        .summonsUpdate
        .patch(rpStub, appStub, 'test-token', jurorNumber, part, {});
      const realUri = urljoin('http://localhost:8080/api/v1',
        `moj/juror-response/juror/${jurorNumber}/details/personal`);

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('PATCH');
    });

    it('Should call the correct endpoint to update the paper summons - Eligibility', function() {
      const jurorNumber = 123456789;
      const part = 'ELIGIBILITY';
      const testObj = summonsManagementObj
        .summonsUpdate
        .patch(rpStub, appStub, 'test-token', jurorNumber, part, {});
      const realUri = urljoin('http://localhost:8080/api/v1',
        `moj/juror-paper-response/juror/${jurorNumber}/details/eligibility`);

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('PATCH');
    });

    it('Should call the correct endpoint to update the paper summons - Reply type', function() {
      const jurorNumber = 123456789;
      const part = 'REPLYTYPE';
      const testObj = summonsManagementObj
        .summonsUpdate
        .patch(rpStub, appStub, 'test-token', jurorNumber, part, {});
      const realUri = urljoin('http://localhost:8080/api/v1',
        `moj/juror-paper-response/juror/${jurorNumber}/details/reply-type`);

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('PATCH');
    });

    it('Should call the correct endpoint to update the paper summons - Cjs employment', function() {
      const jurorNumber = 123456789;
      const part = 'CJS';
      const testObj = summonsManagementObj
        .summonsUpdate
        .patch(rpStub, appStub, 'test-token', jurorNumber, part, {});
      const realUri = urljoin('http://localhost:8080/api/v1',
        `moj/juror-paper-response/juror/${jurorNumber}/details/cjs`);

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('PATCH');
    });

    it('Should call the correct endpoint to update the paper summons - Reasonable adjustments', function() {
      const jurorNumber = 123456789;
      const part = 'ADJUSTMENTS';
      const testObj = summonsManagementObj
        .summonsUpdate
        .patch(rpStub, appStub, 'test-token', jurorNumber, part, {});
      const realUri = urljoin('http://localhost:8080/api/v1',
        `moj/juror-paper-response/juror/${jurorNumber}/details/special-needs`);

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('PATCH');
    });

    it('Should call the correct endpoint to update the paper summons - Signature', function() {
      const jurorNumber = 123456789;
      const part = 'SIGNATURE';
      const testObj = summonsManagementObj
        .summonsUpdate
        .patch(rpStub, appStub, 'test-token', jurorNumber, part, {});
      const realUri = urljoin('http://localhost:8080/api/v1',
        `moj/juror-paper-response/juror/${jurorNumber}/details/signature`);

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('PATCH');
    });

  });

})();
