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
      const newRow = $(response);
      tableBody.append(newRow[0]);

      const newInput = $(`<input id="${jurorNumber}" name="undeliverableJurors" value="${jurorNumber}" type="hidden"/>`);
      jurorsToMarkUndeliverableForm.append(newInput[0]);

      const _totalJurors = totalJurors();

      document.getElementById(`remove-${jurorNumber}`).addEventListener('click', () => removeFromTable(jurorNumber));

      tableWrapper.classList.remove('js-hidden');
      totalJurorsCaption.textContent = `${_totalJurors} ${_totalJurors === 1 ? 'juror' : 'jurors'} to be marked as undeliverable`;
    })
    .catch((error) => {
      if (error.status === 404) {
        const newRow = $(error.responseText);

        tableWrapper.classList.remove('js-hidden');
        tableBody.append(newRow[0]);
      }
    });
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