(function() {
  'use strict';

  var requestObj = require('./pool-management')
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

  describe('Pool management API Object:', function() {

    it('should call the correct endpoint to fetch deferrals for a given court location', function() {
      var locationCode = '415'
        , testObj = requestObj.deferralMaintenance.deferrals.get(rpStub, appStub, 'test-token', locationCode)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/deferral-maintenance/deferrals', locationCode);

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('GET');
    });

    // eslint-disable-next-line max-len
    it('should call the correct endpoint to fetch pools available for a given court location - deferral maintenance', function() {
      var locationCode = '415'
        , testObj = requestObj.deferralMaintenance.availablePools.get(rpStub, appStub, 'test-token', locationCode)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/deferral-maintenance/available-pools', locationCode);

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('GET');
    });

    it('should vall the correct endpoint to post the jurors to be deferred', function() {
      var poolNumber = '415231212'
        , jurors = ['100000000', '100000001', '100000002']
        , testObj = requestObj.deferralMaintenance.allocateJurors
          .post(rpStub, appStub, 'test-token', jurors, poolNumber)
        , realUri = urljoin('http://localhost:8080/api/v1',
          'moj/deferral-maintenance/deferrals/allocate-jurors-to-pool');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('POST');
      expect(testObj.body).to.not.be.undefined;
      expect(testObj.body.hasOwnProperty('jurors')).to.be.true;
      expect(testObj.body.hasOwnProperty('poolNumber')).to.be.true;
      expect(testObj.body.jurors).to.be.eql(jurors);
      expect(testObj.body.poolNumber).to.be.equal(poolNumber);
    });

    // eslint-disable-next-line max-len
    it('should call the correct endpoint to fetch pools available for a given court location - reassign juror', function() {
      var locationCode = '415'
        , testObj = requestObj.reassignJurors.availablePools.get(rpStub, appStub, 'test-token', locationCode)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/manage-pool/available-pools', locationCode);

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('GET');
    });

    it('shout call the correct endpoint to reassign the selected juror to a different pool', function() {
      var payload = {
          jurorNumbers: ['123456789'],
          receivingCourtLocCode: '416',
          receivingPoolNumber: '416240101',
          sourceCourtLocCode: '415',
          sourcePoolNumber: '415240101',
        }
        , testObj = requestObj.reassignJurors.reassignJuror.put(rpStub, appStub, 'test-token', payload)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/manage-pool/reassign-jurors');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('PUT');
      expect(testObj.body).to.not.be.undefined;
      expect(testObj.body.hasOwnProperty('jurorNumbers')).to.be.true;
      expect(testObj.body.jurorNumbers).to.be.eql(payload.jurorNumbers);
      expect(testObj.body.hasOwnProperty('receivingCourtLocCode')).to.be.true;
      expect(testObj.body.receivingCourtLocCode).to.be.equal(payload.receivingCourtLocCode);
      expect(testObj.body.hasOwnProperty('receivingPoolNumber')).to.be.true;
      expect(testObj.body.receivingPoolNumber).to.be.equal(payload.receivingPoolNumber);
      expect(testObj.body.hasOwnProperty('sourceCourtLocCode')).to.be.true;
      expect(testObj.body.sourceCourtLocCode).to.be.equal(payload.sourceCourtLocCode);
      expect(testObj.body.hasOwnProperty('sourcePoolNumber')).to.be.true;
      expect(testObj.body.sourcePoolNumber).to.be.equal(payload.sourcePoolNumber);
    });

  });

})();
