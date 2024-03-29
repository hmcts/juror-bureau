const controller = require('./show-cause.controller');
const auth = require('../../../components/auth');

module.exports = function (app) {
  app.post('/documents/during-service/post-show-cause',
    'documents.show-cause.post',
    auth.verify,
    controller.postShowCause(app));
};
