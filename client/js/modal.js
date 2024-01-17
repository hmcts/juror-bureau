;(function(){
  'use strict';

  // Process actions
  //
  // Each option in process drop down triggers a different modal
  // =====================================
  /*
  $('[name="processAction"]').change(function(e) {
    e.preventDefault();

    switch ($(this).val()) {
    case 'responded':
      triggerResponded(e);
      break;
    case 'deferral':
      triggerDeferral(e);
      break;
    case 'excusal':
      triggerExcusal(e);
      break;
    case 'disqualified':
      triggerDisqualified(e);
      break;
    case 'send_to':
      triggerSingleSendTo(e);
      break;
    case 'awaiting_information':
      triggerAwaitingInformation(e);
      break;
    case 'send_to_court':
      triggerSendToCourt(e);
      break;
    default:
      alert('Functionality not yet available');
      break;
    }

    $(this).val('');
  });
  */


  // Process reply MOJ button menu
  //
  // Each option in process drop down triggers a different modal
  // =====================================
  $('#processAction a').click(function(e) {
    //e.preventDefault();

    switch ($(this).attr('value')) {
    case 'responded':
      break;
    case 'deferral':
      break;
    case 'excusal':
      break;
    case 'disqualified':
      break;
    case 'send_to':
      //triggerSingleSendTo(e);
      break;
    case 'awaiting_information':
      break;
    case 'send_to_court':
      triggerSendToCourt(e);
      break;
    default:
      alert('Functionality not yet available');
      break;
    }

    $(this).val('');
  });

  // Process More Actions MOJ button menu
  //
  // Each option in drop down menu triggers a different modal
  // =====================================
  $('#moreActionsMenu a').click(function(e) {
    //e.preventDefault();

    switch ($(this).attr('value')) {
    case 'download_pdf':
      break;
    case 'send_to':
      //triggerSingleSendTo(e);
      break;
    case 'awaiting_information':
      //triggerAwaitingInformation(e);
      break;
    case 'request_information_by_post':
      break;
    default:
      alert('Functionality not yet available');
      break;
    }

    $(this).val('');
  });


  // -------------------------------------------------------------------------------------------------------------


  // Close modal and reset it's content
  //
  // =====================================
  function resetModal() {
    if ($('#processAction').length > 0) {
      $('#processAction').val('');
    }

    //Hide the Deferral modal window datepicker
    //$('#deferralDate').datepicker('hide');

    $('#modal').html('').css({ display: 'none' });
  }

  $('#modal').on('click', '.close-modal', function(e) {
    e.preventDefault();

    resetModal();
  });

  $('#modal').on('click', '.close-reassign-modal', function(e) {
    var originalActive = $('#staffForm').find('#originalActive').val() ? 'Yes' : 'No'
      , activeRadio = $('#staffForm').find('#active-'+originalActive);

    e.preventDefault();

    activeRadio.prop('checked', true);

    resetModal();
  });

  // Close modal when it loses focus
  $(window).click(function(e) {
    if (e.target.id !== 'modal' && $(e.target).parents('#modal').length === 0) {
      resetModal();
    }
  });


  // -------------------------------------------------------------------------------------------------------------


  // Single Send to
  //
  // Open modal for single reassignment
  // =====================================
  function triggerSingleSendTo(e) {
    e.preventDefault();

    $.get('/staff/assign/' + $('#jurorNumber').val(), function(response) {
      $('#modal').html(response);

      // Ensure we use the version from detail page and not most recently from the record
      $('#modal input[name="version"]').val($('#updateSectionForm #versionNumber').val());

      $('#modal').css({ display: 'block' });
    });
  };

  // Multiple Send to
  //
  // Open modal for multiple reassignments
  // =====================================
  /*
  $('#sendToButtonMulti').click(function(e) {
    var jurorNumberArr = [];

    e.preventDefault();
    message('OK!');

    $('[name="selectedResponses"]').each(function() {
      if ($(this).is(':checked')) {
        jurorNumberArr.push($(this).data('value'));
      }
    });

    $.get('/staff/assign-multi/' + jurorNumberArr, function(response) {
      document.write(response);
    });

  });
  */

  // Disable save button if value of new call log is empty
  $('#modal').on('change', '#sendToUser', function() {
    if ($(this).val().length === 0) {
      $('#modal .error-message-decision').html('Please select a recipient');
      $('#modal #sendToGroup').addClass('govuk-form-group--error');
      $('#modal #sendToMarkComplete').attr('disabled', true);

      return;
    }

    // No more decision error
    $('#modal .error-message-decision').html('');
    $('#modal #sendToGroup').removeClass('govuk-form-group--error');
    $('#modal #sendToMarkComplete').attr('disabled', false);
  });

  // Submit reassignment
  //
  // =====================================
  $('#modal').on('click', '#sendToMarkComplete', function() {
    var isMulti = $('#isMulti').val()
      , isBacklog = $('#modal #sendToUser').val() === 'backlog'
      , sendToUser = isBacklog ? '' : $('#modal #sendToUser').val()
      , postUrl = '/staff/assign'
      , postData = {
        assignTo: sendToUser,
        responseJurorNumber: $('#modal [name="jurorNumber"]').val(),
        _csrf: $('#modal #_csrf').val(),
        version: $('#modal #version').val(),
      }
      , pronoun

      , errorMessage
      , successCB = function(resp) {
        if (resp.failures && resp.failures.length > 0) {
          pronoun = resp.failures.length === 1 ? 'it has' : 'they have';
          errorMessage = 'Summons ' + resp.failures.join(', ') + ' could not be sent to ' + (isBacklog ? 'the backlog' : sendToUser) + ' as ' + pronoun + ' already been Completed';
          $('#modal .error-message-submit').html(errorMessage);
          $('#modal #sendToMarkComplete').attr('disabled', true).val('Send');
        } else {
          window.location.href = '/inbox';
        }
      }
      , errorCB = function(err) {
        feedbackModalPostError(err.status, 'Send');
      };


      // Feedback if nothing has been chosen
    if (isBacklog === false && sendToUser.length === 0) {
      $('#modalErrorFeedback').removeClass('u-hide');
      return;
    }


    // Reset feedback
    $('#modalErrorFeedback').addClass('u-hide');


    // Data is different if we are doing multiple assignments
    if (isMulti) {
      postUrl = '/staff/assign-multi';
      postData = {
        assignTo: sendToUser,
        responses: [],
        _csrf: $('#modal #_csrf').val(),
      };

      $('#modal [name="jurorNumber"]').each(function() {
        postData.responses.push({
          responseJurorNumber: $(this).val(),
          version: $('#version_' + $(this).val()).val(),
        });
      });
    }


    // Send request off
    $.post(postUrl, postData).done(successCB).fail(errorCB);
  });


  // -------------------------------------------------------------------------------------------------------------


  // Call log
  //
  // Open modal for adding call log to response
  // =====================================
  /*
  $('#addCallLogBtn').click(function(e) {
    e.preventDefault();

    $.get('/response/' + $('#jurorNumber').val() + '/call-log/', function(response) {
      $('#modal').html(response);

      // Ensures button is disable on opening if textarea is empty
      $('#modal .call-log-add-section #notes').change();

      $('#modal').css({ display: 'block' });
    });
  });
  */

  // Disable save button if value of new call log is empty
  $('#modal').on('keyup change', '.call-log-add-section #notes', function() {
    if ($(this).val().length > 0) {
      $('#callLogSaveButton').attr('disabled', false).val('Save');
    } else {
      $('#callLogSaveButton').attr('disabled', true);
    }
  });

  // Submit new call log
  $('#modal').on('click', '#callLogSaveButton', function() {
    var postUrl = '/response/' + $('#jurorNumber').val() + '/call-log/'
      , postData = {
        notes: $('#modal .call-log-add-section #notes').val(),
        _csrf: $('#modal #_csrf').val(),
      }
      , successCB = function() {
        window.location.reload();
      }
      , errorCB = function(err) {
        // Reset button states
        $('#callLogCancelButton').attr('disabled', false);
        $('#modal .call-log-add-section').addClass('show-error');

        // Check if save can be enabled or has to stay disabled (for no text)
        $('#modal .call-log-add-section #notes').change();

        feedbackModalPostError(err.status, 'Save');
      };

    // Ensure we have a value
    if ($('#modal .call-log-add-section textarea#notes').val().length === 0) {
      // Show error message
      $('#modal .error-message').html('To save this call log you must provide notes');
      $('#modal .call-log-add-section').addClass('show-error');
      $('#callLogSaveButton').attr('disabled', true);

      return;
    }

    // Ensure no error message is shown
    $('#modal .error-message').html('');
    $('#modal .call-log-add-section').removeClass('show-error');


    // Send to API
    $('#callLogCancelButton').attr('disabled', true);
    $('#callLogSaveButton').attr('disabled', true).val('Saving...');
    $.post(postUrl, postData).done(successCB).fail(errorCB);
  });


  // -------------------------------------------------------------------------------------------------------------


  // Open disqualify modal
  //
  // ====================================
  function triggerDisqualified(e) {
    e.preventDefault();

    $.get('/response/' + $('#jurorNumber').val() + '/disqualify/', function(response) {
      $('#modal').html(response);
      $('#modal input[name="version"]').val($('#updateSectionForm #versionNumber').val());
      $('#modal').css({ display: 'block' });
    });
  };

  // Disqualify reason change
  //
  // When changing reason, we should enable or disable button appropriately
  // ====================================
  $('#modal').on('change', '[name="disqualify"]', function(e) {
    if ($('#modal [name="disqualify"]:checked').length === 0) {
      $('#modal .error-message').html('Please select a reason for the disqualification');
      $('#modal .radio-group').addClass('govuk-form-group--error');
      $('#modal #disqualifyMarkComplete').attr('disabled', true);
    } else {
      $('#modal .error-message').html('');
      $('#modal .radio-group').removeClass('govuk-form-group--error');
      $('#modal #disqualifyMarkComplete').attr('disabled', false);
    }
  });

  // Complete disqualification
  //
  // Mark as disqualified save button
  // =====================================
  $('#modal').on('click', '#disqualifyMarkComplete', function(e) {
    var postUrl = '/response/' + $('#jurorNumber').val() + '/disqualify/'
      , postData = {
        code: $('[name="disqualify"]:checked').val(),
        _csrf: $('#modal #_csrf').val(),
        version: $('#modal #version').val(),
      }
      , successCB = function() {
        window.location.reload();
      }
      , errorCB = function(err) {
        feedbackModalPostError(err.status, 'Mark as completed');
      };

    e.preventDefault();

    // Check for errors
    if ($('#modal [name="disqualify"]:checked').length === 0) {
      $('#modal .error-message').html('Please select a reason for the disqualification');
      $('#modal .radio-group').addClass('govuk-form-group--error');

      return;
    }

    // Reset errors
    $('#modal .error-message').html('');
    $('#modal .radio-group').removeClass('govuk-form-group--error');

    // Provide feedback about whats happening
    $('#modal #disqualifyMarkComplete').attr('disabled', true).val('Updating...');

    // Send to server
    $.post(postUrl, postData)
      .done(successCB)
      .fail(errorCB);
  });


  // -------------------------------------------------------------------------------------------------------------


  // Open excusal modal
  //
  // ====================================
  function triggerExcusal(e) {
    e.preventDefault();

    $.get('/response/' + $('#jurorNumber').val() + '/excusal/', function(response) {
      $('#modal').html(response);
      $('#modal input[name="version"]').val($('#updateSectionForm #versionNumber').val());
      $('#modal').css({ display: 'block' });

      new GOVUK.ShowHideContent().init();
    });
  }

  // Excusal change
  //
  // Disable save button if no excusal decision has been made
  // ====================================
  $('#modal').on('change', '[name="excusal"]', function(e) {
    e.preventDefault();

    if ($('#modal [name="excusal"]:checked').length === 0) {
      $('#modal .error-message-decision').html('Please accept or refuse the excusal');
      $('#modal #excusalGroup').addClass('govuk-form-group--error');
      $('#modal #excusalMarkComplete').attr('disabled', true);

      return;
    }

    // No more decision error
    $('#modal .error-message-decision').html('');
    $('#modal #excusalGroup').removeClass('govuk-form-group--error');
    $('#modal #excusalMarkComplete').attr('disabled', false);


    // Reason error
    if ($('#modal #excusal_reason').val() === '') {
      $('#modal #excusalMarkComplete').attr('disabled', true);
      return;
    }
  });

  // Excusal reason
  //
  // Disable save button if excusal is accepted and no reason given
  // ====================================
  $('#modal').on('change', '[name="excusal_reason"]', function(e) {
    e.preventDefault();

    if ($('#modal #excusal_reason').val().length === 0) {
      $('#modal .error-message-reason').html('Please select a reason for the excusal');
      $('#modal #excusalReasonGroup').addClass('govuk-form-group--error');
      $('#modal #excusalMarkComplete').attr('disabled', true);
    } else {
      $('#modal .error-message-reason').html('');
      $('#modal #excusalReasonGroup').removeClass('govuk-form-group--error');
      $('#modal #excusalMarkComplete').attr('disabled', false);
    }
  });

  // Complete excusal
  //
  // Mark as excused save button
  // =====================================
  $('#modal').on('click', '#excusalMarkComplete', function(e) {
    var postUrl = '/response/' + $('#jurorNumber').val() + '/excusal/'
      , postData = {
        excusalCode: $('[name="excusal_reason"]').val(),
        _csrf: $('#modal #_csrf').val(),
        version: $('#modal #version').val(),
      }
      , successCB = function() {
        window.location.reload();
      }
      , errorCB = function(err) {
        feedbackModalPostError(err.status, 'Mark as completed');
      };

    e.preventDefault();

    // Is this accepting or rejecting
    postUrl = postUrl + ($('#modal [name="excusal"]:checked').val() === 'Yes' ? 'accept' : 'reject');


    // Check for errors
    if ($('#modal [name="excusal"]:checked').length === 0) {
      $('#modal .error-message-decision').html('Please accept or refuse the excusal');
      $('#modal #excusalGroup').addClass('govuk-form-group--error');
      $('#modal #excusalMarkComplete').attr('disabled', true);

      return;
    }

    if ($('#modal #excusal_reason').val() === '') {
      $('#modal .error-message-reason').html('Please select a reason for the excusal');
      $('#modal #excusalReasonGroup').addClass('govuk-form-group--error');
      $('#modal #excusalMarkComplete').attr('disabled', true);

      return;
    }


    // Reset errors
    $('#modal .error-message').html('');
    $('#modal .form-group').removeClass('error');

    // Provide feedback about whats happening
    $('#modal #excusalMarkComplete').attr('disabled', true).val('Updating...');

    // Send to server
    $.post(postUrl, postData)
      .done(successCB)
      .fail(errorCB);
  });


  // -------------------------------------------------------------------------------------------------------------


  // Open excusal modal
  //
  // ====================================
  function triggerDeferral(e) {
    var moment = require('moment')
      , courtDate = ($('#updateSectionForm #courtDate').val())
      , futureDate;

    e.preventDefault();

    $.get('/response/' + $('#jurorNumber').val() + '/deferral/', function(response) {
      $('#modal').html(response);
      $('#modal input[name="version"]').val($('#updateSectionForm #versionNumber').val());
      $('#modal').css({ display: 'block' });

      new GOVUK.ShowHideContent().init();

      futureDate= moment(courtDate, 'DD/MM/YYYY').add(1, 'y').toDate();

      // Create the datepicker
      $('[data-toggle="datepicker"]').datepicker({
        autoHide: true,
        format: 'dd/mm/yyyy',
        date: new Date(),
        startDate: courtDate,
        endDate: futureDate,
      });

      // Hook up the datepicker trigger, in addition to field itself
      $('#deferralTrigger').click(function(e2) {
        e2.stopPropagation();
        $('[data-toggle="datepicker"]').datepicker('show');
      });
    });
  }

  // Deferral change
  //
  // Disable save button if required fields are missing
  // ====================================
  $('#modal').on('change keyup', '[name="acceptDeferral"], [name="deferralDate"], [name="deferralReason"]', function(e) {
    e.preventDefault();

    // Reset errors
    $('#modal .error-message').html('');
    $('#modal .form-group').removeClass('govuk-form-group--error');
    $('#modal #deferralMarkComplete').attr('disabled', false);

    // Ensure accept or reject has been chosen
    if ($('#modal [name="acceptDeferral"]:checked').length === 0) {
      $('#modal .error-message-decision').html('Please accept or refuse the deferral');
      $('#modal #deferralGroup').addClass('govuk-form-group--error');
      $('#modal #deferralMarkComplete').attr('disabled', true);

      return;
    }

    // If rejecting, clear any chosen dates and hide date field
    /*
    if ($('#modal [name="acceptDeferral"]:checked').val() === 'No') {
      $('#modal .hidden-deferral-reject').hide();
      $('#modal #deferralDate').val('');
    } else {
      $('#modal .hidden-deferral-reject').show();
    }
    */

    // If rejecting, clear any chosen dates and hide date field
    if ($('#modal [name="acceptDeferral"]:checked').val() === 'Yes') {
      $('#modal .hidden-deferral-reject').show();
    } else {
      $('#modal .hidden-deferral-reject').hide();
      $('#modal #deferralDate').val('');
    }

    // Ensure a date has been provided, only if accepting
    if ($('#modal [name="acceptDeferral"]:checked').val() === 'Yes' && $('#modal #deferralDate').val() === '') {
      $('#modal #deferralMarkComplete').attr('disabled', true);
      return;
    }

    // Ensure a reason has been provided
    if ($('#modal #deferralReason').val() === '') {
      $('#modal #deferralMarkComplete').attr('disabled', true);
      return;
    }
  });

  $('#modal').on('click', '#deferralMarkComplete', function(e) {
    var dateRegex = /^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}$/
      , moment = require('moment')
      , deferralDate = $('#modal #deferralDate').val()
      , postUrl = '/response/' + $('#jurorNumber').val() + '/deferral/'
      , postData = {
        acceptDeferral: $('#modal [name="acceptDeferral"]:checked').val() === 'Yes',
        deferralDate: $('#modal #deferralDate').val(),
        deferralReason: $('#modal #deferralReason').val(),
        _csrf: $('#modal #_csrf').val(),
        version: $('#modal #version').val(),
      }
      , successCB = function() {
        window.location.reload();
      }
      , errorCB = function(err) {
        feedbackModalPostError(err.status, 'Mark as completed');
      }
      , futureDate = moment($('#updateSectionForm #courtDate').val(), 'DD/MM/YYYY').add(1, 'y');

    e.preventDefault();


    // If not accepting, we have no use for a date
    if (postData.acceptDeferral === false) {
      delete postData.deferralDate;
    }


    // Reset errors
    $('#modal .error-message').html('');
    $('#modal .form-group').removeClass('govuk-form-group--error');
    $('#modal #deferralMarkComplete').attr('disabled', false);


    // Ensure accept or reject has been chosen
    if ($('#modal [name="acceptDeferral"]:checked').length === 0) {
      $('#modal .error-message-decision').html('Please accept or refuse the deferral');
      $('#modal #deferralGroup').addClass('govuk-form-group--error');
      $('#modal #deferralMarkComplete').attr('disabled', true);

      return;
    }


    // Ensure a date has been provided, only if accepting
    if ($('#modal [name="acceptDeferral"]:checked').val() === 'Yes' && $('#modal #deferralDate').val() === '') {
      // $('#modal #deferralMarkComplete').attr('disabled', true);
      $('#modal #deferralDateGroup').addClass('govuk-form-group--error');
      $('#modal .error-message-date').html('Please provide a new date for the response');

      return;
    }

    // Ensure entered date is valid, only if accepting
    if ($('#modal [name="acceptDeferral"]:checked').val() === 'Yes' && $('#modal #deferralDate').val() !== '') {
      // Ensure date is in correct format
      if ((dateRegex.test(deferralDate) && moment(deferralDate, 'DD/MM/YYYY').isValid()) !== true) {
        $('#modal #deferralDateGroup').addClass('govuk-form-group--error');
        $('#modal .error-message-date').html('Please provide a valid date for the response (DD/MM/YYYY)');
        return;
      }
      // Ensure date is in future/the next 12 months
      if (moment(deferralDate, 'DD/MM/YYYY').isBefore(moment().startOf('day')) ||
          moment(deferralDate, 'DD/MM/YYYY').isAfter(futureDate)) {
        $('#modal #deferralDateGroup').addClass('govuk-form-group--error');
        $('#modal .error-message-date').html('Please provide a valid date in the next 12 months for the response (DD/MM/YYYY)');
        return;
      }
    }

    // Ensure a reason has been provided
    if ($('#modal #deferralReason').val() === '') {
      $('#modal #deferralMarkComplete').attr('disabled', true);
      $('#modal #deferralReasonGroup').addClass('govuk-form-group--error');
      $('#modal .error-message-reason').html('Please provide a reason for the deferral');

      return;
    }

    // Provide feedback about whats happening
    $('#modal #deferralMarkComplete').attr('disabled', true).val('Updating...');

    // Send to server
    $.post(postUrl, postData)
      .done(successCB)
      .fail(errorCB);
  });


  // -------------------------------------------------------------------------------------------------------------


  // Open awaiting information modal
  //
  // ====================================
  function triggerAwaitingInformation(e) {
    e.preventDefault();

    $.get('/response/' + $('#jurorNumber').val() + '/awaiting-information/', function(response) {
      $('#modal').html(response);
      $('#modal input[name="version"]').val($('#updateSectionForm #versionNumber').val());
      $('#modal').css({ display: 'block' });
    });
  }

  // Awaiting change
  //
  // Disable save button if no excusal decision has been made
  // ====================================
  $('#modal').on('change', '[name="awaitingInformation"]', function(e) {
    e.preventDefault();

    if ($('#modal [name="awaitingInformation"]:checked').length === 0) {
      $('#modal .error-message-decision').html('Please select an awaiting information status');
      $('#modal #awaitingInformationGroup').addClass('govuk-form-group--error');
      $('#modal #awaitingInformationMarkComplete').attr('disabled', true);

      return;
    }

    // No more decision error
    $('#modal .error-message-decision').html('');
    $('#modal .error-message-submit').html('');
    $('#modal #awaitingInformationGroup').removeClass('govuk-form-group--error');
    $('#modal #awaitingInformationMarkComplete').attr('disabled', false);
  });

  // Complete status update
  //
  // Mark response as given reason
  // =====================================
  $('#modal').on('click', '#awaitingInformationMarkComplete', function(e) {
    var postUrl = '/response/' + $('#jurorNumber').val() + '/awaiting-information/'
      , postData = {
        awaitingInformation: $('[name="awaitingInformation"]:checked').val(),
        _csrf: $('#modal #_csrf').val(),
        version: $('#modal #version').val(),
      }
      , successCB = function() {
        window.location.reload();
      }
      , errorCB = function(err) {
        feedbackModalPostError(err.status, 'Update reply status');
      };

    e.preventDefault();


    // Check for errors
    if ($('#modal [name="awaitingInformation"]:checked').length === 0) {
      $('#modal .error-message-decision').html('Please select an awaiting information status');
      $('#modal #awaitingInformationGroup').addClass('govuk-form-group--error');
      $('#modal #awaitingInformationMarkComplete').attr('disabled', true);

      return;
    }


    // Reset errors
    $('#modal .error-message').html('');
    $('#modal .form-group').removeClass('govuk-form-group--error');

    // Provide feedback about whats happening
    $('#modal #awaitingInformationMarkComplete').attr('disabled', true).val('Updating...');

    // Send to server
    $.post(postUrl, postData)
      .done(successCB)
      .fail(errorCB);
  });


  // -------------------------------------------------------------------------------------------------------------


  // Open responded modal
  //
  // ====================================
  function triggerResponded(e) {
    e.preventDefault();

    $.get('/response/' + $('#jurorNumber').val() + '/responded/', function(response) {
      $('#modal').html(response);
      $('#modal input[name="version"]').val($('#updateSectionForm #versionNumber').val());
      $('#modal').css({ display: 'block' });
    });
  }

  // Responded change
  //
  // Disable save button if no responded decision has been made
  // ====================================
  $('#modal').on('change', '[name="responded"]', function(e) {
    e.preventDefault();

    if ($('#modal [name="responded"]:checked').length === 0) {
      $('#modal .error-message-decision').html('Please confirm you wish to mark as responded');
      $('#modal #respondedGroup').addClass('error');
      $('#modal #respondedMarkComplete').attr('disabled', true);

      return;
    }

    // No more decision error
    $('#modal .error-message-decision').html('');
    $('#modal #respondedGroup').removeClass('error');
    $('#modal #respondedMarkComplete').attr('disabled', false);


    // Reason error
    if ($('#modal [name="responded"]:checked').length === 0) {
      $('#modal #respondedMarkComplete').attr('disabled', true);
      return;
    }
  });

  // Complete responded
  //
  // Responded save button
  // =====================================
  $('#modal').on('click', '#respondedMarkComplete', function(e) {
    var postUrl = '/response/' + $('#jurorNumber').val() + '/responded/'
      , postData = {
        _csrf: $('#modal #_csrf').val(),
        version: $('#modal #version').val(),
      }
      , successCB = function() {
        window.location.reload();
      }
      , errorCB = function(err) {
        feedbackModalPostError(err.status, 'Mark as completed');
        $('#modal [name="responded"]:checked').attr('checked', false);
      };

    e.preventDefault();


    // Check for errors
    if ($('#modal [name="responded"]:checked').length === 0) {
      $('#modal .error-message-decision').html('Please accept or refuse the excusal');
      $('#modal #respondedGroup').addClass('error');
      $('#modal #respondedMarkComplete').attr('disabled', true);

      return;
    }


    // Reset errors
    $('#modal .error-message').html('');
    $('#modal .form-group').removeClass('error');

    // Provide feedback about whats happening
    $('#modal #respondedMarkComplete').attr('disabled', true).val('Updating...');

    // Send to server
    $.post(postUrl, postData)
      .done(successCB)
      .fail(errorCB);
  });



  // Completed Response
  //
  // Completed ok button
  //
  // Note: 'sendcourt' API method sets response status to closed
  // without updating the Pool status
  // =====================================
  $('#modal').on('click', '#completedMarkComplete', function(e) {
    var postUrl = '/response/' + $('#jurorNumber').val() + '/sendcourt/'
      , postData = {
        _csrf: $('#modal #_csrf').val(),
        version: $('#modal #version').val(),
      }
      , successCB = function() {
        window.location.reload();
      }
      , errorCB = function(err) {
        feedbackModalPostError(err.status, 'Mark as completed');
      };

    e.preventDefault();

    // Reset errors
    $('#modal .error-message').html('');
    $('#modal .form-group').removeClass('error');

    // Provide feedback about whats happening
    $('#modal #completedMarkComplete').attr('disabled', true).val('Updating...');

    // Send to server
    $.post(postUrl, postData)
      .done(successCB)
      .fail(errorCB);
  });


  // -------------------------------------------------------------------------------------------------------------

  // open Send to Court modal
  //
  // ====================================
  function triggerSendToCourt(e) {
    e.preventDefault();

    $.get('/response/' + $('#jurorNumber').val() + '/sendcourt/', function(response) {
      $('#modal').html(response);
      $('#modal input[name="version"]').val($('#updateSectionForm #versionNumber').val());
      $('#modal').css({ display: 'block' });
    });
  }

  // Send to Court confirmed checkbox change
  //
  // Disable save button if no send to court decision has been made
  // ====================================
  $('#modal').on('change', '[name="sendToCourtConfirmed"]', function(e) {
    e.preventDefault();

    if ($('#modal [name="sendToCourtConfirmed"]:checked').length === 0) {
      $('#modal .error-message-decision').html('Please confirm you wish to send to court');
      $('#modal #sendToCourtGroup').addClass('error');
      $('#modal #sendToCourtComplete').attr('disabled', true);

      return;
    }

    // No more decision error
    $('#modal .error-message-decision').html('');
    $('#modal #sendToCourtGroup').removeClass('error');
    $('#modal #sendToCourtComplete').attr('disabled', false);


    // Reason error
    if ($('#modal [name="sendToCourtConfirmed"]:checked').length === 0) {
      $('#modal #sendToCourtComplete').attr('disabled', true);
      return;
    }
  });


  // Send to Court Complete
  //
  // Send to Court save button
  // =====================================
  $('#modal').on('click', '#sendToCourtComplete', function(e) {
    var postUrl = '/response/' + $('#jurorNumber').val() + '/sendcourt/'
      , postData = {
        jurorNumber: $('#jurorNumber').val(),
        _csrf: $('#modal #_csrf').val(),
        version: $('#modal #version').val()
      }
      , successCB = function() {
        window.location.reload();
      }
      , errorCB = function(err) {
        feedbackModalPostError(err.status, 'Send to Court');
        $('#modal [name="sendToCourtConfirmed"]:checked').attr('checked', false);
      };

    e.preventDefault();

    $.post(postUrl, postData)
      .done(successCB)
      .fail(errorCB);

  });



  // -------------------------------------------------------------------------------------------------------------


  // Open edit window
  //
  // =====================================
  $('.edit-trigger').click(function(e) {
    e.preventDefault();

    showResponseEdit($(this).data('target'), $(this).data('ref'));
  });


  // Close edit window
  //
  // =====================================
  $('.edit-cancel').click(function(e) {
    e.preventDefault();

    // Clear errors
    $('.error-message').html('');
    $('.form-group, .panel').removeClass('error');

    hideResponseEdit($(this).data('target'));
  });

  // Validate edit
  //
  // =====================================
  $('.edit-save').click(function(e) {
    e.preventDefault();
    validateResponseEdit($(this).data('target'));
  });

  // Disable save button if change log is empty
  //
  // =====================================
  $('#modal').on('keyup change', '.change-log-add-section #notes', function() {
    if ($(this).val().length > 0) {
      $('#changeLogSaveButton').attr('disabled', false);
    } else {
      $('#changeLogSaveButton').attr('disabled', true);
    }
  });


  // When we close the change log modal we need
  // to redisplay the darkened overlay
  //
  // =====================================
  $('#modal').on('click', '#changeLogCancelButton', function() {
    $('.faded-bg').show();
  });


  // Save edit response with note
  //
  // =====================================
  $('#modal').on('click', '#changeLogSaveButton', function(e) {
    var postUrl = '/response/' + $('#jurorNumber').val() + '/edit'
      , postData = jsonifyForm($('#' + $(this).data('target') + '-form'))
      , successCB = function() {
        window.location.reload();
      }
      , errorCB = function(err) {
        feedbackModalPostError(
          err.responseJSON.status, 'Save',
          err.responseJSON.message.indexOf('Validation failed') !== -1
        );
      };

    e.preventDefault();

    // Add notes to post data
    postData.notes = $('#modal .change-log-add-section #notes').val();
    postData.target = $(this).data('target');

    // Submit validation
    $.post(postUrl, postData)
      .done(successCB)
      .fail(errorCB);
  });


  // Show/Hide deferral dates if deferral option toggled
  //
  // =====================================
  $('#deferral-excusal-form [name="confirmedDate"]').on('change', function() {
    if ($(this).val() === 'Change') {
      $('.hide-no-deferral').removeClass('js-hidden');
    } else {
      $('.hide-no-deferral').addClass('js-hidden');
    }
  });



  // -------------------------------------------------------------------------------------------------------------
  // Save from edit staff page
  // -------------------------------------------------------------------------------------------------------------

  $('#saveAndExitButtonStaff').click(function(e) {

    e.preventDefault();
    if ($('#staffForm [name="active"]:checked').val() === 'No'
        && $('#staffForm [name=originalActive]').val() === 'true') {
      $.get('/staff/reallocate/' + $('#login').val(), function(response, status) {
        if (status !== 'nocontent') {
          $('#modal').html(response);

          // Ensure we use the version from detail page and not most recently from the record
          $('#modal input[name="version"]').val($('#updateSectionForm #versionNumber').val());

          $('#modal').css({ display: 'block' });
        } else {
          $('body #staffForm').submit();
        }
      });
    } else {
      $('body #staffForm').submit();
    }
  });



  // -------------------------------------------------------------------------------------------------------------
  // Reallocate from edit staff page dialog
  // -------------------------------------------------------------------------------------------------------------

  $('#modal').on('click', '#reallocationComplete', function(e) {
    var postUrlReallocate = '/responses/reassign',
      postDataReallocate = {
        pendingLogin: $('#modal #pendingSelect').val(),
        staffToDeactivate: $('#login').val(),
        todoLogin: $('#modal #todoSelect').val(),
        urgentsLogin: $('#modal #urgentsSelect').val(),
        _csrf: $('#modal #_csrf').val(),
      }
      , successCB = function() {
        $('#modal').html('').css({ display: 'none' });
        $('body #staffForm').submit();
      }
      , errorCB = function(err) {
        feedbackModalPostError(err.status, 'reallocate');
      };

    e.preventDefault();

    $.post(postUrlReallocate, postDataReallocate)
      .done(successCB)
      .fail(errorCB);
  });

  $('#modal').on('change', '#urgentsSelect', function(e){
    e.preventDefault();
    enableContinueButton();
  })

  $('#modal').on('change', '#pendingSelect', function(e){
    e.preventDefault();
    enableContinueButton();
  })

  $('#modal').on('change', '#todoSelect', function(e) {
    e.preventDefault();
    enableContinueButton();
  })

  function enableContinueButton() {
    if (($('#modal #urgentsSelect option').length === 0 || $('#modal #urgentsSelect').val())
      && ($('#modal #todoSelect option').length === 0 || $('#modal #todoSelect option:selected').text() === 'New Replies' || $('#modal #todoSelect').val())
      && ($('#modal #pendingSelect option').length === 0 || $('#modal #pendingSelect').val())) {
      $('#reallocationComplete').prop('disabled', false);
    }
  }

  // -------------------------------------------------------------------------------------------------------------


  // Helpers
  //
  // Functions useful to all modals
  function feedbackModalPostError(statusCode, saveBtnText, isValidation) {
    var errorMsg = 'Could not update response';

    if (isValidation === true) {
      errorMsg = 'Could not verify information provided, please check the form for errors.'
    } else if (parseInt(statusCode, 10) === 409) {
      // eslint-disable-next-line
      errorMsg = 'The Juror Digital response that you are trying to update has been updated by someone else since you started this process. Please check the updated values and reapply your changes if necessary.';
    } else if (parseInt(statusCode, 10) === 400 && saveBtnText.trim() === 'reallocate') {
      errorMsg = 'You must specify an active staff member for each category.';
    } else if (parseInt(statusCode, 10) === 400 && saveBtnText.trim() === 'Save') {
      errorMsg = 'The note that you are trying to update is exceeding the 2000 characters limit. Please review and lessen the details you are adding.';
    } else if (parseInt(statusCode, 10) === 400) {
      errorMsg = 'The summons has been completed by another user. Your changes will not be saved.';
    }

    $('#modal .error-message-submit').html(errorMsg);
    $('#modal .modal-save-button').attr('disabled', true);
  }


  function triggerAddChangeLog(target) {
    $.get('/response/' + $('#jurorNumber').val() + '/change-log?version=' + $('#updateSectionForm #versionNumber').val(), function(response) {
      $('#modal').html(response);

      // Ensure we use the version from detail page and not most recently from the record
      $('#modal input[name="version"]').val($('#updateSectionForm #versionNumber').val());
      $('#modal #changeLogSaveButton').attr('data-target', target);

      $('.faded-bg').hide();
      $('#modal').css({ display: 'block' });
    });
  };


  function showResponseEdit(target, scrollRef) {
    var hideTarget = $('#view-' + target)
      , showTarget = $('#edit-' + target).show();

    if (hideTarget.length === 0 || showTarget.length === 0) {
      return;
    }

    $('.faded-bg').show();
    hideTarget.hide();
    showTarget.show();

    if (typeof scrollRef !== 'undefined' && $(scrollRef).length > 0) {
      $(window).scrollTop($(scrollRef).position().top);
    }
  }


  function hideResponseEdit(target) {
    var showTarget = $('#view-' + target)
      , hideTarget = $('#edit-' + target).show()
      , form = $('#edit-' + target + ' form');

    if (hideTarget.length === 0 || showTarget.length === 0) {
      return;
    }

    form[0].reset();

    $('.faded-bg').hide();
    hideTarget.hide();
    showTarget.show();
  }


  function focusError() {
    $('html, body').animate({
      scrollTop: $($('.govuk-form-group--error')).offset().top
    }, 2000);
  }

  function validateResponseEdit(target) {
    var postUrl = '/response/' + $('#jurorNumber').val() + '/edit/validate'
      , postData = jsonifyForm($('#' + target + '-form'))
      , successCB = function() {
        // Clear errors
        $('.govuk-error-message').html('');
        $('.govuk-form-group, .panel').removeClass('govuk-form-group--error');

        //console.log('Validate success');

        // Open window to capture reason
        triggerAddChangeLog(target);
      }
      , errorCB = function(err) {
        //console.log('Validate failed:' + err.responseJSON);
        feedbackErrors(err.responseJSON);
      };

    //console.log('Validate target: ' + target);
    //console.log('Validate data: ' + JSON.stringify(postData));
    //console.log('Validate post url: ' + postUrl);

    postData.target = target;

    // Submit validation
    $.post(postUrl, postData)
      .done(successCB)
      .fail(errorCB);
  }


  function jsonifyForm($form) {
    var unindexedArray = $form.serializeArray()
      , indexedArray = {};

    $.map(unindexedArray, function(n, i){
      if (typeof indexedArray[n['name']] === 'object') {
        indexedArray[n['name']].push(n['value']);
      } else if (typeof indexedArray[n['name']] !== 'undefined') {
        indexedArray[n['name']] = [indexedArray[n['name']]];
        indexedArray[n['name']].push(n['value']);
      } else {
        indexedArray[n['name']] = n['value'];
      }
    });

    return indexedArray;
  }

  function feedbackErrors(errJSON) {
    var key
      , iLoop = 0;

    // Clear existing errors
    $('.govuk-error-message').html('');
    $('.govuk-form-group, .panel').removeClass('govuk-form-group--error');

    for (key in errJSON){
      if (errJSON.hasOwnProperty(key)) {
        if (key !== 'dateOfBirth' || typeof errJSON[key][0].fields === 'undefined') {
          $('#' + key + 'ErrorMessage').html(errJSON[key][0].details);
          $('#' + key + 'Group').addClass('govuk-form-group--error');
        } else {
          $('#' + key + 'Group').addClass('govuk-form-group--error');

          errJSON[key][0].fields.forEach(function() {
            $('#' + errJSON[key][0].fields[iLoop] + 'ErrorMessage').html(errJSON[key][0].details[iLoop]);

            iLoop += 1;
          });
        }
      }
    }
    focusError();
  }
})();
