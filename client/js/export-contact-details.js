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
    , totalJurors = $('#totalJurors');

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

      let queryParams = getRelevantQueryParams();

      queryParams += '&checkAll=true';

      checkRequest(this.id, null, isCheckingAll, queryParams).then(function(noSelected) {
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
        var poolNumber = this.attributes['data-poolnumber'].value;

        checkRequest(jurorNumber, poolNumber, isCheckingJuror).then(function(noSelected) {
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

  function checkRequest(jurorNumber, poolNumber, isChecking, queryParams = '') {
    var action = isChecking ? 'check' : 'uncheck';

    const isSearchByJurorNumber = url.searchParams.get('searchBy') === 'jurorNumber';

    return $.ajax({
      url: '/messaging/export-contact-details/jurors/check?action='
        + action + (queryParams ? queryParams : '&poolNumber=' + poolNumber)
        + (!isSearchByJurorNumber ? '&jurorNumber=' + jurorNumber : ''),
      method: 'POST',
      data: {
        _csrf: csrfToken.val(),
      },
    });
  }

  function getRelevantQueryParams() {
    const showOnly = url.searchParams.get('showOnly');
    const include = url.searchParams.get('include');
    const searchBy = url.searchParams.get('searchBy');

    let queryString = '&searchBy=' + searchBy;

    if (showOnly) queryString += `&showOnly=${showOnly}`;
    if (include) queryString += `&include=${include}`;

    switch (searchBy) {
    case 'court':
      const court = url.searchParams.get('courtName');

      if (court) queryString += `&courtName=${court}`;
      break;
    case 'pool':
      const pool = url.searchParams.get('poolNumber');

      if (pool) queryString += `&poolNumber=${pool}`;
      break;
    case 'date':
      const dateDeferredTo = url.searchParams.get('dateDeferredTo');

      if (dateDeferredTo) queryString += `&dateDeferredTo=${dateDeferredTo}`;
      break;
    case 'jurorNumber':
      const jurorNumber = url.searchParams.get('jurorNumber');

      if (jurorNumber) queryString += `&jurorNumber=${jurorNumber}`;
      break;
    case 'jurorName':
      const jurorName = url.searchParams.get('jurorName');

      if (jurorName) queryString += `&jurorName=${jurorName}`;
      break;
    case 'postcode':
      const postcode = url.searchParams.get('postcode');

      if (postcode) queryString += `&postcode=${postcode}`;
      break;
    }

    return queryString;
  }

})();
