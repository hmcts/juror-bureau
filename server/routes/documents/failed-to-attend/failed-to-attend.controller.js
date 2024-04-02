(function() {
  'use strict';

  const _ = require('lodash')
    , urljoin = require('url-join')
    , { reissueLetterDAO } = require('../../../objects/documents')
    , modUtils = require('../../../lib/mod-utils')
    , { isCourtUser } = require('../../../components/auth/user-type');

  module.exports.getFailedToAttend = function(app) {
    return async function(req, res) {
      const document  = 'failed-to-attend';

      try {
        const payload = buildPayload(req);

        payload['letter_type'] = modUtils.LetterType[document];

        delete payload._csrf;

        let response;

        if (isCourtUser(req, res)) {
          response = await reissueLetterDAO.getDuringServiceList(app, req, 'FAILED_TO_ATTEND', 'true');
          response.data.forEach((item) => {
            delete item.status;
            delete item.postcode;
            delete item.pool_number;
          });
          response.data_types.push('hidden');
          response.headings.push('Row Id');
          response.data.forEach((juror, i) => {
            juror.id = i;
          });
        } else {
          response = await reissueLetterDAO.getList(app, req, payload);
        }

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

  module.exports.getSingleFailedToAttend = function(app) {
    return async function(req, res) {
      const { document } = req.params;
      const { jurorNumber } = req.query;
      const { singleFTAdate } = req.query;

      delete req.session.errors;

      if (jurorNumber) {

        req.session.documentsJurorsList ={
          checkedJurors: [{ 'juror_number': jurorNumber }],
          data : [{'juror_number': jurorNumber, 'absent_date': singleFTAdate}],
        };
        req.session.bannerMessage = 'Document sent for printing';

        return res.render('custom-components/letter-flow/redirect.njk', {
          letterType: 'failed-to-attend',
          completeRoute: app.namedRoutes.build('juror-record.attendance.get', {
            jurorNumber,
          }),
          // eslint-disable-next-line max-len
        });
      }

      try {


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
          })));
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

    if (params.durationType) {
      parameters.push('durationType=' + params.durationType);
    }

    if (params.durationYears) {
      parameters.push('durationYears=' + params.durationYears);
    }

    return  '?' + parameters.join('&');
  }

  function buildPayload(req) {
    let payload = {};

    payload['include_printed'] = true;

    return payload;
  }

})();
