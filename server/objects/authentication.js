/* eslint-disable strict */
const { DAO } = require('./dataAccessObject');

module.exports.authCourtsDAO = new DAO('auth/moj/courts');

module.exports.jwtAuthDAO = new DAO('auth/moj/jwt/{locCode}', {
  post: function(locCode, body) {
    const uri = this.resource.replace('{locCode}', locCode);

    return { body, uri };
  },
});
