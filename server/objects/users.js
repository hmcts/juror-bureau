;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join')

  module.exports.usersDAO = new DAO('moj/users');

  module.exports.userRecordDAO = new DAO('moj/users', {
    post: function(body) {
      return { uri: urljoin(this.resource, 'create'), body };
    },
    get: function(username) {
      return { uri: urljoin(this.resource, username) };
    },
    put: function(username, body) {
      return { uri: urljoin(this.resource, username), body };
    },
    patch: function(username, userType) {
      return { uri: urljoin(this.resource, username, 'type', userType) };
    },
  });

  module.exports.assignCourtsDAO = new DAO('moj/users/{username}/courts', {
    patch: function(username, body) {
      return { uri: this.resource.replace('{username}', username), body };
    },
    delete: function(username, body) {
      return { uri: this.resource.replace('{username}', username), body };
    },
  });

})();
