;(function() {
  'use strict';

  const { getPoolsObject, getJurorsObject } = require('./dismiss-jurors');
  const urljoin = require('url-join');
  const rpStub = function(options) {
    return options;
  };
  const appStub = {
    logger: {
      info: function() {
        return;
      },
    },
  };

  describe('Dismiss jurors API object:', function() {
    it('should call the correct endpoint to fetch the pools', function() {
      const testUri = getPoolsObject.get(rpStub, appStub, 'test-token');
      const realUri = urljoin('http://localhost:8080/api/v1/moj/juror-management/dismiss-jurors/pools');

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('GET');
    });

    it('should call the correct endpoint to fetch the jurors with the selected parameters', function() {
      const testUri = getJurorsObject.get(rpStub, appStub, 'test-token');
      const realUri = urljoin('http://localhost:8080/api/v1/moj/juror-management/dismiss-jurors/jurors');

      expect(testUri.uri).to.equal(realUri);
      expect(testUri.method).to.equal('GET');
    });
  });

})();
