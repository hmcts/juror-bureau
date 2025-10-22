;(function() {
  'use strict';

  var poolSearchObject = require('./pool-search')
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

  describe('Pool search API Object:', function() {

    it('Should call the correct endpoint to pull the pool list accroding to search parameters', function() {
      var bodyObj = {
          poolNumber: '415220110',
          locCode: '415',
          serviceStartDate: '2023-02-15'
        }
        , testObj = poolSearchObject.poolSearchObject.post(rpStub, appStub, 'test-token', bodyObj)
        , realUri = urljoin('http://localhost:8080/api/v1', 'moj/pool-search');

      expect(testObj.uri).to.equal(realUri);
      expect(testObj.method).to.equal('POST');

      expect(testObj.body.hasOwnProperty('locCode')).to.equal(true);
      expect(testObj.body.locCode).to.equal('415');

      expect(testObj.body.hasOwnProperty('serviceStartDate')).to.equal(true);
      expect(testObj.body.serviceStartDate).to.equal('2023-02-15');

      expect(testObj.body.hasOwnProperty('poolNumber')).to.equal(true);
      expect(testObj.body.poolNumber).to.equal('415220110');
    });

  });

})();
