(function () {
  'use strict';

  const auth = require('../../../components/auth');
  const { isBureauUser } = require('../../../components/auth/user-type');
  const controller = require('./we-are-group.controller');

  const messages = [
    {
      key: 'contactInformation',
      path: 'we-are-group-contact-information',
      routeName: 'documents.we-are-group-contact',
      title: 'We are Group Contact Information',
      code: 'WE_ARE_GROUP_CONTACT_INFORMATION',
      contentTemplate: 'documents/we-are-group/_partials/message-content.njk',
      logName: 'We Are Group contact information',
    },
    {
      key: 'referralConfirmed',
      path: 'we-are-group-referral-confirmed',
      routeName: 'documents.we-are-group-referral-confirmed',
      title: 'We Are Group Referral Confirmed',
      code: 'WE_ARE_GROUP_REFERRAL_CONFIRMED',
      contentTemplate: 'documents/we-are-group/_partials/referral-confirmed.njk',
      logName: 'We Are Group referral confirmed',
    },
  ];

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

    app.get(`/documents/${message.path}/preview`,
      `${message.routeName}.preview.get`,
      auth.verify,
      isBureauUser,
      controller.getPreview(app, message));

    app.post(`/documents/${message.path}/preview`,
      `${message.routeName}.preview.post`,
      auth.verify,
      isBureauUser,
      controller.postPreview(app, message));
  }

})();
