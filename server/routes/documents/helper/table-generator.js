(function() {
  'use strict';

  const _ = require('lodash');
  const { dateFilter, toSentenceCase } = require('../../../components/filters');
  const config = require('../../../config/environment')();

  function tableGenerator(isBureauUser) {
    return tableBuilder(this.response, this.checkedJurors, isBureauUser, this.allChecked, this.sortBy, this.sortOrder);
  }

  function tableBuilder({ headings, dataTypes, data }, checkedJurors, isBureauUser, allChecked, sortBy, sortOrder) {
    const headingIndexes = getHeadingIndexes(headings);
    const _thead = headingIndexes.reduce((prev, index) => (
      headingsReducer.call({ headings, dataTypes, sortBy, sortOrder }, prev, headings[index], index)
    ), '');

    const selectAllCheck = allChecked ? 'checked' : '';

    const tableHeader = [{
      id: 'check-all-juror',
      html: `${isBureauUser ? `<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">
                <input type="checkbox" class="govuk-checkboxes__input select-check juror-select-check"
                id="check-all-jurors" ${selectAllCheck} name="selectAllCheckbox"/>
                <label class="govuk-label govuk-checkboxes__label govuk-!-padding-0" for="check-all-jurors">
                  <span class="govuk-visually-hidden">Select All</span>
                </label>
              </div>
            ` : ''}`,
      sortable: false,
    },
    ..._thead];

    const tableRows = isBureauUser
      ? data.reduce(rowsReducerBureau.bind({ headings, dataTypes, checkedJurors, headingIndexes }), '')
      : data.reduce(rowsReducerCourt.bind({ headings, dataTypes, checkedJurors, headingIndexes }), '');

    return { tableHeader, tableRows };
  }

  function headingsReducer(prev, curr, i) {
    const sortDirection = this.sortBy === _.camelCase(curr) ? this.sortOrder : 'none';
    const numberTypeClass = this.dataTypes[i] === 'number'
      ? 'govuk-table__header--numeric' : '';
    const isHidden = curr.includes('hidden_') || this.dataTypes[i] === 'hidden';
    const isDbdColumn = curr === 'Original sent by' || curr === 'Current preference'

    let row = [];

    if (!isHidden && !(isDbdColumn && !config.featureFlags?.digitalByDefault)) {
      row = [{
        id: _.camelCase(curr),
        value: curr,
        classes: numberTypeClass,
        sort: sortDirection
      }]
    }

    row = [...prev, ...row];

    return row;
  }

  function getHeadingIndexes(headings) {
    const headingIndexes = headings.map((_, index) => index);
    const datePrintedIdx = headings.indexOf('Date printed');

    if (datePrintedIdx === -1) {
      return headingIndexes;
    }

    return [
      ...headingIndexes.filter((index) => index !== datePrintedIdx),
      datePrintedIdx,
    ];
  }

  function rowsReducerCourt(prev, curr) {
    const jurorInfo = rowValuesFromHeadings(curr, this.headings);

    const datePrintedIdx = this.headings.indexOf('Date printed');

    const _isPrinted = jurorInfo[datePrintedIdx] !== null;
    const isPrintedHighlight = _isPrinted ? 'mod-highlight-table-row__grey' : '';

    const checkedJuror = this.checkedJurors.filter((juror) => (
      juror.jurorNumber === jurorInfo[0]
      && parseInt(juror.formCode) === curr.id
      && juror.datePrinted === (curr.datePrinted || 'null')
    ));

    const isChecked = (checkedJuror && checkedJuror.length) ? 'checked' : '';

    let row = [{
      html:
        `<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">
          <input type="checkbox" class="govuk-checkboxes__input"
            id="juror-${jurorInfo[0]}" ${isChecked}
            aria-label="check-juror-${jurorInfo[0]}"
            data-version="${curr.id}"
            data-printed="${curr.datePrinted}"
            name="checked-jurors"
          />
          <label class="govuk-label govuk-checkboxes__label govuk-!-padding-0" for="juror-${jurorInfo[0]}">
            <span class="govuk-visually-hidden">Select juror ${jurorInfo[0]}</span>
          </label>
        </div>`,
      classes: `mod-padding-block--0 ${isPrintedHighlight}`
    }];

    for (const index of this.headingIndexes) {
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
        row.push({
          html: formatValue(_formatValue),
          classes: `jd-middle-align mod-padding-block--0 ${isPrintedHighlight}`,
        })
      }
    }

    row = [...prev, row];

    return row;
  }

  function rowsReducerBureau(prev, curr) {
    const jurorInfo = Object.values(curr);

    const datePrintedIdx = this.headings.indexOf('Date printed');
    const isPrintedIdx = this.headings.indexOf('hidden_extracted_flag');
    const formCodeIdx = this.headings.indexOf('hidden_form_code');

    let emailStatusIdx = null;
    let originalMethodIdx = null;
    let currentMethodIdx = null;
    if (config.featureFlags?.digitalByDefault) {
      emailStatusIdx = this.headings.indexOf('hidden_email_status');
      originalMethodIdx = this.headings.indexOf('Original sent by');
      currentMethodIdx = this.headings.indexOf('Current preference');
    }

    let _isPrinted = false;
    if (config.featureFlags?.digitalByDefault) {
      _isPrinted = isPrinted(jurorInfo[isPrintedIdx], jurorInfo[originalMethodIdx], jurorInfo[emailStatusIdx]);
    } else {
      _isPrinted = isPrinted(jurorInfo[isPrintedIdx]);
    }

    const isPrintedHighlight = _isPrinted ? 'mod-highlight-table-row__grey' : '';

    const _neverPrinted = !_isPrinted && jurorInfo[datePrintedIdx] === null;

    const checkedJuror = this.checkedJurors.filter((juror) => (
      juror.jurorNumber === jurorInfo[0]
      && juror.formCode === jurorInfo[formCodeIdx]
      && juror.datePrinted === jurorInfo[datePrintedIdx]
    ));

    const isChecked = (checkedJuror && checkedJuror.length) ? 'checked' : '';

    let _isPending = false;
    if (config.featureFlags?.digitalByDefault) {
      _isPending = isPending(jurorInfo[isPrintedIdx], jurorInfo[originalMethodIdx], jurorInfo[emailStatusIdx]);
    } else {
      _isPending = isPending(jurorInfo[isPrintedIdx]);
    }

    let row = _isPending && !_neverPrinted
      ? [{}]
      : [{
        html:
          `<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox">
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
          `,
        classes: `mod-padding-block--0 ${isPrintedHighlight}`
      }];

    const paddingClass = _isPrinted ? 'mod-padding-block--0' : '';

    for (const index of this.headingIndexes) {
      const isDate = this.dataTypes[index] === 'date';
      const isNumber = this.dataTypes[index] === 'number';
      const value = jurorInfo[index];
      const isHidden = this.headings[index].includes('hidden_');
      const showPending = parseInt(index) === datePrintedIdx && !_isPrinted && !_neverPrinted;
      const isTag = this.headings[index] === 'Original sent by' || this.headings[index] === 'Current preference';

      const _formatValue = {
        isDate,
        value,
        version: jurorInfo[jurorInfo.length - 1],
        jurorNumber: jurorInfo[0],
        showPending,
        isTag,
      };

      if (!isHidden && !(isTag && !config.featureFlags?.digitalByDefault)) {
        row.push({
          html: formatValue(_formatValue),
          classes: `jd-middle-align ${paddingClass} ${isPrintedHighlight}`,
          attributes: {
            id: `${jurorInfo[0]}_${jurorInfo[datePrintedIdx]}_${_.camelCase(this.headings[index])}`,
          },
        })
      }
    }

    row = [...prev, row];

    return row;
  }

  function isPrinted(letterStatus, originalMethod = null, emailStatus = null) {
    if (config.featureFlags?.digitalByDefault) {
      if (originalMethod === 'EMAIL') {
        return emailStatus && emailStatus !== 'PENDING';
      }
    }
    return letterStatus && letterStatus !== '-';
  }

  function rowValuesFromHeadings(row, headings) {
    if (Array.isArray(row)) {
      return row;
    }

    return headings.map((heading) => {
      const key = heading === 'Row Id' ? 'id' : _.camelCase(heading);

      return row[key] ?? row[_.snakeCase(heading)] ?? row[heading];
    });
  }

  function isPending(letterExtracted, originalMethod = null, emailStatus = null) {
    if (config.featureFlags?.digitalByDefault) {
      if (originalMethod === 'EMAIL') {
        return emailStatus && emailStatus === 'PENDING';
      }
    }
    return !letterExtracted;
  }

  function formatValue({ isDate, value, version, jurorNumber, showPending, isCourtPending, isTag }) {
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
    if (isTag) {
      return `<strong class="govuk-tag">${toSentenceCase(value)}</strong>`;
    }

    return value;
  }

  module.exports.tableGenerator = tableGenerator;
})();
