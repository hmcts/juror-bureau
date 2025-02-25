/* eslint-disable strict */

const _ = require('lodash');
const { dateFilter, convert12to24 } = require('../../../components/filters');
const { jurorsOnTrialDAO, confirmAttendanceDAO } = require('../../../objects');
const { panelListDAO } = require('../../../objects/panel');
const { Logger } = require('../../../components/logger');
const { setPreviousWorkingDay, makeManualError } = require('../../../lib/mod-utils');
const validate = require('validate.js');
const { jurorsOnTrial: jurorsOnTrialValidator } = require('../../../config/validation/jurors-on-trial');
const { changeAttendanceTimes } = require('../../../config/validation/change-attendance-times');

module.exports.getJurorsOnTrial = function() {
  return async function(req, res) {
    let { attendance_date: attendanceDate } = req.query;
    const locCode = req.session.authentication.locCode;

    attendanceDate = attendanceDate ? new Date(attendanceDate) : new Date();

    let trialsList;

    try {
      ({ trials_list: trialsList } = await jurorsOnTrialDAO
        .get(req, locCode, dateFilter(attendanceDate, null, 'YYYY-MM-DD')));

      Logger.instance.info('Fetched trials list', {
        auth: req.session.authentication,
        data: { locCode, attendanceDate, trialsList },
      });
    } catch (err) {
      Logger.instance.crit('Failed to fetch trials list', {
        auth: req.session.authentication,
        data: { locCode, attendanceDate },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }

    const currentDay = dateFilter(attendanceDate, null, 'dddd D MMMM YYYY');
    const _previousDay = setPreviousWorkingDay(attendanceDate);

    req.session.jurorsOnTrial = {
      today: dateFilter(currentDay, 'dddd D MMMM YYYY', 'YYYY-MM-DD'),
      yesterday: new Date(_previousDay).toISOString().split('T')[0],
    };

    return res.render('juror-management/jurors-on-trial/list-of-trials', {
      nav: 'attendance',
      locCode,
      attendanceDate: dateFilter(currentDay, 'dddd D MMMM YYYY', 'YYYY-MM-DD'),
      currentDay,
      previousDayISO: dateFilter(_previousDay, null, 'YYYY-MM-DD'),
      previousDay: dateFilter(_previousDay, null, 'dddd D MMMM YYYY'),
      trialsList,
      attendanceDatePickerMax: dateFilter(new Date(), null, 'DD/MM/YYYY'),
      attendanceDatePickerValue: dateFilter(currentDay, 'dddd D MMMM YYYY', 'DD/MM/YYYY'),
    });
  };
};

module.exports.getConfirmAttendance = function(app) {
  return async function(req, res) {
    const { trialNumber } = req.params;
    const { attendance_date: attendanceDate } = req.query;
    const locCode = req.session.authentication.locCode;
    const { today, yesterday } = req.session.jurorsOnTrial;

    let jurorsList;

    try {
      jurorsList = await panelListDAO.get(req, trialNumber, locCode, attendanceDate);

      Logger.instance.info('Fetched the jurors on this trial', {
        auth: req.session.authentication,
        data: { locCode, trialNumber, jurorsList },
      });
    } catch (err) {
      Logger.instance.crit('Failed to fetch the jurors on this trial', {
        auth: req.session.authentication,
        data: { locCode, trialNumber },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }

    const tmpErrors = _.clone(req.session.errors);
    const tmpBody = _.clone(req.session.tmpBody);
    const selectedJurors = [];

    if (tmpBody && tmpBody.selectedJurors) {
      if (Array.isArray(tmpBody.selectedJurors)) {
        selectedJurors.push(...tmpBody.selectedJurors);
      } else {
        selectedJurors.push(tmpBody.selectedJurors);
      }
    }

    delete req.session.errors;
    delete req.session.tmpBody;

    return res.render('juror-management/jurors-on-trial/confirm-attendance', {
      trialNumber,
      jurorsList,
      attendanceDate,
      today,
      yesterday,
      tmpBody,
      selectedJurors,
      errors: {
        message: '',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};

module.exports.postConfirmAttendance = function(app) {
  return async function(req, res) {
    const { trialNumber } = req.params;
    const { attendance_date: attendanceDate } = req.query;

    const validatorResult = validatePostConfirm(req);

    if (Object.keys(validatorResult).length > 0) {
      req.session.errors = validatorResult;
      req.session.tmpBody = req.body;

      return res.redirect(app.namedRoutes.build('juror-management.jurors-on-trial.confirm-attendance.get', {
        trialNumber,
      }) + '?attendance_date=' + attendanceDate);
    };

    const payload = buildConfirmAttendancePayload(req);

    try {
      await confirmAttendanceDAO.patch(req, payload);

      Logger.instance.info('Successfully confirmed attendance', {
        auth: req.session.authentication,
        data: { trialNumber, payload },
      });
    } catch (err) {
      Logger.instance.crit('Failed to confirm the jurors in a trial', {
        auth: req.session.authentication,
        data: { trialNumber, payload },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      if (err.error?.code === 'DAY_ALREADY_CONFIRMED') {
        req.session.errors = makeManualError('dayAlreadyConfirmedForJuror', err.error.message);

        return res.redirect(app.namedRoutes.build('juror-management.jurors-on-trial.confirm-attendance.get', {
          trialNumber,
        }) + '?attendance_date=' + attendanceDate);
      }

      return res.render('_errors/generic', { err });
    }

    return res.redirect(app.namedRoutes.build('juror-management.jurors-on-trial.get'));
  };
};

function buildConfirmAttendancePayload(req) {
  const { body } = req;
  const payload = {};
  const commonData = {
    status: 'CONFIRM_ATTENDANCE',
    singleJuror: body.selectedJurors.length === 1,
  };

  if (body.attendanceDate === 'differentDate') {
    commonData.attendanceDate = dateFilter(body.differentDate, null, 'YYYY-MM-DD');
  }
  if (body.attendanceDate === 'previousWorkingDay') {
    commonData.attendanceDate = req.session.jurorsOnTrial.yesterday;
  }
  if (body.attendanceDate === 'today') {
    commonData.attendanceDate = req.session.jurorsOnTrial.today;
  }

  const checkInTime = `${body.checkInTimeHour}:${body.checkInTimeMinute} ${body.checkInTimePeriod}`;
  const checkOutTime = `${body.checkOutTimeHour}:${body.checkOutTimeMinute} ${body.checkOutTimePeriod}`;

  commonData.checkInTime = convert12to24(checkInTime);
  commonData.checkOutTime = convert12to24(checkOutTime);
  commonData.locationCode = req.session.authentication.locCode;

  payload.juror = Array.isArray(body.selectedJurors) ? body.selectedJurors : [body.selectedJurors];
  payload.commonData = commonData;
  payload['trial_number'] = body.trialNumber;

  return payload;
}

function validatePostConfirm(req) {
  const checkInTimeHour = req.body.checkInTimeHour;
  const checkInTimeMinute = req.body.checkInTimeMinute;
  const checkInTimePeriod = req.body.checkInTimePeriod;
  const checkOutTimeHour = req.body.checkOutTimeHour;
  const checkOutTimeMinute = req.body.checkOutTimeMinute;
  const checkOutTimePeriod = req.body.checkOutTimePeriod;

  const validatorResult = validate(req.body, jurorsOnTrialValidator(req.body));
  const timeValidatorResult = validate({
    checkInTime: {
      hour: checkInTimeHour,
      minute: checkInTimeMinute,
      period: checkInTimePeriod,
    },
    checkOutTime: {
      hour: checkOutTimeHour,
      minute: checkOutTimeMinute,
      period: checkOutTimePeriod,
      isMandatory: true,
    },
  }, changeAttendanceTimes());

  let validationErrors = {};

  if (validatorResult || timeValidatorResult) {
    if (validatorResult) {
      validationErrors = Object.assign(validationErrors, validatorResult);
    }

    if (timeValidatorResult && timeValidatorResult.checkInTime) {
      validationErrors = Object.assign(validationErrors, timeValidatorResult.checkInTime[0]);
    }

    if (timeValidatorResult && timeValidatorResult.checkOutTime) {
      validationErrors = Object.assign(validationErrors, timeValidatorResult.checkOutTime[0]);
    }
  }

  return validationErrors;
}
