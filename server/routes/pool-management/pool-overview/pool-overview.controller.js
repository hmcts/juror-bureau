const filters = require('../../../components/filters');

(function(){
  'use strict';

  var _ = require('lodash')
    , validate = require('validate.js')
    , jurorTransfer = require('../../../objects/juror-transfer').jurorTransfer
    , jurorSelectValidator = require('../../../config/validation/pool-reassign')
    , poolSummaryObj = require('../../../objects/pool-summary.js').poolSummaryObject
    , poolMembersObj = require('../../../objects/pool-members.js').poolMemebersObject
    , poolHistoryObj = require('../../../objects/pool-history.js').poolHistoryObject
    , fetchCoronerPool = require('../../../objects/request-pool').fetchCoronerPool
    , modUtils = require('../../../lib/mod-utils')
    , { dateFilter } = require('../../../components/filters')
    , isCourtUser = require('../../../components/auth/user-type').isCourtUser
    , capitalizeFully = require('../../../components/filters').capitalizeFully
    , moment = require('moment')
    , rp = require('request-promise');

  function errorCB(app, req, res, poolNumber, errorString) {
    return function(err) {
      app.logger.crit(errorString, {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          poolNumber: poolNumber,
        },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      res.redirect(app.namedRoutes.build('pool-management.get'));
    };
  }

  module.exports.getJurors = function(app) {
    return function(req, res) {
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

      const poolPromises = [
        poolSummaryObj.get(
          rp,
          app,
          req.session.authToken,
          poolNumber,
        ),
        poolMembersObj.post(
          rp,
          app,
          req.session.authToken,
          {
            'pool_number': poolNumber,
            'juror_number': req.query.jurorNumber || null,
            'first_name': req.query.firstName || null,
            'last_name': req.query.lastName || null,
            'attendance': req.query.attendance?.toUpperCase()
              .replace(/ /g, '_').split(',') || null,
            'checked_in': req.query.checkedIn || null,
            'next_due': req.query.nextDue?.split(',') || null,
            'status': req.query.status?.split(',').map(status => status[0].toUpperCase() + status.slice(1)) || null,
            'page_number': req.query.page || 1,
            'sort_field': req.query.sortBy || 'juror_number',
            'sort_method': req.query.sortOrder || 'ascending',
          },
        ),
      ];

      if (isCourtUser(req, res)) {
        Promise.allSettled(poolPromises)
          .then(([pool, members]) => courtView(app, req, res, pool.value, members.value, tmpError, selectedJurors || [], selectAll))
          .catch(errorCB(app, req, res, poolNumber, 'Failed to fetch pool summary for court user:'));
      } else {
        Promise.allSettled(poolPromises)
          .then(([pool, members]) => bureauView(app, req, res, pool.value, members.value, tmpError, selectedJurors || [], selectAll))
          .catch(errorCB(app, req, res, poolNumber, 'Failed to fetch pool summary for bureau user:'));
      }
    };
  };

  module.exports.postFilterJurors = function(app) {
    return function(req, res) {
      const poolNumber = req.params.poolNumber;
      const filters = req.body;

      req.session.selectedJurors = req.body.selectedJurors;
      req.session.selectAll = req.body["check-all-jurors"];

      const queryParams = new URLSearchParams(req.url.split('?')[1] || '');

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
        poolNumber
      })}?${queryParams.toString()}`)
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
        jwt: req.session.authToken,
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
        req.body.selectedJurors = await poolMembersObj.get(rp, app, req.session.authToken, req.params.poolNumber);
      } else {

        var validatorResult;

        validatorResult = validate(req.body, jurorSelectValidator());
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
        req.body.selectedJurors = await poolMembersObj.get(rp, app, req.session.authToken, req.params.poolNumber)
      } else {
        var validatorResult;

        validatorResult = validate(req.body, jurorSelectValidator());
        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.noJurorSelect = true;
          return res.redirect(app.namedRoutes.build('pool-overview.get', {
            poolNumber: req.body.poolNumber}));
        }
      }

      req.session.poolJurorsTransfer = req.body;
      delete req.session.poolJurorsTransfer._csrf;
      delete req.session.errors;

      if (!Array.isArray(req.body.selectedJurors)) {
        req.session.poolJurorsTransfer.selectedJurors = [req.body.selectedJurors];
      }

      return res.redirect(app.namedRoutes.build('pool-overview.transfer.select-court.get',
        { poolNumber: req.params.poolNumber }));
    };
  };

  // Bulk transfer court selection is handled at ../../juror-management/update/juror-update.transfer.controller

  module.exports.postTransferConfirm = function(app) {
    return function(req, res) {
      executeTransfer(app, req, res, req.session.poolJurorsTransfer.selectedJurors);
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
        jwt: req.session.authToken,
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
      var currentPage = req.query['page'] || 1
        , pagination
        , coronerSuccessCB = function(response) {
          var members = [];

          app.logger.info('Fetched pool summary: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
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
          });
        };

      // temp delete this here 🤔
      delete req.session.newCourtCatchmentArea;

      return fetchCoronerPool.get(rp, app, req.session.authToken, req.params['poolNumber'])
        .then(coronerSuccessCB)
        .catch(errorCB(app, req, res, req.params['poolNumber'], 'Failed to fetch coroner pool:'));
    };
  }

  async function bureauView(app, req, res, pool, membersList, _errors, selectedJurors, selectAll) {
    var assignUrl = app.namedRoutes.build('pool-overview.reassign.post',
        { poolNumber: req.params.poolNumber })
      , transferUrl = app.namedRoutes.build('pool-overview.transfer.post',
        { poolNumber: req.params.poolNumber })
      , completeServiceUrl = app.namedRoutes.build('pool-overview.complete-service.post',
        { poolNumber: req.params.poolNumber })
      , postponeUrl = app.namedRoutes.build('pool-overview.postpone.post',
        { poolNumber: req.params.poolNumber })
      , availableSuccessMessage = false
      , successBanner
      , tmpError
      , error = null;

    req.session.poolDetails = pool;

    app.logger.info('Fetched court members: ', {
      auth: req.session.authentication,
      jwt: req.session.authToken,
      data: membersList,
    });

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

    const currentPage = req.query.page || 1;
    const sortBy = req.query.sortBy || 'jurorNumber';
    const order = req.query.sortOrder || 'asc';

    const totalJurors = membersList.totalItems;
    const totalCheckedJurors = selectAll ? membersList.totalItems : selectedJurors.length || 0;

    let jurors = await paginateJurorsList(membersList.data, sortBy, order, false, selectedJurors, selectAll);
    selectedJurors = selectedJurors.filter(item => !membersList.data.find(juror => juror.jurorNumber === item));

    delete req.session.errors;
    delete req.session.bannerMessage;

    req.session.jurorDetails = {};
    if (membersList && membersList.data) {
      membersList.data.forEach(item => {
        req.session.jurorDetails[item.jurorNumber] = item;
      });
    }

    const pageItems = modUtils.paginationBuilder(
      membersList.totalItems,
      currentPage,
      req.url
    );
    
    delete req.session.bannerMessage;

    // set the loc code for navigating to juror record
    req.session.locCode = pool.poolDetails.locCode;

    res.render('pool-management/pool-overview/bureau-pool-overview', {
      backLinkUrl:{
        built: true,
        url: app.namedRoutes.build('pool-management.get') + '?status=created',
      },
      membersHeaders: jurors.headers,
      poolMembers: jurors.list,
      pageItems: {
        prev: pageItems.prev && `javascript:goHref('${pageItems.prev}')`,
        next: pageItems.next && `javascript:goHref('${pageItems.next}')`,
        items: pageItems.items.map(item => ({
          ...item,
          href: `javascript:goHref('${item.href}')`
        }))
      },
      availableSuccessMessage: availableSuccessMessage,
      successBanner: successBanner,
      poolDetails: pool.poolDetails,
      bureauSummoning: pool.bureauSummoning,
      poolSummary: pool.poolSummary,
      additionalStatistics: pool.additionalStatistics,
      isNil: pool.poolDetails.is_nil_pool,
      isActive: pool.isActive,
      currentTab: 'jurors',
      postUrls: { assignUrl, transferUrl, completeServiceUrl, postponeUrl },
      navData: _.clone(req.session.poolManagementNav),
      errors: {
        title: 'Please check the form',
        count: typeof tmpError !== 'undefined' ? Object.keys(tmpError).length : 0,
        items: tmpError,
      },
      error,
      selectedJurors,
      totalJurors,
      totalCheckedJurors,
      selectAll,
    });
  }

  function renderHistory(app, req, res) {
    return function(data) {
      req.session.poolDetails = data;

      app.logger.info('Rendering Pool history: ', {auth: req.session.authentication,
        jwt: req.session.authToken,
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
          jwt: req.session.authToken,
          data: poolHistoryList,
        });

        res.render('pool-management/pool-overview/bureau-pool-overview', {
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
          currentTab: 'history',
          navData: _.clone(req.session.poolManagementNav),
        });

      })
      .catch(errorCB(app, req, res, data.poolDetails.poolNumber, 'Failed to fetch pool history:'));
  }

  module.exports.postCompleteService = function(app) {
    return async function(req, res) {
      if (req.body['check-all-jurors']) {
        req.body.selectedJurors = await poolMembersObj.get(rp, app, req.session.authToken, req.params.poolNumber)
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

      // TODO: we may now be able to complete from any status - if this doesn't end up being the case, we need to build new functionality for this check
      // req.session.notResponded = req.body.selectedJurors.filter(jurorId =>
      //   req.session.jurorDetails[jurorId]?.status !== 'Responded').map(jurorId =>
      //   req.session.jurorDetails[jurorId]);

      // if (req.session.notResponded.length > 0) {
      //   req.session.selectedJurors = req.body.selectedJurors.filter(juror =>
      //     req.session.jurorDetails[juror]?.status === 'Responded');

      //   return res.redirect(app.namedRoutes.build('pool-overview.complete-service.continue.get',
      //     { poolNumber: req.params['poolNumber'] }));
      // }

      // delete req.session.notResponded;

      return res.redirect(app.namedRoutes.build('pool-overview.complete-service.confirm.get',
        {poolNumber: req.params.poolNumber}));
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

  async function courtView(app, req, res, pool, membersList, _errors, selectedJurors, selectAll) {

    const assignUrl = app.namedRoutes.build('pool-overview.reassign.post',
        { poolNumber: req.params.poolNumber })
      , transferUrl = app.namedRoutes.build('pool-overview.transfer.post',
        { poolNumber: req.params.poolNumber })
      , completeServiceUrl = app.namedRoutes.build('pool-overview.complete-service.post',
        { poolNumber: req.params.poolNumber })
      , changeServiceDateUrl = app.namedRoutes.build('pool-overview.change-next-due-at-court.post',
        { poolNumber: req.params.poolNumber })
      , postponeUrl = app.namedRoutes.build('pool-overview.postpone.post',
        { poolNumber: req.params.poolNumber });

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

    let pagination;

    try {
      delete req.session.filteredMembers;
      delete req.session.filters;

      app.logger.info('Fetched court members: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
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
      
      let jurors = await paginateJurorsList(membersList.data, sortBy, order, true, selectedJurors, selectAll);
      selectedJurors = selectedJurors.filter(item => !membersList.data.find(data => data.jurorNumber == item));


      req.session.poolDetails = pool;
      req.session.locCode = pool.poolDetails.locCode; // set the loc code for navigating to juror record

      const pageItems = modUtils.paginationBuilder(
        membersList.totalItems,
        currentPage,
        req.url
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
          prev: pageItems.prev && `javascript:goHref('${pageItems.prev}')`,
          next: pageItems.next && `javascript:goHref('${pageItems.next}')`,
          items: pageItems.items.map(item => ({
            ...item,
            href: `javascript:goHref('${item.href}')`
          }))
        },
        availableSuccessMessage: availableSuccessMessage,
        successBanner: successBanner,
        poolDetails: pool.poolDetails,
        isNil: pool.poolDetails.is_nil_pool,
        isActive: pool.isActive,
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
          checkedIn: filters.checkedIn ? "today" : "",
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
      console.log(err);
      errorCB(app, req, res, pool.poolDetails.poolNumber, 'Failed to fetch pool members:')(err);
    }
  }

  module.exports.postBulkPostpone = function(app) {
    return async function(req, res) {
      if (req.body['check-all-jurors']) {
        req.body.selectedJurors = await poolMembersObj.get(rp, app, req.session.authToken, req.params.poolNumber);
      } else {
        var validatorResult;
        
        validatorResult = validate(req.body, jurorSelectValidator());
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
        jwt: req.session.authToken,
        data: {
          jurorNumber,
        },
      });

      return res.send();
    };
  };

  function paginateJurorsList(jurors, sortBy, order, isCourt, selectedJurors, selectAll) {
    let headers = [{
      id: 'selectAll',
      html: `<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">\n` +
      `  <input\n` +
      `    type="checkbox"\n` +
      `    class="govuk-checkboxes__input select-check juror-select-check"\n` +
      `    id="check-all-jurors"\n` +
      `    name="check-all-jurors"\n` +
      `    aria-label="check-all-jurors"\n` +
      (selectAll ? "    checked\n" : "") +
      `  >\n` +
      `  <label class="govuk-label govuk-checkboxes__label">\n` +
      `    <span class="govuk-visually-hidden">Select All</span>\n` +
      `  </label>\n` +
      `</div>`,
      sortable: false,
      sort: 'none',
    },
    {
      id: 'jurorNumber',
      value: 'Juror number',
      sort: sortBy === 'jurorNumber' ? order : 'none',
      sortable: true,
    },
    {
      id: 'firstName',
      value: 'First name',
      sort: sortBy === 'firstName' ? order : 'none',
      sortable: true,
    },
    {
      id: 'lastName',
      value: 'Last name',
      sort: sortBy === 'lastName' ? order : 'none',
      sortable: true,
    }];
    if (isCourt) {
      headers = headers.concat([
        {
          id: 'attendance',
          value: 'Attendance',
          sort: sortBy === 'attendance' ? order : 'none',
          sortable: true,
        },
        {
          id: 'checkedIn',
          value: 'Checked in',
          sort: sortBy === 'checkedIn' ? order : 'none',
          sortable: true,
        },
        {
          id: 'nextDate',
          value: 'Next due at court',
          sort: sortBy === 'nextDate' ? order : 'none',
          sortable: true,
        }
      ])
    } else {
      headers.push({
        id: 'postcode',
        value: 'Postcode',
        sort: sortBy === 'postcode' ? order : 'none',
        sortable: true,
      })
    }
    headers.push({
      id: 'status',
      value: 'Status',
      sort: sortBy === 'status' ? order : 'none',
      sortable: true,
    });

    const list = jurors.map(juror => {
      let row = [
        {
          html: `<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">\n` +
          `  <input type="checkbox"\n` +
          `    class="govuk-checkboxes__input select-check juror-select-check"\n` +
          `    id="juror-${juror.jurorNumber}"\n` +
          `    name="selectedJurors"\n` +
          `    value="${juror.jurorNumber}"\n` +
          `    aria-label="check-juror"\n` +
          (selectAll || selectedJurors.indexOf(juror.jurorNumber) > -1 ? 'checked' : '') +
          `  >\n` +
          `    <label class="govuk-label govuk-checkboxes__label" for="select-${juror.jurorNumber}">\n` +
          `    <span class="govuk-visually-hidden">Select ${juror.jurorNumber}</span>\n` +
          `  </label>\n`+
          `</div>\n`
        },
        {
          html: '<a href="/juror-management/record/' +
            juror.jurorNumber + '/overview" class="govuk-link">' + juror.jurorNumber + '</a>',
          attributes: {
            'data-sort-value': juror.jurorNumber,
          },
        },
        {
          text: filters.capitalizeFully(juror.firstName?.toLowerCase()),
          attributes: {
            'data-sort-value': juror.firstName,
          },
        },
        {
          text: filters.capitalizeFully(juror.lastName?.toLowerCase()),
          attributes: {
            'data-sort-value': juror.lastName,
          },
        }];
        
      if (isCourt) {
        row = row.concat([
          {
            text: filters.capitalizeFully(juror.attendance?.toLowerCase()),
            attributes: {
              'data-sort-value': juror.attendance,
            },
          },
          {
            text: juror.checkedIn ? filters.convert24to12(filters.timeArrayToString(juror.checkedIn)) : '',
            attributes: {
              'data-sort-value': juror.checkedIn,
            },
          },
          {
            text: juror.nextDate && filters.dateFilter(juror.nextDate),
            attributes: {
              'data-sort-value': juror.nextDate,
            },
          },
        ])
      } else {
        row.push({
          text: juror.postcode,
          attributes: {
            'data-sort-value': juror.postcode,
          },
        })
      }
      row.push({
        text: filters.capitalizeFully(juror.status?.toLowerCase()),
        attributes: {
          'data-sort-value': juror.status,
        },
      });
      
      return row;
    });

    return {headers, list};
  }

})();
