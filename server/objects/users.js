;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join')
  const { mapSnakeToCamel } = require('../lib/mod-utils');

  module.exports.usersDAO = new DAO('moj/users', {
    post: function(body) {
      return {
        body,
        transform: mapSnakeToCamel,
      };
    },
  });

  module.exports.userRecordDAO = new DAO('moj/users', {
    post: function(body) {
      return { uri: urljoin(this.resource, 'create'), body, transform: mapSnakeToCamel };
    },
    get: function(username) {
      return { uri: urljoin(this.resource, username), transform: mapSnakeToCamel };
    },
    put: function(username, body) {
      return { uri: urljoin(this.resource, username), body, transform: mapSnakeToCamel };
    },
    patch: function(username, userType) {
      return { uri: urljoin(this.resource, username, 'type', userType), transform: mapSnakeToCamel };
    },
  });

  module.exports.assignCourtsDAO = new DAO('moj/users/{username}/courts', {
    patch: function(username, body) {
      return { uri: this.resource.replace('{username}', username), body, transform: mapSnakeToCamel };
    },
    delete: function(username, body) {
      return { uri: this.resource.replace('{username}', username), body, transform: mapSnakeToCamel };
    },
  });

})();
