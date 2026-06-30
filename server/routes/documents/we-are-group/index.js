(function () {
  'use strict';

  const auth = require('../../../components/auth');
  const { isBureauUser } = require('../../../components/auth/user-type');
  const controller = require('./we-are-group.controller');
  const messages = require('./definitions');

  module.exports = function (app) {
    messages.forEach(message => registerMessageRoutes(app, message));
  };

  function registerMessageRoutes (app, message) {
    app.get(`/documents/${message.path}`,
      `${message.routeName}.get`,
      auth.verify,
      isBureauUser,
      controller.getSearch(app, message));
    app.post(`/documents/${message.path}`,
      `${message.routeName}.post`,
      auth.verify,
      isBureauUser,
      controller.postSearch(app, message));

    app.get(`/documents/${message.path}/results`,
      `${message.routeName}.results.get`,
      auth.verify,
      isBureauUser,
      controller.getResults(app, message));
    app.post(`/documents/${message.path}/results`,
      `${message.routeName}.results.post`,
      auth.verify,
      isBureauUser,
      controller.postResults(app, message));

    app.get(`/documents/${message.path}/preview/:locCode/:jurorNumber`,
      `${message.routeName}.preview.get`,
      auth.verify,
      isBureauUser,
      controller.getPreview(app, message));
    app.post(`/documents/${message.path}/preview/:locCode/:jurorNumber`,
      `${message.routeName}.preview.post`,
      auth.verify,
      isBureauUser,
      controller.postPreview(app, message));

    app.get(`/documents/${message.path}/confirm/:locCode/:jurorNumber`,
      `${message.routeName}.confirm.get`,
      auth.verify,
      isBureauUser,
      controller.getConfirm(app, message));
    app.post(`/documents/${message.path}/confirm/:locCode/:jurorNumber`,
      `${message.routeName}.confirm.post`,
      auth.verify,
      isBureauUser,
      controller.postConfirm(app, message));
  }

})();
