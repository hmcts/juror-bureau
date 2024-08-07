/* eslint-disable strict */
const filters = require('../../../components/filters');

module.exports = function(jurors, sortBy, order, isCourt, selectedJurors, selectAll) {
  let headers = [{
    id: 'selectAll',
    html: `<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">\n` +
    `  <input\n` +
    `    type="checkbox"\n` +
    `    class="govuk-checkboxes__input select-check juror-select-check"\n` +
    `    id="check-all-jurors"\n` +
    `    name="check-all-jurors"\n` +
    `    aria-label="check-all-jurors"\n` +
    (selectAll ? "    checked\n" : "") +
    `  >\n` +
    `  <label class="govuk-label govuk-checkboxes__label" for="check-all-jurors">\n` +
    `    <span class="govuk-visually-hidden">Select All</span>\n` +
    `  </label>\n` +
    `</div>`,
    sortable: false,
    sort: 'none',
  },
  {
    id: 'juror_Number',
    value: 'Juror number',
    sort: sortBy === 'juror_Number' ? order : 'none',
    sortable: true,
  },
  {
    id: 'first_Name',
    value: 'First name',
    sort: sortBy === 'first_Name' ? order : 'none',
    sortable: true,
  },
  {
    id: 'last_Name',
    value: 'Last name',
    sort: sortBy === 'last_Name' ? order : 'none',
    sortable: true,
  }];
  if (isCourt) {
    headers = headers.concat([
      {
        id: 'attendance',
        value: 'Attendance',
        sort: sortBy === 'attendance' ? order : 'none',
        sortable: true,
      },
      {
        id: 'checked_In',
        value: 'Checked in',
        sort: sortBy === 'checked_In' ? order : 'none',
        sortable: true,
      },
      {
        id: 'next_Date',
        value: 'Next due at court',
        sort: sortBy === 'next_Date' ? order : 'none',
        sortable: true,
      }
    ])
  } else {
    headers.push({
      id: 'postcode',
      value: 'Postcode',
      sort: sortBy === 'postcode' ? order : 'none',
      sortable: true,
    })
  }
  headers.push({
    id: 'status',
    value: 'Status',
    sort: sortBy === 'status' ? order : 'none',
    sortable: true,
  });

  const list = jurors.map(juror => {
    let row = [
      {
        html: `<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">\n` +
        `  <input type="checkbox"\n` +
        `    class="govuk-checkboxes__input select-check juror-select-check"\n` +
        `    id="juror-${juror.jurorNumber}"\n` +
        `    name="selectedJurors"\n` +
        `    value="${juror.jurorNumber}"\n` +
        `    aria-label="check-juror"\n` +
        (selectAll || selectedJurors.indexOf(juror.jurorNumber) > -1 ? 'checked' : '') +
        `  >\n` +
        `    <label class="govuk-label govuk-checkboxes__label" for="select-${juror.jurorNumber}">\n` +
        `    <span class="govuk-visually-hidden">Select ${juror.jurorNumber}</span>\n` +
        `  </label>\n`+
        `</div>\n`
      },
      {
        html: '<a href="/juror-management/record/' +
          juror.jurorNumber + '/overview" class="govuk-link">' + juror.jurorNumber + '</a>',
        attributes: {
          'data-sort-value': juror.jurorNumber,
        },
      },
      {
        text: filters.capitalizeFully(juror.firstName?.toLowerCase()),
        attributes: {
          'data-sort-value': juror.firstName,
        },
      },
      {
        text: filters.capitalizeFully(juror.lastName?.toLowerCase()),
        attributes: {
          'data-sort-value': juror.lastName,
        },
      }];
      
    if (isCourt) {
      row = row.concat([
        {
          text: filters.capitalizeFully(juror.attendance?.toLowerCase()),
          attributes: {
            'data-sort-value': juror.attendance,
          },
        },
        {
          text: juror.checkedIn ? filters.convert24to12(filters.timeArrayToString(juror.checkedIn)) : '',
          attributes: {
            'data-sort-value': juror.checkedIn,
          },
        },
        {
          text: juror.nextDate && filters.dateFilter(juror.nextDate),
          attributes: {
            'data-sort-value': juror.nextDate,
          },
        },
      ])
    } else {
      row.push({
        text: juror.postcode,
        attributes: {
          'data-sort-value': juror.postcode,
        },
      })
    }
    row.push({
      text: filters.capitalizeFully(juror.status?.toLowerCase()),
      attributes: {
        'data-sort-value': juror.status,
      },
    });
    
    return row;
  });

  return { headers, list };
};
