const auth = require('../../../components/auth');
const controller = require('./request-info.controller');
const isBureauUser = require('../../../components/auth/user-type').isBureauUser;

module.exports = function (app) {
  app.get('/summons-replies/response/:id/request-info/:type(paper|digital)',
    'request-info.by-post.get',
    auth.verify,
    isBureauUser,
    controller.getRequestInfo(app));
  app.post('/summons-replies/response/:id/request-info/:type(paper|digital)',
    'request-info.by-post.post',
    auth.verify,
    isBureauUser,
    controller.postRequestInfo(app));

  app.get('/summons-replies/response/:id/request-info/letter/:type(paper|digital)',
    'request-info.by-post.letter.get',
    auth.verify,
    isBureauUser,
    controller.getRequestInfoLetter(app));
  app.post('/summons-replies/response/:id/request-info/letter/:type(paper|digital)',
    'request-info.by-post.letter.post',
    auth.verify,
    isBureauUser,
    controller.postRequestInfoLetter(app));
};
