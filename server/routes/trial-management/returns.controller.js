(() => {
  'use strict';

  const _ = require('lodash')
  const returnsValidator = require('../../config/validation/return-panel-jury');
  const validate = require('validate.js');
  const returnsObject = require('../../objects/return-jurors').returnsObject;
  const { jurorAttendanceDao } = require('../../objects/juror-attendance');
  const { convert12to24, dateFilter, convertAmPmToLong } = require('../../components/filters');
  const { padTimeForApi } = require('../../lib/mod-utils');
  const { panelListDAO, trialDetailsObject } = require('../../objects');
  const isAttendanceConfirmed = require('../juror-management/juror-management.controller').isAttendanceConfirmed;


  module.exports.postReturnJurors = (app) => async (req, res) => {
    const { trialNumber, locationCode } = req.params;
    delete req.session[`${trialNumber}-${locationCode}-checkInTime`];
    delete req.session[`${trialNumber}-${locationCode}-checkOutTime`];
    delete req.session[`${trialNumber}-${locationCode}-handleAttendance`];
    delete req.session.formFields;

    let panelData;
    try {
      panelData = await panelListDAO.get(
        app, req, trialNumber, locationCode
      )
    } catch (err) {
      app.logger.crit('Failed to fetch panel data: ', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
      return res.render('_errors/generic');
    }

    const isJuryEmpanelled = (await fetchTrialDetails(app)(req, res))['is_jury_empanelled'];

    let validatorResult;

    validatorResult = isJuryEmpanelled
      ? validate(req.body, returnsValidator.returnJury())
      : validate(req.body, returnsValidator.returnPanel());

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = req.body;

      return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
        trialNumber,
        locationCode,
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
    req.session[`${trialNumber}-${locationCode}-returnJurors`] = panelData.filter(juror => req.body.selectedJurors.includes(juror['juror_number']));

    if (!isJuryEmpanelled) {
      // Panel route
      return res.redirect(app.namedRoutes.build('trial-management.trials.return.confirm.get', {
        trialNumber,
        locationCode,
      }));
    }

    // Jury route
    return res.redirect(app.namedRoutes.build('trial-management.trials.return.attendance.get', {
      trialNumber,
      locationCode,
    }));
  };

  module.exports.getReturnAttendance = (app) => async (req, res) => {
  try{
      const { trialNumber, locationCode } = req.params;
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;
      delete req.session[`${trialNumber}-${locationCode}-checkInTime`];
      delete req.session[`${trialNumber}-${locationCode}-checkOutTime`];
      const dayIsConfirmed = await isAttendanceConfirmed(app, req, req.params.locationCode, dateFilter(new Date(), null, 'YYYY-MM-DD'));

      return res.render('trial-management/returns/return-attendance.njk', {
        formActions: {
          returnUrl: app.namedRoutes.build('trial-management.trials.return.check-out.get', {
            trialNumber,
            locationCode,
          }),
        },
        selectedJurors: req.session[`${trialNumber}-${locationCode}-returnJurors`],
        cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber,
          locationCode,
        }),
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
        prevAnswer: req.session[`${trialNumber}-${locationCode}-handleAttendance`],
        dayIsConfirmed: dayIsConfirmed
      });
    } catch(err) {
        app.logger.crit('Failed to get return attendances: ', {
          auth: req.session.authentication,
          data: {
            locCode: locCode
            attendanceDate: attendanceDate,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
      return res.render('_errors/generic.njk');
    }
  };

  module.exports.postReturnAttendance = (app) => (req, res) => {
    const { trialNumber, locationCode } = req.params;
    if (!req.body.handleAttendance) {
      req.session.errors = {handleAttendance: [{details: 'Select how you want to return the jurors'}]};

      return res.redirect(app.namedRoutes.build('trial-management.trials.return.attendance.get', {
        trialNumber,
        locationCode,
      }));
    }

    req.session[`${trialNumber}-${locationCode}-handleAttendance`] = req.body.handleAttendance;

    if (req.body.handleAttendance === 'return') {
      return res.redirect(app.namedRoutes.build('trial-management.trials.return.confirm.get', {
        trialNumber,
        locationCode,
      }));
    }

    return res.redirect(app.namedRoutes.build('trial-management.trials.return.check-out.get', {
      trialNumber,
      locationCode,
    }));
  };

  module.exports.getReturnCheckOut = (app) => (req, res) => {
    const { trialNumber, locationCode } = req.params;
    const tmpErrors = _.clone(req.session.errors);
    const tmpFields = _.clone(req.session.formFields);

    delete req.session.errors;

    const body = {
      commonData: {
        tag: 'JUROR_NUMBER',
        attendanceDate: dateFilter(new Date(), null, 'YYYY-MM-DD'),
        locationCode,
      },
      juror: req.session[`${trialNumber}-${locationCode}-returnJurors`].map(juror => juror['juror_number']),
    };

    jurorAttendanceDao.get(
      app,
      req,
      body
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
              trialNumber,
              locationCode,
            }),
          },
          selectedJurors: req.session[`${trialNumber}-${locationCode}-returnJurors`],
          trialNumber,
          cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
            trialNumber,
            locationCode,
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
              trialNumber,
              locationCode,
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
      const { trialNumber, locationCode } = req.params;
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
          trialNumber,
          locationCode,
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
          trialNumber,
          locationCode,
        }));
      }

      req.session[`${trialNumber}-${locationCode}-checkInTime`] = checkInTime;
      req.session[`${trialNumber}-${locationCode}-checkOutTime`] = checkOutTime;

      return res.redirect(app.namedRoutes.build('trial-management.trials.return.confirm.get', {
        trialNumber,
        locationCode,
      }));

    };
  };

  module.exports.getReturnConfirm = (app) => async (req, res) => {
    const { trialNumber, locationCode } = req.params;
    const handleAttendance = req.session[`${trialNumber}-${locationCode}-handleAttendance`];
    const checkInTime = req.session[`${trialNumber}-${locationCode}-checkInTime`];
    const checkOutTime = req.session[`${trialNumber}-${locationCode}-checkOutTime`];
    const tmpErrors = _.clone(req.session.errors);
    const tmpBody = _.clone(req.session.formFields);

    delete req.session.errors;
    delete req.session.formFields;

    let backUrl;

    const isPanel = !(await fetchTrialDetails(app)(req, res))['is_jury_empanelled']

    if (isPanel) {
      backUrl = app.namedRoutes.build('trial-management.trials.detail.get', {
        trialNumber,
        locationCode,
      });
    } else if (handleAttendance === 'return') {
      backUrl = app.namedRoutes.build('trial-management.trials.return.attendance.get', {
        trialNumber,
        locationCode,
      });
    } else {
      backUrl = app.namedRoutes.build('trial-management.trials.return.check-out.get', {
        trialNumber,
        locationCode,
      });
    }

    return res.render('trial-management/returns/confirm-return.njk', {
      formActions: {
        returnUrl: app.namedRoutes.build('trial-management.trials.return.confirm.post', {
          trialNumber,
          locationCode,
        }),
      },
      selectedJurors: req.session[`${trialNumber}-${locationCode}-returnJurors`],
      cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
        trialNumber,
        locationCode,
      }),
      isPanel,
      handleAttendance,
      checkInTime,
      checkOutTime,
      backLinkUrl: {
        built: true,
        url: backUrl,
      },
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
      tmpBody,
    });
  };

  module.exports.postReturnConfirm = (app) => async (req, res) => {
    const { trialNumber, locationCode } = req.params;
    // TODO: call the backend here
    let checkInTime = req.session[`${trialNumber}-${locationCode}-checkInTime`] ? padTimeForApi(convert12to24(req.session[`${trialNumber}-${locationCode}-checkInTime`])) : '';
    const checkOutTime = req.session[`${trialNumber}-${locationCode}-checkOutTime`] ? padTimeForApi(convert12to24(req.session[`${trialNumber}-${locationCode}-checkOutTime`])) : '';
    const selectedJurors = req.session[`${trialNumber}-${locationCode}-returnJurors`];
    const completeService = req.session[`${trialNumber}-${locationCode}-handleAttendance`] === 'complete' ? 'true' : 'false';

    const panelType = (await fetchTrialDetails(app)(req, res))['is_jury_empanelled'] ? 'jury' : 'panel';

    if (req.session[`${trialNumber}-${locationCode}-handleAttendance`] === 'return') {
      let validatorResult = validate({
        checkInTime: {
          hour: req.body.checkInTimeHour,
          minute: req.body.checkInTimeMinute,
          period: req.body.checkInTimePeriod,
        },
      }, returnsValidator.returnCheckInTime());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult.checkInTime[0];
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('trial-management.trials.return.confirm.get', {
          trialNumber,
          locationCode,
        }));
      }

      checkInTime = padTimeForApi(
        convert12to24(`${req.body.checkInTimeHour}:${req.body.checkInTimeMinute}${req.body.checkInTimePeriod}`)
      );
    }

    delete req.session[`${trialNumber}-${locationCode}-checkInTime`];
    delete req.session[`${trialNumber}-${locationCode}-checkOutTime`];
    delete req.session[`${trialNumber}-${locationCode}-returnJurors`];

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
      locationCode,
      payload
    )
      .then(() => {
        req.session.bannerMessage =
        `${selectedJurors.length} juror${selectedJurors.length > 1 ? 's' : ''} returned`;

        req.session[`${trialNumber}-${locationCode}-continueToEndTrial`] = true;

        return res.redirect(app.namedRoutes.build('trial-management.trials.end-trial.get', {
          trialNumber,
          locationCode,
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

  const fetchTrialDetails = (app) => async (req, res) => {
    const { trialNumber, locationCode } = req.params;
    try {
      return await trialDetailsObject.get(
        require('request-promise'),
        app,
        req.session.authToken,
        trialNumber,
        locationCode
      );
    } catch (err) {
      app.logger.crit('Failed to fetch trial details: ', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        body: {
          trialNumber,
          locationCode
        }
      });
      return res.render('_errors/generic');
    }
  };

})();
