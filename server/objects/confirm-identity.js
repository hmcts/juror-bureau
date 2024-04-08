/* eslint-disable strict */

const { DAO } = require('./dataAccessObject');

module.exports.confirmIdentityDAO = new DAO('moj/juror-record/confirm-identity', {
  patch: function(body) {
    return { body };
  },
});
