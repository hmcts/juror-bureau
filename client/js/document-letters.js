(function() {
  'use strict';

  var selectedJurorsCount = $('#selectedJurorsCount');
  var totalCheckableJurors = $('#totalCheckableJurors');
  var jurorRows = $('input[aria-label^=check-juror-]');
  var csrfToken = $('#csrfToken');
  var documentType = $('#documentType');
  var deleteLetterLinks = $('a[id^=delete-letter-]');
  var checkAllJurors = $('#check-all-jurors');

  checkAllJurors.click(function() {
    const isCheckingAll = this.checked;

    doAjaxCall(this.checked, null, null, 'null', 'POST', true).then(function(noChecked) {
      jurorRows.each(function(_, element) {
        element.checked = isCheckingAll;
      });
      selectedJurorsCount.text(isCheckingAll ? noChecked : '0');
    });

  });

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

      doAjaxCall(this.checked, jurorNumber, documentVersion, datePrinted, 'POST');
      updateCheckAllJurorsCheckbox();
    });
  });

  deleteLetterLinks.each(function(_, link) {
    link.addEventListener('click', function(event) {
      var documentVersion = $(link).attr('data-version');
      var jurorNumber = $(link).attr('data-juror-number');
      var datePrinted = $(link).attr('data-printed');
      var row = $(`#row-${jurorNumber}`);

      event.preventDefault();

      doAjaxCall(_, jurorNumber, documentVersion, datePrinted, 'DELETE')
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

  function doAjaxCall(isChecking, jurorNumber, documentVersion, datePrinted, reqMethod, isCheckAll = false) {
    const routeUrl = reqMethod === 'POST' ? 'check-juror' : 'delete-letter';

    return $.ajax({
      url: `/documents/${documentType.val()}/letters-list/` + routeUrl,
      method: reqMethod,
      data: {
        _csrf: csrfToken.val(),
        isChecking,
        'juror_number': jurorNumber,
        'form_code': documentVersion,
        'date_printed': datePrinted,
        isCheckAll,
      },
    });
  }

  function updateCheckAllJurorsCheckbox() {
    if (selectedJurorsCount.text() === totalCheckableJurors.text()) {
      checkAllJurors[0].checked = true;
    } else {
      checkAllJurors[0].checked = false;
    }
  }

})();
