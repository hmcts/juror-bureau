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
        `<div role="region" class="moj-alert moj-alert--success" aria-label="success" data-module="moj-alert">
          <div>
            <svg class="moj-alert__icon" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" height="30" width="30">
              <path d="M11.2869 24.6726L2.00415 15.3899L4.62189 12.7722L11.2869 19.4186L25.3781 5.32739L27.9958 7.96369L11.2869 24.6726Z" fill="currentColor" />
            </svg>
          </div>
          <div class="moj-alert__content">Pool <b>${poolNumber.text()}</b> successfully exported.</div>
          <div class="moj-alert__action">
            <button class="moj-alert__dismiss" hidden>Dismiss</button>
          </div>
        </div>`
      )
    }

    if (type === 'error') {
      bannerWrapper.html(
        `<div id="errorBanner" role="region" class="moj-alert moj-alert--error" aria-label="error" data-module="moj-alert">
          <div>
            <svg class="moj-alert__icon" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" height="30" width="30">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M20.1777 2.5H9.82233L2.5 9.82233V20.1777L9.82233 27.5H20.1777L27.5 20.1777V9.82233L20.1777 2.5ZM10.9155 8.87769L15.0001 12.9623L19.0847 8.87771L21.1224 10.9154L17.0378 15L21.1224 19.0846L19.0847 21.1222L15.0001 17.0376L10.9155 21.1223L8.87782 19.0846L12.9624 15L8.87783 10.9153L10.9155 8.87769Z" fill="currentColor" />
            </svg>
          </div>
          <div class="moj-alert__content">There was a problem exporting pool <b>${poolNumber.text()}</b> Try again. If the problem persists contact support..</div>

          <div class="moj-alert__action">
            <button class="moj-alert__dismiss" hidden>Dismiss</button>
          </div>
        </div>`
      )
    }
  }

})();
