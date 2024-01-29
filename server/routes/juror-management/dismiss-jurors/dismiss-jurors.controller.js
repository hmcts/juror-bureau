/* eslint-disable strict */
'use strict';

const _ = require('lodash');
const moment = require('moment');
const validate = require('validate.js');
const { jurorsToDismiss, completeService } = require('../../../config/validation/dismiss-jurors');
const { checkOutTime } = require('../../../config/validation/check-in-out-time');
const modUtils = require('../../../lib/mod-utils');
const { getJurorsObject, dismissJurorsObject } = require('../../../objects/dismiss-jurors');
const { fetchPoolsAtCourt } = require('../../../objects/request-pool');
const { convertAmPmToLong, dateFilter, timeArrayToString, convert12to24 } = require('../../../components/filters');
const { jurorAttendanceDao } = require('../../../objects/juror-attendance');

module.exports.getDismissJurorsPools = function(app) {
  return async function(req, res) {
    let tmpForm = {};

    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;
    delete req.session.poolsAtCourt;

    if (req.session.dismissJurors && req.session.dismissJurors.jurors) {
      delete req.session.dismissJurors.jurors;
    }

    if (req.session.dismissJurors) {
      tmpForm = req.session.dismissJurors;
    }

    try {
      const pools = await fetchPoolsAtCourt.get(
        require('request-promise'),
        app,
        req.session.authToken,
        req.session.authentication.owner
      );

      req.session.poolsAtCourt = pools.pools_at_court_location.filter(pool => pool.total_jurors !== 0);

      app.logger.info('Fetched the pools to dismiss jurors from: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
      });

      return res.render('juror-management/dismiss-jurors/pools-list.njk', {
        totalCurrentlySelected: totalCurrentlySelected(tmpForm['checked-pools']),
        pools: req.session.poolsAtCourt,
        tmpForm,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    } catch (err) {
      app.logger.crit('Failed to fetch pools to dismiss jurors from: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic.njk');
    }
  };
};

module.exports.postDismissJurorsPools = function(app) {
  return function(req, res) {
    const { action } = req.query;
    const calculateAvailableJurors = 'calculate_available_jurors';
    const availablePools = _.clone(req.session.poolsAtCourt);
    const jurorsAvailable = calculateTotalJurorsAvailable(req.body, availablePools);

    req.session.dismissJurors = req.body;
    delete req.session.dismissJurors._csrf;
    delete req.session.poolsAtCourt;

    if (action === calculateAvailableJurors) {
      req.session.dismissJurors.jurorsAvailableToDismiss = jurorsAvailable;

      return res.redirect(app.namedRoutes.build('juror-management.dismiss-jurors.pools.get'));
    }

    const validatorResult = validate(req.body, jurorsToDismiss(jurorsAvailable));

    if (validatorResult) {
      req.session.errors = validatorResult;

      return res.redirect(app.namedRoutes.build('juror-management.dismiss-jurors.pools.get'));
    }

    return res.redirect(app.namedRoutes.build('juror-management.dismiss-jurors.jurors.get'));
  };
};

module.exports.getJurorsList = function(app) {
  return async function(req, res) {
    const currentPage = req.query.page || 1;
    const tmpErrors = _.clone(req.session.errors);
    let pagination;

    delete req.session.errors;

    try {
      if (req.session.dismissJurors && !req.session.dismissJurors.jurors) {
        const jurorList = await getJurorsObject
          .get(require('request-promise'),
            app,
            req.session.authToken,
            req.session.dismissJurors,
            req.session.authentication.owner
          );

        req.session.dismissJurors.jurors = jurorList.jurors_to_dismiss_request_data;

        app.logger.info('Fetched the the list of jurors to dismiss: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: req.session.dismissJurors.jurors,
        });
      }

      const jurors = await paginateJurorsList(req.session.dismissJurors.jurors, req.session.dismissJurors, currentPage);

      if (req.session.dismissJurors.jurorsToDismiss > modUtils.constants.PAGE_SIZE) {
        pagination = modUtils.paginationBuilder(req.session.dismissJurors.jurorsToDismiss, currentPage, req.url);
      }

      const totalJurors = req.session.dismissJurors.jurors.length;
      const totalCheckedJurors = req.session.dismissJurors.jurors.filter(juror => juror.checked).length;

      return res.render('juror-management/dismiss-jurors/jurors-list.njk', {
        jurors,
        pagination,
        totalJurors,
        totalCheckedJurors,
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('juror-management.dismiss-jurors.pools.get'),
        },
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    } catch (err) {
      app.logger.crit('Failed to fetch jurors to dismiss: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic.njk');
    }
  };
};

module.exports.postJurorsList = function(app) {
  return async function(req, res) {
    const urls = {
      jurors: 'juror-management.dismiss-jurors.jurors.get',
      checkOut: 'juror-management.dismiss-jurors.check-out.get',
      completeService: 'juror-management.dismiss-jurors.complete-service.get',
    };

    const checkedJurors = req.session.dismissJurors.jurors.filter(juror => juror.checked);

    if (!checkedJurors.length) {
      req.session.errors = {
        'checked-jurors': [{
          details: 'Select at least one juror to dismiss',
          summary: 'Select at least one juror to dismiss',
        }],
      };

      return res.redirect(app.namedRoutes.build(urls.jurors));
    }

    const selectedJurorNo = checkedJurors.map((juror) => juror.juror_number);

    const payload = {
      commonData: {
        tag: 'NOT_CHECKED_OUT',
        attendanceDate: dateFilter(new Date(), null, 'YYYY-MM-DD'),
        locationCode: req.session.authentication.owner,
      },
      juror: selectedJurorNo,
    };
    const response = await jurorAttendanceDao.get(app, req, payload);
    const notCheckedOut = response.details.filter((juror) => selectedJurorNo.includes(juror.juror_number));

    if (notCheckedOut.length) {
      req.session.dismissJurors.notCheckedOut = notCheckedOut;

      return res.redirect(app.namedRoutes.build(urls.checkOut));
    }

    return res.redirect(app.namedRoutes.build(urls.completeService));
  };
};

module.exports.getCompleteService = function() {
  return function(req, res) {
    const today = new Date();
    const dateLimit = new Date([today.getFullYear(), today.getMonth() + 1, today.getDate()]);
    const tmpErrors = _.clone(req.session.errors);
    const checkedJurors = req.session.dismissJurors.jurors.filter(juror => juror.checked);

    delete req.session.errors;

    let latestServiceStartDate = checkedJurors[0].service_start_date;

    checkedJurors.forEach((juror) => {
      const ssDate = moment(juror.service_start_date, 'yyyy-MM-DD');

      latestServiceStartDate = ssDate.isBefore(moment(latestServiceStartDate, 'yyyy-MM-DD'))
        ? juror.service_start_date
        : latestServiceStartDate;
    });

    req.session.dismissJurors.latestServiceStartDate = latestServiceStartDate;

    return res.render('juror-management/dismiss-jurors/complete-service.njk', {
      today,
      latestServiceStartDate,
      dateLimit,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};

module.exports.postCompleteService = function(app) {
  return async function(req, res) {

    const validatorResult = validate({ dateToCheck: req.body.completionDate }, completeService());

    if (validatorResult) {
      req.session.errors = {
        completionDate: validatorResult.dateToCheck,
      };

      return res.redirect(app.namedRoutes.build('juror-management.dismiss-jurors.complete-service.get'));
    }

    const latestServiceStartDate = req.session.dismissJurors.latestServiceStartDate;

    delete req.session.dismissJurors.latestServiceStartDate;

    if (moment(req.body.completionDate, 'DD/MM/YYYY').isBefore(moment(latestServiceStartDate, 'yyyy-MM-DD'))) {
      req.session.errors = {
        completionDate: [{
          details: 'Completion date cannot be before service start date  ',
          summary: 'Completion date cannot be before service start date  ',
        }],
      };

      return res.redirect(app.namedRoutes.build('juror-management.dismiss-jurors.complete-service.get'));
    }

    try {

      const checkedJurors = req.session.dismissJurors.jurors.filter(juror => juror.checked);

      const payload = {
        'juror_numbers': checkedJurors.map((juror) => juror.juror_number),
        'completion_date': dateFilter(req.body.completionDate, 'DD/MM/YYYY', 'YYYY-MM-DD'),
      };

      await dismissJurorsObject.patch(require('request-promise'), app, req.session.authToken, payload);

      app.logger.info('Jurors dismissed and service completed: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
      });

      req.session.bannerMessage = `${checkedJurors.length} jurors dismissed and service completed.`;

      delete req.session.dismissJurors;

      return res.redirect(app.namedRoutes.build('juror-management.manage-jurors.in-waiting.get'));
    } catch (err) {
      app.logger.crit('Failed to dismiss the selected jurors: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.redirect(app.namedRoutes.build('juror-management.dismiss-jurors.complete-service.get'));
    }
  };
};

module.exports.getCheckOutJurors = function() {
  return function(req, res) {
    const tmpErrors = _.clone(req.session.errors);
    let _checkOutTime;

    delete req.session.errors;

    if (req.session.dismissJurors && req.session.dismissJurors.checkOutTime) {
      _checkOutTime = req.session.dismissJurors.checkOutTime;
    }

    return res.render('juror-management/dismiss-jurors/check-out.njk', {
      checkOutTime: _checkOutTime,
      notCheckedOut: req.session.dismissJurors.notCheckedOut,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};

module.exports.postCheckOutJurors = function(app) {
  return async function(req, res) {
    const { checkOutTimeHour, checkOutTimeMinute, checkOutTimePeriod } = req.body;

    req.session.dismissJurors.checkOutTime = {
      hour: checkOutTimeHour,
      minute: checkOutTimeMinute,
      period: checkOutTimePeriod,
    };

    const validatorResult = validate(req.body, checkOutTime());

    if (validatorResult) {
      req.session.errors = validatorResult;

      return res.redirect(app.namedRoutes.build('juror-management.dismiss-jurors.check-out.get'));
    }

    const checkOutTimeErrors = compareCheckInAndCheckOutTimes(req.session.dismissJurors);

    if (checkOutTimeErrors.length) {
      req.session.errors = {
        checkOutTimeHour: [{
          details: 'Check out time must be after checked in time for all jurors',
          summary: 'Check out time must be after checked in time for all jurors',
        }],
      };

      return res.redirect(app.namedRoutes.build('juror-management.dismiss-jurors.check-out.get'));
    }

    try {
      const payload = {
        commonData: {
          status: 'CHECK_OUT',
          attendanceDate: dateFilter(new Date(), null, 'YYYY-MM-DD'),
          locationCode: req.session.authentication.owner,
          checkOutTime: modUtils.padTimeForApi(
            convert12to24(checkOutTimeHour + ':' + checkOutTimeMinute + checkOutTimePeriod)
          ),
          singleJuror: false,
        },
        juror: req.session.dismissJurors.notCheckedOut.map((j) => j.juror_number),
      };

      await jurorAttendanceDao.patch(app, req, payload);

      app.logger.info('Checked-out selected jurors: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
      });

      return res.redirect(app.namedRoutes.build('juror-management.dismiss-jurors.complete-service.get'));
    } catch (err) {
      app.logger.crit('Failed to checkout the selected jurors: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      req.session.errors = {
        checkOut: [{
          details: 'Failed to checkout the selected jurors',
          summary: 'Failed to checkout the selected jurors',
        }],
      };

      return res.redirect(app.namedRoutes.build('juror-management.dismiss-jurors.check-out.get'));
    }
  };
};

module.exports.postCheckJuror = function(app) {
  return function(req, res) {
    const { jurorNumber, action } = req.query;

    if (jurorNumber === 'check-all-jurors') {
      req.session.dismissJurors.jurors.forEach(j => {
        j.checked = action === 'check';
      });
    } else {
      const juror = req.session.dismissJurors.jurors.find(j => j.juror_number === jurorNumber);

      juror.checked = !juror.checked;
    }

    app.logger.info('Checked or unchecked one or more jurors: ', {
      auth: req.session.authentication,
      jwt: req.session.authToken,
      data: {
        jurorNumber,
      },
    });

    return res.send();
  };
};

// the checked pools can be posted as a single string or as an array of pool numbers
// to calculate how many is selected we need first to check what it is to count
function totalCurrentlySelected(checkedPools) {
  const checkedPoolsType = typeof checkedPools;

  if (checkedPoolsType === 'string') return 1;
  if (checkedPools instanceof Array) return checkedPools.length;
  return 0;
}

function calculateTotalJurorsAvailable(selections, allPools){
  if (selections['checked-pools']){
    const selectedPools = allPools.filter((pool) => selections['checked-pools'].includes(pool.pool_number));
    let totalAvailable = 0;

    selectedPools.forEach((pool) => {
      totalAvailable = totalAvailable + pool.jurors_in_attendance;
      if (selections['jurors-to-include']) {
        if (selections['jurors-to-include'].includes('on-call')) {
          totalAvailable = totalAvailable + pool.jurors_on_call;
        }
        if (selections['jurors-to-include'].includes('not-in-attendance')) {
          totalAvailable = totalAvailable + pool.other_jurors;
        }
      }
    });

    return totalAvailable;
  }

  return 0;
}

function paginateJurorsList(jurors, params, currentPage) {
  return new Promise((resolve) => {
    let start = 0;
    let end = params.jurorsToDismiss;

    if (currentPage > 1) {
      start = (currentPage - 1) * modUtils.constants.PAGE_SIZE;
    }
    if (params.jurorsToDismiss > modUtils.constants.PAGE_SIZE) {
      end = start + modUtils.constants.PAGE_SIZE;
    }

    resolve(jurors.slice(start, end));
  });
}

function compareCheckInAndCheckOutTimes({ notCheckedOut, checkOutTime: time }) {
  const _checkOutTime = convertAmPmToLong(`${time.hour}:${time.minute}${time.period}`);

  return notCheckedOut
    .filter(juror => _checkOutTime < convertAmPmToLong(timeArrayToString(juror.check_in_time)));
}
