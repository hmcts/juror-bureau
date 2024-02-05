(function() {
  'use strict';

  var selectedJurorsCount = $('#selectedJurorsCount');
  var jurorRows = $('input[aria-label^=check-juror-]');
  var csrfToken = $('#csrfToken');
  var documentType = $('#documentType');
  var deleteLetterLinks = $('a[id^=delete-letter-]');

  jurorRows.each(function(_, element) {
    element.addEventListener('change', function() {
      var jurorNumber = this.id.split('-')[1];
      var documentVersion = $(this).attr('data-version');
      var datePrinted = $(this).attr('data-printed');

      if (this.checked) {
        selectedJurorsCount.text(+selectedJurorsCount.text() + 1);
      } else {
        selectedJurorsCount.text(+selectedJurorsCount.text() - 1);
      }

      $.ajax({
        url: `/documents/${documentType.val()}/letters-list/check-juror`,
        method: 'POST',
        data: {
          _csrf: csrfToken.val(),
          isChecking: this.checked,
          'juror_number': jurorNumber,
          'form_code': documentVersion,
          'date_printed': datePrinted,
        },
      });
    });
  });

  deleteLetterLinks.each(function(_, link) {
    link.addEventListener('click', function(event) {
      var documentVersion = $(link).attr('data-version');
      var jurorNumber = $(link).attr('data-juror-number');
      var datePrinted = $(link).attr('data-printed');
      var row = $(`#row-${jurorNumber}`);

      event.preventDefault();

      $.ajax({
        url: `/documents/${documentType.val()}/letters-list/delete-letter`,
        method: 'DELETE',
        data: {
          _csrf: csrfToken.val(),
          'juror_number': jurorNumber,
          'form_code': documentVersion,
          'date_printed': datePrinted,
        },
      })
        .then(() => {
          var successBox = $('#delete-success');

          row.remove();

          successBox.removeClass('mod-hidden');
        })
        .catch(() => {
          var errorBox = $('#delete-error');

          errorBox.removeClass('mod-hidden');
        });
    });
  });

})();
