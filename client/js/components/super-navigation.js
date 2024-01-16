;(function(){
  'use strict';

  var appsButton = $('[data-apps-button]')
    , searchButton = $('[data-search-button]')
    , navContainer = $('.moj-header__container')
    , appsDropdown = $('[data-apps-dropdown]')
    , searchDropdown = $('[data-search-dropdown]');

  appsButton.on('click', function() {
    var toggleClass = ($(this).data('toggle-class')) ?
      $(this).data('toggle-class') : 'moj-header__navigation-open-button';

    $(this).toggleClass(toggleClass);

    if (appsDropdown[0].hidden === true) {
      appsDropdown[0].hidden = false;
      navContainer.css({ 'margin-bottom': appsDropdown.height() + 'px' });

      // hide all search dropdown related
      searchButton.removeClass('moj-header__navigation-open-button');
      searchDropdown[0].hidden = true;
    } else {
      appsDropdown[0].hidden = true;
      navContainer.removeAttr('style');
    }
  });

  searchButton.on('click', function() {
    var toggleClass = ($(this).data('toggle-class')) ?
      $(this).data('toggle-class') : 'moj-header__navigation-open-button';

    $(this).toggleClass(toggleClass);

    if (searchDropdown[0].hidden === true) {
      searchDropdown[0].hidden = false;
      navContainer.css({'margin-bottom': searchDropdown.height() + 'px'});

      // hide all apps dropdown related
      appsButton.removeClass('moj-header__navigation-open-button');
      appsDropdown[0].hidden = true;
    } else {
      searchDropdown[0].hidden = true;
      navContainer.removeAttr('style');
    }
  });

  $(window).on('resize', function() {
    if (appsDropdown[0].hidden === false) {
      navContainer.css({ 'margin-bottom': appsDropdown.height() + 'px' });
    }
    if (searchDropdown[0].hidden === false) {
      navContainer.css({ 'margin-bottom': searchDropdown.height() + 'px' });
    }
  });

})();
