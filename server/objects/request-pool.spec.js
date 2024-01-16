;(function() {
  'use strict';

  var poolRequestObject = require('./request-pool')
    , urljoin = require('url-join')
    , rpStub = function(options) {
      return options;
    }
    , appStub = {
      logger: {
        debug: function() {
          return;
        },
        info: function() {
          return;
        }
      }
    }

  describe('Request a pool API Object:', function() {

    it('should call the correct endpoint to fetch the courts list', function() {
      var testUri = poolRequestObject.fetchCourts.get(rpStub, appStub, 'test-token')
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/pool-request/court-locations');

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('GET');
    });

    it('should call the correct endpoint to post the pool request data', function() {
      var bodyStub = {
          attendanceTime: {}
        }
        , testUri = poolRequestObject.createPoolRequest.post(rpStub, appStub, 'test-token', bodyStub)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/pool-request/new-pool');

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('POST');
    });

    it('should call the correct endpoint to check a type of day', function() {
      var testUri = poolRequestObject.checkDayType.get(rpStub, appStub, 'test-token', 100, '2022-10-10')
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/pool-request/day-type?locationCode=100&attendanceDate=2022-10-10'
        );

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('GET');
    });

    it('should call the correct endpoint to generate a pool number', function() {
      var testUri = poolRequestObject.generatePoolNumber.get(rpStub, appStub, 'test-token', 100, '2022-10-10')
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/pool-request/generate-pool-number?locationCode=100&attendanceDate=2022-10-10'
        );

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('GET');
    });

    it('should call the correct endpoint to fetch court deferrals', function() {
      var testUri = poolRequestObject.fetchCourtDeferrals.get(rpStub, appStub, 'test-token', 100, '2022-10-10')
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/pool-request/deferrals?locationCode=100&deferredTo=2022-10-10'
        );

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('GET');
    });

    it('should call the correct endpoint to fetch pool numbers', function() {
      var testUri = poolRequestObject.fetchPoolNumbers.get(rpStub, appStub, 'test-token', '4152201')
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/pool-request/pool-numbers?poolNumberPrefix=4152201'
        );

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('GET');
    });

    it('should call the correct endpoint to create a coroner court pool', function() {
      var testUri = poolRequestObject.createCoronerPool.post(rpStub, appStub, 'test-token', {})
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/pool-create/create-coroner-pool'
        );

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('POST');
    });

    it('should call the correct endpoint to fetch a coroner court pool', function() {
      var testUri = poolRequestObject.fetchCoronerPool.get(rpStub, appStub, 'test-token', '923040001')
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/pool-create/coroner-pool?poolNumber=923040001'
        );

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('GET');
    });

    it('should call the correct endpoint to add voters into a coroner court pool', function() {
      var testUri = poolRequestObject.addCoronerCitizens.post(rpStub, appStub, 'test-token', {})
        , realUri = urljoin(
          'http://localhost:8080/api/v1',
          'moj/pool-create/add-citizens'
        );

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('POST');
    });

  });
})();
