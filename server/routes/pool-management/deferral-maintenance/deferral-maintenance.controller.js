(function() {
  'use strict';

  const _ = require('lodash');
  const { isBureauUser, isCourtUser } = require('../../../components/auth/user-type');
  const modUtils = require('../../../lib/mod-utils');
  const validator = require('../../../config/validation/pool-management').deferralMaintenance;
  const validate = require('validate.js');
  const requestObj = require('../../../objects/pool-management').deferralMaintenance;
  const dateFilter = require('../../../components/filters').dateFilter;
  const courtNameOrLocationValidator = require('../../../config/validation/request-pool.js').courtNameOrLocation;
  const { transformCourtName } = require('../../../components/filters');

  function successCB(data, courtCode) {
    return function(app, req, res) {
      const court = req.session.courtsList.find((element) => {
        return element.locationCode === courtCode;
      });

      req.session.deferralMaintenance = {
        deferrals: data.deferrals,
        court,
      };

      // set the location code in case a user visits the juror record... should be reset every time
      req.session.locCode = court.locationCode;

      app.logger.info('Fetched the deferrals available: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          deferrals: data.deferrals.length,
          courtCode,
        },
      });

      return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.filter.get', {
        locationCode: court.locationCode,
      }));
    };
  }

  function errorCB(err) {
    return function(app, req, res) {
      req.session.errors = {
        deferrals: [{
          summary: 'Failed to fetch deferrals',
          details: 'Failed to fetch deferrals',
        }],
      };

      app.logger.crit('Failed to fetch deferrals: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          courtCode: req.params['locationCode'],
        },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.get'));
    };
  }

  module.exports.index = function(app) {
    return function(req, res) {
      // start by resetting the deferral maintenance data
      delete req.session.deferralMaintenance;

      if (isCourtUser(req) && !req.session.errors) {
        return requestObj
          .deferrals.get(req, req.session.authentication.locCode)
          .then((data) => successCB(data, req.session.authentication.locCode)(app, req, res))
          .catch((err) => errorCB(err)(app, req, res));
      }

      return render(app)(req, res);
    };
  };

  module.exports.getDeferrals = function(app) {
    return function(req, res) {
      let validatorResult;
      let courtCode;

      validatorResult = validate(req.body, validator.courtNameOrLocation());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.get'));
      }

      // this will return an array of codes (1 only) or null
      courtCode = req.body.courtNameOrLocationCode.match(/\d+/g);
      if (!courtCode || !courtCode.length) {
        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.get'));
      }

      return requestObj
        .deferrals.get(req, courtCode)
        .then((data) => successCB(data, courtCode[0])(app, req, res))
        .catch((err) => errorCB(err)(app, req, res));
    };
  };

  module.exports.postFilterSearch = function(app) {
    return function(req, res) {
      const { locationCode } = req.params;
      const filters = req.body;
      let filterString;
      
      delete filters._csrf;

      Object.keys(filters).forEach((k) => filters[k] === '' && delete filters[k]);

      if (!_.isEmpty(filters)) {
        filterString = new URLSearchParams(filters).toString();
      }

      // Clear all checked when filtering
      req.session.deferralMaintenance.deferrals.forEach((deferral) => {
        deferral.isChecked = false
      })

      return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.filter.get', {
        locationCode: locationCode,
      }) + `?showFilter=true${filterString ? `&${filterString}` : ''}`);
    }
  }

  module.exports.postFilterDeferrals = function(app) {
    return function(req, res) {
      const data = {
        court: req.session.deferralMaintenance.court,
        deferrals: req.session.deferralMaintenance.deferrals,
        filters: {},
      };
      const currentPage = req.query['page'] || 1;
      const filters = {
        jurorNumber: req.query['jurorNumber'],
        firstName: req.query['firstName'],
        lastName: req.query['lastName'],
        deferredTo: req.query['deferredTo'],
      };
      const sortBy = req.query.sortBy || '';
      const sortOrder = req.query.sortOrder || '';
      let offset = 0;

      req.session.deferralMaintenance.filtered = [];

      app.logger.info('Filtering deferrals: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          filters,
        },
      });

      // TODO: refactor this gibberish
      if (filters.jurorNumber) {
        data.filters.jurorNumber = filters.jurorNumber;
        data.deferrals = data.deferrals.filter((deferral) => {
          return deferral.jurorNumber === filters.jurorNumber.trim();
        });
      }

      if (filters.firstName) {
        data.filters.firstName = filters.firstName;
        data.deferrals = data.deferrals.filter((deferral) => {
          return deferral.firstName.toLowerCase() === filters.firstName.trim().toLowerCase();
        });
      }

      if (filters.lastName) {
        data.filters.lastName = filters.lastName;
        data.deferrals = data.deferrals.filter((deferral) => {
          return deferral.lastName.toLowerCase() === filters.lastName.trim().toLowerCase();
        });
      }

      if (filters.deferredTo) {
        data.filters.deferredTo = filters.deferredTo;
        data.deferrals = data.deferrals.filter((deferral) => {
          return dateFilter(deferral.deferredTo, 'yyyy-MM-dd', 'DD/MM/YYYY')
            === filters.deferredTo.split('/').map(d => d.padStart(2, '0')).join('/');
        });
      }

      if (sortBy) {
        if (sortOrder === 'ascending') {
          data.deferrals.sort((a, b) => a[sortBy].toUpperCase().localeCompare(b[sortBy].toUpperCase()))
        } else {
          data.deferrals.sort((a, b) => b[sortBy].toUpperCase().localeCompare(a[sortBy].toUpperCase()))
        }
      }

      data.queryTotal = data.deferrals.length;

      // if we have filters, we then store the filtered deferrals because we need them
      const filterLength = Object.entries(data.filters).length;

      if (filterLength > 0) {
        req.session.deferralMaintenance.filtered =
          data.deferrals.reduce((prev, curr) => {
            prev.push(curr.jurorNumber);
            return prev;
          }, []);
      }

      if (currentPage > 1) {
        offset = modUtils.constants.PAGE_SIZE * (currentPage - 1);
      }

      if (data.queryTotal > modUtils.constants.PAGE_SIZE) {
        data.deferrals = data.deferrals.slice(offset, offset + modUtils.constants.PAGE_SIZE);
      }

      return render(app, data, !!Object.entries(data.filters).length)(req, res);
    };
  };

  module.exports.getCheckDeferral = function(app) {
    return function(req, res) {
      let juror;
      let total;

      if (req.params.jurorNumber === 'all') {
        if (req.query['isFiltered'] === 'true') {
          req.session.deferralMaintenance.deferrals.forEach((deferral) => {
            if (req.session.deferralMaintenance.filtered.includes(deferral.jurorNumber)) {
              deferral.isChecked = req.query['check'] === 'true';
            }
          });
        } else {
          req.session.deferralMaintenance.deferrals.forEach((deferral) => {
            deferral.isChecked = req.query['check'] === 'true';
          });
        }

        total = req.session.deferralMaintenance.deferrals.filter((deferral) => deferral.isChecked).length;

        return res.status(200).send({ isChecked: 'all', total });
      }

      juror = req.session.deferralMaintenance.deferrals.find((deferral) => {
        return deferral.jurorNumber === req.params['jurorNumber'];
      });
      juror.isChecked = !juror.isChecked;

      app.logger.debug('Checked or unchecked a deferral', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          deferral: juror.jurorNumber,
          checked: juror.isChecked,
        },
      });

      total = req.session.deferralMaintenance.deferrals.filter((deferral) => deferral.isChecked).length;

      return res.status(200).send({ jurorNumber: req.params['jurorNumber'], isChecked: juror.isChecked, total });
    };
  };

  module.exports.getProcessCheckedDeferrals = function(app) {
    return async function(req, res) {
      const deferralsToProcess = extractDeferralsToProcess(req.session.deferralMaintenance.deferrals);

      if (!deferralsToProcess || !deferralsToProcess.length) {
        req.session.errors = {
          deferrals: [{
            summary: 'Select the deferrals you want to add to a pool',
            details: 'Select the deferrals you want to add to a pool',
          }],
        };

        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.filter.get', {
          locationCode: req.params['locationCode'],
        }));
      }

      try {
        const data = await requestObj.availablePools.get(req, req.params['locationCode'])

        const tmpErrors = _.clone(req.session.errors);

        delete req.session.errors;

        app.logger.info('Fetched available pools: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            pools: data.deferralPoolsSummary[0].deferralOptions,
            courtCode: req.params['locationCode'],
          },
        });

        const sortedPools = data.deferralPoolsSummary[0].deferralOptions.sort(function(a, b){
          return new Date(a.serviceStartDate) - new Date(b.serviceStartDate);
        });

        return res.render('pool-management/deferral-maintenance/pools.njk', {
          locationCode: req.params['locationCode'],
          pools: sortedPools,
          errors: {
            title: 'There is a problem',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        req.session.errors = {
          deferrals: [{
            summary: 'Failed to fetch available pools',
            details: 'Failed to fetch available pools',
          }],
        };

        app.logger.crit('Failed to fetch available pools: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            courtCode: req.params['locationCode'],
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.filter.get', {
          locationCode: req.params['locationCode'],
        }));
      }
    }
  };

  module.exports.postProcessCheckedDeferrals = function(app) {
    return async function(req, res) {
      let validatorResult;
      let deferralsToProcess;

      validatorResult = validate(req.body, validator.selectedActivePool());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintencance.process.get', {
          locationCode: req.params['locationCode'],
        }));
      }

      deferralsToProcess = extractDeferralsToProcess(req.session.deferralMaintenance.deferrals);

      try {
        await requestObj.allocateJurors.post(req, deferralsToProcess, req.body.poolNumber);

        const courtCode = req.params['locationCode'];
        const poolUrl = app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.body.poolNumber,
        });

        delete req.session.deferralMaintenance;

        req.session.bannerMessage
          = `Selected jurors added to pool <a href="${poolUrl}" class="govuk-link">${req.body.poolNumber}</a>`;

        app.logger.info('Finished processing all selected deferrals: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            deferrals: deferralsToProcess,
            poolNumber: req.body.poolNumber,
          },
        });

        return requestObj
          .deferrals.get(req, courtCode)
          .then((data) => successCB(data, courtCode)(app, req, res))
          .catch((err) => errorCB(err)(app, req, res));
          
      } catch (err) {
        if (err.statusCode === 422) {
          switch (err.error?.code) {
            case 'CANNOT_DEFER_TO_EXISTING_POOL':
              req.session.errors = modUtils.makeManualError('deferrals', 'You cannot defer into the juror\'s existing pool - please select a different pool or date');
              break;
            case 'JUROR_DATE_OF_BIRTH_REQUIRED':
              req.session.errors = modUtils.makeManualError('deferrals', 'You cannot postpone a juror without a date of birth - please ensure all selected jurors have a date of birth');
              break;
            default:
              app.logger.crit('Failed to process the selected deferrals: ', {
                auth: req.session.authentication,
                jwt: req.session.authToken,
                data: {
                  deferrals: deferralsToProcess,
                  poolNumber: req.body.poolNumber,
                },
                error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
              });
              req.session.errors = modUtils.makeManualError('deferrals', 'Failed to process the selected deferrals');
          }
        } else {
          app.logger.crit('Failed to process the selected deferrals: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              deferrals: deferralsToProcess,
              poolNumber: req.body.poolNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
          req.session.errors = modUtils.makeManualError('deferrals', 'Failed to process the selected deferrals');
        }
        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintencance.process.get', {
          locationCode: req.params['locationCode'],
        }));

      }
    };
  };

  function render(app, data, isFiltered = false) {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const bannerMessage = req.session.bannerMessage;
      let renderData;
      const sortBy = req.query.sortBy || '';
      const sortOrder = req.query.sortOrder || '';

      delete req.session.bannerMessage;
      delete req.session.errors;
      delete req.session.postponeToDate;

      if (data) {
        renderData = _.clone(data);
        renderData.court = data.court;

        renderData.count = {
          total: req.session.deferralMaintenance.deferrals.length,
          selected: req.session.deferralMaintenance.deferrals.filter((deferral) => deferral.isChecked).length,
        };

        if (data.queryTotal > modUtils.constants.PAGE_SIZE) {
          renderData.pagination =
            modUtils.paginationBuilder(data.queryTotal, req.query['page'] || 1, req.url);
        }
      }

      const table = renderData ? createDeferralsTable(app)(renderData, sortBy, sortOrder, isFiltered) : '';

      let urlPrefix = '';
      if (isFiltered) {
        const filters = _.clone(req.query);
        delete filters.sortOrder;
        delete filters.sortBy;
        delete filters.page;
        urlPrefix = `?${new URLSearchParams(filters).toString()}`
      }


      return res.render('pool-management/deferral-maintenance/index', {
        deferralMaintenance: true,
        isBureauUser: isBureauUser(req),
        courts: modUtils.transformCourtNames(req.session.courtsList),
        errors: {
          title: 'There is a problem',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
        data: {
          hasData: typeof data !== 'undefined',
          bannerMessage,
          ...renderData,
        },
        table,
        urlPrefix,
      });
    };
  }

  module.exports.postPostpone = function(app) {
    return (req, res) => {
      if (req.body['select-all-jurors']) {
        req.session.selectedDeferralJurors = req.session.deferralMaintenance.deferrals;
      } else if (Array.isArray(req.body.selectedJurors)) {
        req.session.selectedDeferralJurors = req.body.selectedJurors.map(juror =>
          req.session.deferralMaintenance.deferrals.find(item => item.jurorNumber === juror)
        );
      } else if (req.body.selectedJurors) {
        req.session.selectedDeferralJurors = [
          req.session.deferralMaintenance.deferrals.find(item => item.jurorNumber === req.body.selectedJurors),
        ];
      } else {
        req.session.errors = modUtils.makeManualError('selectedJurors', 'Select at least one juror');
        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.filter.get', {
          locationCode: req.params.locationCode,
        }));
      }

      return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.postpone.date.get', {
        locationCode: req.params.locationCode,
      }));
    };
  };

  module.exports.getMoveCourt = function(app) {
    return async function(req, res) {
      const deferralsToProcess = extractDeferralsToProcess(req.session.deferralMaintenance.deferrals);

      if (!deferralsToProcess || !deferralsToProcess.length) {
        req.session.errors = {
          deferrals: [{
            summary: 'Select the deferrals you want to move court',
            details: 'Select the deferrals you want to move court',
          }],
        };

        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.filter.get', {
          locationCode: req.params['locationCode'],
        }));
      }

      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);
      delete req.session.errors;
      delete req.session.formFields;

      if (!req.session.courtsList?.length) { 
        try {
          const courtsData = await fetchCourtsDAO.get(req);
          req.session.courtsList = courtsData.courts;
        } catch (err) {
          app.logger.crit('Failed to fetch courts list', {
            auth: req.session.authentication,
            token: req.session.authToken,
            error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          });
        }
      }

      const transformedCourtNames = modUtils.transformCourtNames(_.clone(req.session.courtsList));

      return res.render('pool-management/_common/select-court', {
        pageTitle: 'Select a court to move the selected jurors to',
        courts: transformedCourtNames,
        submitUrl: app.namedRoutes.build('pool-management.deferral-maintenance.move-court.select-court.post', {
          locationCode: req.params['locationCode'],
        }),
        cancelUrl: app.namedRoutes.build('pool-management.deferral-maintenance.filter.get', {
          locationCode: req.params['locationCode'],
        }),
        pageIdentifier: 'Deferral maintenance - Move court',
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
        tmpBody,
      });
    }
  };

  module.exports.postMoveCourt = function(app) {
    return async function(req, res) {
      const { locationCode } = req.params;

      const validatorResult = validate(req.body, courtNameOrLocationValidator(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.move-court.select-court.get', {
          locationCode,
        }));
      }

      let courtData;
      try {
        courtData = await modUtils.matchUserCourt(req.session.courtsList, req.body);
      } catch (err) {
        req.session.errors = {
          courtNameOrLocation: [{
            summary: 'Please check the court name or location',
            details: 'We could not find that court. Select another one or go back',
          }],
        };

        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.move-court.select-court.get', {
          locationCode,
        }));
      }

      return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.move-court.select-pool.get', {
        locationCode,
        newLocationCode: courtData.locationCode,
      }))

    };
  };

  module.exports.getMoveCourtPools = function(app) {
    return async function(req, res) {
      const { locationCode, newLocationCode } = req.params;
      try {
        const data = await requestObj.availablePools.get(req, newLocationCode)

        const tmpErrors = _.clone(req.session.errors);

        delete req.session.errors;

        app.logger.info('Fetched available pools to move court: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            pools: data.deferralPoolsSummary[0].deferralOptions,
            courtCode: newLocationCode,
          },
        });

        const sortedPools = data.deferralPoolsSummary[0].deferralOptions.sort(function(a, b){
          return new Date(a.serviceStartDate) - new Date(b.serviceStartDate);
        });

        return res.render('pool-management/deferral-maintenance/pools.njk', {
          locationCode: newLocationCode,
          pools: sortedPools,
          submitUrl: app.namedRoutes.build('pool-management.deferral-maintenance.move-court.select-pool.post', {
            locationCode,
            newLocationCode,
          }),
          backLinkUrl: {
            built: true,
            url: app.namedRoutes.build('pool-management.deferral-maintenance.move-court.select-court.get', {
              locationCode,
            }),
          },
          errors: {
            title: 'There is a problem',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to fetch available pools: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            courtCode: newLocationCode,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postMoveCourtPools = function(app) {
    return async function(req, res) {
      const { locationCode, newLocationCode } = req.params;

      let courtData;
      try {
        courtData = await modUtils.matchUserCourt(req.session.courtsList, {
          courtNameOrLocation: newLocationCode,
        });
      } catch (err) {
        req.session.errors = {
          courtNameOrLocation: [{
            summary: 'Please check the court name or location',
            details: 'We could not find that court. Select another one or go back',
          }],
        };

        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.move-court.select-court.get', {
          locationCode,
        }));
      }

      const jurors = extractDeferralsToProcess(req.session.deferralMaintenance.deferrals, true);

      // TODO: Update payload once API is available
      // This is a placeholder - contains more information than probably needed
      const payload = {
        receivingCourtLocationCode: courtData.locationCode,
        receivingPoolNumber: req.body.poolNumber,
        jurors: jurors.map(juror => ({
          jurorNumber: juror.jurorNumber,
          sourcePoolNumber: juror.poolNumber,
          sendingCourtLocationCode: locationCode,
          deferredTo: juror.deferredTo,
        })),
      }

      try {
        // TODO: Implement API call once it's available
        // await requestObj.moveCourt.post(req, payload);
      } catch(err) {
        app.logger.crit('Failed to move the selected deferrals to another court: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: payload,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }

      // TODO: Validate if message is still relevant after API implementation
      req.session.bannerMessage
          = `${jurors.length} Juror${jurors.length > 1 ? '\'s' : ''} successfully moved to
           <span class="govuk-!-font-weight-bold">${transformCourtName(courtData)}</span>
           and remain deferred`;

      return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.filter.get', {
        locationCode,
      }))
    };
  };

  /**
   *
   * @param {object} deferrals Full loaded list of deferrals
   * @returns {string[]} An array of deferral numbers
   */
  function extractDeferralsToProcess(deferrals, allJurorDetails = false) {
    return deferrals.reduce((deferralNumbers, deferral) => {
      if (deferral.isChecked) {
        if (allJurorDetails) {
          deferralNumbers.push(deferral);
        } else {
          deferralNumbers.push(deferral.jurorNumber);
        }
      }
      return deferralNumbers;
    }, []);
  }

  const createDeferralsTable = (app) => (data, sortBy, order, isFiltered) => {
    const headers = [
      {
        id: 'selectAll',
        html: `<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">\n` +
                `<input\n` +
                  `type="checkbox"\n` +
                  `class="govuk-checkboxes__input select-check staff-select-check"\n` +
                  `id="deferral-all"\n` +
                  `name="check-all-jurors"\n` +
                  `aria-label="select-all-deferrals"\n` +
                  `data-is-filtered="${ isFiltered }"\n` +
                  (data.count.selected === data.queryTotal ? "    checked\n" : "") +
                `>\n` +
                `<label class="govuk-label govuk-checkboxes__label govuk-!-padding-0" for="deferral-all">\n` +
                  `<span class="govuk-visually-hidden">Select All</span>\n` +
                `</label>\n` +
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
      },
      {
        id: 'poolNumber',
        value: 'Pool number',
        sort: sortBy === 'poolNumber' ? order : 'none',
        sortable: true,
      },
      {
        id: 'deferredTo',
        value: 'Deferred to',
        sort: sortBy === 'deferredTo' ? order : 'none',
        sortable: true,
      }
    ]

    const rows = data.deferrals.map((juror) => {
      return [
        {
          html: `<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">\n` +
                  `<input type="checkbox" class="govuk-checkboxes__input select-check staff-select-check"\n` +
                    `id="deferral-${ juror.jurorNumber }"\n` +
                    `${juror.isChecked ? 'checked' : ''}\n` +
                    `name="selectedJurors"\n` +
                    `value="${juror.jurorNumber}"\n` +
                    `aria-label="deferral-select-${juror.jurorNumber}"/>\n` +
                  `<label class="govuk-label govuk-checkboxes__label govuk-!-padding-0" for="deferral-${ juror.jurorNumber }">\n` +
                    `<span class="govuk-visually-hidden">Select juror number ${ juror.jurorNumber }</span>\n` +
                  `</label>\n` +
                `</div>`
        },
        {
          html: `<a class='govuk-link' href='${app.namedRoutes.build('juror-record.overview.get', { jurorNumber: juror.jurorNumber })}'> ${juror.jurorNumber} </a>`,
          classes: 'jd-middle-align',
        },
        {
          text: juror.firstName,
          classes: 'jd-middle-align',
        },
        {
          text: juror.lastName,
          classes: 'jd-middle-align',
        },
        {
          html: `<a class='govuk-link' href='${app.namedRoutes.build('pool-overview.get', { poolNumber: juror.poolNumber })}'> ${juror.poolNumber} </a>`,
          classes: 'jd-middle-align',
        },
        {
          text: dateFilter(juror.deferredTo, "yyyy-MM-DD", "ddd DD MMM YYYY"),
          classes: 'jd-middle-align',
        },
      ]
    })
  
    return {headers, rows}
  }

})();
