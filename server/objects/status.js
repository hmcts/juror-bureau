/* eslint-disable strict */

const _ = require('lodash');
const urljoin = require('url-join');
const { DAO } = require('./dataAccessObject');
const { replaceAllObjKeys } = require('../lib/mod-utils');

module.exports.updateStatusDAO = new DAO('moj/juror-response/update-status', {
  post: function(jurorNumber, body) {
    return { 
      uri: urljoin(this.resource, jurorNumber),
      body: replaceAllObjKeys(body, _.snakeCase)
    };
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
