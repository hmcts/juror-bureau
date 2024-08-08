(function() {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const modUtils = require('../../lib/mod-utils');
  const {
    exportContactDetailsValidator,
    detailsToExportValidator,
  } = require('../../config/validation/export-contact-details');
  const { fetchAllCourts } = require('../../objects/request-pool');
  const { transformCourtNames } = require('../../lib/mod-utils');
  const { jurorSearchDAO, downloadCSVDAO } = require('../../objects/messaging');
  const { dateFilter, capitalise } = require('../../components/filters');

  module.exports.getExportContacts = function(app) {
    return async function(req, res) {
      let courtsResponse;
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.messaging;
      delete req.session.errors;

      req.session.messaging = {};

      try {
        courtsResponse = await fetchAllCourts.get(require('request-promise'), app, req.session.authToken);
      } catch (err) {
        app.logger.crit('Failed to fetch all courts', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        // set it to be empty so that the page can still be rendered
        courtsResponse = {
          courts: [],
        };
      }

      return res.render('messaging/export-contact-details/find-contact-details.njk', {
        nav: 'export',
        courts: transformCourtNames(courtsResponse.courts),
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postExportContacts = function(app) {
    return function(req, res) {
      const { searchBy } = req.body;

      const validatorResult = validate(req.body, exportContactDetailsValidator(req.body));

      if (validatorResult) {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('messaging.export-contacts.get', {
          message: 'export-contact-details',
        }));
      }

      if (searchBy === 'trial') {
        return res.redirect(app.namedRoutes.build('messaging.export-contacts.trials.get', {
          message: 'export-contact-details',
        }));
      }

      const postUrl = app.namedRoutes.build('messaging.export-contacts.jurors.get');
      const queryParams = buildQueryParams(searchBy, req.body);

      return res.redirect(postUrl + queryParams);
    };
  };

  module.exports.getJurorsList = function(app) {
    return async function(req, res) {
      const {
        searchBy,
        jurorNumber,
        jurorName,
        poolNumber,
        courtName,
        dateDeferredTo,
        nextDueAtCourtDate,
        postcode,
        trialNumber,
        sortBy,
        sortOrder,
      } = req.query;
      const isEmpty = v => !v || v === '';
      const tmpErrors = _.clone(req.session.errors);
      const currentPage = req.query.page || 1;

      delete req.session.errors;

      // eslint-disable-next-line max-len
      if (isEmpty(searchBy) || (
        isEmpty(jurorNumber)
        && isEmpty(jurorName)
        && isEmpty(poolNumber)
        && isEmpty(courtName)
        && isEmpty(dateDeferredTo)
        && isEmpty(postcode)
        && isEmpty(nextDueAtCourtDate)
        && isEmpty(trialNumber)
      )) {
        return res.redirect(app.namedRoutes.build('messaging.export-contacts.get'));
      }

      if (req.query.clearFilters === 'true') {
        delete req.query.include;
        delete req.query.showOnly;
      }

      const urlPrefix = buildQueryParams(searchBy, req.query);

      const clearFiltersUrl = app.namedRoutes.build('messaging.export-contacts.jurors.get') + urlPrefix
        + '&clearFilters=true';
      const filterUrl = app.namedRoutes.build('messaging.export-contacts.jurors.filter.post') + urlPrefix;
      const submitUrl = app.namedRoutes.build('messaging.export-contacts.jurors.post') + urlPrefix;

      if (!req.session.messaging) {
        req.session.messaging = {};
      }

      const renderView = (totalJurors, jurors, pagination, errorMetadata) => {
        res.render('messaging/export-contact-details/jurors-list.njk', {
          origin: 'EXPORT_DETAILS',
          totalJurors,
          errorMetadata,
          jurors,
          pagination,
          checkedJurors: req.session.messaging?.checkedJurors,
          urlPrefix,
          sortBy,
          sortOrder,
          filterUrl,
          clearFiltersUrl,
          submitUrl,
          showOnly: req.query.showOnly ? req.query.showOnly.split(',') : [],
          include: req.query.include ? req.query.include.split(','): [],
          backLinkUrl: {
            built: true,
            url: app.namedRoutes.build('messaging.export-contacts.get'),
          },
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      };

      const locCode = req.session.authentication.locCode;
      const payload = buildSearchPayload(req.query, currentPage);
      let jurorsList;
      let formatedList;
      let pagination;

      try {
        jurorsList = await jurorSearchDAO.post(req, locCode, payload);

        formatedList = modUtils.replaceAllObjKeys(jurorsList.data, _.camelCase);

        if (jurorsList.total_items > modUtils.constants.PAGE_SIZE) {
          pagination = modUtils.paginationBuilder(jurorsList.total_items, currentPage, req.url);
        }
      } catch (err) {
        app.logger.crit('Something went wrong searching for jurors to export contact details for', {
          auth: req.session.authentication,
          data: payload,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        /** @type {number | 'MAX_ITEMS_EXCEEDED'} */
        let _totalJurors = 0;

        if (err.error?.code === 'MAX_ITEMS_EXCEEDED') {
          _totalJurors = 'MAX_ITEMS_EXCEEDED';
        }

        return renderView(_totalJurors, [], null, err.error?.meta_data);
      }

      return renderView(jurorsList.total_items, formatedList, pagination);
    };
  };

  module.exports.postJurorsFilter = function(app) {
    return function(req, res) {
      delete req.query.include;
      delete req.query.showOnly;

      if (req.body) {
        if (req.body.include) {
          req.query.include = req.body.include;
          req.query.showFilter = 'true';
        }
        if (req.body.showOnly) {
          req.query.showOnly = req.body.showOnly;
          req.query.showFilter = 'true';
        }
      }

      // on applying filters clear jurors checked
      req.session.messaging.checkedJurors = [];

      const queryParams = buildQueryParams(req.query.searchBy, req.query);

      return res.redirect(app.namedRoutes.build('messaging.export-contacts.jurors.get') + queryParams);
    };
  };

  module.exports.postJurorsList = function(app) {
    return function(req, res) {
      const { selectedJurors } = req.body;
      const { searchBy } = req.query;

      const queryParams = buildQueryParams(searchBy, req.query);

      if (!selectedJurors || selectedJurors.length === 0) {
        req.session.errors = {
          selectedJurors: [{
            details: 'Please select at least one juror to export',
            summary: 'Please select at least one juror to export',
          }],
        };

        return res.redirect(app.namedRoutes.build('messaging.export-contacts.jurors.get') + queryParams);
      }

      return res.redirect(app.namedRoutes.build('messaging.export-contacts.details-to-export.get'));
    };
  };

  module.exports.getSelectDetailsToExport = function() {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const formFields = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('messaging/export-contact-details/details-to-export.njk', {
        formFields,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postSelectDetailsToExport = function(app) {
    return async function(req, res) {
      const validatorResult = validate(req.body, detailsToExportValidator());

      if (validatorResult) {
        req.session.errors = validatorResult;
        req.session.formFields = _.clone(req.body);

        return res.redirect(app.namedRoutes.build('messaging.export-contacts.details-to-export.get'));
      }

      const locCode = req.session.authentication.locCode;
      const payload = {
        jurors: req.session.messaging.checkedJurors.reduce((jurors, juror) => {
          jurors.push({
            'juror_number': juror.jurorNumber,
            'pool_number': juror.poolNumber,
          });

          return jurors;
        }, []),
      };

      populateContactExportProperties(payload, req.body);

      try {
        const csv = await downloadCSVDAO.post(app, req, locCode, payload);

        app.logger.info('Generated and downloded a csv with contact details', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: payload,
        });

        res.set('content-disposition', 'attachment; filename=juror_export_details.csv');
        res.type('csv');
        return res.send(csv);
      } catch (err) {
        app.logger.crit('Failed to generate and download csv file with contact details', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: payload,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.redirect(app.namedRoutes.build('messaging.export-contacts.details-to-export.get'));
      }
    };
  };

  module.exports.postCheckJuror = function(app) {
    return async function(req, res) {
      const { jurorNumber, poolNumber, action, checkAll } = req.query;

      if (!req.session.messaging.checkedJurors) req.session.messaging.checkedJurors = [];

      if (checkAll === 'true') {
        const searchPayload = buildSearchPayload(req.query, 1);

        if (action === 'check') {

          try {
            const opts = {
              ...searchPayload,
              pageNumber: 1,
              pageLimit: 500,
            };

            let jurorsData = await jurorSearchDAO.post(
              req,
              req.session.authentication.owner,
              opts,
              true,
            );

            // clear the array quickly
            req.session.messaging.checkedJurors = [];

            jurorsData.data.forEach(juror => {
              req.session.messaging.checkedJurors.push({
                jurorNumber: juror.juror_number,
                poolNumber: juror.pool_number,
              });
            });

          } catch (err) {
            app.logger.crit('Failed to check the juror to export contact details for', {
              auth: req.session.authentication,
              data: { jurorNumber, poolNumber, action },
              error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
            });

            return res.status(500).send();
          }

        } else {
          // uncheck everyone
          req.session.messaging.checkedJurors = [];
        }
      } else {
        if (action === 'check') {
          req.session.messaging.checkedJurors.push({ jurorNumber, poolNumber });
        }

        if (action === 'uncheck') {
          req.session.messaging.checkedJurors = req.session.messaging.checkedJurors
            .filter(juror => (juror.jurorNumber !== jurorNumber));
        }
      }

      app.logger.info('Checked a juror to export contact details for', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
      });

      res.status(200).send(req.session.messaging.checkedJurors.length.toString());
    };
  };

  function buildSearchPayload(query, currentPage) {
    const payload = {
      pageLimit: modUtils.constants.PAGE_SIZE,
      pageNumber: currentPage,
      filters: [],
    };

    switch (query.searchBy) {
    case 'jurorNumber':
      payload['juror_search'] = {};
      payload['juror_search'].jurorNumber = query.jurorNumber;
      break;
    case 'jurorName':
      payload['juror_search'] = {};
      payload['juror_search'].jurorName = query.jurorName;
      break;
    case 'pool':
      payload['pool_number'] = query.poolNumber;
      break;
    case 'court':
      payload['court_name'] = query.courtName;
      break;
    case 'date':
      if (query.dateDeferredTo) {
        payload['date_deferred_to'] = dateFilter(query.dateDeferredTo, 'DD/MM/YYYY', 'YYYY-MM-DD');
      }
      if (query.nextDueAtCourtDate) {
        payload['next_due_at_court_date'] = dateFilter(query.nextDueAtCourtDate, 'DD/MM/YYYY', 'YYYY-MM-DD');
      }
      break;
    case 'postcode':
      payload['juror_search'] = {};
      payload['juror_search'].postcode = query.postcode;
      break;
    case 'trial':
      payload['trial_number'] = decodeURIComponent(query.trialNumber);
      break;
    }

    if (query.sortOrder) {
      payload['sort_method'] = query.sortOrder === 'ascending' ? 'ASC' : 'DESC';
    }
    if (query.sortBy) {
      payload['sort_field'] = capitalise(_.snakeCase(query.sortBy)) || null;
    }
    if (query.include) {
      payload['filters'] = [ ...payload.filters, ...query.include.split(',') ];
    }
    if (query.showOnly) {
      payload['filters'] = [ ...payload.filters, ...query.showOnly.split(',') ];
    }

    return payload;
  }

  function buildQueryParams(searchBy, query) {
    let queryParams = '';

    switch (searchBy) {
    case 'jurorNumber':
      queryParams = `?searchBy=jurorNumber&jurorNumber=${query.jurorNumber}`;
      break;
    case 'jurorName':
      queryParams = `?searchBy=jurorName&jurorName=${query.jurorName}`;
      break;
    case 'pool':
      queryParams = `?searchBy=pool&poolNumber=${query.poolNumber}`;
      break;
    case 'court':
      queryParams = `?searchBy=court&courtName=${query.courtName}`;
      query.showOnly = 'SHOW_ONLY_DEFERRED';
      break;
    case 'dateDeferredTo':
      queryParams = `?searchBy=date&dateDeferredTo=${query.dateDeferredTo}`;
      break;
    case 'nextDueAtCourtDate':
      queryParams = `?searchBy=date&nextDueAtCourtDate=${query.nextDueAtCourtDate}`;
      break;
    case 'postcode':
      queryParams = `?searchBy=postcode&postcode=${query.postcode}`;
      break;
    case 'trial':
      queryParams = `?searchBy=trial&trialNumber=${encodeURIComponent(query.trialNumber)}`;
      break;
    }

    if (query.include) {
      queryParams += `&include=${query.include}`;
    }
    if (query.showOnly) {
      queryParams += `&showOnly=${query.showOnly}`;
    }
    if (query.showFilter) {
      queryParams += '&showFilter=true';
    }

    return queryParams;
  };


  function populateContactExportProperties(payload, body) {
    payload['export_items'] = body.detailsToExport;

    if (body.detailsToExport.includes('ADDRESS')) {
      payload.export_items.push('ADDRESS_LINE_1');
      payload.export_items.push('ADDRESS_LINE_2');
      payload.export_items.push('ADDRESS_LINE_3');
      payload.export_items.push('ADDRESS_LINE_4');
      payload.export_items.push('ADDRESS_LINE_5');

      payload['export_items'] = payload.export_items.filter(item => item !== 'ADDRESS');
    }
  }

})();
