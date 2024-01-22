(() => {
  'use strict';

  const _ = require('lodash'),
    returnsValidator = require('../../config/validation/return-panel-jury'),
    validate = require('validate.js'),
    returnsObject = require('../../objects/return-jurors').returnsObject,
    { attendanceData } = require('../../objects/attendance-data'),
    { convert12to24, dateFilter, convertAmPmToLong } = require('../../components/filters'),
    { padTimeForApi } = require('../../lib/mod-utils');

  module.exports.postReturnJurors = (app) => (req, res) => {
    delete req.session.checkInTime;
    delete req.session.checkOutTime;
    delete req.session.handleAttendance;
    delete req.session.formFields;
    delete req.session.panel;

    const isJuryEmpanelled = _.clone(req.session.isJuryEmpanelled);
    const panelData  = _.clone(req.session.panelData);
    let validatorResult;

    delete req.session.panelData;
    delete req.session.isJuryEmpanelled;

    validatorResult = isJuryEmpanelled
      ? validate(req.body, returnsValidator.returnJury())
      : validate(req.body, returnsValidator.returnPanel());

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

    // setup the payload to be sent to api - needs names and status
    panelData.forEach(juror => {
      if (juror['juror_status'] === 'Juror') {
        juror['empanel_status'] = 'JUROR';
      }
      delete juror['juror_status'];
    });
    req.session.selectedJurors = panelData.filter(juror => req.body.selectedJurors.includes(juror['juror_number']));

    if (!isJuryEmpanelled) {
      // Panel route
      req.session.panel = true;
      return res.redirect(app.namedRoutes.build('trial-management.trials.return.confirm.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      }));
    }

    // Jury route
    return res.redirect(app.namedRoutes.build('trial-management.trials.return.attendance.get', {
      trialNumber: req.params.trialNumber,
      locationCode: req.params.locationCode,
    }));
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

    attendanceData.get(
      require('request-promise'),
      app,
      req.session.authToken,
      'JUROR_NUMBER',
      dateFilter(new Date(), null, 'YYYY-MM-DD'),
      req.params.locationCode,
      req.session.selectedJurors.map(juror => juror['juror_number'])
    )
      .then((attendanceRecords) => {
        let earliestCheckInTime;

        attendanceRecords.details.forEach((juror) => {
          const checkInTime = juror['check_in_time'][0].toString()
          + juror['check_in_time'][1].toString().padStart(2, '0');

          earliestCheckInTime = checkInTime < earliestCheckInTime
            || !earliestCheckInTime ? checkInTime : earliestCheckInTime;
        });

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
          earliestCheckIn: earliestCheckInTime,
          backLinkUrl: {
            built: true,
            url: app.namedRoutes.build('trial-management.trials.return.attendance.get', {
              trialNumber: req.params.trialNumber,
              locationCode: req.params.locationCode,
            }),
          },
        });
      })
      .catch((err) => {
        app.logger.crit('Failed to fetch attendance records for given day and juror numbers', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      });
  };

  module.exports.postReturnCheckOut = function(app) {
    return function(req, res) {
      const checkInTimeHour = req.body.checkInTimeHour
        , checkInTimeMinute = req.body.checkInTimeMinute
        , checkInTimePeriod = req.body.checkInTimePeriod
        , checkOutTimeHour = req.body.checkOutTimeHour
        , checkOutTimeMinute = req.body.checkOutTimeMinute
        , checkOutTimePeriod = req.body.checkOutTimePeriod
        , earliestCheckIn = req.body.earliestCheckIn;

      let validatorResult = validate({
        checkInTime: {
          hour: checkInTimeHour,
          minute: checkInTimeMinute,
          period: checkInTimePeriod,
        },
        checkOutTime: {
          hour: checkOutTimeHour,
          minute: checkOutTimeMinute,
          period: checkOutTimePeriod,
        },
      }, returnsValidator.returnAttendanceTimes());

      let completeValidatorResult = {};

      if (typeof validatorResult !== 'undefined') {
        // Validator returns nested result therefore is resturctured
        if (typeof validatorResult.checkInTime !== 'undefined') {
          completeValidatorResult = validatorResult.checkInTime[0];
        }

        if (typeof validatorResult.checkOutTime !== 'undefined') {
          completeValidatorResult = Object.assign(completeValidatorResult, validatorResult.checkOutTime[0]);
        }
      }

      if (!_.isEmpty(completeValidatorResult)) {
        req.session.errors = completeValidatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('trial-management.trials.return.check-out.get', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }));
      }

      // Ensure that check out time entered is later than all jurors check in times
      const inMinutes = `${req.body.checkInTimeMinute}`.padStart(2, '0'),
        checkInTime = `${req.body.checkInTimeHour}:${inMinutes}${req.body.checkInTimePeriod}`;

      const outMinutes = `${req.body.checkOutTimeMinute}`.padStart(2, '0')
        , checkOutTime = `${req.body.checkOutTimeHour}:${outMinutes}${req.body.checkOutTimePeriod}`;

      if (convertAmPmToLong(checkOutTime) <= earliestCheckIn){
        req.session.errors = {
          checkOutTime: [{
            summary: 'Check out time must be after checked in time for all jurors',
            details: 'Check out time must be after checked in time for all jurors',
          }],
        };
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('trial-management.trials.return.check-out.get', {
          trialNumber: req.params.trialNumber,
          locationCode: req.params.locationCode,
        }));
      }

      req.session.checkInTime = checkInTime;
      req.session.checkOutTime = checkOutTime;

      return res.redirect(app.namedRoutes.build('trial-management.trials.return.confirm.get', {
        trialNumber: req.params.trialNumber,
        locationCode: req.params.locationCode,
      }));

    };
  };

  module.exports.getReturnConfirm = (app) => (req, res) => {
    const isPanel = req.session.panel;
    const handleAttendance = req.session.handleAttendance;
    const checkInTime = req.session.checkInTime;
    const checkOutTime = req.session.checkOutTime;

    let backUrl;

    if (isPanel) {
      backUrl = app.namedRoutes.build('trial-management.trials.detail.get', {
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
    const checkInTime = req.session.checkInTime ? padTimeForApi(convert12to24(req.session.checkInTime)) : '';
    const checkOutTime = req.session.checkOutTime ? padTimeForApi(convert12to24(req.session.checkOutTime)) : '';
    const selectedJurors = req.session.selectedJurors;
    const trialNumber = req.params.trialNumber;
    const locCode = req.params.locationCode;
    const panelType = req.session.panel ? 'panel' : 'jury';
    const completeService = req.session.handleAttendance === 'complete' ? 'true' : 'false';

    delete req.session.panel;
    delete req.session.checkInTime;
    delete req.session.checkOutTime;
    delete req.session.selectedJurors;

    let payload;

    if (panelType === 'panel') {
      payload = selectedJurors;
    } else {
      payload = {
        'check_in': checkInTime,
        'check_out': checkOutTime,
        completed: completeService,
        jurors: selectedJurors,
      };
    }

    returnsObject.post(
      require('request-promise'),
      app,
      req.session.authToken,
      panelType,
      trialNumber,
      locCode,
      payload
    )
      .then(() => {
        req.session.bannerMessage =
        `${selectedJurors.length} juror${selectedJurors.length > 1 ? 's' : ''} returned`;

        return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber: trialNumber,
          locationCode: locCode,
        }));
      })
      .catch((err) => {
        app.logger.crit('Failed to return the ' + panelType, {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      });
  };
})();
