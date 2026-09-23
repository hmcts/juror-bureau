const undeliverableJurorNumberForm = document.getElementById('undeliverableJurorNumberForm');
const jurorsToMarkUndeliverableForm = document.getElementById('jurorsToMarkUndeliverableForm');
const tableWrapper = document.getElementById('tableWrapper');
const totalJurorsCaption = document.getElementById('totalJurorsCaption');
const tableBody = document.getElementById('tableBody');
const csrftoken = document.getElementById('csrfToken');

undeliverableJurorNumberForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const undeliverableJurorNumber = document.getElementById('undeliverableJurorNumber');
  const jurorNumber = undeliverableJurorNumber.value;

  const errorSummary = document.getElementsByClassName('govuk-error-summary');

  if (errorSummary && errorSummary.length > 0) {
    errorSummary[0].remove();
  }
  clearError();
  const hasError = validateJurorNumber(jurorNumber);

  if (hasError) {
    return;
  }

  apiCall(jurorNumber);

  undeliverableJurorNumber.value = '';
  undeliverableJurorNumber.focus();
});

function clearError() {
  const undeliverableJurorNumberError = document.getElementById('undeliverableJurorNumberError');
  undeliverableJurorNumberError.classList.add('js-hidden');
  undeliverableJurorNumberForm.classList.remove('govuk-form-group--error');
}

function addError(message) {
  const undeliverableJurorNumberError = document.getElementById('undeliverableJurorNumberError');
  const undeliverableJurorNumberErrorMessage = document.getElementById('undeliverableJurorNumberErrorMessage');

  undeliverableJurorNumberErrorMessage.textContent = message;
  undeliverableJurorNumberError.classList.remove('js-hidden');
}

function validateJurorNumber(jurorNumber) {
  if (jurorNumber.length !== 9) {
    undeliverableJurorNumberForm.classList.add('govuk-form-group--error');
    addError('Juror number must be 9 characters long');

    return true;
  }

  const isJurorOnTheList = Object.values(tableBody.children).find((row) => (row.id === `row-${jurorNumber}`));

  if (isJurorOnTheList) {
    addError('This juror is already on the list');

    return true;
  }

  return false;
}

function apiCall(jurorNumber) {
  $.ajax({
    url: '/summons-management/bulk-undeliverable/find-juror',
    method: 'POST',
    data: {
      jurorNumber,
      _csrf: csrftoken.value,
    },
  })
    .then((response) => {
      const newRow = createTableRow(response);
      tableBody.append(newRow);

      const newInput = document.createElement('input');
      newInput.id = jurorNumber;
      newInput.name = 'undeliverableJurors';
      newInput.value = jurorNumber;
      newInput.type = 'hidden';
      jurorsToMarkUndeliverableForm.append(newInput);

      const _totalJurors = totalJurors();

      document.getElementById(`remove-${jurorNumber}`).addEventListener('click', () => removeFromTable(jurorNumber));

      tableWrapper.classList.remove('js-hidden');
      totalJurorsCaption.textContent = `${_totalJurors} ${_totalJurors === 1 ? 'juror' : 'jurors'} to be marked as undeliverable`;
    })
    .catch((error) => {
      if (error.status === 404 || error.status === 422) {
        if (error.status === 422) {
          addError('Juror must be in Summoned status to be marked as undeliverable');
        }

        tableWrapper.classList.remove('js-hidden');
        tableBody.append(createTableRow(error.responseJSON));
      }
    });
}

function createTableRow(rowData) {
  const row = document.createElement('tr');
  row.className = 'govuk-table__row';
  row.id = `row-${rowData.jurorNumber}`;

  const jurorNumberLink = document.createElement('a');
  jurorNumberLink.className = 'govuk-link';
  jurorNumberLink.href = '#';
  jurorNumberLink.textContent = rowData.jurorNumber;
  row.append(createTableCell(jurorNumberLink));
  row.append(createTableCell(rowData.firstName || '-'));
  row.append(createTableCell(rowData.lastName || '-'));

  const addressCell = createTableCell();
  if (rowData.address && rowData.address.length) {
    rowData.address.forEach((addressLine, index) => {
      if (index > 0) {
        addressCell.append(document.createElement('br'));
      }
      addressCell.append(document.createTextNode(addressLine));
    });
  } else {
    addressCell.textContent = '-';
  }
  row.append(addressCell);
  row.append(createTableCell(rowData.postcode || '-'));
  row.append(createTableCell(rowData.court || '-'));

  const actionCell = createTableCell();
  if (rowData.isFail) {
    const failed = document.createElement('span');
    failed.className = 'mod-red-text';
    failed.textContent = 'Failed';
    actionCell.append(failed);
  } else {
    const removeLink = document.createElement('a');
    removeLink.className = 'govuk-link';
    removeLink.href = '#';
    removeLink.id = `remove-${rowData.jurorNumber}`;
    removeLink.textContent = 'Remove';
    actionCell.append(removeLink);
  }
  row.append(actionCell);

  return row;
}

function createTableCell(content) {
  const cell = document.createElement('td');
  cell.className = 'govuk-table__cell';

  if (content instanceof Node) {
    cell.append(content);
  } else if (content) {
    cell.textContent = content;
  }

  return cell;
}

function removeFromTable(jurorNumber) {
  const row = document.getElementById(`row-${jurorNumber}`);
  const input = document.getElementById(jurorNumber);

  row.remove();
  input.remove();

  const _totalJurors = totalJurors();

  if (tableBody.children.length === 0) {
    tableWrapper.classList.add('js-hidden');
  }

  totalJurorsCaption.textContent = `${_totalJurors} ${_totalJurors === 1 ? 'juror' : 'jurors'} to be marked as undeliverable`;
}

function totalJurors() {
  return Object.values(tableBody.children).filter((row) => {
    const hasRemoveLink = document.getElementById(`remove-${row.id.replace('row-', '')}`);
    if (hasRemoveLink) {
      return row;
    }
  }).length;
}
