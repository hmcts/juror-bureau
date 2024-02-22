;(function(){
  'use strict';

  // If clicked, will toggle a class on the element
  $('[data-toggle-active]').css({ cursor: 'pointer' });
  $(document).on('click', '[data-toggle-active]', function() {
    var toggleClass = ($(this).data('toggle-class')) ?
      $(this).data('toggle-class') :
      'active';

    $(this).toggleClass(toggleClass);

    if ($(this).data('target').length > 0) {
      location.href = $(this).data('target');
    }
  });

  $(document).on('click', '[data-toggle-active-cell] > td', function() {
    var toggleClass = ($(this).parent().data('toggle-class')) ?
      $(this).parent().data('toggle-class') :
      'active';

    if ($(this).data('toggle-exclude') !== true) {
      $(this).parent().toggleClass(toggleClass);

      if ($(this).parent().data('target').length > 0) {
        location.href = $(this).parent().data('target');
      }
    }
  });


  // Hook into back button to go to browser history if JS is enabled

  $('.link-back:not(.link-back--static)').click(function(e) {
    e.preventDefault();

    window.history.back();
  });

  $('.link-search').on('click', function() {
    location.replace('/search');
  });

  $('.link-inbox').on('click', function() {
    location.replace('/inbox');
  });

  $('.link-pending').on('click', function() {
    location.replace('/pending');
  });

  $('.link-complete').on('click', function() {
    location.replace('/completed');
  });

  // Hide and show JS specific toggles
  $('.hidden-no-js').show();
  $('.show-no-js').hide();

  //require('./components/selectButtons');
  //require('./components/showhide');
  require('./tabs');
  require('./components/forms');
  require('./components/search');
  require('./components/backlog');
  require('./components/notes');
  require('./components/super-navigation');
  require('./modal');
  require('./status');
  require('./export-coroner');

})();
