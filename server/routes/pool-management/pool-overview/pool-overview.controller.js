const _ = require('lodash');
const validate = require('validate.js');
const jurorTransfer = require('../../../objects/juror-transfer').jurorTransfer;
const jurorSelectValidator = require('../../../config/validation/pool-reassign');
const poolSummaryObj = require('../../../objects/pool-summary.js').poolSummaryObject;
const poolHistoryObj = require('../../../objects/pool-history.js').poolHistoryObject;
const modUtils = require('../../../lib/mod-utils');
const { dateFilter } = require('../../../components/filters');
const isCourtUser = require('../../../components/auth/user-type').isCourtUser;
const capitalizeFully = require('../../../components/filters').capitalizeFully;
const rp = require('request-promise');
const paginateJurorsList = require('./paginate-jurors-list');
const { poolMembersDAO, fetchCoronerPoolDAO } = require('../../../objects');

function errorCB(app, req, res, poolNumber, errorString) {
  return function(err) {
    app.logger.crit(errorString, {
      auth: req.session.authentication,
      data: {
        poolNumber: poolNumber,
      },
      error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
    });

    res.redirect(app.namedRoutes.build('pool-management.get'));
  };
}

module.exports.getJurors = function(app) {
  return async function(req, res) {
    const poolNumber = req.params['poolNumber'];
    const coronerPoolPrefix = '9' + new Date().getFullYear().toString().slice(2, 4);
    let tmpError;

    // this is going to be changed in the future when the backend for coroner-court pools is done
    // it will also be only after the fetch is complete and we will check the pool-type instead of the number
    if (poolNumber.slice(0, 3) === coronerPoolPrefix) {
      if (isCourtUser(req, res)) {
        return res.redirect(app.namedRoutes.build('pool-management.get'));
      }
      return coronerCourtPool(app)(req, res);
    }

    let { selectedJurors, selectAll } = req.session;

    if (typeof selectedJurors === 'string') {
      selectedJurors = [selectedJurors];
    }

    // display an error message if the pool failed to delete or an invalid location code is used
    // the location code will be very unlikely to ever be invalid...
    // an invalid location code would be a string (abc) or a location code that does not exist on our records
    tmpError = (typeof req.session.deletePoolError !== 'undefined')
      ? req.session.deletePoolError : req.session.additionalSummonsError;
    delete req.session.deletePoolError;
    delete req.session.additionalSummonsError;
    delete req.session.newCourtCatchmentArea;
    delete req.session.newBureauDeferrals;
    delete req.session.poolJurorsReassign;
    delete req.session.notResponded;
    delete req.session.poolJurorsPostpone;
    delete req.session.selectedJurors;
    delete req.session.selectedAll;
    delete req.session.processLateSummons;
    delete req.session.editPool;

    let pool;

    try {
      pool = await poolSummaryObj.get(rp, app, req.session.authToken, poolNumber);
    } catch (err) {
      const errorMessage = `Failed to fetch pool summary for ${isCourtUser(req, res) ? 'court' : 'bureau'} user:`;

      return errorCB(app, req, res, poolNumber, errorMessage)(err);
    }

    if (!Object.keys(req.query).length || (Object.keys(req.query).length === 1 && req.query.status)) {
      delete req.session.selectedJurors;
      delete req.session.selectAll;
    }

    let queryStatus = !req.query.status || req.query.status === 'all' ? null : req.query.status;

    const payload = {
      'pool_number': poolNumber,
      'juror_number': req.query.jurorNumber || null,
      'first_name': req.query.firstName || null,
      'last_name': req.query.lastName || null,
      'attendance': req.query.attendance?.toUpperCase()
        .replace(/ /g, '_').split(',') || null,
      'checked_in': req.query.checkedIn || null,
      'next_due': req.query.nextDue?.split(',') || null,
      'status': queryStatus?.split(',').map(status => status[0].toUpperCase() + status.slice(1)) || null,
      'page_number': req.query.page || 1,
      'sort_field': req.query.sortBy || 'juror_number',
      'sort_method': req.query.sortOrder || 'ascending',
    };

    poolMembersDAO.post(req, payload)
      .then((members) => isCourtUser(req, res)
        ? courtView(app, req, res, pool, members, tmpError, selectedJurors || [], selectAll)
        : require('./bureau-view.js')(app, req, res, pool, members, tmpError, selectedJurors || [], selectAll))
      .catch((err) => {
        if (err.statusCode === 422 && err.error.code === 'MAX_ITEMS_EXCEEDED') {
          const members = { data: [], totalItems: 501 };

          if (isCourtUser(req, res)) {
            return courtView(app, req, res, pool, members, tmpError, selectedJurors || [], selectAll);
          }
          return require('./bureau-view.js')(app, req, res, pool, members, tmpError, selectedJurors || [], selectAll);
        }
        return errorCB(app, req, res, poolNumber,
          `Failed to fetch pool summary for ${isCourtUser(req, res) ? 'court' : 'bureau'} user:`)(err);
      });
  };
};

module.exports.postFilterJurors = function(app) {
  return function(req, res) {
    const poolNumber = req.params.poolNumber;
    const filters = req.body;

    req.session.selectedJurors = req.body.selectedJurors;
    req.session.selectAll = req.body['check-all-jurors'];

    const queryParams = new URLSearchParams(req.url.split('?')[1] || '');

    if (req.body.filterType === 'filter') {
      queryParams.delete('page');

      delete req.session.selectedJurors;
      delete req.session.selectAll;
    }

    // I have some weird behaviour with the bureau filter adding an empty checked when I check a single status
    if (Array.isArray(filters.status)) {
      filters.status = filters.status.filter(status => status);
    }

    if (filters.jurorNumber) {
      queryParams.set('jurorNumber', filters.jurorNumber);
    } else {
      queryParams.delete('jurorNumber');
    }
    if (filters.firstName) {
      queryParams.set('firstName', filters.firstName);
    } else {
      queryParams.delete('firstName');
    }
    if (filters.lastName) {
      queryParams.set('lastName', filters.lastName);
    } else {
      queryParams.delete('lastName');
    }
    if (filters.attendance) {
      queryParams.set('attendance', filters.attendance);
    } else {
      queryParams.delete('attendance');
    }
    if (filters.checkedIn === 'today') {
      queryParams.set('checkedIn', 'true');
    } else {
      queryParams.delete('checkedIn');
    }
    if (filters.nextDueAtCourt) {
      queryParams.set('nextDue', filters.nextDueAtCourt);
    } else {
      queryParams.delete('nextDue');
    }
    if (filters.status) {
      queryParams.set('status', filters.status);
    } else {
      queryParams.delete('status');
    }

    res.redirect(`${app.namedRoutes.build('pool-overview.get', {
      poolNumber,
    })}?${queryParams.toString()}`);
  };
};

module.exports.getHistory = function(app) {
  return function(req, res) {
    var poolNumber = req.params['poolNumber']
      , coronerPoolPrefix = '9' + new Date().getFullYear().toString().slice(2, 4);

    // this is going to be changed in the future when the backend for coroner-court pools is done
    // it will also be only after the fetch is complete and we will check the pool-type instead of the number
    if (poolNumber.slice(0, 3) === coronerPoolPrefix) {
      if (isCourtUser(req, res)) {
        return res.redirect(app.namedRoutes.build('pool-management.get'));
      }
      return coronerCourtPool(app)(req, res);
    }

    app.logger.info('trying to render history tab: ', {
      auth: req.session.authentication,
    });

    return poolSummaryObj.get(
      rp,
      app,
      req.session.authToken,
      poolNumber,
    )
      .then(renderHistory(app, req, res))
      .catch(errorCB(app, req, res, poolNumber, 'Failed to fetch pool summary:'));
  };
};

module.exports.postReassign = function(app) {
  return async function(req, res) {
    if (req.body['check-all-jurors']) {
      try {
        const poolMembers = await poolMembersDAO.post(req, filtersHelper(req, req.params.poolNumber), true);

        req.body.selectedJurors = poolMembers.data.map(juror => juror.jurorNumber);
      } catch (err) {
        app.logger.crit('Failed to fetch pool members to reassign: ', {
          auth: req.session.authentication,
          poolNumber: req.params.poolNumber,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    } else {
      const validatorResult = validate(req.body, jurorSelectValidator());

      if (typeof validatorResult !== 'undefined') {

        req.session.errors = validatorResult;
        req.session.noJurorSelect = true;
        return res.redirect(app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.body.poolNumber}));
      }
    }

    req.session.poolJurorsReassign = req.body;
    delete req.session.poolJurorsReassign._csrf;
    delete req.session.errors;

    if (!Array.isArray(req.body.selectedJurors)) {
      req.session.poolJurorsReassign.selectedJurors = [req.body.selectedJurors];
    }

    req.session.receivingCourtLocCode = req.body.poolNumber.slice(0, 3);

    return res.redirect(app.namedRoutes.build('pool-management.reassign.get', {
      poolNumber: req.body.poolNumber,
    }));
  };
};

module.exports.postTransfer = function(app) {
  return async function(req, res) {
    if (req.body['check-all-jurors']) {
      try {
        const poolMembers = await poolMembersDAO.post(req, filtersHelper(req, req.params.poolNumber), true);

        req.session.selectedJurors = poolMembers.data.map(juror => juror.jurorNumber);
      } catch (err) {
        app.logger.crit('Failed to fetch pool members to tranfer: ', {
          auth: req.session.authentication,
          poolNumber: req.params.poolNumber,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    } else {
      const validatorResult = validate(req.body, jurorSelectValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.noJurorSelect = true;
        return res.redirect(app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.body.poolNumber}));
      }

      req.session.selectedJurors = Array.isArray(req.body.selectedJurors)
        ? req.body.selectedJurors : [req.body.selectedJurors];
    }

    delete req.session.errors;

    return res.redirect(app.namedRoutes.build('pool-overview.transfer.select-court.get', {
      poolNumber: req.params.poolNumber,
    }));
  };
};

// Bulk transfer court selection is handled at ../../juror-management/update/juror-update.transfer.controller

module.exports.postTransferConfirm = function(app) {
  return function(req, res) {
    executeTransfer(app, req, res, req.session.selectedJurors);
  };
};

module.exports.postTransferContinue = function(app) {
  return (req, res) => {
    executeTransfer(app, req, res, req.session.availableForMove);
  };
};

function executeTransfer(app, req, res, transferedJurors) {
  var newServiceStartDate, receivingCourtLocCode;
  const poolNumber = req.params.poolNumber;

  const successCB = function(data) {
    const courtName = req.session.formField.courtNameOrLocation;

    app.logger.info(`${transferedJurors.length} juror(s) succesfully transferred from ${poolNumber}:`, {
      auth: req.session.authentication,
      data: {
        poolNumber,
        receivingCourt: receivingCourtLocCode,
        data: data,
      },
    });

    /* eslint-disable-next-line */
    req.session.bannerMessage = `${transferedJurors.length} juror${transferedJurors.length > 1 ? 's' : ''} transferred to ${courtName}`;

    delete req.session.formField;
    delete req.session.poolJurorsTransfer;

    return res.redirect(app.namedRoutes.build('pool-overview.get', {
      poolNumber: req.params.poolNumber,
    }));
  };

  receivingCourtLocCode = req.session.formField.courtNameOrLocation.match(/\d+/g)[0];

  newServiceStartDate = dateFilter(req.session.formField.attendanceDate, 'DD/MM/YYYY', 'YYYY-MM-DD');

  jurorTransfer.put(
    rp,
    app,
    req.session.authToken,
    transferedJurors,
    receivingCourtLocCode,
    newServiceStartDate,
    poolNumber)
    .then(successCB)
    .catch(errorCB(app, req, res, poolNumber, 'Failed to bulk transfer jurors:'));
};

function coronerCourtPool(app) {
  return function(req, res) {
    let pagination;
    const coronerSuccessCB = function(response) {
      const members = [];
      const tmpErrors = _.clone(req.session.errors);

      req.session.coronerCourtEtag = response._headers.etag;
      delete response._headers;

      delete req.session.errors;

      app.logger.info('Fetched pool summary: ', {
        auth: req.session.authentication,
        data: response,
      });

      req.session.coronerCourt = response;


      if (response.coronerDetailsList.length > 0) {
        response.coronerDetailsList.forEach(function(member) {
          members.push([
            {
              text: member.jurorNumber,
            },
            {
              text: capitalizeFully(member.firstName),
            },
            {
              text: capitalizeFully(member.lastName),
            },
            {
              text: member.postcode,
            },
          ]);
        });
      }

      return res.render('pool-management/pool-overview/coroner', {
        backLinkUrl: 'pool-management.get',
        members: members,
        poolDetails: response,
        pageItems: pagination,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };

    // temp delete this here 🤔
    delete req.session.newCourtCatchmentArea;

    return fetchCoronerPoolDAO.get(req, req.params['poolNumber'])
      .then(coronerSuccessCB)
      .catch(errorCB(app, req, res, req.params['poolNumber'], 'Failed to fetch coroner pool:'));
  };
}

function renderHistory(app, req, res) {
  return function(data) {
    req.session.poolDetails = data;

    app.logger.info('Rendering Pool history: ', {
      auth: req.session.authentication,
    });

    return renderHistoryItems(app, req, res, data);

  };
}

function renderHistoryItems(app, req, res, data){
  return poolHistoryObj.get(
    rp,
    app,
    req.session.authToken,
    data.poolDetails.poolNumber,
  )
    .then(function(poolHistoryList) {
      app.logger.info('Fetched Pool Request history: ', {
        auth: req.session.authentication,
        data: poolHistoryList,
      });

      poolHistoryList.poolHistoryEvents.forEach((item) => {
        item.datePart = dateFilter(item.datePart, null, 'ddd D MMM yyyy [at] hh:mma');
        return item;
      });

      res.render(`pool-management/pool-overview/${isCourtUser(req, res) ? 'court' : 'bureau'}-pool-overview`, {
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('pool-management.get') + (data.poolDetails.isActive ? '?status=created' : ''),
        },
        poolHistory: poolHistoryList.poolHistoryEvents,
        poolDetails: data.poolDetails,
        bureauSummoning: data.bureauSummoning,
        poolSummary: data.poolSummary,
        additionalStatistics: data.additionalStatistics,
        isNil: data.poolDetails.is_nil_pool,
        currentOwner: data.poolDetails.current_owner,
        currentTab: 'history',
        navData: _.clone(req.session.poolManagementNav),
      });
    })
    .catch(errorCB(app, req, res, data.poolDetails.poolNumber, 'Failed to fetch pool history:'));
}

module.exports.postCompleteService = function(app) {
  return async function(req, res) {
    if (req.body['check-all-jurors']) {
      try {
        const poolMembers = await poolMembersDAO.post(req, filtersHelper(req, req.params.poolNumber), true);

        req.body.selectedJurors = poolMembers.data.map(juror => juror.jurorNumber);
      } catch (err) {
        app.logger.crit('Failed to fetch pool members to complete service: ', {
          auth: req.session.authentication,
          poolNumber: req.params.poolNumber,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    } else {

      const validatorResult = validate(req.body, jurorSelectValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('pool-overview.get', { poolNumber: req.params['poolNumber'] }));
      }
    }

    if (!Array.isArray(req.body.selectedJurors)) {
      req.body.selectedJurors = [req.body.selectedJurors];
    }

    req.session.selectedJurors = req.body.selectedJurors;
    delete req.session.selectedJurors._csrf;
    delete req.session.errors;

    return res.redirect(app.namedRoutes.build('pool-overview.complete-service.confirm.get',{
      poolNumber: req.params.poolNumber,
    }));
  };
};

module.exports.getCompleteServiceContinue = function(app) {
  return function(req, res) {
    const notResponded = req.session.notResponded;
    const selectedJurors = req.session.selectedJurors;

    if (selectedJurors.length > 0) {
      return res.render('shared/complete-service/some-responded.njk', {
        notResponded,
        selectedJurors,
        confirmUrl: app.namedRoutes.build('pool-overview.complete-service.post',
          { poolNumber: req.params.poolNumber }),
        cancelUrl: app.namedRoutes.build('pool-overview.get',
          { poolNumber: req.params.poolNumber }),
      });
    }

    return res.render('shared/complete-service/none-responded.njk', {
      cancelUrl: app.namedRoutes.build('pool-overview.get',
        { poolNumber: req.params.poolNumber }),
    });
  };
};

function courtView(app, req, res, pool, membersList, _errors, selectedJurors, selectAll) {
  let assignUrl = app.namedRoutes.build('pool-overview.reassign.post', {
    poolNumber: req.params.poolNumber,
  });
  let transferUrl = app.namedRoutes.build('pool-overview.transfer.post', {
    poolNumber: req.params.poolNumber,
  });
  let completeServiceUrl = app.namedRoutes.build('pool-overview.complete-service.post', {
    poolNumber: req.params.poolNumber,
  });
  let changeServiceDateUrl = app.namedRoutes.build('pool-overview.change-next-due-at-court.post', {
    poolNumber: req.params.poolNumber,
  });
  let postponeUrl = app.namedRoutes.build('pool-overview.postpone.post', {
    poolNumber: req.params.poolNumber,
  });;

  let availableSuccessMessage = false
    , successBanner
    , tmpError
    , error = null
    , jurorStatuses = 'all';

  const specifiedStatuses = ['responded', 'panel', 'juror'];
  const filters = req.query;

  if (typeof filters !== 'undefined' && typeof filters.status !== 'undefined') {
    if (specifiedStatuses.every(i => filters.status.includes(i)) && filters.status.split(',').length === 3) {
      jurorStatuses = 'responded';
    }
  }

  if (req.session.bannerMessage) {
    availableSuccessMessage = true;
    successBanner = req.session.bannerMessage;
  }

  if (req.session.errors && !_errors) {
    tmpError = req.session.errors;
  }

  if (_errors && _errors.type === 'pool-delete-error') {
    error = _errors;
  }

  delete req.session.errors;
  delete req.session.bannerMessage;

  const searchParams = req.url.split('?')[1];
  if (searchParams) {
    postponeUrl += `?${searchParams}`;
    changeServiceDateUrl += `?${searchParams}`;
    completeServiceUrl += `?${searchParams}`;
    transferUrl += `?${searchParams}`;
    assignUrl += `?${searchParams}`;
  }

  let pagination;

  try {
    delete req.session.filteredMembers;
    delete req.session.filters;

    app.logger.info('Fetched court members: ', {
      auth: req.session.authentication,
      data: membersList,
    });

    req.session.membersList = membersList.data;
    req.session.jurorDetails = {};
    membersList.data.forEach(item => {
      req.session.jurorDetails[item.jurorNumber] = item;
    });

    const currentPage = req.query.page || 1;
    const sortBy = req.query.sortBy || 'jurorNumber';
    const order = req.query.sortOrder || 'asc';

    const totalJurors = membersList.totalItems;
    const totalCheckedJurors = selectAll ? membersList.totalItems : selectedJurors.length || 0;

    let jurors = paginateJurorsList(membersList.data, sortBy, order, true, selectedJurors, selectAll);

    // eslint-disable-next-line no-param-reassign, eqeqeq
    selectedJurors = selectedJurors.filter(item => !membersList.data.find(data => data.jurorNumber == item));


    req.session.poolDetails = pool;
    req.session.locCode = pool.poolDetails.locCode; // set the loc code for navigating to juror record

    const pageItems = modUtils.paginationBuilder(
      membersList.totalItems,
      currentPage,
      req.url,
    );

    const queryParams = new URLSearchParams(req.url.split('?')[1]);

    queryParams.delete('sortBy');
    queryParams.delete('sortOrder');
    queryParams.delete('showFilter');
    const sortUrl = req.url.split('?')[0] + '?' + queryParams.toString();

    res.render('pool-management/pool-overview/court-pool-overview', {
      backLinkUrl:{
        built: true,
        url: app.namedRoutes.build('pool-management.get') + '?status=created',
      },
      membersHeaders: jurors.headers,
      poolMembers: jurors.list,
      pageItems: {
        prev: pageItems.prev,
        next: pageItems.next,
        items: pageItems.items.map(item => ({
          ...item,
          href: item.href,
          attributes: {
            id: `pool-overview-page-${item.number}`,
          },
        })),
      },
      availableSuccessMessage: availableSuccessMessage,
      successBanner: successBanner,
      poolDetails: pool.poolDetails,
      isNil: pool.poolDetails.is_nil_pool,
      isActive: pool.isActive,
      currentOwner: pool.poolDetails.current_owner,
      currentTab: 'jurors',
      postUrls: { assignUrl, transferUrl, completeServiceUrl, changeServiceDateUrl, postponeUrl },
      navData: _.clone(req.session.poolManagementNav),
      errors: {
        title: 'Please check the form',
        count: typeof tmpError !== 'undefined' ? Object.keys(tmpError).length : 0,
        items: tmpError,
      },
      error,
      appliedFilters: {
        ...filters,
        checkedIn: filters.checkedIn ? 'today' : '',
        nextDueAtCourt: filters.nextDue,
      },
      jurorStatuses,
      totalJurors,
      totalCheckedJurors,
      pagination,
      sortUrl,
      selectedJurors,
      selectAll,
    });

  } catch (err) {
    errorCB(app, req, res, pool.poolDetails.poolNumber, 'Failed to fetch pool members:')(err);
  }
}

module.exports.postBulkPostpone = function(app) {
  return async function(req, res) {
    if (req.body['check-all-jurors']) {
      try {
        const poolMembers = await poolMembersDAO.post(req, filtersHelper(req, req.params.poolNumber), true);

        req.body.selectedJurors = poolMembers.data.map(juror => juror.jurorNumber);
      } catch (err) {
        app.logger.crit('Failed to fetch pool members to postpone: ', {
          auth: req.session.authentication,
          poolNumber: req.params.poolNumber,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    } else {
      const validatorResult = validate(req.body, jurorSelectValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.noJurorSelect = true;
        return res.redirect(app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.body.poolNumber}));
      }
    }

    req.session.poolJurorsPostpone = req.body;
    delete req.session.poolJurorsPostpone._csrf;
    delete req.session.errors;

    if (!Array.isArray(req.body.selectedJurors)) {
      req.session.poolJurorsPostpone.selectedJurors = [req.body.selectedJurors];
    }
    return res.redirect(app.namedRoutes.build('pool-management.postpone.get', {
      poolNumber: req.body.poolNumber,
    }));
  };
};

module.exports.postCheckJuror = function(app) {
  return function(req, res) {
    const { jurorNumber, action } = req.query;

    if (jurorNumber === 'check-all-jurors') {
      if (typeof req.session.filteredMembers !== 'undefined') {
        req.session.membersList.forEach(j => {
          if (req.session.filteredMembers.poolMembers.find((obj) => obj.jurorNumber === j.jurorNumber)) {
            j.checked = action === 'check';
          }
        });
        req.session.filteredMembers.poolMembers.forEach(j => {
          j.checked = action === 'check';
        });
      } else {
        req.session.membersList.forEach(j => {
          j.checked = action === 'check';
        });
      }
    } else {
      const juror = req.session.membersList.find(j => j.jurorNumber === jurorNumber);

      juror.checked = !juror.checked;

      if (typeof req.session.filteredMembers !== 'undefined') {
        const filtMem = req.session.filteredMembers.poolMembers.find(j => j.jurorNumber === jurorNumber);

        filtMem.checked = !filtMem.checked;
      }
    }

    app.logger.info('Checked or unchecked one or more jurors: ', {
      auth: req.session.authentication,
      data: {
        jurorNumber,
      },
    });

    return res.send();
  };
};

function filtersHelper(req, poolNumber) {
  const queryStatus = !req.query.status || req.query.status === 'all' ? null : req.query.status;

  const payload = {
    'pool_number': poolNumber,
    'juror_number': req.query.jurorNumber || null,
    'first_name': req.query.firstName || null,
    'last_name': req.query.lastName || null,
    'attendance': req.query.attendance?.toUpperCase()
      .replace(/ /g, '_').split(',') || null,
    'checked_in': req.query.checkedIn || null,
    'next_due': req.query.nextDue?.split(',') || null,
    'status': queryStatus?.split(',').map(status => status[0].toUpperCase() + status.slice(1)) || null,
    'page_number': req.query.page || 1,
    'sort_field': 'juror_number',
    'sort_method': 'ascending',
    'page_limit': 500,
  };

  return payload;
}
module.exports.filtersHelper = filtersHelper;
