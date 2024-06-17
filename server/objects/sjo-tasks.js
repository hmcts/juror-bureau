const { DAO } = require('./dataAccessObject');


module.exports.sjoTasksSearchDAO = new DAO('moj/sjo-tasks/juror/search', {
  post: function(body) {
    Object.keys(body).forEach(key => body[key] === '' && delete body[key]);

    return {
      body,
    }
  },
});

module.exports.undoFailedToAttendBulkDAO = new DAO('moj/sjo-tasks/failed-to-attend/undo');
