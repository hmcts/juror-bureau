;(function() {
  'use strict';

  $('.tabs').each(function() {

    var tabContainer = $(this)
      , tabContainerId = tabContainer.attr('id')
      , defaultTab = window.location.hash
      , activeTab;

    // If url fragment belongs in the Logs section, then activate that tab first
    if (defaultTab === '#notesTab' || defaultTab === '#callLog' || defaultTab === '#changelogTab') {
      $('.detail-tabs [data-target="replyContent"]').removeClass('active');
      $('.detail-tabs [data-target="logContent"]').addClass('active');

      $('.detail-tabs [data-target="replyContent"] a').removeAttr('aria-current', 'page'); //JDB-4911
      $('.detail-tabs [data-target="replyContent"]')
        .removeClass((tabContainerId === 'responseTabs')
          ? 'moj-sub-navigation__item--active'
          : 'moj-side-navigation__item--active'); //JDB-4911
      $('.detail-tabs [data-target="logContent"] a').attr('aria-current', 'page'); //JDB-4911

      $('#replyContent').removeClass('active').hide();
      $('#logContent').addClass('active').show();

    }

    // Check if URL fragment exists to default a tab as active
    activeTab = tabContainer.find('.tab-content'+defaultTab+'[data-tabs="'+tabContainerId+'"]');
    tabContainer.find('.tab-content[data-tabs="'+tabContainerId+'"]').hide();
    if (defaultTab.length > 0 && activeTab.length > 0) {
      
      // Show content for preselected tab
      tabContainer.find('li[data-target="'+defaultTab.replace('#', '')+'"]').addClass('active');
      
      tabContainer.find('li[data-target="'+defaultTab.replace('#', '')+'"]')
        .addClass((tabContainerId === 'responseTabs')
          ? 'moj-sub-navigation__item--active'
          : 'moj-side-navigation__item--active'); //JDB-4911
      tabContainer.find('li[data-target="'+defaultTab.replace('#', '')+'"] a').attr('aria-current', 'page'); //JDB-4911


      activeTab.show();

    } else {
      // Set first tab to active
      tabContainer.find('li[data-tabs="'+tabContainerId+'"]').first().addClass('active');
      
      tabContainer.find('li[data-tabs="'+tabContainerId+'"]').first().find('a').attr('aria-current', 'page'); //JDB-4911
      tabContainer.find('li[data-tabs="'+tabContainerId+'"]').first()
        .addClass((tabContainerId === 'responseTabs')
          ? 'moj-sub-navigation__item--active'
          : 'moj-side-navigation__item--active'); //JDB-4911

      // Show content for first tab
      tabContainer.find('.tab-content[data-tabs="'+tabContainerId+'"]').first().show();

    }

    // Prevent clicking actual link within tab, allows friendly fallback
    // that doesn't effect our actual tabs
    tabContainer.find('li[data-tabs="'+tabContainerId+'"] a').click(function(e) {
      e.preventDefault();
    });

    tabContainer.find('li[data-tabs="'+tabContainerId+'"]').click(function(e) {
      var clickedItem = $(this)
        , tabId = clickedItem.attr('data-target');

      e.preventDefault();
      window.location.hash = tabId;

      // Remove active state from li and tab-content related to tab container
      // we have interacted with
      tabContainer.find('li[data-tabs="'+tabContainerId+'"]').removeClass('active');

      tabContainer.find('li[data-tabs="'+tabContainerId+'"]')
        .removeClass((tabContainerId === 'responseTabs')
          ? 'moj-sub-navigation__item--active'
          : 'moj-side-navigation__item--active'); //JDB-4911
      tabContainer.find('li[data-tabs="'+tabContainerId+'"]').find('a').removeAttr('aria-current'); //JDB-4911

      tabContainer.find('.tab-content[data-tabs="'+tabContainerId+'"]').hide();

      // Add active state to the tab we clicked
      clickedItem.addClass('active');

      clickedItem.addClass((tabContainerId === 'responseTabs')
        ? 'moj-sub-navigation__item--active'
        : 'moj-side-navigation__item--active'); //JDB-4911
      clickedItem.find('a').attr('aria-current', 'page'); //JDB-4911

      // Show the tab-content related to tab container
      // we have interacted with
      tabContainer.find('#' + tabId).show();

    });


    // If hash in url changes, click the relevant tab.
    // Allows tabs to change when using browser back and forward button
    window.onhashchange = function() {
      var matchedTab = $('li[data-target="'+window.location.hash.replace('#', '')+'"]');

      //if (matchedTab.length > 0) {
      //  matchedTab.click();
      //}
    };
  });
})();
