(function() {
  'use strict';

  const { dateFilter } = require('../../../components/filters');

  function tableGenerator(isBureauUser) {
    return tableBuilder(this.response, this.checkedJurors, isBureauUser, this.allChecked);
  }

  function tableBuilder({ headings, data_types: dataTypes, data }, checkedJurors, isBureauUser, allChecked) {
    const _thead = headings.reduce(headingsReducer.bind({ headings, dataTypes }), '');

    const selectAllCheck = allChecked ? 'checked' : '';

    const tableHeader = `
      <tr class="govuk-table__row">
        <th class="govuk-table__header">
          ${isBureauUser ? `<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">
            <input type="checkbox" class="govuk-checkboxes__input select-check juror-select-check"
            id="check-all-jurors" ${selectAllCheck} name="selectAllCheckbox"/>
            <label class="govuk-label govuk-checkboxes__label govuk-!-padding-0" for="check-all-jurors">
              <span class="govuk-visually-hidden">Select All</span>
            </label>
          </div>
        </th>` : ''}
        ${_thead}
      </tr>
    `;

    const tableRows = isBureauUser
      ? data.reduce(rowsReducerBureau.bind({ headings, dataTypes, checkedJurors }), '')
      : data.reduce(rowsReducerCourt.bind({ headings, dataTypes, checkedJurors }), '');

    return { tableHeader, tableRows };
  }

  function headingsReducer(prev, curr, i) {
    const sortDirection = i === this.headings.length - 2 ? 'descending' : 'none';
    const numberTypeClass = this.dataTypes[i] === 'number'
      ? 'govuk-table__header--numeric' : '';
    const isHidden = curr.includes('hidden_') || this.dataTypes[i] === 'hidden';

    let row = '';

    if (!isHidden) {
      row = `
        <th
          scope="col"
          class="govuk-table__header ${numberTypeClass}"
          aria-sort="${sortDirection}"
          aria-label="${curr}"
        >
          ${curr}
        </th>
      `;
    }

    row = prev + row;

    return row;
  }

  function rowsReducerCourt(prev, curr) {
    const jurorInfo = Object.values(curr);

    const datePrintedIdx = this.headings.indexOf('Date printed');

    const _isPrinted = jurorInfo[datePrintedIdx] !== null;
    const isPrintedHighlight = _isPrinted ? 'mod-highlight-table-row__grey' : '';

    const checkedJuror = this.checkedJurors.filter((juror) => (
      juror.juror_number === jurorInfo[0]
      && parseInt(juror.form_code) === curr.id
      && juror.date_printed === (curr.date_printed || 'null')
    ));

    const isChecked = (checkedJuror && checkedJuror.length) ? 'checked' : '';

    let row = `
        <td class="govuk-table__cell mod-padding-block--0">
          <div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">
            <input type="checkbox" class="govuk-checkboxes__input"
              id="juror-${jurorInfo[0]}" ${isChecked}
              aria-label="check-juror-${jurorInfo[0]}"
              data-version="${curr.id}"
              data-printed="${curr.date_printed}"
              name="checked-jurors"
            />
            <label class="govuk-label govuk-checkboxes__label govuk-!-padding-0" for="juror-${jurorInfo[0]}">
              <span class="govuk-visually-hidden">Select juror ${jurorInfo[0]}</span>
            </label>
          </div>
        </td>
      `;

    // eslint-disable-next-line guard-for-in
    for (let index in jurorInfo) {
      const isDate = this.dataTypes[index] === 'date';
      const isNumber = this.dataTypes[index] === 'number';
      const value = jurorInfo[index];
      const isHidden = this.dataTypes[index] === 'hidden';

      const _formatValue = {
        isDate,
        value,
        version: jurorInfo[jurorInfo.length - 1],
        jurorNumber: jurorInfo[0],
        isCourtPending: parseInt(index) === datePrintedIdx && !_isPrinted,
      };

      if (!isHidden) {
        row += `
          <td
            class="govuk-table__cell jd-middle-align mod-padding-block--0"
            ${sortValue(isDate, isNumber, value)}
          >
            ${formatValue(_formatValue)}
          </td>
        `;
      }
    }

    row = prev + `<tr id="row-${jurorInfo[0]}" class="govuk-table__row ${isPrintedHighlight}">${row}</tr>`;

    return row;
  }

  function rowsReducerBureau(prev, curr) {
    const jurorInfo = Object.values(curr);

    const datePrintedIdx = this.headings.indexOf('Date printed');
    const isPrintedIdx = this.headings.indexOf('hidden_extracted_flag');
    const formCodeIdx = this.headings.indexOf('hidden_form_code');

    const _isPrinted = isPrinted(jurorInfo[isPrintedIdx]);
    const isPrintedHighlight = _isPrinted ? 'mod-highlight-table-row__grey' : '';

    const _neverPrinted = !_isPrinted && jurorInfo[datePrintedIdx] === null;

    const checkedJuror = this.checkedJurors.filter((juror) => (
      juror.juror_number === jurorInfo[0]
      && juror.form_code === jurorInfo[formCodeIdx]
      && juror.date_printed === jurorInfo[datePrintedIdx]
    ));

    const isChecked = (checkedJuror && checkedJuror.length) ? 'checked' : '';

    let row = isPending(jurorInfo[jurorInfo.length - 2]) && !_neverPrinted
      ? '<td class="govuk-table__cell"></td>'
      : `
        <td class="govuk-table__cell mod-padding-block--0">
          <div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">
            <input type="checkbox" class="govuk-checkboxes__input"
              id="juror-${jurorInfo[0]}" ${isChecked}
              aria-label="check-juror-${jurorInfo[0]}"
              data-version="${jurorInfo[formCodeIdx]}"
              data-printed="${jurorInfo[datePrintedIdx]}"
              name="checked-jurors"
            />
            <label class="govuk-label govuk-checkboxes__label govuk-!-padding-0" for="juror-${jurorInfo[0]}">
              <span class="govuk-visually-hidden">Select juror ${jurorInfo[0]}</span>
            </label>
          </div>
        </td>
      `;

    const paddingClass = _isPrinted ? 'mod-padding-block--0' : '';

    // eslint-disable-next-line guard-for-in
    for (let index in jurorInfo) {
      const isDate = this.dataTypes[index] === 'date';
      const isNumber = this.dataTypes[index] === 'number';
      const value = jurorInfo[index];
      const isHidden = this.headings[index].includes('hidden_');
      const showPending = parseInt(index) === datePrintedIdx && !_isPrinted && !_neverPrinted;

      const _formatValue = {
        isDate,
        value,
        version: jurorInfo[jurorInfo.length - 1],
        jurorNumber: jurorInfo[0],
        showPending,
      };

      if (!isHidden) {
        row += `
          <td
            class="govuk-table__cell jd-middle-align ${paddingClass}"
            ${sortValue(isDate, isNumber, value)}
          >
            ${formatValue(_formatValue)}
          </td>
        `;
      }
    }

    row = prev + `<tr id="row-${jurorInfo[0]}" class="govuk-table__row ${isPrintedHighlight}">${row}</tr>`;

    return row;
  }

  function isPrinted(value) {
    return value && value !== '-';
  }

  function isPending(value) {
    return !value;
  }

  function sortValue(isDate, isNumber, value) {
    if (isDate || isNumber) {
      return `data-sort-value="${value === '-' ? 'top' : value}"`;
    }

    return '';
  }

  function formatValue({ isDate, value, version, jurorNumber, showPending, isCourtPending }) {
    if (showPending) {
      return `
        <span class="mod-flex mod-gap-x-4">
          Pending
          <a
            id="delete-letter-${jurorNumber}"
            data-version="${version}"
            data-juror-number="${jurorNumber}"
            data-printed="${dateFilter(new Date(), null, 'YYYY-MM-DD')}"
            href="#"
          >
            Delete
            <span class="govuk-visually-hidden">queued letter for juror ${jurorNumber}</span>
          </a>
        </span>
      `;
    }
    if (isCourtPending) {
      return '-';
    }
    if (isDate) {
      return value ? dateFilter(value, 'YYYY-MM-DD', 'ddd D MMM YYYY') : '-';
    }

    return value;
  }

  module.exports.tableGenerator = tableGenerator;
})();
