(() => {
  'use strict';

  const _ = require('lodash');
  const { dateFilter } = require('../../components/filters');
  const { makeManualError } = require('../../lib/mod-utils');

  module.exports.getDashboard = (app) => (req, res) => {
    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;

    return res.render('electoral-register/dashboard.njk', {
      localAuthorities: buildLocalAuthoritiesTable([
        {
          id: '001',
          authorityName: 'Springfield City Council',
          status: 'Not uploaded',
          lastDataUpload: '2024-03-23'
        },
        {
          id: '002',
          authorityName: 'Shelbyville Borough Council',
          status: 'Uploaded',
          lastDataUpload: '2024-06-10'
        },
        {
          id: '003',
          authorityName: 'Ogdenville District Council',
          status: 'Uploaded',
          lastDataUpload: '2024-06-12'
        },
        {
          id: '004',
          authorityName: 'North Haverbrook Council',
          status: 'Not uploaded',
          lastDataUpload: '2024-02-15'
        }
      ]),
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };

  module.exports.postLocalAuthorityFilter = function(app) {
    return async function(req, res) {

      return res.redirect(
        app.namedRoutes.build('electoral-register.get')
        + `?localAuthority=${encodeURIComponent(req.body.localAuthorityFilter || '')}`
      );
    };
  };

  module.exports.postLocalAuthorities = (app) => (req, res) => {
    const { action } = req.query;

    if (!req.body.selectedAuthorities || req.body.selectedAuthorities.length === 0) {
      req.session.errors = makeManualError('selectedAuthorities', 'At least one authority must be selected');
      return res.redirect(
        app.namedRoutes.build('electoral-register.get')
      );
    }

    // TODO: Implement actual action handling logic for each option
    switch (action) {
      case 'send-reminder':
        console.log(`\n\n--- Sending reminder emails to: ${JSON.stringify(req.body)} ---\n\n`);
        break;
      case 'mark-email-delivered':
        console.log(`\n\n--- Marking data request email as delivered for: ${JSON.stringify(req.body)} ---\n\n`);
        break;
      default:
        console.log(`\n\n--- No action specified for: ${JSON.stringify(req.body)} ---\n\n`);
    }

    return res.redirect(
      app.namedRoutes.build('electoral-register.get')
    );

  };

  const buildLocalAuthoritiesTable = (localAuthorities) => {
    const table = {
      head: [],
      rows: [],
    };

    table.head = [
      {
        html: '<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox mod-center-items">'
            + '<input type="checkbox" class="govuk-checkboxes__input select-check authority-select-check" id="selectAllCheckbox" name="selectAllCheckbox"/>'
            + '<label class="govuk-label govuk-checkboxes__label" for="selectAllCheckbox">'
            + '<span class="govuk-visually-hidden">Select All</span>'
            + '</label>'
            + '</div>'
      },
      {
        id: 'authorityName',
        text: 'Authority name',
        attributes: {
          'aria-sort': 'ascending'
        }
      },
      {
        id: 'status',
        text: 'Status',
        attributes: {
          'aria-sort': 'none'
        }
      },
      {
        id: 'lastDataUpload',
        text: 'Last data upload',
        attributes: {
          'aria-sort': 'none'
        }
      }
    ];

    localAuthorities.forEach(function(localAuthority) {
      table.rows.push([
        {
          html: '<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox mod-center-items" >'
            + `<input type="checkbox" class="govuk-checkboxes__input select-check authority-select-check" id="select-${localAuthority.id}" name="selectedAuthorities" value="${localAuthority.id}">`
            + `<label class="govuk-label govuk-checkboxes__label" for="select-${localAuthority.id}">`
            + `<span class="govuk-visually-hidden">Select ${localAuthority.id}</span>`
            + '</label>'
            + '</div>'

        },
        {
          text: localAuthority.authorityName,
        },
        {
          html: `<strong class="govuk-tag ${localAuthority.status === 'Not uploaded' ? 'govuk-tag--grey' : ''}">`
              + `${localAuthority.status}`
              + '</strong>'
        },
        {
          text: dateFilter(localAuthority.lastDataUpload, 'yyyy-MM-DD', 'DD MMMM yyyy'),
          attributes: {
            'data-sort-value': dateFilter(localAuthority.lastDataUpload, 'yyyy-MM-DD', 'yyyyMMDD')
          },
        }
      ]);
    });

    return table;
  };

})();
