(() => {
  'use strict';

  const _ = require('lodash')
  const { makeManualError } = require('../../../lib/mod-utils');
  const { getReturnedJurors, reinstateJurors } = require('../../../objects/reinstate-jury');

  module.exports.getReinstateJury = (app) => async (req, res) => {
    const { trialNumber, locationCode } = req.params;
    const tmpErrors = _.cloneDeep(req.session.errors);
    const tmpBody = _.cloneDeep(req.session.formFields);

    delete req.session.errors;
    delete req.session.formFields;
    delete req.session[`${trialNumber}-${locationCode}-reinstateJury`];
    
    let response;
    try {
      response = await getReturnedJurors.get(req, trialNumber, locationCode);
    } catch (err) {
      app.logger.crit('Failed to get returned jurors: ', {
        auth: req.session.authentication,
        data: {
          trialNumber,
          locationCode,
        },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }

    const { validJurorsTable, invalidJurorsTable } = buildReinstateJuryTables(app)(response.returnedJurors);

    req.session[`${trialNumber}-${locationCode}-reinstateJury`] = {
      originalJurorsCount: response.originalJurorsCount
    }

    return res.render('trial-management/reinstate-jury/reinstate-jury-selection', {
      validJurorsTable,
      invalidJurorsTable,
      processUrl: app.namedRoutes.build('trial-management.trials.reinstate-jury.post', {
        trialNumber,
        locationCode,
      }),
      cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {
        trialNumber,
        locationCode,
      }),
      backLinkUrl: {
        built: true,
        url:app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber,
          locationCode,
        }),
      },
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
      tmpBody,
    });
  };

  module.exports.postReinstateJury = (app) => async (req, res) => {
    const { trialNumber, locationCode } = req.params;
    const errorUrl = app.namedRoutes.build('trial-management.trials.reinstate-jury.get', {
        trialNumber,
        locationCode,
      });

    const originalJurorsCount = req.session[`${trialNumber}-${locationCode}-reinstateJury`]?.originalJurorsCount;

    if (!req.body.selectedJurors) {
      req.session.errors = makeManualError('selectedJurors', 'Select at least one juror to reinstate');
      return res.redirect(errorUrl);
    }

    const selectedJurors = !Array.isArray(req.body.selectedJurors) ? [req.body.selectedJurors] : req.body.selectedJurors;

    const jurorsLimit = originalJurorsCount <= 12 ? 12 : originalJurorsCount;
    if (selectedJurors.length > jurorsLimit) {
      req.session.errors = makeManualError('selectedJurors', `You cannot select more than ${jurorsLimit} jurors`);
      return res.redirect(errorUrl);
    }

    const payload = {
      jurors: selectedJurors,
      trialNumber,
      courtLocationCode: locationCode,
    };

    try {
      await reinstateJurors.post(req, payload);
    } catch (err) {
      app.logger.crit('Failed to reinstate jurors: ', {
        auth: req.session.authentication,
        data: payload,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }

    req.session.bannerMessage = `${selectedJurors.length} juror${selectedJurors.length !== 1 ? 's' : ''} reinstated`;

    return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
      trialNumber,
      locationCode,
    }));

  };


  const buildReinstateJuryTables = (app) => (returnedJurors) => {
    const tableHead = (selectable) => {
      const tableHead = [
        {
          id: 'jurorNumber',
          text: 'Juror number',
          attributes: {
            "aria-sort": "none"
          },
          classes: 'jd-middle-align'
        },
        {
          id: 'firstName',
          text: 'First name',
          attributes: {
            "aria-sort": "none"
          },
          classes: 'jd-middle-align'
        },
        {
          id: 'lastName',
          text: 'Last name',
          attributes: {
            "aria-sort": "none"
          },
          classes: 'jd-middle-align'
        },
        {
          id: 'status',
          text: 'Status',
          attributes: {
            "aria-sort": "none"
          },
          classes: 'jd-middle-align'
        }
      ]
      if (selectable) {
        tableHead.unshift(
          {
            id: 'checkAllJurors',
            html: 
              '<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">'
              + '<input type="checkbox" class="govuk-checkboxes__input" id="check-all-jurors" aria-label="check-all-jurors"/>'
              + '<label class="govuk-label govuk-checkboxes__label govuk-!-padding-0" for="check-all-jurors">'
              + '<span class="govuk-visually-hidden">Select all jurors</span>'
              + '</label>'
              + '</div>',
              classes: 'jd-middle-align'
          }
        );
      }
      return tableHead;
    };
    
    const validJurorsTable = {
      head: tableHead(true),
      rows: [],
    };
    const invalidJurorsTable = {
      head: tableHead(false),
      rows: [],
    };

    returnedJurors.forEach((juror) => {
      const tableRow = [
        {
          html: `<a href="${app.namedRoutes.build('juror-record.overview.get', { jurorNumber: juror.jurorNumber })}" class="govuk-link">${juror.jurorNumber}</a>`,
          attributes: {
            'data-sort-value': juror.jurorNumber,
          },
          classes: 'jd-middle-align' + (juror.jurorStatus === 'Responded' ? ' mod-padding-block--0' : ''),
        },
        {
          text: juror.firstName ,
          attributes: {
            'data-sort-value': juror.firstName ,
          },
          classes: 'jd-middle-align'+ (juror.jurorStatus === 'Responded' ? ' mod-padding-block--0' : ''), 
        },
        {
          text: juror.lastName,
          attributes: {
            'data-sort-value': juror.lastName,
          },
          classes: 'jd-middle-align' + (juror.jurorStatus === 'Responded' ? ' mod-padding-block--0' : ''),
        },
        {
          text: juror.jurorStatus,
          attributes: {
            'data-sort-value': juror.jurorStatus,
          },
          classes: 'jd-middle-align' + (juror.jurorStatus === 'Responded' ? ' mod-padding-block--0' : ''),
        }
      ]

      if (juror.jurorStatus === 'Responded') {
        tableRow.unshift({
          html: '<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">'
            + '<input type="checkbox" class="govuk-checkboxes__input"'
            + 'id="select-' + juror.jurorNumber + '" aria-label="check-juror-' + juror.jurorNumber + '"'
            + 'name="selectedJurors" value="' + juror.jurorNumber + '" />'
            + '<label class="govuk-label govuk-checkboxes__label govuk-!-padding-0" for="select-' + juror.jurorNumber + '">'
            + '<span class="govuk-visually-hidden">Select juror ' + juror.jurorNumber + '</span>'
            + '</label>'
            + '</div>',
          attributes: {
            'data-sort-value': juror.jurorNumber,
          },
          classes: 'jd-middle-align' + (juror.jurorStatus === 'Responded' ? ' mod-padding-block--0' : ''),
        });
        validJurorsTable.rows.push(tableRow);
      } else {
        invalidJurorsTable.rows.push(tableRow);
      }
    });

    return { validJurorsTable, invalidJurorsTable };

  };

})();