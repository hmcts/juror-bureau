const { toSentenceCase } = require('../../components/filters');

(function(){
  'use strict';

  const jurorsForApproval = require('../../objects/approve-jurors').jurorList;
  const { isSJOUser, isCourtUser } = require('../../components/auth/user-type');
  const { widgetDefinitions } = require('./dashboard/definitions');
  const courtDashboardDAOs = require('../../objects/court-dashboard');


  module.exports.homepage = function(app) {
    return async function(req, res) {

      if (isCourtUser(req)) {
        return res.redirect(app.namedRoutes.build('homepage.dashboard.get'));
      }

      res.render('homepage/index.njk', {
        notifications: await getNotificationsHTML(app, req, res),
      });
    };
  };

  module.exports.dashboard = function(app) {
    return async function(req, res) {

      let notifcations;
      try {
        notifcations = await courtDashboardDAOs.dashboardNotifications.get(req, req.session.authentication.locCode);
      } catch (err) {
        app.logger.crit('Unable to fetch notifications', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
      }

      // In future can be supplied from the API
      let requiredSections = ['admin', 'attendance'];

      let stats = {}
      for (const section of requiredSections) {
        try {
          stats[section] = await courtDashboardDAOs[`dashboard${toSentenceCase(section)}Stats`].get(req, req.session.authentication.locCode);
        } catch (err) {
          app.logger.crit(`Unable to fetch ${section} dashboard stats`, {
            auth: req.session.authentication,
            token: req.session.authToken,
            error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          });
        }
      }

      console.log('\n\nstats\n', JSON.stringify(stats, null, 2), '\n\n');

      let widgets = [];
      try {
        widgets = await widgetDefinitions(app)(req, res)([], stats);
      } catch (err) {
        app.logger.crit('Unable to fetch widget keys', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        console.log('\n\n', err, '\n\n');
        return res.render('_errors/generic', { err });
      }
      // console.log('\n\widgets\n', JSON.stringify(widgets, null, 2), '\n\n');

      res.render('homepage/court-dashboard/dashboard.njk', {
        notifications: buildDashboardNotifications(app)(req, res)(notifcations),
        widgets,
        courtName: 'Chester Crown Court',
      });
    };
  };

  const buildDashboardNotifications = (app) => (req, res) => (notifcations) => {
    const notifcationList = [];
    for (const [notificationType, value] of Object.entries(notifcations)) {
      let notificationHTML;
      if (value > 0) {
        switch (notificationType) {
          case 'openSummonsReplies':
            notificationHTML = `You have <b>${value}</b> <a href="#" class="govuk-link">summons replies</a> with less than a week until service start date to process.`;
            break;
          case 'pendingJurors':
            notificationHTML = `You have <b>${value}</b> <a href="/juror-management/manage-jurors/approve"> juror${value > 1 ? 's' : ''} to approve</a>`
            break;
        }
        notifcationList.push(notificationHTML);
      }
    }

    return notifcationList;
  };

})();
