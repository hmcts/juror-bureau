/* eslint-disable strict */

const _ = require('lodash');
const { dateFilter } = require('../../../components/filters');
const { jurorsOnTrialDAO } = require('../../../objects');
const { panelListDAO } = require('../../../objects/panel');
const { Logger } = require('../../../components/logger');
const { setPreviousWorkingDay } = require('../../../lib/mod-utils');
const validate = require('validate.js');
const { jurorsOnTrial: jurorsOnTrialValidator } = require('../../../config/validation/jurors-on-trial');

module.exports.getJurorsOnTrial = function() {
  return async function(req, res) {
    let { attendance_date: attendanceDate } = req.query;
    const locCode = req.session.authentication.locCode;

    attendanceDate = attendanceDate ? new Date(attendanceDate) : new Date();

    let trialsList;

    try {
      ({trials_list: trialsList} = await jurorsOnTrialDAO
        .get(req, locCode, dateFilter(attendanceDate, null, 'YYYY-MM-DD')));

      Logger.instance.info('Fetched trials list', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: { locCode, attendanceDate, trialsList },
      });
    } catch (err) {
      Logger.instance.crit('Failed to fetch trials list', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: { locCode, attendanceDate },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic');
    }

    const currentDay = dateFilter(attendanceDate, null, 'dddd D MMMM YYYY');
    const _previousDay = setPreviousWorkingDay(attendanceDate);

    req.session.jurorsOnTrial = {
      today: new Date(currentDay).toISOString().split('T')[0],
      yesterday: new Date(_previousDay).toISOString().split('T')[0],
    };

    return res.render('juror-management/jurors-on-trial/list-of-trials', {
      nav: 'attendance',
      locCode,
      currentDay,
      previousDayISO: dateFilter(_previousDay, null, 'YYYY-MM-DD'),
      previousDay: dateFilter(_previousDay, null, 'dddd D MMMM YYYY'),
      trialsList,
    });
  };
};

module.exports.getConfirmAttendance = function(app) {
  return async function(req, res) {
    const { trialNumber } = req.params;
    const locCode = req.session.authentication.locCode;
    const { today, yesterday } = req.session.jurorsOnTrial;

    let jurorsList;

    try {
      jurorsList = await panelListDAO.get(app, req, trialNumber, locCode);

      Logger.instance.info('Fetched the jurors on this trial', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: { locCode, trialNumber, jurorsList },
      });
    } catch (err) {
      Logger.instance.crit('Failed to fetch the jurors on this trial', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: { locCode, trialNumber },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic');
    }

    const tmpErrors = _.clone(req.session.errors);
    const tmpBody = _.clone(req.session.tmpBody);

    delete req.session.errors;
    delete req.session.tmpBody;

    return res.render('juror-management/jurors-on-trial/confirm-attendance', {
      trialNumber,
      jurorsList,
      today,
      yesterday,
      tmpBody,
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

    const validatorResult = validate(req.body, jurorsOnTrialValidator(req.body));

    if (validatorResult) {
      req.session.errors = validatorResult;
      req.session.tmpBody = req.body;

      return res.redirect(app.namedRoutes.build('juror-management.jurors-on-trial.confirm-attendance.get', {
        trialNumber,
      }));
    }

    const payload = buildConfirmAttendancePayload(req);

    console.log(payload);

    return res.redirect(app.namedRoutes.build('juror-management.jurors-on-trial.confirm-attendance.get', {
      trialNumber,
    }));
  };
};

function buildConfirmAttendancePayload(req) {
  const { body } = req;
  const payload = {};

  if (body.attendanceDate === 'differentDate') {
    payload.attendanceDate = body.differentDate;
  }
  if (payload.attendanceDate === 'previousWorkingDay') {
    payload.attendanceDate = req.session.jurorsOnTrial.yesterday;
  }
  if (payload.attendanceDate === 'today') {
    payload.attendanceDate = req.session.jurorsOnTrial.today;
  }

  const checkInTime = `${body.checkInTimeHour}:${body.checkInTimeMinute} ${body.checkInTimePeriod}`;
  const checkOutTime = `${body.checkOutTimeHour}:${body.checkOutTimeMinute} ${body.checkOutTimePeriod}`;

  payload.checkInTime = checkInTime;
  payload.checkOutTime = checkOutTime;

  payload.jurors = Array.isArray(body.selectedJurors) ? body.selectedJurors : [body.selectedJurors];

  return payload;
}
