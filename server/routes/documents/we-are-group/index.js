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
      code: 'CONTACT_INFORMATION',
      messageContent: 'Thank you for contacting HM Courts & Tribunals Service (HMCTS) Jury Central Summoning Bureau.\n\nAs discussed today, if you would like support to complete your online form, you can contact our partner organisation We Are Group who can help. They do not provide legal advice.\n\nYou can contact them by:\nTelephone: 03300 160051\nOpening Hours: Monday - Friday 09:00 - 17:00\nEmail: support@wearegroup.com\nOr text "FORM" to 60777\nWebsite: https://www.wearegroup.com/digital_support\n\nPlease do not reply to this message as this number is not monitored.',
    },
    {
      key: 'referralConfirmed',
      path: 'we-are-group-referral-confirmed',
      routeName: 'documents.we-are-group-referral-confirmed',
      title: 'We Are Group Referral Confirmed',
      code: 'REFERRAL_CONFIRMED',
      messageContent: 'Thank you for contacting HM Courts and Tribunals Service (HMCTS) Jury Central Summoning Bureau.\n\nAs discussed today, we can confirm that we’ve made a referral to our partner organisation, We Are Group, to provide you with support for the online appeal form. They do not provide legal advice.\n\nYou will receive a call back from We Are Group within the next 2 working days. If you wish to contact them yourself, this can be done by:\n\nTelephone: 03300 160051\nWe Are Group’s opening hours. Monday – Friday 09.00 – 17.00\nEmail: support@wearegroup.com\nOr text “FORM” to 60777\nWebsite: https://www.wearegroup.com/digital_support\n\nPlease do not reply to this message as this number is not monitored.'
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
