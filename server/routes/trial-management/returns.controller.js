(() => {
  'use strict';

  const _ = require('lodash'),
    selectJurorValidator = require('../../config/validation/pool-reassign'),
    {
      checkInTime: checkInTimeValidator,
      checkOutTime: checkOutTimeValidator,
      timeMessageMapping,
    } = require('../../config/validation/check-in-out-time'),
    validate = require('validate.js');

  const timeIsEmpty = function(body, direction) {
    return !(body[`check${direction}TimeHour`] !== ''
      || body[`check${direction}TimeMinute`] !== ''
      || body[`check${direction}TimePeriod`]);
  };

  module.exports.postReturnJurors = (app) => (req, res) => {
    delete req.session.checkInTime;
    delete req.session.checkOutTime;
    delete req.session.handleAttendance;
    delete req.session.formFields;

    let validatorResult;

    validatorResult = validate(req.body, selectJurorValidator());

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;

      return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      }));
    }

    if (!Array.isArray(req.body.selectedJurors)) {
      req.body.selectedJurors = [req.body.selectedJurors];
    }

    req.session.selectedJurors = req.body.selectedJurors;

    // TODO update route depending on if we're a panel or a full jury
    // Jury route
    return res.redirect(app.namedRoutes.build('trial-management.trials.return.attendance.get', {
      trialNumber: req.params.trialNumber,
      locationCode: req.params.locationCode,
    }));

    // Panel route
    // req.session.panel = true;
    // return res.redirect(app.namedRoutes.build('trial-management.trials.return.confirm.get', {
    //   trialNumber: req.params.trialNumber,
    //   locationCode: req.params.locationCode,
    // }));
  };

  module.exports.getReturnAttendance = (app) => (req, res) => {
    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;
    delete req.session.checkInTime;
    delete req.session.checkOutTime;

    return res.render('trial-management/returns/return-attendance.njk', {
      formActions: {
        returnUrl: app.namedRoutes.build('trial-management.trials.return.check-out.get', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }),
      },
      selectedJurors: req.session.selectedJurors,
      cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      }),
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
      prevAnswer: req.session.handleAttendance,
    });
  };

  module.exports.postReturnAttendance = (app) => (req, res) => {
    if (!req.body.handleAttendance) {
      req.session.errors = {handleAttendance: [{details: 'Select how you want to return the jurors'}]};

      return res.redirect(app.namedRoutes.build('trial-management.trials.return.attendance.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      }));
    }

    req.session.handleAttendance = req.body.handleAttendance;
    if (req.body.handleAttendance === 'return') {
      return res.redirect(app.namedRoutes.build('trial-management.trials.return.confirm.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      }));
    }

    return res.redirect(app.namedRoutes.build('trial-management.trials.return.check-out.get', {
      trialNumber: req.params.trialNumber,
      locationCode: req.params.locationCode,
    }));
  };

  module.exports.getReturnCheckOut = (app) => (req, res) => {
    const tmpErrors = _.clone(req.session.errors);
    const tmpFields = _.clone(req.session.formFields);

    delete req.session.errors;

    return res.render('trial-management/returns/return-check-out.njk', {
      formActions: {
        returnUrl: app.namedRoutes.build('trial-management.trials.return.confirm.post', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }),
      },
      selectedJurors: req.session.selectedJurors,
      trialNumber: req.params.trialNumber,
      cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      }),
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
      formFields: tmpFields,
      backLinkUrl: {
        built: true,
        url: app.namedRoutes.build('trial-management.trials.return.attendance.get', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }),
      },
    });
  };

  module.exports.postReturnCheckOut = (app) => (req, res) => {
    const checkInValidate = validate(req.body, checkInTimeValidator());
    const checkOutValidate = validate(req.body, checkOutTimeValidator());
    let totalErrors = {};

    // TODO We need to check the server to see what the juror's check-in
    // times are: If they have one, we can skip check-in validation, and
    // we need to validate that the check-out time selected is after
    // all of the juror's check-in times.

    if (timeIsEmpty(req.body, 'Out')) {
      totalErrors = {
        checkOutTime: [timeMessageMapping.checkOut.missingWholeTime],
      };
    } else if (typeof checkOutValidate !== 'undefined') {
      // TODO Validate if this isn't before the Jurors' check-in times
      totalErrors = checkOutValidate;
    }

    if (req.session.selectedJurors.reduce((needed, juror) => {
      if (juror === '123456789') { // Assume this juror isn't checked in
        return true;
      }

      return needed;
    }, false)) {
      const formattedCheckIn = {};

      if (timeIsEmpty(req.body, 'In')) {
        totalErrors = {
          checkInTime: [timeMessageMapping.checkIn.missingWholeTime],
          ...totalErrors,
        };
      } else if (typeof checkInValidate !== 'undefined') {

        Object.keys(checkInValidate).forEach(key => {
          const oldMessage = checkInValidate[key][0].summary;
          const message = oldMessage.slice(0,
            oldMessage.indexOf(' or delete this juror\'s attendance'));

          formattedCheckIn[key] = [{ summary: message, details: message }];
        });
      }

      totalErrors = {...formattedCheckIn, ...totalErrors};
    }

    req.session.formFields = req.body;

    if (Object.keys(totalErrors).length > 0) {
      req.session.errors = totalErrors;

      return res.redirect(app.namedRoutes.build('trial-management.trials.return.check-out.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      }));
    }

    if (!timeIsEmpty(req.body, 'In')) {
      const inMinutes = `${req.body.checkInTimeMinute}`.padStart(2, '0');

      req.session.checkInTime = `${req.body.checkInTimeHour}:${inMinutes}${req.body.checkInTimePeriod}`;
    }

    const outMinutes = `${req.body.checkInTimeMinute}`.padStart(2, '0');

    req.session.checkOutTime = `${req.body.checkOutTimeHour}:${outMinutes}${req.body.checkOutTimePeriod}`;

    return res.redirect(app.namedRoutes.build('trial-management.trials.return.confirm.get', {
      trialNumber: req.params.trialNumber,
      locationCode: req.params.locationCode,
    }));
  };

  module.exports.getReturnConfirm = (app) => (req, res) => {
    const isPanel = req.session.panel;
    const handleAttendance = req.session.handleAttendance;
    const checkInTime = req.session.checkInTime;
    const checkOutTime = req.session.checkOutTime;
    let backUrl;

    if (isPanel) {
      backUrl = app.namedRoutes.build('trial-management.trials.return.detail.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      });
    } else if (handleAttendance === 'return') {
      backUrl = app.namedRoutes.build('trial-management.trials.return.attendance.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      });
    } else {
      backUrl = app.namedRoutes.build('trial-management.trials.return.check-out.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      });
    }

    return res.render('trial-management/returns/confirm-return.njk', {
      formActions: {
        returnUrl: app.namedRoutes.build('trial-management.trials.return.confirm.post', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }),
      },
      selectedJurors: req.session.selectedJurors,
      cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      }),
      isPanel,
      handleAttendance,
      checkInTime,
      checkOutTime,
      backLinkUrl: {
        built: true,
        url: backUrl,
      },
    });
  };

  module.exports.postReturnConfirm = (app) => (req, res) => {
    // TODO: call the backend here
    // if success:
    req.session.bannerMessage =
      `${req.session.selectedJurors.length} juror${req.session.selectedJurors.length > 1 ? 's' : ''} returned`;

    delete req.session.selectedJurors;

    return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
      trialNumber: req.params.trialNumber,
      locationCode: req.params.locationCode,
    }));

    // else:
    // req.session.errors = 'Unhappy path';

    // return res.redirect(errorUrl);
  };
})();
