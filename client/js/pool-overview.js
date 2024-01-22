(function() {
  'use strict';

  var poolOverviewFilter = $('#pool-overview-filter')
    , poolOverviewTableWrapper = $('#pool-overview-table-wrapper')
    , poolOverviewShowFilterBtn = $('#pool-overview-show-filter')
    , selectedStatuses = $('input[name="status"]:checked')
    , respondedStatusRadio = $('#jurorsInPool')
    , allStatusRadio = $('#jurorsInPool-2')
    , url = new URL(window.location)
    , csrfToken = $('#csrfToken')
    , checkAllJurors = $('#check-all-jurors')
    , jurorRows = $('input[aria-label^=check-juror]')
    , totalCheckedJurors = $('#total-checked-jurors')
    , totalJurors = $('#total-jurors-count')
    , poolNumber = $('#poolNumber');

  // checking jurors logic
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
      url: '/juror-management/pool-overview/'
        + poolNumber.val()
        + '/check?jurorNumber=' + jurorNumber + '&action=' + action,
      method: 'POST',
      data: {
        _csrf: csrfToken.val(),
      },
    });
  }

  // filtering logic
  // if the user is not filtering (ie: first page load), we should hide the filters
  if (url.searchParams.get('showFilter') === 'true') {
    poolOverviewFilter.removeClass('js-hidden');
    poolOverviewFilter.attr('aria-hidden', false);
    poolOverviewTableWrapper.removeClass('govuk-grid-column-full');
    poolOverviewTableWrapper.addClass('govuk-grid-column-two-thirds');
    poolOverviewShowFilterBtn.text('Hide filter');
  }

  respondedStatusRadio.click(function(event) {
    event.preventDefault();
    selectedStatuses.removeAttr('checked');
    $(':checkbox[value=responded]').prop('checked', 'true');
    $(':checkbox[value=panelled]').prop('checked', 'true');
    $(':checkbox[value=juror]').prop('checked', 'true');
    $('#applyFiltersButton').trigger('click');
  });

  allStatusRadio.click(function(event) {
    event.preventDefault();
    if (selectedStatuses.length) {
      selectedStatuses.removeAttr('checked');
      $('#applyFiltersButton').trigger('click');
    }
  });


  poolOverviewShowFilterBtn.click(function(event) {
    event.preventDefault();
    if (poolOverviewFilter.attr('aria-hidden') === 'true') {
      poolOverviewFilter.removeClass('js-hidden');
      poolOverviewFilter.attr('aria-hidden', false);

      poolOverviewTableWrapper.removeClass('govuk-grid-column-full');
      poolOverviewTableWrapper.addClass('govuk-grid-column-two-thirds');

      url.searchParams.set('showFilter', 'true');
      window.history.pushState(null, '', url.toString());

      this.textContent = 'Hide filter';
    } else {
      poolOverviewFilter.addClass('js-hidden');
      poolOverviewFilter.attr('aria-hidden', true);

      poolOverviewTableWrapper.removeClass('govuk-grid-column-two-thirds');
      poolOverviewTableWrapper.addClass('govuk-grid-column-full');

      url.searchParams.delete('showFilter');
      window.history.pushState(null, '', url.toString());

      this.textContent = 'Show filter';
    }
  });

})();
