(function() {
  'use strict';

  var csrfToken = $('#csrfToken');
  var totalCheckedPools = $('#total-checked-pools');
  var totalPools = $('#total-pools-count')
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

      checkPoolRequest(this.id, isCheckingAll).then(function() {
        poolRows.each(function(_, element) {
          element.checked = isCheckingAll;
        });

        totalCheckedPools.text(isCheckingAll ? totalPools.text() : '0');
      });
    });
  }

  if (poolRows && poolRows.length) {
    poolRows.each(function(_, element) {
      element.addEventListener('change', async function() {
        var poolNumber = this.id.split('-')[1];
        var isCheckingPool = this.checked;

        await checkPoolRequest(poolNumber, isCheckingPool);

        if (isCheckingPool) {
          totalCheckedPools.text(+totalCheckedPools.text() + 1);
        } else {
          totalCheckedPools.text(+totalCheckedPools.text() - 1);
        }

        updateCheckAllPoolsCheckbox(isCheckingPool);
      });
    });
  }

  function updateCheckAllPoolsCheckbox(checking) {
    if (checking) {
      if (totalCheckedPools.text() === totalPools.text()) {
        checkAllPools[0].checked = true;
      }
    } else {
      checkAllPools[0].checked = false;
    }
  }

  function checkPoolRequest(poolNumber, isChecking) {
    var action = isChecking ? 'check' : 'uncheck';

    return $.ajax({
      url: '/pool-management/dismiss-jurors/pools/check?poolNumber=' + poolNumber + '&action=' + action,
      method: 'POST',
      data: {
        _csrf: csrfToken.val(),
      },
    });
  }


  // jurors related logic
  if (checkAllJurors && checkAllJurors.length) {
    checkAllJurors[0].addEventListener('change', function() {
      var isCheckingAll = this.checked;

      checkJurorRequest(this.id, isCheckingAll).then(function() {
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

        await checkJurorRequest(jurorNumber, isCheckingJuror);

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

  function checkJurorRequest(jurorNumber, isChecking) {
    var action = isChecking ? 'check' : 'uncheck';

    return $.ajax({
      url: '/pool-management/dismiss-jurors/jurors/check?jurorNumber=' + jurorNumber + '&action=' + action,
      method: 'POST',
      data: {
        _csrf: csrfToken.val(),
      },
    });
  }

})();
