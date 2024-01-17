/* eslint-disable strict */
'use strict';

const _ = require('lodash');
const validate = require('validate.js');
const { jurorsToDismiss, completeService } = require('../../../config/validation/dismiss-jurors');
const { checkOutTime } = require('../../../config/validation/check-in-out-time');
const modUtils = require('../../../lib/mod-utils');
const { getPoolsObject, getJurorsObject } = require('../../../objects/dismiss-jurors');
const { convertAmPmTime } = require('../../../components/filters');

module.exports.getDismissJurorsPools = function(app) {
  return async function(req, res) {
    let tmpForm = {};

    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;

    if (req.session.dismissJurors && req.session.dismissJurors.jurors) {
      delete req.session.dismissJurors.jurors;
    }

    if (req.session.dismissJurors) {
      tmpForm = req.session.dismissJurors;
    }

    try {
      const pools = await getPoolsObject.get(() => {}, app, 'token');

      app.logger.info('Fetched the pools to dismiss jurors from: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
      });

      return res.render('juror-management/dismiss-jurors/pools-list.njk', {
        totalCurrentlySelected: totalCurrentlySelected(tmpForm['checked-pools']),
        pools,
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

    req.session.dismissJurors = req.body;
    delete req.session.dismissJurors._csrf;

    if (action === calculateAvailableJurors) {
      req.session.dismissJurors.jurorsAvailableToDismiss = 50;

      return res.redirect(app.namedRoutes.build('juror-management.dismiss-jurors.pools.get'));
    }

    const validatorResult = validate(req.body, jurorsToDismiss());

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
        req.session.dismissJurors.jurors = await getJurorsObject
          .get(() => {}, app, 'token', req.session.dismissJurors);

        app.logger.info('Fetched the the list of jurors to dismiss: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
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
      app.logger.crit('Failed to fetch jurors to dismiss jurors from: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic.njk');
    }
  };
};

module.exports.postJurorsList = function(app) {
  return function(req, res) {
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

    const notCheckedOut = checkedJurors.filter(juror => juror.checkedIn && juror.checkedOut === null);

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

    delete req.session.errors;

    return res.render('juror-management/dismiss-jurors/complete-service.njk', {
      today,
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

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      app.logger.info('Jurors dismissed and service completed: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
      });

      const checkedJurors = req.session.dismissJurors.jurors.filter(juror => juror.checked);
      const message = `${checkedJurors.length} jurors dismissed and service completed.`;

      return res.send({ status: 'ok', message });
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
      await new Promise((resolve) => setTimeout(resolve, 1500));

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
      const juror = req.session.dismissJurors.jurors.find(j => j.jurorNumber === jurorNumber);

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

// Note: not checked in users can be ignored here, but they will also be checked out.
function compareCheckInAndCheckOutTimes({ notCheckedOut, checkOutTime: time }) {
  const _checkOutTime = convertAmPmTime(`${time.hour}:${time.minute}${time.period}`);

  return notCheckedOut
    .filter(juror => _checkOutTime < convertAmPmTime(juror.checkedIn));
}
