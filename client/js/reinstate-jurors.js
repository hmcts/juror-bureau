(function() {
  'use strict';

  var checkAllJurors = $('#check-all-jurors')
    , jurorRows = $('input[id^=select]')
    , totalCheckedJurors = $('#noCheckedJurors')
    , totalJurors = $('#totalJurors');

  // checking jurors logic
  if (checkAllJurors) {
    checkAllJurors.on('change', function() {
      var isCheckingAll = this.checked;

      if (jurorRows && jurorRows.length) {
        $('input:checkbox').not(this).prop('checked', this.checked);
      }

      totalCheckedJurors.text(isCheckingAll ? jurorRows.length : '0');
    });
  }

  if (jurorRows && jurorRows.length) {
    jurorRows.each(function(_, element) {
      element.addEventListener('change', async function() {
        var isCheckingJuror = this.checked;

        var noChecked = $('input[id^=select]:checked').length;
        totalCheckedJurors.text(noChecked || '0');

        updateCheckAllJurorsCheckbox(isCheckingJuror);
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

})();
