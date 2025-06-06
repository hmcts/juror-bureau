(function() {
  'use strict';

  // Attach to any submit button inside a form
  $('form button[type="submit"]').on('click', function(event) {
    // Disable the button to prevent double submission
    $(this).attr('disabled', true);

    // Find the closest form and submit it
    var $form = $(this).closest('form');
    $form.submit();

    // Hide error summary and navigation
    $('.govuk-error-summary').hide();
    $('.moj-primary-navigation').hide();

    var message = $form.attr('loading-spinner-message');

    // Find the outermost .govuk-grid-column-full ancestor and replace its content
    var $container = $(this).closest('.govuk-grid-column-full');
    if ($container.length === 0) {
      // fallback: find the outermost one on the page
      $container = $('.govuk-grid-column-full').first();
    }
    $container.html(
      '<div class="hods-loading-spinner" id="request-pool-spinner">' +
        '<div class="hods-loading-spinner__spinner" aria-live="polite" role="status"></div>' +
        '<div class="hods-loading-spinner__content">' +
          '<h1 class="govuk-heading-m"> ' + message + ' </h1>' +
        '</div>' +
      '</div>'
    );
  });

})();
