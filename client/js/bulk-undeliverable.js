const undeliverableJurorNumberForm = document.getElementById('undeliverableJurorNumberForm');
const jurorsToMarkUndeliverableForm = document.getElementById('jurorsToMarkUndeliverableForm');
const tableWrapper = document.getElementById('tableWrapper');
const totalJurorsCaption = document.getElementById('totalJurorsCaption');
const tableBody = document.getElementById('tableBody');
const csrftoken = document.getElementById('csrfToken');

undeliverableJurorNumberForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  clearError();
  const hasError = validateJurorNumber();

  if (hasError) {
    return;
  }

  const undeliverableJurorNumber = document.getElementById('undeliverableJurorNumber');

  const jurorNumber = undeliverableJurorNumber.value;
  apiCall(jurorNumber);

  undeliverableJurorNumber.value = '';
});

function clearError() {
  const undeliverableJurorNumberError = document.getElementById('undeliverableJurorNumberError');
  undeliverableJurorNumberError.classList.add('js-hidden');
  undeliverableJurorNumberForm.classList.remove('govuk-form-group--error');
}

function validateJurorNumber() {
  const undeliverableJurorNumber = document.getElementById('undeliverableJurorNumber');
  const undeliverableJurorNumberError = document.getElementById('undeliverableJurorNumberError');

  if (undeliverableJurorNumber.value.length !== 9) {
    undeliverableJurorNumberForm.classList.add('govuk-form-group--error');
    undeliverableJurorNumberError.classList.remove('js-hidden');

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
  }).then((response) => {
    const newRow = $(response);
    tableBody.append(newRow[0]);

    const newInput = $(`<input id="${jurorNumber}" name="undeliverableJurors" value="${jurorNumber}" type="hidden"/>`);
    jurorsToMarkUndeliverableForm.append(newInput[0]);

    const totalJurors = tableBody.children.length;

    tableWrapper.classList.remove('js-hidden');
    totalJurorsCaption.textContent = `${totalJurors} ${totalJurors === 1 ? 'juror' : 'jurors'} to be marked as undeliverable`;
  });
}