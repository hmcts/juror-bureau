(function() {
  'use strict';

  var poolOverviewFilter = $('#pool-overview-filter')
    , poolOverviewTableWrapper = $('#pool-overview-table-wrapper')
    , poolOverviewShowFilterBtn = $('#pool-overview-show-filter')
    , selectedStatuses = $('input[name="status"]:checked')
    , respondedStatusRadio = $('#jurorsInPool')
    , respondedBureauStatusRadio = $('#jurorsInBureauPool')
    , allStatusRadio = $('#jurorsInPool-2')
    , allBureauStatusRadio= $('#jurorsInBureauPool-2')
    , url = new URL(window.location)
    , checkAllJurors = $('#check-all-jurors')
    , jurorRows = $('input[aria-label^=check-juror]')
    , totalCheckedJurors = $('#total-checked-jurors')
    , totalJurors = $('#total-jurors-count');

  // checking jurors logic
  if (checkAllJurors && checkAllJurors.length) {
    checkAllJurors[0].addEventListener('change', function() {
      var isCheckingAll = this.checked;

      jurorRows.each(function(_, element) {
        element.checked = isCheckingAll;
        if (element.type === 'hidden' && !isCheckingAll) {
          element.parentNode.removeChild(element);
        }
      });

      totalCheckedJurors.text(isCheckingAll ? totalJurors.text() : '0');
    });
  }

  if (jurorRows && jurorRows.length) {
    jurorRows.each(function(_, element) {
      element.addEventListener('change', async function() {
        var isCheckingJuror = this.checked;

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
    $(':checkbox[value=panel]').prop('checked', 'true');
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

  respondedBureauStatusRadio.click(function(event) {
    event.preventDefault();
    window.location.href = window.location.pathname + '?status=responded';
  });

  allBureauStatusRadio.click(function(event) {
    event.preventDefault();
    window.location.href = window.location.pathname + '?status=all';
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
