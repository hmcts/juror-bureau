(function() {
  'use strict';

  var csrfToken = $('#csrfToken');
  var totalCheckedPools = $('#total-checked-pools');
  var checkAllPools = $('#check-all-pools');
  var poolRows = $('input[aria-label^=check-pool]');
  var checkAllJurors = $('#check-all-jurors');
  var jurorRows = $('input[aria-label^=check-juror]');
  var totalCheckedJurors = $('#total-checked-jurors');
  var totalJurors = $('#total-jurors-count');

  // pools related logic
  if (checkAllPools && checkAllPools.length) {
    checkAllPools[0].addEventListener('change', function() {
      var isCheckingAll = this.checked;

      poolRows.each(function(_, element) {
        element.checked = isCheckingAll;
      });

      totalCheckedPools.text(isCheckingAll ? poolRows.length : '0');
    });
  }

  if (poolRows && poolRows.length) {
    poolRows.each(function(_, element) {
      element.addEventListener('change', function() {
        if (this.checked) {
          totalCheckedPools.text(+totalCheckedPools.text() + 1);
        } else {
          totalCheckedPools.text(+totalCheckedPools.text() - 1);
        }
        updateCheckAllPoolsCheckbox(this.checked);
      });
    });
  }

  function updateCheckAllPoolsCheckbox(checking) {
    if (checking) {
      if (+totalCheckedPools.text() === poolRows.length) {
        checkAllPools[0].checked = true;
      }
    } else {
      checkAllPools[0].checked = false;
    }
  }

  // jurors related logic
  if (checkAllJurors && checkAllJurors.length) {
    checkAllJurors[0].addEventListener('change', function() {
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

        await request(jurorNumber, isCheckingJuror);

        if (isCheckingJuror) {
          totalCheckedJurors.text(+totalCheckedJurors.text() + 1);
        } else {
          totalCheckedJurors.text(+totalCheckedJurors.text() - 1);
        }

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

  function request(jurorNumber, isChecking) {
    var action = isChecking ? 'check' : 'uncheck';

    return $.ajax({
      url: '/juror-management/dismiss-jurors/jurors/check?jurorNumber=' + jurorNumber + '&action=' + action,
      method: 'POST',
      data: {
        _csrf: csrfToken.val(),
      },
    });
  }

})();
