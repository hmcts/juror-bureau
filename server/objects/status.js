/* eslint-disable strict */

const urljoin = require('url-join');
const { DAO } = require('./dataAccessObject');

module.exports.updateStatus = new DAO('moj/juror-response/update-status', {
  post: function(jurorNumber, body) {

    const uri = urljoin(this.resource, jurorNumber);

    return { uri, body };
  },
});
