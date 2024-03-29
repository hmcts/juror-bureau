const controller = require('./search.controller');
const auth = require('../../../components/auth');

module.exports = function (app) {
  app.get('/juror-record/search', 'juror-record.search.get', auth.verify, controller.getSearch(app));
  app.post('/juror-record/search', 'juror-record.search.post', auth.verify, controller.postSearch(app));

  // please do not question me 🫡
  app.get('/juror-record/select', 'juror-record.select.get', auth.verify, controller.selectJuror(app));
};
