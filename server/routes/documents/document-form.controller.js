(function() {
  'use strict';

  const _ = require('lodash')
    , urljoin = require('url-join')
    , validate = require('validate.js')
    , validator = require('../../config/validation/document-form')
    , modUtils = require('../../lib/mod-utils')
    , { reissueLetterDAO } = require('../../objects/documents')
    , { isCourtUser } = require('../../components/auth/user-type');

  // TODO: will be updated with the addition of new letter types in the backend
  const LetterType = {
    'initial-summons': 'SUMMONS',
    'summons-reminders': 'REMINDERS',
    'further-information': 'INFORMATION',
    'confirmation': 'CONFIRMATION',
    'deferral-granted': 'DEFERRAL_GRANTED',
    'deferral-refused': 'DEFERRAL_REFUSED',
    'excusal-granted': 'EXCUSAL_GRANTED',
    'excusal-refused': 'EXCUSAL_REFUSED',
    'postponement': 'POSTPONED',
    'withdrawal': 'WITHDRAWAL',
  };

  module.exports.getDocumentForm = function(app) {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const backLinkUrl = app.namedRoutes.build('documents.get');
      const formFields = _.clone(req.session.formFields);
      const { document } = req.params;
      const postUrl = app.namedRoutes.build('documents.form.post', {
        document,
      });
      const cancelUrl = app.namedRoutes.build('documents.form.get', {
        document,
      });

      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.documentsJurorsList;

      return res.render('documents/_common/document-form.njk', {
        postUrl,
        cancelUrl,
        backLinkUrl,
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
      const validatorResult = validate(req.body, validator.documentForm());
      const { document } = req.params;

      delete req.session.errors;
      req.session.formFields = req.body;

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('documents.form.get', {
          document,
        }));
      };

      try {
        const payload = buildPayload(req);

        payload.document = document;
        payload['letter_type'] = LetterType[document];

        delete payload._csrf;

        let response;

        if (isCourtUser(req, res)) {
          response = await reissueLetterDAO.getListCourt(app, req, payload);
        } else {
          response = await reissueLetterDAO.getList(app, req, payload);
        }

        // TODO: maybe sort the list before caching? ... so we have the pending / - always first
        req.session.documentsJurorsList = response;

        app.logger.info('Fetched the list of juror documents: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: { ...payload },
        });

        return res.redirect(urljoin(app.namedRoutes.build('documents.letters-list.get', {
          document,
        }), urlBuilder(req.body)));
      } catch (err) {
        // A 404 means no results were found
        if (err.statusCode === 404) {
          req.session.documentsJurorsList = {
            headings: [],
            'data_types': [],
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

    if (params.jurorDetails) {
      parameters.push('jurorDetails=' + params.jurorDetails);
    }

    if (params.poolDetails) {
      parameters.push('poolDetails=' + params.poolDetails);
    }

    if (params.includePrinted) {
      parameters.push('includePrinted=' + params.includePrinted);
    }

    return  '?' + parameters.join('&');
  }

  function buildPayload(req) {
    let payload = {};

    if (req.body.documentSearchBy === 'pool') {
      payload['pool_number'] = req.body.poolDetails;
    }
    if (req.body.documentSearchBy === 'juror') {
      payload['juror_number'] = req.body.jurorDetails;
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
