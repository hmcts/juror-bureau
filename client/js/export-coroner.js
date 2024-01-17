/* eslint-disable max-len */
(function() {
  'use strict';

  var exportButton = $('#exportPoolButton')
    , poolNumber = $('#poolNumber')
    , bannerWrapper = $('#bannerWrapper');

  exportButton.click(clickHandler);

  function clickHandler(event) {
    event.preventDefault();

    // eslint-disable-next-line vars-on-top
    var url = '/pool-management/pool/{}/coroner/export'.replace('{}', poolNumber.text());

    $.get(url)
      .then(function(data) {
        var csvBlob = new Blob([data], { type: 'text/csv' })
          , csvURL = URL.createObjectURL(csvBlob)
          , tempLink = document.createElement('a');

        tempLink.href = csvURL;
        tempLink.setAttribute('download', 'pool_' + poolNumber.text());
        tempLink.click();

        addBanner('success');
      })
      .catch(function() {
        addBanner('error');
      });
  }

  function addBanner(type) {
    if (type === 'success') {
      bannerWrapper.html(
        '<div class="moj-banner moj-banner--success" id="successBanner" role="region" aria-label="Success" style="display: none;">' +
        '<svg class="moj-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M25,6.2L8.7,23.2L0,14.1l4-4.2l4.7,4.9L21,2L25,6.2z"></path></svg>' +
        '<div class="moj-banner__message">Pool <b>' + poolNumber.text() + '</b> successfully exported.</div>' +
        '</div>'
      );
    }

    if (type === 'error') {
      bannerWrapper.html(
        '<div class="moj-banner moj-banner--warning" id="errorBanner" role="region" aria-label="Warning">' +
        '<svg class="moj-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M13.6,15.4h-2.3v-4.5h2.3V15.4z M13.6,19.8h-2.3v-2.2h2.3V19.8z M0,23.2h25L12.5,2L0,23.2z"></path></svg>' +
        '<div class="moj-banner__message">There was a problem exporting pool <b>' + poolNumber.text() + '</b> Try again. If the problem persists contact support.</div>' +
        '</div>'
      );
    }
  }

})();
