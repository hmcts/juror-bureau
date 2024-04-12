(function(){
  'use strict';

  const _ = require('lodash')
    , urljoin = require('url-join')
    , validate = require('validate.js')
    , showCauseValidator = require('../../../config/validation/show-cause')
    , { reissueLetterDAO } = require('../../../objects/documents')
    , { dateFilter, convert12to24 } = require('../../../components/filters');


  module.exports.postShowCause = function(app) {
    return async function(req, res) {
      const { document } = req.params;
      const { jurorNumber, showCauseDate } = req.query;

      const validatorResult = validate(req.body, showCauseValidator());

      delete req.session.errors;

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('documents.form.get', {
          document: 'show-cause',
        }) + `${jurorNumber ? `?jurorNumber=${jurorNumber}` : ''}`);
      };

      if (jurorNumber) {
        let time = convert12to24(
          req.body.hearingTimeHour + ':' + req.body.hearingTimeMinute + req.body.hearingTimePeriod);

        req.session.documentsJurorsList = { checkedJurors: [{ 'juror_number': jurorNumber }] };
        req.session.bannerMessage = 'Document sent for printing';

        return res.render('custom-components/letter-flow/redirect.njk', {
          letterType: 'show-cause',
          completeRoute: app.namedRoutes.build('juror-record.attendance.get', {
            jurorNumber,
          }),
          // eslint-disable-next-line max-len
          queryParams: `?showCauseDate=${showCauseDate}&hearingDate=${req.body.hearingDate}&hearingTime=${time}`,
        });
      }

      try {

        const response = await reissueLetterDAO.getDuringServiceList(app, req, 'SHOW_CAUSE', 'true');

        response.data.forEach((item) => {
          delete item.status;
          delete item.postcode;
          delete item.pool_number;
        });

        req.session.documentsJurorsList = response;

        app.logger.info('Fetched the list of juror documents: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
        });
        return res.redirect(urljoin(app.namedRoutes.build('documents.letters-list.get', {
          document: 'show-cause',
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

  function urlBuilder(params, query) {
    var parameters = [];

    if (params.hearingDate) {
      parameters.push('hearingDate=' + dateFilter(params.hearingDate, 'DD/MM/YYYY', 'YYYY-MM-DD'));
    }

    if (typeof query !== 'undefined' && query.jurorNumber) {
      parameters.push('jurorNumber=' + query.jurorNumber);
    }

    if (params.hearingTimeHour && params.hearingTimeMinute && params.hearingTimePeriod) {
      parameters.push('hearingTime=' + convert12to24(
        params.hearingTimeHour + ':' + params.hearingTimeMinute + params.hearingTimePeriod)
      );
    }

    return  '?' + parameters.join('&');
  }

})();
