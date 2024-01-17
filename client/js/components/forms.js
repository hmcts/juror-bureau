;(function() {
  'use strict';

  // Disable function
  jQuery.fn.extend({
    disable: function(state) {
      return this.each(function() {
        this.disabled = state;
      });
    }
  });

  function toggleButton(form) {
    var valuesFound = 0;

    form.find('input[type="text"], select').each(function() {
      if ($(this).val().length > 0) {
        valuesFound += 1;
      }
    });

    form.find('input[type="number"], select').each(function() {
      if ($(this).val().length > 0) {
        valuesFound += 1;
      }
    });

    form.find('input[type="checkbox"]').each(function() {
      if ($(this).is(':checked')) {
        valuesFound += 1;
      }
    });

    if (valuesFound > 0) {
      form.find('[type="submit"]').first().disable(false);
      form.find('[type="reset"]').first().disable(false);
    } else {
      //form.find('[type="submit"]').first().disable(true);
      //form.find('[type="reset"]').first().disable(true);
    }
  }

  $('.disable-empty').each(function() {
    var thisForm = $(this);

    toggleButton(thisForm);

    thisForm.find('input[type="text"], input[type="number"], input[type="checkbox"], select').on('keyup change blur', function() {
      toggleButton(thisForm);
    });

    //Juror Number and Pool Number inputs should only accept digit chars
    $('#jurorNumber').on('keypress', function(e) {
      return integerInput(e);
    });

    $('#poolNumber').on('keypress', function(e) {
      return integerInput(e);
    });

  });

  function integerInput(e){
    var charCode
      , charStr
      , validChar = false
      , validList = [0, 8, 9, 13, 16, 17, 18, 19, 20, 27];

    e = e || window.event;
    charCode = (typeof e.which == 'undefined') ? e.keyCode : e.which;
    charStr = String.fromCharCode(charCode);

    if (validList.indexOf(charCode) > -1){
      validChar = true;
    } else {
      //validChar = (/[/\d]/.test(charStr));
      validChar = (/[0-9]/.test(charStr));
    }

    return validChar;

  }

  /*
  $('#clearBtn').click(function(e) {
    e.preventDefault();
    $(this).closest('form').find('input[type="text"], select').val('');
    $(this).closest('form').find('input[type="number"], select').val('');
    $(this).closest('form').find('input[type="checkbox"]').prop('checked', false);
    toggleButton($(this).closest('form'));
  });
  */

  // If clicked, will toggle a class on the element
  /*
  $(document).on('click', '.sortable', function() {
    var newState = ($(this).attr('data-state') === 'ASC') ? 'DESC' : 'ASC';

    // Reset all states
    $('[data-state]').attr('data-state', '');

    // Change values on form
    $('#sortBy').val($(this).attr('data-field'));
    $('#sortOrder').val(newState);

    // Change visual of toggle
    $(this).attr('data-state', newState);

    // Submit form
    $('.search-filters').submit();
  });

  // Add sortable to thead
  $('th[data-field]').each(function() {
    $(this).addClass('sortable');
  });
  */

})();
