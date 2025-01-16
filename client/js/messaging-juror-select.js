(function() {
  'use strict';

  var messagingFilter = $('#messaging-jurors-filter')
    , jurorsTableWrapper = $('#messaging-jurors-table-wrapper')
    , jurorsShowFilterBtn = $('#filterJurorsButton')
    , url = new URL(window.location)
    , csrfToken = $('#csrfToken');

  var checkAllJurors = $('#check-all-jurors')
    , jurorRows = $('input[aria-label^=check-juror]')
    , totalCheckedJurors = $('#checkedJurors')
    , totalJurors = $('#totalJurors')
    , messageKey = $('#messageKey');

  var jurorMethods = $('select[id^=selectMethod-]');

  // filtering logic
  // if the user is not filtering (ie: first page load), we should hide the filters
  if (url.searchParams.get('showFilter') === 'true') {
    messagingFilter.removeClass('js-hidden');
    messagingFilter.attr('aria-hidden', false);
    jurorsTableWrapper.removeClass('govuk-grid-column-full');
    jurorsTableWrapper.addClass('govuk-grid-column-three-quarters');
    jurorsShowFilterBtn.text('Hide filter');
  }

  jurorsShowFilterBtn.click(function(event) {
    event.preventDefault();
    if (messagingFilter.attr('aria-hidden') === 'true') {
      messagingFilter.removeClass('js-hidden');
      messagingFilter.attr('aria-hidden', false);

      jurorsTableWrapper.removeClass('govuk-grid-column-full');
      jurorsTableWrapper.addClass('govuk-grid-column-three-quarters');

      url.searchParams.set('showFilter', 'true');
      window.history.pushState(null, '', url.toString());

      this.textContent = 'Hide filter';
    } else {
      messagingFilter.addClass('js-hidden');
      messagingFilter.attr('aria-hidden', true);

      jurorsTableWrapper.removeClass('govuk-grid-column-three-quarters');
      jurorsTableWrapper.addClass('govuk-grid-column-full');

      url.searchParams.delete('showFilter');
      window.history.pushState(null, '', url.toString());

      this.textContent = 'Show filter';
    }
  });


  // checking jurors logic
  if (checkAllJurors && checkAllJurors.length) {
    checkAllJurors[0].addEventListener('change', function() {
      var isCheckingAll = this.checked;

      checkRequest(this.id, isCheckingAll).then(function(noSelected) {
        jurorRows.each(function(_, element) {
          element.checked = isCheckingAll;
        });
        totalCheckedJurors.text(isCheckingAll ? noSelected : '0');
      });
    });
  }

  if (jurorRows && jurorRows.length) {
    jurorRows.each(function(_, element) {
      element.addEventListener('change', async function() {
        var jurorNumber = this.id;
        var isCheckingJuror = this.checked;

        checkRequest(jurorNumber, isCheckingJuror).then(function(noSelected) {
          totalCheckedJurors.text(noSelected || '0');
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

  function checkRequest(jurorNumber, isChecking) {
    var action = isChecking ? 'check' : 'uncheck';

    return $.ajax({
      url: '/messaging/send/' + messageKey.text() + '/select-jurors/check?jurorNumber=' + jurorNumber + '&action=' + action,
      method: 'POST',
      data: {
        _csrf: csrfToken.val(),
      },
    });
  }

  //Changing notifcation method logic
  if (jurorMethods && jurorMethods.length) {
    jurorMethods.each(function(_, element) {
      element.addEventListener('change', async function() {
        var jurorNumber = this.id.split('-')[1];
        var selectedOption = $('#' + this.id).find(':selected').val();

        await changeMethodRequest(jurorNumber, selectedOption);
      });
    });
  }

  function changeMethodRequest(jurorNumber, selectedOption) {
    return $.ajax({
      url: '/messaging/send/select-jurors/method?jurorNumber=' + jurorNumber + '&selection=' + selectedOption,
      method: 'POST',
      data: {
        _csrf: csrfToken.val(),
      },
    });
  }

})();
