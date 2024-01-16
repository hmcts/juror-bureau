;(function(){
  'use strict';

  function showNotesEdit() {
    //$('.note-controls p').html('');
    //$('section.notes').removeClass('notes--readonly');
    $('textarea[name="notes"]').attr('disabled', false).focus();
    $('#notesSaveButton').show();
    $('#notesCancelButton').show();
    $('#notesEditButton').hide();

    //$('.faded-bg').show();
  }


  function hideNotesEdit() {
    //$('.note-controls p').html('');
    //$('section.notes').addClass('notes--readonly');
    $('textarea[name="notes"]').attr('disabled', true);
    $('#notesSaveButton').hide();
    $('#notesCancelButton').hide();
    $('#notesEditButton').show();

    //$('.faded-bg').hide();
  }

  $('.button--notes-edit').click(function(e) {
    e.preventDefault();

    showNotesEdit();
  });

  $('.notes-cancel').click(function(e) {
    e.preventDefault();

    // Reset text area to state prior to opening Edit
    $('#notes').val($('#notes_original').val());

    hideNotesEdit();
  });

  $('.notes-save').click(function(e) {
    e.preventDefault();

    $('.note-controls p').html('');

    if ($('#notes').val().length < 1) {
      $('#notes').val(' ');
    }

    $.post('/response/' + $('#jurorNumber').val() + '/notes', {
      version: $('#notesVersion').val(),
      notes: $('#notes').val(),
      _csrf: $('[name="_csrf"]').val(),
    })
      .done(function() {
        // loadNotes(hideNotesEdit);
        window.location.reload();
      })
      .fail(function(err) {
        if (err.responseJSON.status === 409) {
          // eslint-disable-next-line max-len
          $('.note-controls p').html('The notes have been updated by someone else.');
        } else if (err.responseJSON.status === 400){
          $('.note-controls p').html('You have exceeded the 2000 character limit.');
        } else {
          $('.note-controls p').html(err.responseJSON.message);
        }
      });
  });


  // Load notes on page load
  function loadNotes(cb) {


    $.get('/response/' + $('#jurorNumber').val() + '/notes')
      .done(function(response) {
        $('#notesVersion').val(response.version);
        $('#notes_original').val(response.notes);
        $('#notes').val(response.notes);

        if (response.notes === null || response.notes.length === 0) {
          $('.no-notes-msg').show();
        } else {
          $('.no-notes-msg').hide();
        }

        if (typeof cb === 'function') {
          cb();
        }
      })
      .fail(function() {
        $('.no-notes-msg').show();
      });
  }

  $(document).ready(function() {
    // We are on response details page

    //hideNotesEdit();

    if ($('.detail-info').length > 0) {
      loadNotes();
    }
  });
})();
