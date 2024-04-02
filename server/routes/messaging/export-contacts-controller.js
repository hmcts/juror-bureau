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

  module.exports.getExportContacts = function(app) {
    return async function(req, res) {
      let courtsResponse;
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.messaging;
      delete req.session.errors;

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

        return res.redirect(app.namedRoutes.build('messaging.export-contacts.get'));
      }

      const postUrl = app.namedRoutes.build('messaging.export-contacts.jurors.get');
      const queryParams = buildQueryParams(searchBy, req.body);

      return res.redirect(postUrl + queryParams);
    };
  };

  module.exports.getJurorsList = function(app) {
    return async function(req, res) {
      const {
        search_by: searchBy,
        juror_number: jurorNumber,
        juror_name: jurorName,
        pool_number: poolNumber,
        court_name: courtName,
        date_deferred_to: dateDeferredTo,
      } = req.query;
      const isEmpty = v => !v || v === '';
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      // eslint-disable-next-line max-len
      if (isEmpty(searchBy) || (isEmpty(jurorNumber) && isEmpty(jurorName) && isEmpty(poolNumber) && isEmpty(courtName) && isEmpty(dateDeferredTo))) {
        return res.redirect(app.namedRoutes.build('messaging.export-contacts.get'));
      }

      const renderView = (totalJurors, jurors) => {
        res.render('messaging/export-contact-details/jurors-list.njk', {
          origin: 'EXPORT_DETAILS',
          totalJurors,
          jurors,
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
      const payload = buildSearchPayload(req.query);
      let jurorsList;
      let formatedList;

      try {
        jurorsList = await jurorSearchDAO.post(app, req, locCode, payload);

        formatedList = modUtils.replaceAllObjKeys(jurorsList.data, _.camelCase);
      } catch (err) {
        return renderView(0, []);
      }

      return renderView(jurorsList.total_items, formatedList);
    };
  };

  module.exports.postJurorsList = function(app) {
    return function(req, res) {
      const { selectedJurors } = req.body;
      const { search_by: searchBy } = req.query;

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

      req.session.messaging = {
        selectedJurors,
      };

      return res.redirect(app.namedRoutes.build('messaging.export-contacts.details-to-export.get'));
    };
  };

  module.exports.getSelectDetailsToExport = function() {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      return res.render('messaging/export-contact-details/details-to-export.njk', {
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

        return res.redirect(app.namedRoutes.build('messaging.export-contacts.details-to-export.get'));
      }

      const locCode = req.session.authentication.locCode;
      const payload = {
        jurors: [
          { 'juror_number': '641500001', 'pool_number': '415240501' },
          { 'juror_number': '641500002', 'pool_number': '415240501' },
          { 'juror_number': '641500007', 'pool_number': '415240501' },
        ],
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

  function buildSearchPayload(query) {
    const payload = {
      pageLimit: 25,
      pageNumber: 1,
    };

    if (query.search_by === 'jurorNumber') {
      payload['juror_number'] = query.juror_number;
    }
    if (query.search_by === 'jurorName') {
      payload['juror_name'] = query.juror_name;
    }
    if (query.search_by === 'pool') {
      payload['pool_number'] = query.pool_number;
    }
    if (query.search_by === 'court') {
      payload['court_name'] = query.court_name;
    }
    if (query.search_by === 'deferredTo') {
      payload['date_deferred_to'] = query.deferred_to;
    }

    return payload;
  }

  function buildQueryParams(searchBy, query) {
    let queryParams = '';

    switch (searchBy) {
    case 'jurorNumber':
      queryParams = `?search_by=juror&juror_number=${query.juror_number || query.jurorNumber}`;
      break;
    case 'jurorName':
      queryParams = `?search_by=juror&juror_name=${query.juror_name || query.jurorName}`;
      break;
    case 'pool':
      queryParams = `?search_by=pool&pool_number=${query.pool_number || query.poolNumber}`;
      break;
    case 'court':
      queryParams = `?search_by=court&court_name=${query.court_name || query.courtName}`;
      break;
    case 'deferredTo':
      queryParams = `?search_by=date&date_deferred_to=${query.deferred_to || query.deferredTo}`;
      break;
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
