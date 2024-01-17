;(function() {
  'use strict';

  $(document).ready(function() {

    // Allow only numeric chars in the allocate input fields
    $('.allocateInput').on('keydown', function(event){
      var charCode = (event.which) ? event.which : event.keyCode
        , allowedCharCodes = [8, 9, 37, 39, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101,
          102, 103, 104, 105];

      if (allowedCharCodes.indexOf(charCode) === -1) {
        return false;
      }

    });

    // Set status of Send button when an allocate input is changed
    $('.allocateInput').on('keyup', function() {
      setSendButtonStatus();
    });

    // Set status of Send button when an allocate checkbox is changed
    $('.select-check').on('change', function() {
      setSendButtonStatus();
    });

    $('#checkboxes-all').on('change', function() {
      setSendButtonStatus();
    });

  });

  // Process the send button click
  /*
  $(document).ready(function() {
    $('#allocateRepliesButton').click(function() {
      processSend();
      $('#allocate-list').val('1001,1002,1003');
    });
  });
  */

  function setSendButtonStatus(){
    var itemCount
      , allocateCount = 0
      , selectedStaffCount = $('.staff-select-check:checked').length;

    $('.allocateInput').each(function() {
      itemCount = isNaN(parseInt($(this).val(), 10)) ? 0 : parseInt($(this).val(), 10);
      allocateCount += itemCount;

      if (allocateCount > 0 && selectedStaffCount > 0){
        $('#allocateRepliesButton').prop('disabled', false);
      } else {
        $('#allocateRepliesButton').prop('disabled', true);
      }
    });
  }

})();
