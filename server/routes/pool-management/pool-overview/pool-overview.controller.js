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
    , moment = require('moment');

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
      delete req.session.poolJurorsPostpone;
      return poolSummaryObj.get(
        require('request-promise'),
        app,
        req.session.authToken,
        poolNumber,
      )
        .then(renderJurors(app, req, res))
        .catch(errorCB(app, req, res, poolNumber, 'Failed to fetch pool summary:'));
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
        require('request-promise'),
        app,
        req.session.authToken,
        poolNumber,
      )
        .then(renderHistory(app, req, res))
        .catch(errorCB(app, req, res, poolNumber, 'Failed to fetch pool summary:'));
    };
  };

  module.exports.postReassign = function(app) {
    return function(req, res) {
      var validatorResult;

      validatorResult = validate(req.body, jurorSelectValidator());
      if (typeof validatorResult !== 'undefined') {

        req.session.errors = validatorResult;
        req.session.noJurorSelect = true;
        return res.redirect(app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.body.poolNumber}));
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
    return function(req, res) {
      var validatorResult;

      validatorResult = validate(req.body, jurorSelectValidator());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.noJurorSelect = true;
        return res.redirect(app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.body.poolNumber}));
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
      executeTransfer(app, req, res, req.session.availableForTransfer);
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
      require('request-promise'),
      app,
      req.session.authToken,
      transferedJurors,
      receivingCourtLocCode,
      newServiceStartDate,
      poolNumber)
      .then(successCB)
      .catch(errorCB(app, req, res, poolNumber, 'Failed to bulk transfer jurors:'));
  };

  function renderJurors(app, req, res) {
    return function(data) {
      var tmpError;

      req.session.poolDetails = data;

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
      delete req.session.selectedJurors;

      if (data.bureauSummoning.required === 0) {
        req.session.poolDetails.canConvert = true;
      }

      app.logger.info('Fetched pool summary: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: data,
      });

      if (data.poolDetails.isActive === true
        && !!data.bureauSummoning.required) {
        if (isCourtUser(req, res)) {
          return renderAttendancePool(app, req, res, tmpError, data);
        }

        return renderActivePool(app, req, res, tmpError, data);
      }

      res.render('pool-management/pool-overview/index', {
        backLinkUrl: 'pool-management.get',
        poolDetails: data.poolDetails,
        members: [],
        bureauSummoning: data.bureauSummoning,
        poolSummary: data.poolSummary,
        additionalStatistics: data.additionalStatistics,
        navData: _.clone(req.session.poolManagementNav),
        currentTab: 'jurors',
        isNil: data.poolDetails.is_nil_pool,
        error: tmpError,
      });
    };
  }


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

      return fetchCoronerPool.get(require('request-promise'), app, req.session.authToken, req.params['poolNumber'])
        .then(coronerSuccessCB)
        .catch(errorCB(app, req, res, req.params['poolNumber'], 'Failed to fetch coroner pool:'));
    };
  }

  function renderActivePool(app, req, res, _errors, data) {
    return poolMembersObj.get(
      require('request-promise'),
      app,
      req.session.authToken,
      data.poolDetails.poolNumber,
    )
      .then(function(membersList) {
        var assignUrl = app.namedRoutes.build('pool-overview.reassign.post')
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

        delete req.session.errors;
        delete req.session.bannerMessage;

        req.session.jurorDetails = {};
        if (membersList && membersList.poolMembers) {
          membersList.poolMembers.forEach(item => {
            req.session.jurorDetails[item.jurorNumber] = item;
          });
        }

        delete req.session.bannerMessage;
        // TODO: Make sure that this has no future implications 🤔
        req.session.locCode = req.params.poolNumber.substring(0, 3);
        res.render('pool-management/pool-overview/index', {
          backLinkUrl:{
            built: true,
            url: app.namedRoutes.build('pool-management.get') + '?status=created',
          },
          members: (membersList) ? modUtils.membersRows(membersList.poolMembers, app.namedRoutes) : [],
          poolMembers: membersList ? membersList.poolMembers : [],
          availableSuccessMessage: availableSuccessMessage,
          successBanner: successBanner,
          poolDetails: data.poolDetails,
          bureauSummoning: data.bureauSummoning,
          poolSummary: data.poolSummary,
          additionalStatistics: data.additionalStatistics,
          isNil: data.poolDetails.is_nil_pool,
          isActive: data.isActive,
          currentTab: 'jurors',
          postUrls: { assignUrl, transferUrl, completeServiceUrl, postponeUrl },
          navData: _.clone(req.session.poolManagementNav),
          errors: {
            title: 'Please check the form',
            count: typeof tmpError !== 'undefined' ? Object.keys(tmpError).length : 0,
            items: tmpError,
          },
          error,
        });
      })
      .catch(errorCB(app, req, res, data.poolDetails.poolNumber, 'Failed to fetch pool members:'));
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
      require('request-promise'),
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

        res.render('pool-management/pool-overview/index', {
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
    return function(req, res) {
      const validatorResult = validate(req.body, jurorSelectValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('pool-overview.get', { poolNumber: req.params['poolNumber'] }));
      }

      if (!Array.isArray(req.body.selectedJurors)) {
        req.body.selectedJurors = [req.body.selectedJurors];
      }

      req.session.selectedJurors = req.body.selectedJurors;
      req.session.notResponded = req.body.selectedJurors.filter(jurorId =>
        req.session.jurorDetails[jurorId].status !== 'Responded').map(jurorId =>
        req.session.jurorDetails[jurorId]);

      if (req.session.notResponded.length > 0) {
        req.session.selectedJurors = req.body.selectedJurors.filter(juror =>
          req.session.jurorDetails[juror].status === 'Responded');

        return res.redirect(app.namedRoutes.build('pool-overview.complete-service.continue.get',
          { poolNumber: req.params['poolNumber'] }));
      }

      delete req.session.notResponded;

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

  module.exports.postFilterJurors = function(app) {
    return function(req, res) {
      const data = _.clone(req.session.poolDetails)
        , filters = _.clone(req.body);

      delete req.session.filters;
      delete req.session.filteredMembers;
      data.filters = {};
      delete filters._csrf;

      // REMOVE ALL SELECTED JURORS - dont want prior selections persisting through filtering
      // req.session.membersList.forEach((member) => delete member.checked);
      // let membersList = _.clone(req.session.membersList) || [];

      app.logger.info('Filtering members in pool: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          filters,
        },
      });

      req.session.filters = filters;

      // TODO: refactor this gibberish
      if (filters.jurorNumber) {
        data.filters.jurorNumber = filters.jurorNumber;
        membersList = membersList.filter((member) => {
          return member.jurorNumber === filters.jurorNumber.trim();
        });
      }
      if (filters.firstName) {
        data.filters.firstName = filters.firstName;
        membersList = membersList.filter((member) => {
          return member.firstName.toLowerCase() === filters.firstName.trim().toLowerCase();
        });
      }
      if (filters.lastName) {
        data.filters.lastName = filters.lastName;
        membersList = membersList.filter((member) => {
          return member.lastName.toLowerCase() === filters.lastName.trim().toLowerCase();
        });
      }
      if (filters.attendance) {
        data.filters.attendance = filters.attendance;
        membersList = membersList.filter((member) => {
          return filters.attendance.includes(member.attendance.toLowerCase());
        });
      }
      if (filters.checkedIn) {
        data.filters.checkedIn = filters.checkedIn;
        membersList = membersList.filter((member) => {
          return member.checkedIn !== '';
        });
      }
      if (filters.nextDueAtCourt) {
        data.filters.nextDueAtCourt = filters.nextDueAtCourt;
        const values = ['set', 'notSet'];

        if (!values.every(i => filters.nextDueAtCourt.includes(i))) {
          if (filters.nextDueAtCourt === 'set') {
            membersList = membersList.filter((member) => {
              return member.nextDueAtCourt !== '';
            });
          }
          if (filters.nextDueAtCourt === 'notSet') {
            membersList = membersList.filter((member) => {
              return member.nextDueAtCourt === '';
            });
          }
        }
      }
      if (filters.status) {
        data.filters.status = filters.status;
        membersList = membersList.filter((member) => {
          return filters.status.includes(member.status.toLowerCase());
        });
      }

      // req.session.filteredMembers = {poolMembers: membersList};

      renderAttendancePool(app, req, res, null, data);

    };
  };

  async function renderAttendancePool(app, req, res, _errors, data) {

    const assignUrl = app.namedRoutes.build('pool-overview.reassign.post')
      , transferUrl = app.namedRoutes.build('pool-overview.transfer.post',
        { poolNumber: req.params.poolNumber })
      , completeServiceUrl = app.namedRoutes.build('pool-overview.complete-service.post',
        { poolNumber: req.params.poolNumber })
      , changeServiceDateUrl = app.namedRoutes.build('pool-overview.change-next-due-at-court.post',
        { poolNumber: req.params.poolNumber })
      , postponeUrl = app.namedRoutes.build('pool-overview.postpone.post',
        { poolNumber: req.params.poolNumber })
      , filters = _.clone(req.session.filters);

    let availableSuccessMessage = false
      , successBanner
      , tmpError
      , error = null
      , jurorStatuses = 'all';

    const specifiedStatuses = ['responded', 'panelled', 'juror'];

    if (typeof filters !== 'undefined' && typeof filters.status !== 'undefined') {
      if (specifiedStatuses.every(i => filters.status.includes(i)) && filters.status.length === 3) {
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

    let poolMembers;

    const currentPage = req.query.page || 1;
    let pagination;

    try {
      delete req.session.filteredMembers;
      delete req.session.filters;

      let membersList = await poolMembersObj.get(
        require('request-promise'),
        app,
        req.session.authToken,
        data.poolDetails.poolNumber,
      );

      app.logger.info('Fetched court members: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: membersList,
      });

      req.session.membersList = membersList.poolMembers;
      req.session.jurorDetails = {};
      membersList.poolMembers.forEach(item => {
        req.session.jurorDetails[item.jurorNumber] = item;
      });

      if (typeof req.session.filteredMembers !== 'undefined' && typeof filters !== 'undefined') {
        poolMembers = _.clone(req.session.filteredMembers).poolMembers;
      } else {
        poolMembers = req.session.membersList;
      }

      let jurors = await paginateJurorsList(poolMembers, currentPage);

      if (poolMembers.length > modUtils.constants.PAGE_SIZE) {
        pagination = modUtils.paginationBuilder(poolMembers.length, currentPage, req.url);
      }

      const totalJurors = poolMembers.length;
      const totalCheckedJurors = poolMembers.filter(juror => juror.checked).length;

      req.session.poolDetails = data;

      req.session.locCode = req.params.poolNumber.substring(0, 3);

      res.render('pool-management/pool-overview/attendance-pool-overview', {
        backLinkUrl:{
          built: true,
          url: app.namedRoutes.build('pool-management.get') + '?status=created',
        },
        poolMembers: jurors ? jurors : [],
        availableSuccessMessage: availableSuccessMessage,
        successBanner: successBanner,
        poolDetails: data.poolDetails,
        isNil: data.poolDetails.is_nil_pool,
        isActive: data.isActive,
        currentTab: 'jurors',
        postUrls: { assignUrl, transferUrl, completeServiceUrl, changeServiceDateUrl, postponeUrl },
        navData: _.clone(req.session.poolManagementNav),
        errors: {
          title: 'Please check the form',
          count: typeof tmpError !== 'undefined' ? Object.keys(tmpError).length : 0,
          items: tmpError,
        },
        error,
        appliedFilters: filters,
        jurorStatuses,
        totalJurors,
        totalCheckedJurors,
        pagination,
      });

    } catch (err) {
      errorCB(app, req, res, data.poolDetails.poolNumber, 'Failed to fetch pool members:')(err);
    }
  }

  module.exports.postBulkPostpone = function(app) {
    return function(req, res) {
      var validatorResult;

      validatorResult = validate(req.body, jurorSelectValidator());
      if (typeof validatorResult !== 'undefined') {

        req.session.errors = validatorResult;
        req.session.noJurorSelect = true;
        return res.redirect(app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.body.poolNumber}));
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

  function paginateJurorsList(jurors, currentPage) {
    return new Promise((resolve) => {
      let start = 0;
      let end = jurors.length;

      if (currentPage > 1) {
        start = (currentPage - 1) * modUtils.constants.PAGE_SIZE;
      }
      if (jurors.length > modUtils.constants.PAGE_SIZE) {
        end = start + modUtils.constants.PAGE_SIZE;
      }

      resolve(jurors.slice(start, end));
    });
  }

})();
