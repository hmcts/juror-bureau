const _ = require('lodash');
const { replaceAllObjKeys } = require('../lib/mod-utils');
const { DAO } = require('./dataAccessObject');
const { basicDataTransform2 } = require('../lib/utils');

module.exports.sjoTasksSearchDAO = new DAO('moj/sjo-tasks/juror/search', {
  post: function(body) {
    Object.keys(body).forEach(key => body[key] === '' && delete body[key]);

    return {
      uri: this.resource,
      body: replaceAllObjKeys(body, _.snakeCase),
    }
  },
});

module.exports.undoFailedToAttendDAO = new DAO('moj/sjo-tasks/failed-to-attend/undo', {
  patch: function(payload) {
    return {
      uri: this.resource,
      body: replaceAllObjKeys(payload, _.snakeCase),
    }
  }
});

module.exports.uncompleteJurorDAO = new DAO('moj/complete-service/uncomplete', {
  patch: function(payload) {
    return {
      uri: this.resource,
      body: replaceAllObjKeys(payload, _.snakeCase),
    }
  }
});
