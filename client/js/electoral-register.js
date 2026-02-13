const checkAllLa = $('#selectAllCheckbox');
const laRows = $('input[aria-label^=select]');
const checkedAuthorities = $('#checkedAuthorities');
const totalAuthorities = $('#totalAuthorities');
const csrfToken = $('#csrfToken');

// checking jurors logic
if (checkAllLa && checkAllLa.length) {
  checkAllLa[0].addEventListener('change', function() {
    const isCheckingAll = this.checked;

    checkRequest(this.id, isCheckingAll).then(function(noSelected) {
      laRows.each(function(_, element) {
        element.checked = isCheckingAll;
      });
      checkedAuthorities.text(isCheckingAll ? noSelected : '0');
    });
  });
}

if (laRows && laRows.length) {
  laRows.each(function(_, element) {
    element.addEventListener('change', async function() {
      const laCode = this.id.split('-')[1];
      const isCheckingLa = this.checked;

      checkRequest(laCode, isCheckingLa).then(function(noSelected) {
        checkedAuthorities.text(noSelected || '0');
        updatecheckAllLaCheckbox(isCheckingLa);
      });
    });
  });
}

function updatecheckAllLaCheckbox(checking) {
  if (checking) {
    if (checkedAuthorities.text() === totalAuthorities.text()) {
      checkAllLa[0].checked = true;
    }
  } else {
    checkAllLa[0].checked = false;
  }
}

function checkRequest(laCode, isChecking) {
  const action = isChecking ? 'check' : 'uncheck';

  return $.ajax({
    url: `/electoral-register/check-la?laCode=${laCode}&action=${action}`,
    method: 'POST',
    data: {
      _csrf: csrfToken.val(),
    },
  });
}


$(document).ready(() => {
  $('[name="status"]').on('change', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const localAuthorityFilter = urlParams.get('localAuthorityFilter') || '';

    window.location.href = '/electoral-register/filter-status?status=' + $(this).val()
    + `${localAuthorityFilter ? `&localAuthorityFilter=${encodeURIComponent(localAuthorityFilter)}` : ''}`;
  });
});