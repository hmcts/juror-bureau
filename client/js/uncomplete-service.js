(function() {
  'use strict';

  var checkAllJurors = $('#check-all-jurors')
    , jurorRows = $('input[id^=select]')
    , totalCheckedJurors = $('#checkedJurors')
    , totalJurors = $('#totalJurors')
    , csrfToken = $('#_csrf');

  // checking jurors logic
  if (checkAllJurors) {
    checkAllJurors.on('change', function() {
      var isCheckingAll = this.checked;

      request(this.id, isCheckingAll).then(function() {
        jurorRows.each(function(_, element) {
          element.checked = isCheckingAll;
        });

        totalCheckedJurors.text(isCheckingAll ? totalJurors.text() : '0');
      });
    });
  }

  if (jurorRows && jurorRows.length) {
    jurorRows.each(function(_, element) {
      element.addEventListener('change', async function() {
        var jurorNumber = this.id.split('-')[1];
        var isCheckingJuror = this.checked;

        request(jurorNumber, isCheckingJuror).then(function() {
          if (isCheckingJuror) {
            totalCheckedJurors.text(+totalCheckedJurors.text() + 1);
          } else {
            totalCheckedJurors.text(+totalCheckedJurors.text() - 1);
          }
          updateCheckAllJurorsCheckbox(isCheckingJuror);
        });
      });
    });
  }

  function updateCheckAllJurorsCheckbox(checking) {
    if (checking) {
      if (totalCheckedJurors.text() === totalJurors.text()) {
        checkAllJurors[0].checked = true;
      }
    } else {
      checkAllJurors[0].checked = false;
    }
  }

  function request(jurorNumber, isChecking) {
    var action = isChecking ? 'check' : 'uncheck';

    return $.ajax({
      url: '/senior-jury-officer-tasks/uncomplete-service/search/check?jurorNumber='
        + jurorNumber + '&action=' + action,
      method: 'POST',
      data: {
        _csrf: csrfToken.val(),
      },
    });
  };

})();
