
(function(){
  'use strict';

  var _ = require('lodash')
    , validate = require('validate.js')
    , jurorSelectValidator = require('../../../../config/validation/change-attendance-date').jurorSelect
    , attendanceDateValidator = require('../../../../config/validation/change-attendance-date').bulkAttendanceDate
    , { dateFilter } = require('../../../../components/filters')
    , { changeNextDueAtCourtDAO } = require('../../../../objects/juror-attendance')
    , { poolMemebersObject } = require('../../../../objects/pool-members')
    , rp = require('request-promise');


  module.exports.postChangeNextDueAtCourt = function(app) {
    return async function(req, res) {
      if (req.body['check-all-jurors']) {
        req.body.selectedJurors = await poolMemebersObject.get(rp, app, req.session.authToken, req.params.poolNumber);
      } else {
        let validatorResult;

        validatorResult = validate(req.body, jurorSelectValidator());
        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.noJurorSelect = true;
          return res.redirect(app.namedRoutes.build('pool-overview.get', {
            poolNumber: req.body.poolNumber}));
        }
      }

      delete req.session.membersList;
      delete req.session.filteredMembers;
      delete req.session.filters;

      req.session.selectedJurors = Array.isArray(req.body.selectedJurors)
        ? req.body.selectedJurors
        : [req.body.selectedJurors];

      return res.redirect(app.namedRoutes.build('pool-overview.change-next-due-at-court.continue.get', {
        poolNumber: req.params.poolNumber,
      }));
    };
  };

  module.exports.getChangeNextDueAtCourtContinue = function(app) {
    return function(req, res) {
      const { poolNumber } = req.params;
      const tmpErrors = _.clone(req.session.errors)
        , tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      const today = new Date();
      let tomorrow = new Date();

      tomorrow.setDate(today.getDate() + 1);

      return res.render('pool-management/change-next-due-at-court/change-next-due-at-court', {
        processUrl: app.namedRoutes.build('pool-overview.change-next-due-at-court.continue.post', {
          poolNumber,
        }),
        cancelUrl: app.namedRoutes.build('pool-overview.get', {
          poolNumber,
        }),
        minDate: dateFilter(tomorrow, null, 'DD/MM/YYYY'),
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
        formDetails: typeof tmpBody !== 'undefined'
          ? tmpBody
          : { attendanceDate: dateFilter(tomorrow, null, 'DD/MM/YYYY') },
      });
    };
  };

  module.exports.postChangeNextDueAtCourtContinue = function(app) {
    return function(req, res) {
      const { poolNumber } = req.params;

      const validatorResult = validate({
        ...req.body,
        originalNextDate: dateFilter(new Date(), null, 'YYYY, MM, DD'),
      }, attendanceDateValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(
          app.namedRoutes.build('pool-overview.change-next-due-at-court.continue.get', {
            poolNumber,
          })
        );
      }

      req.session.newAttendanceDate = req.body.attendanceDate;

      return res.redirect(app.namedRoutes.build('pool-overview.change-next-due-at-court.confirm.get', {
        poolNumber,
      }));
    };
  };

  module.exports.getChangeNextDueAtCourtConfirm = function(app) {
    return function(req, res) {
      const { poolNumber } = req.params;
      const tmpErrors = _.clone(req.session.errors);
      const attendanceDate = req.session.newAttendanceDate;
      const jurorNumbers = req.session.selectedJurors;

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('pool-management/change-next-due-at-court/confirm-next-due-at-court', {
        processUrl: app.namedRoutes.build('pool-overview.change-next-due-at-court.confirm.post', {
          poolNumber,
        }),
        cancelUrl: app.namedRoutes.build('pool-overview.get', {
          poolNumber,
        }),
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('pool-overview.change-next-due-at-court.continue.get', {
            poolNumber,
          }),
        },
        attendanceDate: dateFilter(attendanceDate, 'DD/MM/YYYY', 'dddd DD MMMM YYYY'),
        noJurors: jurorNumbers.length,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postChangeNextDueAtCourtConfirm = function(app) {
    return async function(req, res) {
      const jurors = _.clone(req.session.selectedJurors);
      const attendanceDate = _.clone(req.session.newAttendanceDate);
      const { poolNumber } = req.params;

      delete req.session.selectedJurors;
      delete req.session.newAttendanceDate;

      const payload = {
        'juror_numbers': jurors,
        'pool_number': poolNumber,
        'attendance_date': dateFilter(attendanceDate, 'DD/MM/YYYY', 'YYYY-MM-DD'),
      };

      try {
        const response = await changeNextDueAtCourtDAO.patch(app, req, payload);

        // Extract no of jurors updated from response
        const jurorsUpdated = response.split('Attendance date updated for ')[1].split(' ')[0];

        req.session.bannerMessage = `${jurorsUpdated} juror${jurorsUpdated > 1 ? 's' : ''} 
        next due at court on ${dateFilter(attendanceDate, 'DD/MM/YYYY', 'dddd DD MMMM YYYY')}`;

        return res.redirect(app.namedRoutes.build('pool-overview.get', {
          poolNumber,
        }));

      } catch (err) {
        app.logger.crit('Failed to change attendance dates for juror(s)', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          data: payload,
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

})();
