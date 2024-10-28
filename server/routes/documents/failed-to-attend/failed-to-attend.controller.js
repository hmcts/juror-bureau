(function() {
  'use strict';

  const _ = require('lodash');
  const urljoin = require('url-join');
  const { reissueLetterDAO } = require('../../../objects/documents');
  const modUtils = require('../../../lib/mod-utils');
  const { isCourtUser } = require('../../../components/auth/user-type');

  module.exports.getFailedToAttend = function(app) {
    return async function(req, res) {
      const document  = 'failed-to-attend';

      try {
        const payload = {
          'letter_type': modUtils.LetterType[document],
        };

        let response;

        if (isCourtUser(req, res)) {
          response = await reissueLetterDAO.getDuringServiceList(req, 'FAILED_TO_ATTEND', 'true');
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
        }

        req.session.documentsJurorsList = response;
        app.logger.info('Fetched the list of juror documents: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: { ...payload },
        });
        return res.redirect(urljoin(app.namedRoutes.build('documents.letters-list.get', {
          document: document,
        })));
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

  module.exports.getSingleFailedToAttend = function(app) {
    return async function(req, res) {
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
        });
      }
    };
  };

})();
