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

  // Maybe could be replaced with dedicated notifcations api endpoint - to discuss with BE
  async function getNotificationsHTML(app, req, res) {
    let notifications = [];

    if (isSJOUser(req)) {
      try {
        const approvals = await jurorsForApproval.get(
          req,
          req.session.authentication.locCode,
          'QUEUED'
        );

        const noApprovals = approvals.pending_jurors_response_data.length;

        if (noApprovals !== 0) {
          req.session.jurorApprovalCount = noApprovals;
          notifications.push(
            '<p class="govuk-body">You have ' +
            noApprovals +
            ' <a href="/juror-management/manage-jurors/approve">' +
            ` juror${noApprovals > 1 ? 's' : ''}` +
            ' to approve</a></p>');
        }
      } catch (err) {
        app.logger.crit('Unable to fetch pending juror list', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: {
            locationCode: req.session.authentication.owner,
            status: 'QUEUED',
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
      }
    }
    return notifications;
  }

  module.exports.dashboard = function(app) {
    return async function(req, res) {

      let notifcations;
      try {
        notifcations = await dashboardNotifications.get(req, req.session.authentication.locCode);
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

      console.log('notifcations', buildDashboardNotifications(app)(req, res)(notifcations),);
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
      switch (notificationType) {
        case 'urgentReplies':
          notificationHTML = value > 0 ? `You have <b>${value}</b> <a href="#" class="govuk-link">summons replies</a> with less than a week until service start date to process.` : null;
          break;
      }
      if (notificationHTML) notifcationList.push(notificationHTML);
    }

    return notifcationList;
  };

})();
