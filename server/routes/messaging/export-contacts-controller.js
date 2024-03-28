(function() {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
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
      let queryParams;

      switch (searchBy) {
      case 'jurorNumber':
        queryParams = `?search_by=juror&juror_number=${req.body.jurorNumber}`;
        break;
      case 'jurorName':
        queryParams = `?search_by=juror&juror_name=${req.body.jurorName}`;
        break;
      case 'pool':
        queryParams = `?search_by=pool&pool_number=${req.body.poolNumber}`;
        break;
      case 'court':
        queryParams = `?search_by=court&court_name=${req.body.courtName}`;
        break;
      case 'deferredTo':
        queryParams = `?search_by=date&date_deferred_to=${req.body.deferredTo}`;
        break;
      }

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

      // eslint-disable-next-line max-len
      if (isEmpty(searchBy) || (isEmpty(jurorNumber) && isEmpty(jurorName) && isEmpty(poolNumber) && isEmpty(courtName) && isEmpty(dateDeferredTo))) {
        return res.redirect(app.namedRoutes.build('messaging.export-contacts.get'));
      }

      const locCode = req.session.authentication.locCode;
      const payload = buildSearchPayload(req.body);
      let jurorsList;

      debugger;

      try {
        jurorsList = await jurorSearchDAO.post(app, req, locCode, payload, true);

        debugger;
      } catch (err) {
        console.log(err);
        return; // do not continue on the error
      }

      debugger;

      return res.render('messaging/export-contact-details/jurors-list.njk', {
        origin: 'EXPORT_DETAILS',
        totalJurors: jurorsList.total_items,
        jurorsList: jurorsList.data,
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('messaging.export-contacts.get'),
        },
      });
    };
  };

  module.exports.postJurorsList = function(app) {
    return function(req, res) {
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
        });

        return res.redirect(app.namedRoutes.build('messaging.export-contacts.details-to-export.get'));
      }
    };
  };

  function buildSearchPayload(body) {
    const payload = {
      pageLimit: 25,
      pageNumber: 1,
    };

    if (body.search_by === 'jurorNumber') {
      payload['juror_number'] = body.jurorNumber;
    }
    if (body.search_by === 'jurorName') {
      payload['juror_name'] = body.jurorName;
    }
    if (body.search_by === 'pool') {
      payload['pool_number'] = body.poolNumber;
    }
    if (body.search_by === 'court') {
      payload['court_name'] = body.courtName;
    }
    if (body.search_by === 'deferredTo') {
      payload['date_deferred_to'] = body.deferredTo;
    }

    return payload;
  }


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
