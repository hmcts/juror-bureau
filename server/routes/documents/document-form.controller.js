(function() {
  'use strict';

  const _ = require('lodash');
  const urljoin = require('url-join');
  const validate = require('validate.js');
  const validator = require('../../config/validation/document-form');
  const showCauseValidator = require('../../config/validation/show-cause');
  const modUtils = require('../../lib/mod-utils');
  const { reissueLetterDAO } = require('../../objects/documents');
  const { dateFilter } = require('../../components/filters');
  const { isCourtUser } = require('../../components/auth/user-type');

  module.exports.getDocumentForm = function(app) {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const backLinkUrl = app.namedRoutes.build('documents.get');
      const formFields = _.clone(req.session.formFields);

      delete req.session.formFields;
      const { document } = req.params;
      const postUrl = app.namedRoutes.build('documents.form.post', {
        document,
      });
      const cancelUrl = app.namedRoutes.build('documents.form.get', {
        document,
      });

      const today = new Date();
      let tomorrow = new Date();

      const postUrlDocumentForm = urljoin(app.namedRoutes.build('documents.show-cause.post', {
        document,
      }), urlBuilder(req.query));

      tomorrow.setDate(today.getDate() + 1);

      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.documentsJurorsList;


      const template = (document === 'show-cause') ? 'show-cause-form' : 'document-form';
      const postForm = document === 'show-cause' ? postUrlDocumentForm : postUrl;


      return res.render(`documents/_common/${template}.njk`, {
        postUrl: postForm,
        cancelUrl,
        backLinkUrl,
        minDate: dateFilter(tomorrow, null, 'DD/MM/YYYY'),
        urlParams: req.query,
        pageIdentifier: modUtils.getLetterIdentifier(document),
        errors: {
          title: 'There is a problem',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
        formFields,
      });
    };
  };

  module.exports.postDocumentForm = function(app) {
    return async function(req, res) {

      const { document } = req.params;
      const formValidator = document === 'show-cause'
        ? showCauseValidator.showCaseForm() : validator.documentForm(req.body);
      const validatorResult = validate(req.body, formValidator);

      delete req.session.errors;

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('documents.form.get', {
          document,
        }));
      };

      try {
        const payload = buildPayload(req);

        payload.document = document;
        payload['letter_type'] = modUtils.LetterType[document];

        delete payload._csrf;

        let response;

        if (isCourtUser(req, res)) {
          response = await reissueLetterDAO.getListCourt(req, payload);
          response.dataTypes.push('hidden');
          response.headings.push('Row Id');
          response.data.forEach((juror, i) => {
            juror.id = i;
          });
        } else {
          response = await reissueLetterDAO.getList(req, payload);
        }


        // TODO: maybe sort the list before caching? ... so we have the pending / - always first
        req.session.documentsJurorsList = response;

        app.logger.info('Fetched the list of juror documents: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: { ...payload },
        });
        return res.redirect(urljoin(app.namedRoutes.build('documents.letters-list.get', {
          document: document,
        }), urlBuilder(req.body)));
      } catch (err) {
        // A 404 means no results were found
        if (err.statusCode === 404) {
          req.session.documentsJurorsList = {
            headings: [],
            'dataTypes': [],
            data: [],
          };

          return res.redirect(urljoin(app.namedRoutes.build('documents.letters-list.get', {
            document,
          }), urlBuilder(req.body)));
        }

        app.logger.crit('Failed to fetch documents / jurors list: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: { ...req.body },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

  function urlBuilder(params) {
    var parameters = [];

    if (params.documentSearchBy) {
      parameters.push('documentSearchBy=' + params.documentSearchBy);
    }

    if (params.jurorNumber) {
      parameters.push('jurorNumber=' + params.jurorNumber);
    }

    if (params.jurorName) {
      parameters.push('jurorName=' + params.jurorName);
    }

    if (params.postcode) {
      parameters.push('postcode=' + params.postcode);
    }

    if (params.poolDetails) {
      parameters.push('poolDetails=' + params.poolDetails);
    }

    if (params.includePrinted) {
      parameters.push('includePrinted=' + params.includePrinted);
    }

    if (params.hearingDate) {
      parameters.push('hearingDate=' + params.hearingDate);
    }

    if (params.hearingTimeHour && params.hearingTimeMinute && params.hearingTimePeriod) {
      parameters.push('hearingTime=' + modUtils.convertTimeToHHMM(
        params.hearingTimeHour, params.hearingTimeMinute, params.hearingTimePeriod)
      );
    }

    return  '?' + parameters.join('&');
  }

  function buildPayload(req) {
    let payload = {};

    if (req.body.documentSearchBy === 'pool') {
      payload['pool_number'] = req.body.poolDetails;
    }
    if (req.body.documentSearchBy === 'juror_number') {
      payload['juror_number'] = req.body.jurorNumber;
    }
    if (req.body.documentSearchBy === 'juror_name') {
      payload['juror_name'] = req.body.jurorName;
    }
    if (req.body.documentSearchBy === 'postcode') {
      payload['juror_postcode'] = req.body.postcode;
    }
    if (req.body.documentSearchBy === 'allLetters') {
      payload['show_all_queued'] = true;
    }
    if (req.body.includePrinted === 'includePrinted') {
      payload['include_printed'] = true;
    }

    return payload;
  }

})();
