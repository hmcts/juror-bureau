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
const { convertAmPmToLong, dateFilter, timeArrayToString, convert12to24, fullCourtType } = require('../../../components/filters');
const { jurorAttendanceDao, updateJurorAttendanceDAO } = require('../../../objects/juror-attendance');

module.exports.getDismissJurorsPools = function(app) {
  return async function(req, res) {
    const sortBy = req.query.sortBy || 'poolNumber';
    const sortOrder = req.query.sortOrder || 'ascending';
    let tmpForm = {};

    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;
    delete req.session.poolsAtCourt;

    if (req.session.dismissJurors && req.session.dismissJurors.jurors) {
      delete req.session.dismissJurors.jurors;
    }

    if (req.session.dismissJurors) {
      tmpForm = req.session.dismissJurors;
    } else {
      req.session.dismissJurors = {};
    }

    try {
      const pools = await fetchPoolsAtCourt.get(
        req,
        req.session.authentication.owner
      );

      const poolsAtCourt = pools.pools_at_court_location.filter(pool => pool.total_jurors !== 0);
      req.session.poolsAtCourt = poolsAtCourt;

      let pageItems;
      if (pools.total_items > modUtils.constants.PAGE_SIZE) {
        pageItems = modUtils.paginationBuilder(pools.total_items, page, req.url);
      }

      app.logger.info('Fetched the pools to dismiss jurors from: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
      });

      return res.render('pool-management/dismiss-jurors/pools-list.njk', {
        pools: poolsAtCourt,
        totalCheckedPools: req.session.selectedDismissalPools?.length || 0,
        poolsTable: transformPoolsList(app, poolsAtCourt, sortBy, sortOrder, req.session.selectedDismissalPools || [], poolsAtCourt.length),
        pageItems,
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
    const jurorsAvailable = calculateTotalJurorsAvailable(req.body, _.clone(req.session.selectedDismissalPools));

    req.session.dismissJurors = req.body;
    req.session.dismissJurors['checked-pools'] =_.clone(req.session.selectedDismissalPools);
    delete req.session.dismissJurors._csrf;
    delete req.session.poolsAtCourt;

    if (action === calculateAvailableJurors) {
      req.session.dismissJurors.jurorsAvailableToDismiss = jurorsAvailable;

      return res.redirect(app.namedRoutes.build('pool-management.dismiss-jurors.pools.get'));
    }

    if (!req.session.dismissJurors['checked-pools'].length) {
      req.session.errors = modUtils.makeManualError('checked-pools', 'Select at least one pool')
      return res.redirect(app.namedRoutes.build('pool-management.dismiss-jurors.pools.get'));
    }

    const validatorResult = validate(req.body, jurorsToDismiss(jurorsAvailable));

    if (validatorResult ) {
      req.session.errors = validatorResult;

      return res.redirect(app.namedRoutes.build('pool-management.dismiss-jurors.pools.get'));
    }

    return res.redirect(app.namedRoutes.build('pool-management.dismiss-jurors.jurors.get'));
  };
};

module.exports.getJurorsList = function(app) {
  return async function(req, res) {
    const currentPage = req.query.page || 1;
    const tmpErrors = _.clone(req.session.errors);
    const { sortBy, sortDirection } = req.query;
    let pagination;

    delete req.session.errors;

    sortJurors(req);

    try {
      if (req.session.dismissJurors && !req.session.dismissJurors.jurors) {
        const jurorList = await getJurorsObject.post(
            req,
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

      return res.render('pool-management/dismiss-jurors/jurors-list.njk', {
        jurors,
        pagination,
        totalJurors,
        totalCheckedJurors,
        sortBy,
        sortDirection: sortDirection || 'ascending',
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('pool-management.dismiss-jurors.pools.get'),
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
      jurors: 'pool-management.dismiss-jurors.jurors.get',
      checkOut: 'pool-management.dismiss-jurors.check-out.get',
      completeService: 'pool-management.dismiss-jurors.complete-service.get',
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
    const response = await jurorAttendanceDao.post(req, payload);
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

    return res.render('pool-management/dismiss-jurors/complete-service.njk', {
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

      return res.redirect(app.namedRoutes.build('pool-management.dismiss-jurors.complete-service.get'));
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

      return res.redirect(app.namedRoutes.build('pool-management.dismiss-jurors.complete-service.get'));
    }

    try {

      const checkedJurors = req.session.dismissJurors.jurors.filter(juror => juror.checked);

      const payload = {
        'juror_numbers': checkedJurors.map((juror) => juror.juror_number),
        'completion_date': dateFilter(req.body.completionDate, 'DD/MM/YYYY', 'YYYY-MM-DD'),
      };

      await dismissJurorsObject.patch(req, payload);

      app.logger.info('Jurors dismissed and service completed: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
      });

      req.session.bannerMessage = `${checkedJurors.length} jurors dismissed and service completed.`;

      delete req.session.dismissJurors;

      return res.redirect(app.namedRoutes.build('pool-management.get') + '?status=created');
    } catch (err) {
      app.logger.crit('Failed to dismiss the selected jurors: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.redirect(app.namedRoutes.build('pool-management.dismiss-jurors.complete-service.get'));
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

    return res.render('pool-management/dismiss-jurors/check-out.njk', {
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

      return res.redirect(app.namedRoutes.build('pool-management.dismiss-jurors.check-out.get'));
    }

    const checkOutTimeErrors = compareCheckInAndCheckOutTimes(req.session.dismissJurors);

    if (checkOutTimeErrors.length) {
      req.session.errors = {
        checkOutTimeHour: [{
          details: 'Check out time must be after checked in time for all jurors',
          summary: 'Check out time must be after checked in time for all jurors',
        }],
      };

      return res.redirect(app.namedRoutes.build('pool-management.dismiss-jurors.check-out.get'));
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

      await updateJurorAttendanceDAO.patch(req, payload);

      app.logger.info('Checked-out selected jurors: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
      });

      return res.redirect(app.namedRoutes.build('pool-management.dismiss-jurors.complete-service.get'));
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

      return res.redirect(app.namedRoutes.build('pool-management.dismiss-jurors.check-out.get'));
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

module.exports.postCheckPool = function(app) {
  return async function(req, res) {
    const { poolNumber, action } = req.query;

    if (poolNumber === 'check-all-pools') {
      let pools;
      try {
        pools = (await fetchPoolsAtCourt.get(
          req,
          req.session.authentication.owner
        )).pools_at_court_location.filter(pool => pool.total_jurors !== 0);

      } catch (err) {
        app.logger.crit('Failed to fetch pools to dismiss jurors when checking all pools: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
  
        return res.render('_errors/generic.njk');
      }
      req.session.selectedDismissalPools = action === 'check' ? pools : [];
    } else {
      const pool = req.session.poolsAtCourt.find(p => p.pool_number === poolNumber);
      pool.checked = action === 'check';

      if (action === 'check') {
        req.session.selectedDismissalPools ? req.session.selectedDismissalPools.push(pool) : req.session.selectedDismissalPools = [pool];
      } else {
        if (req.session.selectedDismissalPools) {
          req.session.selectedDismissalPools = req.session.selectedDismissalPools.filter(p => p.pool_number !== poolNumber);
        }
      }
    }

    app.logger.info('Checked or unchecked one or more pools: ', {
      auth: req.session.authentication,
      jwt: req.session.authToken,
      data: {
        poolNumber,
      },
    });

    return res.send();
  };
};

function calculateTotalJurorsAvailable(selections, selectedPools){
  if (selectedPools){
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

function sortJurors(req) {
  const SORT_BY = {
    jurorNumber: 'juror_number',
    firstName: 'first_name',
    lastName: 'last_name',
    attending: 'attending',
    checkedInTime: 'check_in_time',
    nextDueAtCourt: 'next_due_at_court',
    serviceStartDate: 'service_start_date',
  };

  const { sortBy, sortDirection } = req.query;
  const _sortBy = SORT_BY[sortBy] || 'juror_number';

  const isNumber = (value) => !isNaN(value);

  if (sortBy) {
    req.session.dismissJurors.jurors = req.session.dismissJurors.jurors.sort((a, b) => {
      let _a = a[_sortBy] ? a[_sortBy] : '-';
      let _b = b[_sortBy] ? b[_sortBy] : '-';

      if (_sortBy === 'check_in_time') {
        _a = _a === '-' ? '0000' : convertAmPmToLong(timeArrayToString(_a));
        _b = _b === '-' ? '0000' : convertAmPmToLong(timeArrayToString(_b));
      }

      if (sortDirection === 'ascending') {
        if (isNumber(_a) && isNumber(_b)) return _a - _b;
        return _a.localeCompare(_b);
      }

      if (isNumber(_a) && isNumber(_b)) return _b - _a;
      return _b.localeCompare(_a);
    });
  }
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

function transformPoolsList(app, pools, sortBy, sortOrder, checkedPools, totalPools) {  
  const order = sortOrder || 'ascending';
  const allPoolsChecked = checkedPools.length === totalPools ? 'checked' : '';
  const table = {
    head: [
      {
        id: 'checkAllPools',
        html: 
          '<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">'
          + '<input type="checkbox" class="govuk-checkboxes__input" id="check-all-pools" aria-label="check-all-pools" ' + allPoolsChecked + '/>'
          + '<label class="govuk-label govuk-checkboxes__label govuk-!-padding-0" for="check-all-pools">'
          + '<span class="govuk-visually-hidden">Select all pools</span>'
          + '</label>'
          + '</div>'
          ,
        sort: 'none',
        sortable: false,
      },
      {
        id: 'poolNumber',
        value: 'Pool Number',
        sort: sortBy === 'poolNumber' ? order : 'none',
        sortable: true,
      },
      {
        id: 'jurorsInAttendance',
        value: 'Jurors in attendance',
        sort: sortBy === 'jurorsInAttendance' ? order : 'none',
        sortable: true,
      },
      {
        id: 'jurorsOnCall',
        value: 'Jurors on call',
        sort: sortBy === 'jurorsOnCall' ? order : 'none',
        sortable: true,
      },
      {
        id: 'others',
        value: 'Others',
        sort: sortBy === 'others' ? order : 'none',
        sortable: true,
      },
      {
        id: 'total',
        value: 'Total',
        sort: sortBy === 'total' ? order : 'none',
        sortable: true,
      },
      {
        id: 'poolType',
        value: 'Pool type',
        sort: sortBy === 'poolType' ? order : 'none',
        sortable: true,
      },
      {
        id: 'serviceStartDate',
        classes: 'govuk-table__header--numeric jd-middle-align mod-padding-block--0',
        value: 'Service start date',
        sort: sortBy === 'serviceStartDate' ? order : 'none',
        sortable: true,
      },
    ],
    rows: [],
  };

  pools.forEach((pool) => {
    const checked = checkedPools.some(p => p.pool_number === pool.pool_number) ? 'checked' : '';
    table.rows.push([
      {
        html: '<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">'
          + '<input type="checkbox" class="govuk-checkboxes__input"'
          + 'id="pool-' + pool.pool_number + '" aria-label="check-pool-' + pool.pool_number + '"'
          + 'name="checked-pools" value="' + pool.pool_number + '" '
          + checked + '/>'
          + '<label class="govuk-label govuk-checkboxes__label govuk-!-padding-0" for="pool-' + pool.pool_number + '">'
          + '<span class="govuk-visually-hidden">Select pool ' + pool.pool_number + '</span>'
          + '</label>'
          + '</div>',
        attributes: {
          'data-sort-value': pool.pool_number,
        },
        classes: 'mod-padding-block--0',
      },
      {
        html: `<a href="${app.namedRoutes.build('pool-overview.get', {poolNumber: pool.pool_number})}" class="govuk-link">${pool.pool_number}</a>`,
        attributes: {
          'data-sort-value': pool.pool_number,
        },
        classes: 'jd-middle-align mod-padding-block--0',
      },
      {
        text: pool.jurors_in_attendance ,
        attributes: {
          'data-sort-value': pool.jurors_in_attendance ,
        },
        classes: 'jd-middle-align mod-padding-block--0',
      },
      {
        text: pool.jurors_on_call,
        attributes: {
          'data-sort-value': pool.jurors_on_call,
        },
        classes: 'jd-middle-align mod-padding-block--0',
      },
      {
        text: pool.other_jurors,
        attributes: {
          'data-sort-value': pool.other_jurors,
        },
        classes: 'jd-middle-align mod-padding-block--0',
      },
      {
        text: pool.total_jurors,
        attributes: {
          'data-sort-value': pool.total_jurors,
        },
        classes: 'jd-middle-align mod-padding-block--0',
      },
      {
        text: fullCourtType(pool.pool_type),
        attributes: {
          'data-sort-value': pool.pool_type,
        },
        classes: 'jd-middle-align mod-padding-block--0',
      },
      {
        text: dateFilter(pool.service_start_date, 'YYYY-MM-DD', 'ddd D MMM YYYY'),
        attributes: {
          'data-sort-value': pool.service_start_date,
        },
        classes: 'jd-middle-align mod-padding-block--0',
      }
    ]);
  });

  return table;
};
