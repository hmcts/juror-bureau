const { dashboardNotifications } = require('../../objects/court-dashboard');
const { notifications } = require('../../stores/court-dashboard');

(function(){
  'use strict';

  const jurorsForApproval = require('../../objects/approve-jurors').jurorList;
  const { isSJOUser, isCourtUser } = require('../../components/auth/user-type');
  const { widgetDefinitions } = require('./dashboard/definitions');


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
        notifcations = await dashboardNotifications.get(req, req.session.authentication.locCode);
        console.log('\n\nnotifications', JSON.stringify(notifcations, null, 2), '\n\n');
      } catch (err) {
        app.logger.crit('Unable to fetch notifications', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
      }

      let widgets = [];
      try {
        widgets = await widgetDefinitions(app)(req, res)([]);
      } catch (err) {
        app.logger.crit('Unable to fetch widget keys', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
      }
      console.log('\n\widgets\n', JSON.stringify(widgets, null, 2), '\n\n');

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
