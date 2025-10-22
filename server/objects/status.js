/* eslint-disable strict */

const urljoin = require('url-join').default;
const { DAO } = require('./dataAccessObject');

module.exports.updateStatusDAO = new DAO('moj/juror-response/update-status', {
  post: function(jurorNumber, body) {

    const uri = urljoin(this.resource, jurorNumber);

    return { uri, body };
  },
});

module.exports.markAsRespondedDAO = new DAO('moj/juror-record/mark-responded', {
  patch: function(jurorNumber) {
    const uri = urljoin(this.resource, jurorNumber);

    return { uri, body: {} };
  },
});

// TODO: Update with correct endpoint when available
module.exports.markAsSummonedDAO = new DAO('moj/juror-record/mark-summoned', {
  patch: function(jurorNumber) {
    const uri = urljoin(this.resource, jurorNumber);

    return { uri, body: {} };
  },
});
