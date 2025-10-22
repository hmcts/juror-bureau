(function() {
  'use strict';
  
  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join').default;

  module.exports.jurorList = new DAO('moj/juror-record/pending-jurors', {
    get: function(locCode, status) {
      let uri = urljoin(
        this.resource,
        locCode,
      );
      if (typeof status !== 'undefined') {
        uri = urljoin(uri, '?status=' + status);
      }
      return { uri };
    }
  });
  module.exports.processPendingJuror = new DAO('moj/juror-record/process-pending-juror', {
    post: function(jurorNumber, decision, comments) {
      return {
        uri: this.resource,
        body: {
          jurorNumber,
          decision,
          comments,
        },
      }
    }
  });

})();
