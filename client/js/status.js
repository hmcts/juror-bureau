;(function(){
  'use strict';
  var poolStatus = ''
    , processingStatus = '';

  $(document).ready(function(){
    if ($('#poolStatus').length){

      poolStatus = $('#poolStatus').val();
      processingStatus = $('#processingStatus').val();

      if (processingStatus === 'TODO' && poolStatus !== ''){

        switch (poolStatus) {
        case '2':
        case '5':
        case '6':
        case '7':
          break;
        case '11':
          displaySelectStatusDialog();
          break;
        default:
          break;

        }

        $('#poolStatus').val = '';
      }
    };
  });

  function displaySelectStatusDialog(){
    $.get('/response/' + $('#jurorNumber').val() + '/bureaustatus/', function(response) {
      $('#modal').html(response);
      $('#modal input[name="version"]').val($('#updateSectionForm #versionNumber').val());
      $('#modal').css({ display: 'block' });
    });
  };


})();
