(function() {
  'use strict';

  const _ = require('lodash');
  const urljoin = require('url-join');
  const modUtils = require('../../../lib/mod-utils');
  const validate = require('validate.js');
  const validator = require('../../../config/validation/letters-list');
  const { isBureauUser } = require('../../../components/auth/user-type');
  const { reissueLetterDAO } = require('../../../objects/documents');
  const { tableGenerator } = require('../helper/table-generator');
  const { dateFilter } = require('../../../components/filters');
  const { Logger } = require('../../../components/logger');

  module.exports.getListLetters = function(app) {
    return function(req, res) {
      try {
        const { document } = req.params;
        const _isBureauUser = isBureauUser(req, res);
        const backLinkUrl = app.namedRoutes.build('documents.get');
        const changeUrl = app.namedRoutes.build('documents.form.get', {
          document,
        });
        const tmpErrors = _.clone(req.session.errors);

        const { documentSearchBy, jurorNumber, jurorName, postcode, poolDetails, page } = req.query;
        let searchBy, paginationObject;

        delete req.session.errors;

        if (documentSearchBy === 'juror_number') {
          searchBy = jurorNumber;
        } else if (documentSearchBy === 'juror_name') {
          searchBy = jurorName;
        } else if (documentSearchBy === 'postcode') {
          searchBy = postcode;
        } else {
          searchBy = poolDetails;
        }

        if (!req.session.documentsJurorsList) {
          return res.redirect(app.namedRoutes.build('documents.get'));
        }

        if (req.session.documentsJurorsList.data.length > modUtils.constants.PAGE_SIZE) {
          paginationObject = modUtils.paginationBuilder(
            req.session.documentsJurorsList.data.length,
            page || 1,
            req.url,
          );
        }

        const slicedJurorList = {
          headings: req.session.documentsJurorsList.headings,
          'data_types': req.session.documentsJurorsList.data_types,
          data: paginateJurorsList(req.session.documentsJurorsList.data, page || 1),
        };

        const { tableHeader, tableRows } = tableGenerator.bind({
          response: slicedJurorList,
          checkedJurors: req.session.documentsJurorsList.checkedJurors || [],
          allChecked: areAllChecked(req),
        })(_isBureauUser);

        const postUrl = urljoin(app.namedRoutes.build('documents.letters-list.post', {
          document,
        }), urlBuilder(req.query));

        const printUrl = urljoin(app.namedRoutes.build('documents.letters-list.print', {
          document,
        }), urlBuilder(req.query));

        const selectedJurors = (req.session.documentsJurorsList.checkedJurors
          && req.session.documentsJurorsList.checkedJurors.length) || 0;

        delete req.session.statusChangedList;

        return res.render('documents/_common/letters-list.njk', {
          pageIdentifier: modUtils.getLetterIdentifier(document),
          backLinkUrl,
          postUrl,
          changeUrl,
          printUrl,
          searchBy,
          headings: tableHeader,
          rows: tableRows,
          paginationObject,
          buttonLabel: buttonLabel(document, _isBureauUser),
          selectedJurors,
          totalJurors: req.session.documentsJurorsList.data.length,
          totalCheckableJurors: calculateTotalJurors(req.session.documentsJurorsList.data, documentSearchBy),
          document,
          documentSearchBy,
          errors: {
            title: 'There is a problem',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to retrive letters: ', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    };
  };

  module.exports.postListLetters = function(app) {
    return async function(req, res) {
      const { document } = req.params;
      const { origin } = req.query;

      if (origin === 'statusChanged') {
        removeStatusChangedJurors(req);
      }

      const validatorResult = validate(req.body, validator(req.session.documentsJurorsList.checkedJurors));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.noJurorSelect = true;

        return res.redirect(urljoin(app.namedRoutes.build('documents.letters-list.get', {
          document,
        }), urlBuilder(req.query)));
      }

      delete req.session.errors;

      const checkedJurors = _.clone(req.session.documentsJurorsList.checkedJurors);

      checkedJurors.forEach((juror) => {
        if (juror['date_printed'] === 'null') {
          juror['date_printed'] = dateFilter(new Date(), null, 'YYYY-MM-DD');
        }
      });

      const payload = {
        'letters_list': checkedJurors,
      };

      delete req.session.statusChangedList;

      try {
        const { juror_list: jurorList } = await reissueLetterDAO.postList(app, req, payload);

        if (jurorList && jurorList.length) {
          req.session.statusChangedList = jurorList;

          Logger.instance.info('Found jurors with status changes', {
            auth: req.session.authentication,
            data: { ...payload, ...jurorList },
          });

          return res.redirect(app.namedRoutes.build('documents.letter-list.status-changed.get', {
            document,
          }));
        }

        const documentCount = req.session.documentsJurorsList.checkedJurors.length;

        req.session.documentsJurorsList.successMessage =
          `${documentCount} document${documentCount > 1 ? 's' : ''} sent for printing`;

        return res.redirect(app.namedRoutes.build('documents.get'));
      } catch (err) {
        req.session.errors = {
          selectedJurors: [{
            summary: 'Unable to reprint letters for the selected jurors',
            details: 'Unable to reprint letters for the selected jurors',
          }],
        };

        app.logger.crit('Failed to reprint letters for selected jurors', {
          userId: req.session.authentication.login,
          data: payload,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.redirect(urljoin(app.namedRoutes.build('documents.letters-list.get', {
          document,
        }), urlBuilder(req.query)));
      }
    };
  };

  module.exports.deletePendingLetter = function(app) {
    return async function(req, res) {
      const payload = {
        'letters_list': [{
          'juror_number': req.body.juror_number,
          'form_code': req.body.form_code,
          'date_printed': req.body.date_printed,
        }],
      };

      try {
        await reissueLetterDAO.deletePending(app, req, payload);

        const index = req.session.documentsJurorsList.data
          .findIndex((juror) => (
            juror[0] === req.body.juror_number
            && juror[juror.length - 1] === req.body.form_code
            && juror[juror.length - 2] === false
          ));

        req.session.documentsJurorsList.data.splice(index, 1);

        return res.send();
      } catch (err) {
        app.logger.crit('Failed to delete the letter from the printing queue', {
          userId: req.session.authentication.login,
          data: payload,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.status(err.statusCode).send();
      }
    };
  };

  module.exports.getStatusChanged = function() {
    return function(req, res) {
      const { document } = req.params;
      const jurorsList = req.session.statusChangedList;

      Logger.instance.info('Status changed for jurors', {
        auth: req.session.authentication,
        data: { ...jurorsList },
      });

      return res.render('documents/status-changed.njk', {
        document,
        jurorsList,
      });
    };
  };

  function removeStatusChangedJurors(req) {
    const statusChangedList = req.session.statusChangedList.reduce((acc, juror) => {
      acc.push(juror.juror_number);
      return acc;
    }, []);

    req.session.documentsJurorsList.checkedJurors = req.session.documentsJurorsList.checkedJurors.filter((juror) => (
      !statusChangedList.includes(juror.juror_number)
    ));

    delete req.session.statusChangedList;

    Logger.instance.info('Sending letters to jurors without status changes', {
      auth: req.session.authentication,
      data: { ...req.session.documentsJurorsList.checkedJurors, statusChangedList },
    });
  }

  // Because we need to move to redis, the checking of jurors could break due to race conditions
  // with this in mind it will be better if we keep the checked jurors on a separated array stored in redis
  // (memory for now) so we can update it using the redis api directly and not wait for the request to finish
  // the same approach could be used in other places where we have checkboxes for selecting items from big lists
  module.exports.checkJuror = function(app) {
    return function(req, res) {
      const { isChecking, isCheckAll } = req.body;

      if (isCheckAll === 'true') {
        if (areAllChecked(req)) {
          req.session.documentsJurorsList.checkedJurors = [];
        } else {
          req.session.documentsJurorsList.checkedJurors = [];
          req.session.documentsJurorsList.data.forEach(juror => {
            if (!isPending(juror[4], juror[5])) {
              console.log(juror);
              req.session.documentsJurorsList.checkedJurors.push({
                'juror_number': juror[0],
                'form_code': juror[6],
                'date_printed': req.body.date_printed,
              });
            }
          });
        }

        app.logger.info('Checked / unchecked all juror documents: ', {
          auth: req.session.authentication,
          data: { ...req.body },
        });

        return res.status(200).send(req.session.documentsJurorsList.checkedJurors.length.toString());
      }

      delete req.body._csrf;
      delete req.body.isChecking;
      delete req.body.isCheckAll;

      if (typeof req.session.documentsJurorsList.checkedJurors === 'undefined') {
        req.session.documentsJurorsList.checkedJurors = [];
      }

      const index = req.session.documentsJurorsList.checkedJurors
        .findIndex((juror) => (
          juror.juror_number === req.body.juror_number
          && juror.form_code === req.body.form_code
          && juror.date_printed === req.body.date_printed
        ));

      if (isChecking && index === -1) {
        req.session.documentsJurorsList.checkedJurors.push(req.body);
      } else {
        req.session.documentsJurorsList.checkedJurors.splice(index, 1);
      }

      app.logger.info('Checked / unchecked juror document: ', {
        auth: req.session.authentication,
        data: { ...req.body },
      });

      return res.status(200).send(req.session.documentsJurorsList.checkedJurors.length.toString());
    };
  };

  function paginateJurorsList(jurors, currentPage) {
    let start = 0;
    let end = 25;

    if (currentPage > 1) {
      start = (currentPage - 1) * modUtils.constants.PAGE_SIZE;
    }

    end = start + modUtils.constants.PAGE_SIZE;

    return jurors.slice(start, end);
  }

  function urlBuilder(params) {
    const parameters = [];

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

    if (params.hearingDate) {
      parameters.push('hearingDate=' + params.hearingDate);
    }

    if (params.hearingTime) {
      parameters.push('hearingTime=' + params.hearingTime);
    }

    return  '?' + parameters.join('&');
  }

  function buttonLabel(document, _isBureauUser) {
    switch (document) {
    case 'initial-summons':
      return 'Resend initial summons';
    case 'summons-reminders':
      return 'Send summons reminder';
    case 'further-information':
      return 'Resend request for further information';
    case 'confirmation':
      return 'Resend confirmation letter';
    case 'deferral-granted':
      return _isBureauUser ? 'Resend deferral granted letter' : 'Print deferral granted letter';
    case 'deferral-refused':
      return _isBureauUser ? 'Resend deferral refused letter' : 'Print deferral refused letter';
    case 'excusal-granted':
      return _isBureauUser ? 'Resend excusal granted letter' : 'Print excusal granted letter';
    case 'excusal-refused':
      return _isBureauUser ? 'Resend excusal refused letter' : 'Print excusal refused letter';
    case 'postponement':
      return _isBureauUser ? 'Resend postponement letter' : 'Print postponement letter';
    case 'withdrawal':
      return _isBureauUser ? 'Resend withdrawal letter' : 'Print withdrawal letter';
    case 'show-cause':
      return 'Print show cause letter';
    case 'certificate-attendance':
      return 'Print certificate of attendance';
    case 'failed-to-attend':
      return 'Print failed to attend letter';
    }
  }

  function calculateTotalJurors(data, documentSearchBy) {
    if (documentSearchBy === 'allLetters') {
      return data.length;
    }

    return data.filter((doc) => {
      const _neverPrinted = doc[doc.length - 3] === null && doc[doc.length - 2] === false;

      return doc[doc.length - 2] !== false || _neverPrinted;
    }).length;
  }

  function areAllChecked(req) {
    if (typeof req.session.documentsJurorsList.checkedJurors === 'undefined') {
      req.session.documentsJurorsList.checkedJurors = [];
      return false;
    }

    return req.session.documentsJurorsList.data.filter((juror) => (!isPending(juror[4], juror[5]))).length
      === req.session.documentsJurorsList.checkedJurors.length;
  }

  function isPending(datePrinted, isPrinted) {
    return datePrinted !== null && !isPrinted;
  }

})();
