(function(){
  'use strict';

  const jurorsForApproval = require('../../objects/approve-jurors').jurorList;
  const { isSJOUser } = require('../../components/auth/user-type');


  module.exports.homepage = function(app) {
    return async function(req, res) {

      // res.render('homepage/index.njk', {
      //   notifications: await getNotificationsHTML(app, req, res),
      // });
      res.render('homepage/court-dashboard/dashboard.njk', {
        courtName: 'Chester Crown Court',
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

})();
