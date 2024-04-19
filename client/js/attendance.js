(function() {
  'use strict';

  var checkInHour = $('#checkInTimeHour');
  var checkInMinute = $('#checkInTimeMinute');
  var checkInTimeAm = $('#checkInTime-am');
  var checkInTimePm = $('#checkInTime-pm');

  var checkOutHour = $('#checkOutTimeHour');
  var checkOutMinute = $('#checkOutTimeMinute');
  var checkOutTimeAm = $('#checkOutTime-am');
  var checkOutTimePm = $('#checkOutTime-pm');

  var jurorNumber;
  var form = '';

  var csrfToken = $('#csrfToken');
  var attendeesTable = $('#attendanceTable');

  var errorContainer = $('div[data-module="govuk-error-summary"]');
  var errorsList = $('#errors-list');
  var validationResult;

  var checkOutRadio = $('#checkInOrCheckOut-2');
  var checkOutConditionalHtml = $('#conditional-checkInOrCheckOut-2');
  var checkInConditionalHtml = $('#conditional-checkInOrCheckOut');

  // error summaries
  var checkInFailedSummary = $('#checkInFailedSummary');
  var checkInFailedList = $('#checkInFailedList');
  var checkOutFailedSummary = $('#checkOutFailedSummary');
  var checkOutFailedList = $('#checkOutFailedList');

  $('#checkInForm').submit(function(event) {
    var jn;

    jurorNumber = $('#checkInJurorNumber');
    form = 'checkIn';

    event.preventDefault();
    errorContainer.addClass('js-hidden');

    validationResult = validate('single');
    if (validationResult) {
      addError(validationResult);
      return;
    }

    // if all is good add a temp row and clear the input
    jn = jurorNumber.val();

    if (checkForDuplicateRow(jn)) {

      if (checkForExistingFailedRow(jn)){
        jurorNumber.focus();
        addError([{
          message: 'An attempt to check in this juror has already been made',
          field: 'checkInJurorNumber',
        }]);
        return;
      }

      jurorNumber.focus();
      addError([{
        message: 'This juror is already checked-in',
        field: 'checkInJurorNumber',
      }]);
      return;
    }

    addTempRow(jn);
    jurorNumber.val('');
    jurorNumber.focus();

    $.ajax({
      url: '/juror-management/attendance/check-in',
      method: 'POST',
      data: {
        jurorNumber: jn,
        time: buildTimeString(),
        _csrf: csrfToken.val(),
      },
    })
      .then(function(res) {
        replaceTableRow(res);

        checkInTimeError(null, true);
        jurorNumberError(null, true);
      })
      .catch(function(err) {
        if (err.status === 403) {
          location.href = '/'; // TODO: handle this better
        }

        if (err.status === 404) {
          addError([{
            message: 'No juror found with the number you entered - check and try again',
            field: 'checkInJurorNumber',
          }]);

          // eslint-disable-next-line newline-after-var, vars-on-top
          var badRow = $('#' + jn + '-row');
          badRow.remove();
          jurorNumber.val(jn);

          if (!$(attendeesTable.children()[1]).children().length) {
            attendeesTable.addClass('js-hidden');
          }
        }
      });
  });

  $('#checkOutSingleJuror').click(function(event) {
    var jn;

    jurorNumber = $('#checkOutJurorNumber');
    form = 'checkOut';

    event.preventDefault();
    errorContainer.addClass('js-hidden');

    validationResult = validate('single');
    if (validationResult) {
      addError(validationResult);
      return;
    }

    jn = jurorNumber.val();

    jurorNumber.val('');
    jurorNumber.focus();

    $.ajax({
      url: '/juror-management/attendance/check-out',
      method: 'POST',
      data: {
        jurorNumber: jn,
        time: checkOutHour.val() + ':' + checkOutMinute.val() + timePeriod(),
        _csrf: csrfToken.val(),
      },
    })
      .then(function(res) {
        replaceTableRow(res);

        checkOutTimeError(null, true);
        jurorNumberError(null, true);
      })
      .catch(function(err) {
        if (err.status === 403) {
          location.href = '/'; // TODO: handle this better
        }

        if (err.status === 404) {
          addError([{
            message: 'No juror found with the number you entered - check and try again',
            field: 'checkOutJurorNumber',
          }]);
        }

        if (err.status === 400) {
          addError([{
            message: 'Check out time cannot be earlier than check in time',
            field: 'checkOutTimeHour',
          }]);
        }

        jurorNumber.val(jn);
        jurorNumber.focus();
      });
  });

  $('[id$=recordCheckOut]').click(recordCheckoutTimeHandler);

  function recordCheckoutTimeHandler() {
    var jn = $(this).attr('id');

    jurorNumber = $('#checkOutJurorNumber');
    form = 'checkOut';

    jn = jn.substring(0, jn.indexOf('-'));

    jurorNumber.val(jn);

    errorContainer.addClass('js-hidden');

    validationResult = validate('record');
    if (validationResult) {
      addError(validationResult);
      // Emulate click on check out radio
      checkOutRadio.prop('checked', true);
      checkInConditionalHtml.addClass('govuk-radios__conditional--hidden');
      checkOutConditionalHtml.removeClass('govuk-radios__conditional--hidden');
      return;
    }

    jurorNumber.val('');
    jurorNumber.focus();

    $.ajax({
      url: '/juror-management/attendance/check-out',
      method: 'POST',
      data: {
        jurorNumber: jn,
        time: checkOutHour.val() + ':' + checkOutMinute.val() + timePeriod(),
        _csrf: csrfToken.val(),
      },
    })
      .then(function(res) {
        replaceTableRow(res);

        checkOutTimeError(null, true);
        jurorNumberError(null, true);
      })
      .catch(function(err) {
        if (err.status === 403) {
          location.href = '/'; // TODO: handle this better
        }
        if (err.status === 400) {
          addError([{
            message: 'Check out time cannot be earlier than check in time',
            field: 'checkOutTimeHour',
          }]);
        }
        jurorNumber.val(jn);
        jurorNumber.focus();
      });
  }

  function validate(method) {
    var errors = [];

    // clear errors
    jurorNumberError(null, true);
    checkInTimeError(null, true);
    checkOutTimeError(null, true);

    if (method === 'single') {
      validateJurorNumber(errors);
    }
    if (form === 'checkIn'){
      validateCheckInTime(errors);
    } else if (form === 'checkOut') {
      validateCheckOutTime(method, errors);
    }

    if (errors.length) {
      return errors;
    }

    errorsList.empty();

    return null;
  }

  function validateJurorNumber(errors) {
    var _jurorNumber = jurorNumber.val();

    if (!_jurorNumber) {
      errors.push({
        message: 'Enter a juror number, or click in the field and then scan a barcode',
        field: form + 'JurorNumber',
      });
    }

    if (_jurorNumber && (_jurorNumber.length > 9 || _jurorNumber.length < 9)) {
      errors.push({
        message: 'Juror number must only include 9 numbers',
        field: form + 'JurorNumber',
      });
    }

    if (isNaN(_jurorNumber)) {
      errors.push({
        message: 'Juror number must only include 9 numbers - you cannot enter letters or special characters',
        field: form + 'JurorNumber',
      });
    }
  }

  function validateCheckInTime(errors) {
    var _checkInHour = checkInHour.val();
    var _checkInMinute = checkInMinute.val();
    var _checkInTimeAm = checkInTimeAm.is(':checked');
    var _checkInTimePm = checkInTimePm.is(':checked');

    if (!_checkInHour && !_checkInMinute) {
      errors.push({
        message: 'Enter a check in time',
        field: 'checkInTimeHour',
      });
    } else {
      if (!_checkInHour && _checkInMinute) {
        errors.push({
          message: 'Enter an hour for check in time',
          field: 'checkInTimeHour',
        });
      }

      if (_checkInHour && (isNaN(_checkInHour) || (_checkInHour < 0 || _checkInHour > 12))) {
        errors.push({
          message: 'Enter an hour between 0 and 12',
          field: 'checkInTimeHour',
        });
      }

      if (!_checkInMinute && _checkInHour) {
        errors.push({
          message: 'Enter minutes for check in time',
          field: 'checkInTimeMinute',
        });
      }

      if (_checkInMinute && (isNaN(_checkInMinute) || (_checkInMinute < 0 || _checkInMinute > 59))) {
        errors.push({
          message: 'Enter minutes between 0 and 59',
          field: 'checkInTimeMinute',
        });
      }
      // Validate the time period
      if (!_checkInTimeAm && !_checkInTimePm) {
        errors.push({
          message: 'Select whether check in time is am or pm',
          field: 'checkInTime-am',
        });
      }
    }
  }

  function validateCheckOutTime(checkOutMethod, errors) {
    var _checkOutHour = checkOutHour.val();
    var _checkOutMinute = checkOutMinute.val();
    var _checkOutTimeAm = checkOutTimeAm.is(':checked');
    var _checkOutTimePm = checkOutTimePm.is(':checked');

    if (!_checkOutHour && !_checkOutMinute) {
      if (checkOutMethod === 'record') {
        errors.push({
          message: 'Enter a check out time and then press record time again for this juror',
          field: 'checkOutTimeHour',
        });
      } else {
        errors.push({
          message: 'Enter a check out time',
          field: 'checkOutTimeHour',
        });
      }
    } else {
      if (!_checkOutHour && _checkOutMinute) {
        errors.push({
          message: 'Enter an hour for check out time',
          field: 'checkOutTimeHour',
        });
      }

      if (_checkOutHour && (isNaN(_checkOutHour) || (_checkOutHour < 0 || _checkOutHour > 12))) {
        errors.push({
          message: 'Enter an hour between 0 and 12',
          field: 'checkOutTimeHour',
        });
      }

      if (!_checkOutMinute && _checkOutHour) {
        errors.push({
          message: 'Enter minutes for check out time',
          field: 'checkOutTimeMinute',
        });
      }

      if (_checkOutMinute && (isNaN(_checkOutMinute) || (_checkOutMinute < 0 || _checkOutMinute > 59))) {
        errors.push({
          message: 'Enter minutes between 0 and 59',
          field: 'checkOutTimeMinute',
        });
      }

      // Validate the time period
      if (!_checkOutTimeAm && !_checkOutTimePm) {
        errors.push({
          message: 'Select whether check out time is am or pm',
          field: 'checkOutTime-am',
        });
      }
    }
  }

  function addError(errors) {
    var error;
    var i;

    errorsList.empty();

    for (i = 0; i < errors.length; i++) {
      error = $('<li><a href="#' + errors[i].field + '">' + errors[i].message + '</a></li>');
      errorsList.append(error[0]);

      if (errors[i].field .includes('JurorNumber')) {
        jurorNumberError(errors[i]);
      }

      if (errors[i].field.includes('TimeHour')
        || errors[i].field.includes('TimeMinute')
        || errors[i].field.includes('Time-am')) {
        if (form === 'checkIn'){
          checkInTimeError(errors[i]);
        } else if (form === 'checkOut'){
          checkOutTimeError(errors[i]);
        }
      }
    }

    errorContainer.removeClass('js-hidden');
  }

  function jurorNumberError(error, clear) {
    //get name of form in desired layout
    var formName = form;

    var attendanceJurorNumberContainer = $('#' + formName + 'JurorNumberContainer');
    var errorMessageContainer = $('#' + formName + 'JnErrorMessageContainer');
    var _errorMessageContainer = $('<p id="' + formName + 'JnErrorMessageContainer" class="govuk-error-message"></p>');
    var _errorMessageLabel = $('<span class="govuk-visually-hidden">Error: </span>');

    if (clear) {
      _errorMessageContainer = $('<p id="' + formName + 'JnErrorMessageContainer"></p>');
      attendanceJurorNumberContainer.removeClass('govuk-form-group--error');
    } else {
      attendanceJurorNumberContainer.addClass('govuk-form-group--error');
      _errorMessageContainer.append(_errorMessageLabel[0]);
      _errorMessageContainer.append(error.message);
    }

    errorMessageContainer.replaceWith(_errorMessageContainer);
  }

  function checkInTimeError(error, clear) {
    var checkInTimeErrorContainer = $('#checkInTimeErrorContainer');
    var checkInTime = $('#checkInTime');
    var _checkInTimeErrorMessageContainer = $('#checkInTimeErrorMessageContainer');
    var _errorMessageLabel = $('<span class="govuk-visually-hidden">Error: </span>');

    if (!_checkInTimeErrorMessageContainer.length) {
      // eslint-disable-next-line max-len
      _checkInTimeErrorMessageContainer = $('<p id="checkInTimeErrorMessageContainer" class="govuk-error-message"></p>');
    }

    if (clear) {
      _checkInTimeErrorMessageContainer = $('#checkInTimeErrorMessageContainer');
      _checkInTimeErrorMessageContainer.remove();
      checkInTimeErrorContainer.removeClass('govuk-form-group--error');
      checkInHour.removeClass('govuk-input--error');
      checkInMinute.removeClass('govuk-input--error');
    } else {
      checkInTimeErrorContainer.addClass('govuk-form-group--error');
      _checkInTimeErrorMessageContainer.append(_errorMessageLabel[0]);
      _checkInTimeErrorMessageContainer.append(error.message);

      if (_checkInTimeErrorMessageContainer.length > 0) {
        _checkInTimeErrorMessageContainer.append('<br>');
      }

      checkInTime.before(_checkInTimeErrorMessageContainer[0]);

      if (error.field === 'checkInTimeHour') {
        checkInHour.addClass('govuk-input--error');
      }

      if (error.field === 'checkInTimeMinute') {
        checkInMinute.addClass('govuk-input--error');
      }
    }
  }

  function checkOutTimeError(error, clear) {
    var checkOutTimeErrorContainer = $('#checkOutTimeErrorContainer');
    var checkOutTime = $('#checkOutTime');
    var _checkOutTimeErrorMessageContainer = $('#checkOutTimeErrorMessageContainer');
    var _errorMessageLabel = $('<span class="govuk-visually-hidden">Error: </span>');

    if (!_checkOutTimeErrorMessageContainer.length) {
      // eslint-disable-next-line max-len
      _checkOutTimeErrorMessageContainer = $('<p id="checkOutTimeErrorMessageContainer" class="govuk-error-message"></p>');
    }

    if (clear) {
      _checkOutTimeErrorMessageContainer = $('#checkOutTimeErrorMessageContainer');
      _checkOutTimeErrorMessageContainer.remove();
      checkOutTimeErrorContainer.removeClass('govuk-form-group--error');
      checkOutHour.removeClass('govuk-input--error');
      checkOutMinute.removeClass('govuk-input--error');
    } else {
      checkOutTimeErrorContainer.addClass('govuk-form-group--error');
      _checkOutTimeErrorMessageContainer.append(_errorMessageLabel[0]);
      _checkOutTimeErrorMessageContainer.append(error.message);

      if (_checkOutTimeErrorMessageContainer.length > 0) {
        _checkOutTimeErrorMessageContainer.append('<br>');
      }

      checkOutTime.before(_checkOutTimeErrorMessageContainer[0]);

      if (error.field === 'checkOutTimeHour') {
        checkOutHour.addClass('govuk-input--error');
      }

      if (error.field === 'checkOutTimeMinute') {
        checkOutMinute.addClass('govuk-input--error');
      }
    }
  }

  function replaceTableRow(html) {
    var tableRow = $(html);
    var tempRow = $('#' + tableRow.attr('id'));
    var ch, jn;

    tableRow.children().each(function(_, child) {
      ch = $(child);

      if (ch.data('kind') === 'jurorNumber') {
        jn = ch.children(':first').text();
      }
    });

    if (tableRow.data('failed')) {
      // eslint-disable-next-line vars-on-top
      var listItem = $('<li>' + jn + '</li>');

      if (tableRow.data('kind') === 'checkIn') {
        checkInFailedSummary.removeClass('mod-hidden');
        checkInFailedList.append(listItem);
      }

      if (tableRow.data('kind') === 'checkOut') {
        checkOutFailedSummary.removeClass('mod-hidden');
        checkOutFailedList.append(listItem);
      }
    }

    attendeesTable.removeClass('js-hidden');
    tempRow.replaceWith(tableRow);

    $('#'+ jn +'-recordCheckOut').click(recordCheckoutTimeHandler);

    updateJurorsCount(attendeesTable.children()[2]);
  }

  function replaceMultipleRows(html){
    var tableBody = $(html);

    tableBody.find('tr').each(function() {
      var tableRow = $(this);
      var tempRow = $('#' + tableRow.attr('id'));

      attendeesTable.removeClass('js-hidden');
      tempRow.replaceWith(tableRow);
    });
  }

  function updateJurorsCount(el) {
    var listedJurors = $('#listedJurors');
    var tbody = $(el);

    listedJurors.text(tbody.children().length);
  }

  function addTempRow(jn) {
    var tr = $('<tr class="govuk-table__row" id="' + jn + '-row"></tr>');
    var td;
    var i;

    for (i = 0; i < 7; i++) {
      td = $('<td class="govuk-table__cell"></td>');

      switch (i) {
      case 0:
        td.append(jn);
        break;
      case 4:
        td.append(checkInHour.val() + ':' + checkInMinute.val() + timePeriod());
        break;
      default:
        td.append('-');
      }

      tr.append(td[0]);
    }

    attendeesTable.removeClass('js-hidden');
    attendeesTable.children()[2].append(tr[0]);
  };

  function buildTimeString() {
    var _hour = checkInHour.val().length === 1
      ? '0' + checkInHour.val() : checkInHour.val();

    return _hour + ':' + checkInMinute.val() + timePeriod();
  }

  function timePeriod() {
    if ($('#' + form + 'Time-am').is(':checked')) return 'am';
    if ($('#' + form + 'Time-pm').is(':checked')) return 'pm';
  }

  function checkForDuplicateRow(jn) {
    var duplicate = $('#' + jn + '-row');

    if (duplicate.length) return true;

    return false;
  }

  function checkForExistingFailedRow(jn) {
    var duplicate = $('#' + jn + '-row[data-failed=true]');

    if (duplicate.length) return true;

    return false;
  }
})();

