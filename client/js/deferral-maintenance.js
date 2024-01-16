(function() {
  'use strict';

  var deferralMaintenanceFilter = $('#deferral-maintenance-filter')
    , deferralMaintenanceTableWrapper = $('#deferral-maintenance-table-wrapper')
    , deferralMaintenanceShowFilterBtn = $('#deferral-maintenance-show-filter')
    , deferralSelectedCount = $('#deferral-selected-count')
    , deferralTotalCount = $('#deferral-total-count')
    , url = new URL(window.location);

  // if the user is not filtering (ie: first page load), we should hide the filterb
  if (url.searchParams.get('showFilter') === 'true') {
    deferralMaintenanceFilter.removeClass('js-hidden');
    deferralMaintenanceFilter.attr('aria-hidden', false);
    deferralMaintenanceTableWrapper.removeClass('govuk-grid-column-full');
    deferralMaintenanceTableWrapper.addClass('govuk-grid-column-two-thirds');
    deferralMaintenanceShowFilterBtn.text('Hide filter');
  }

  deferralMaintenanceShowFilterBtn.click(function() {
    if (deferralMaintenanceFilter.attr('aria-hidden') === 'true') {
      deferralMaintenanceFilter.removeClass('js-hidden');
      deferralMaintenanceFilter.attr('aria-hidden', false);

      deferralMaintenanceTableWrapper.removeClass('govuk-grid-column-full');
      deferralMaintenanceTableWrapper.addClass('govuk-grid-column-two-thirds');

      url.searchParams.set('showFilter', 'true');
      window.history.pushState(null, '', url.toString());

      this.textContent = 'Hide filter';
    } else {
      deferralMaintenanceFilter.addClass('js-hidden');
      deferralMaintenanceFilter.attr('aria-hidden', true);

      deferralMaintenanceTableWrapper.removeClass('govuk-grid-column-two-thirds');
      deferralMaintenanceTableWrapper.addClass('govuk-grid-column-full');

      url.searchParams.delete('showFilter');
      window.history.pushState(null, '', url.toString());

      this.textContent = 'Show filter';
    }
  });

  $('input[aria-label="select-all-deferrals"').click(function(el) {
    var isFiltered = el.target.dataset.isFiltered;

    $('input[aria-label^="deferral-select-"]').each(function(_, defEl) {
      if (el.target.checked) {
        defEl.checked = true;
      } else if (!el.target.checked) {
        defEl.checked = false;
      }
    });

    ajax('all?check=' + el.target.checked + '&isFiltered=' + isFiltered);
  });

  // like this we give a proper label to the input box and use that same label to select it
  $('input[aria-label^="deferral-select-"]').click(function(el) {
    var pattern = new RegExp(/[0-9]+/)
      , jurorNumber = el.target.id.match(pattern);

    if (!jurorNumber || !pattern.test(jurorNumber[0])) return;

    ajax(jurorNumber[0]);
  });

  function ajax(param) {
    $.get('/pool-management/deferral-maintenance/check/' + param)
      .then(function(data) {
        deferralSelectedCount.text(data.total);

        if (data.isChecked === 'all') return;

        if (data.isChecked) {
          if (deferralTotalCount.text() === deferralSelectedCount.text()) {
            $('input[aria-label="select-all-deferrals"').each(function(_, el) {
              el.checked = true;
            });
          }
        } else {
          $('input[aria-label="select-all-deferrals"').each(function(_, el) {
            el.checked = false;
          });
        }
      });
  }

})();
