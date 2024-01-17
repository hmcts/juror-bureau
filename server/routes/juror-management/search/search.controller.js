(function() {
  'use strict';

  var urljoin = require('url-join')
    , search = require('../../../objects/juror-record').search
    , modUtils = require('../../../lib/mod-utils')
    , capitalizeFully = require('../../../components/filters').capitalizeFully

  module.exports.getSearch = function(app) {
    return function(req, res) {
      var query = req.query['q']
        , jurorRecords = [];

      if (typeof req.session.superSearchError === 'undefined'
        && typeof query !== 'undefined'
        && modUtils.isJurorNumber(query)
      ) {
        if (typeof req.session.jurorRecordSearchData !== 'undefined') {
          jurorRecords = transformResults(req.session.jurorRecordSearchData, app.namedRoutes);
        }
      }

      // attempt to delete the superSearchError incase it is set
      delete req.session.superSearchError;

      return res.render('juror-management/search/index', {
        jurorRecords: jurorRecords,
        query: query,
      });
    }
  };

  module.exports.postSearch = function(app) {
    return function(req, res) {
      var jurorNumber = req.body['search'] || req.body['super-nav-search']
        , redirectUrl = app.namedRoutes.build('juror-record.search.get')
        , successCB = function(response) {

          if (response.jurorRecordSearchData.length === 1) {
            req.session.locCode = response.jurorRecordSearchData[0].locCode;

            return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
              jurorNumber: response.jurorRecordSearchData[0].jurorNumber,
            }));
          }

          req.session.jurorRecordSearchData = response.jurorRecordSearchData;

          app.logger.info('Found one or more juror records', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: response,
          });

          return res.redirect(urljoin(redirectUrl, '?q=' + jurorNumber));
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to search for a juror-record: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: jurorNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(redirectUrl);
        };

      // if someone tries to search for an invalid value we don't need to do an api request
      if (typeof jurorNumber === 'undefined' || !modUtils.isJurorNumber(jurorNumber)) {
        req.session.superSearchError = true;

        if (typeof jurorNumber !== 'undefined' && jurorNumber.length) {
          redirectUrl = urljoin(redirectUrl, '?q=' + jurorNumber);
        }

        return res.redirect(redirectUrl);
      }

      search.get(require('request-promise'), app, req.session.authToken, jurorNumber)
        .then(successCB)
        .catch(errorCB);
    }
  };

  module.exports.selectJuror = function(app) {
    return function(req, res) {
      var jurorNumber = req.query['jurorNumber']
        , locCode = req.query['locCode'];

      req.session.locCode = locCode;

      return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
        jurorNumber: jurorNumber,
      }));
    }
  };

  // nr is the namedRoutes object
  function transformResults(results, nr) {
    var list = [];

    results.forEach(function(result) {
      var url = urljoin(nr.build('juror-record.select.get'),
        '?jurorNumber=' + result.jurorNumber,
        '&locCode=' + result.locCode);

      list.push([{
        html: '<a href="'+ url +'" class="govuk-link">' + result.jurorNumber + '</a>',
        attributes: {
          'data-sort-value': result.jurorNumber
        }
      },
      {
        text: capitalizeFully([result.firstName, result.lastName].join(' ')),
        attributes: {
          'data-sort-value': [result.firstName, result.lastName].join(' ')
        }
      },
      {
        text: result.addressPostcode,
        attributes: {
          'data-sort-value': result.addressPostcode
        }
      },
      {
        text: result.poolNumber,
        attributes: {
          'data-sort-value': result.poolNumber
        }
      },
      {
        text: capitalizeFully(result.courtName),
        attributes: {
          'data-sort-value': result.courtName
        }
      }])
    });

    return list;
  }

})();
