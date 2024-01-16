;(function() {
  'use strict';

  function parseSearchResponse(response) {
    var iResult = 0
      , item
      , tbodyEle = $('<tbody />')
      , checkDivEle
      , checkLblEle
      , checkboxEle
      , showCheckbox
      , rowEle
      , jurorNoLinkEle
      , jurorNoSpanEle
      , jurorNoDivEle
      , dateRecEle
      , statusEle
      , statusDesc
      , urgencyEle
      , urgencyVal;


    // Build table rows
    for (iResult; iResult < response.results.length; iResult += 1) {
      item = response.results[iResult];

      rowEle = $('<tr />');

      // Select Checkbox
      // =================
      if (response.isTeamLeader && !(item.isClosed)) {
        checkDivEle = $('<div />').addClass('govuk-checkboxes__item').addClass('govuk-checkboxes--small');
        checkLblEle = $('<label />').addClass('govuk-label').addClass('govuk-checkboxes__label').attr({'for': 'selectedResponse_' + item.jurorNumber }).html('');
        checkboxEle = $('<input />').addClass('govuk-checkboxes__input').addClass('multi-select').attr({
          type: 'checkbox',
          'data-behaviour': 'exclusive',
          name: 'selectedResponses',
          id: 'selectedResponse_' + item.jurorNumber,
          'data-value': item.jurorNumber,
          value: item.jurorNumber
        });
        

        checkDivEle.append(checkboxEle);
        checkDivEle.append(checkLblEle);
        checkDivEle.addClass('jd-block-align');
        if ($('#selectionError').val() === 'Y') {
          checkboxEle.addClass('govuk-input--error');
        }
        showCheckbox = true;

      } else {
        showCheckbox = false;
      }


      // Juror number
      // =================
      //jurorNoSpanEle = '<span class="govuk-visually-hidden">view response </span>';
      //jurorNoLinkEle = $('<a />').addClass('govuk-link').addClass('jd-block-align').attr({'href': '/response/' + item.jurorNumber }).html(jurorNoSpanEle + item.jurorNumber);
      jurorNoSpanEle = $('<span />').addClass('govuk-visually-hidden').html('view response ');
      jurorNoLinkEle = $('<a />').addClass('govuk-link').addClass('jd-block-align').attr({'href': '/response/' + item.jurorNumber }).html(jurorNoSpanEle).append(item.jurorNumber);

      jurorNoDivEle = $('<div />');
      if (showCheckbox){
        jurorNoDivEle.append(checkDivEle);
      }
      jurorNoDivEle.append(jurorNoLinkEle);

      rowEle.append($('<td />').addClass('govuk-table__cell').addClass('govuk-table__cell--numeric').attr({'data-sort-value': item.jurorNumber}).html(jurorNoDivEle));

      // Name
      // =================
      rowEle.append($('<td />').addClass('govuk-table__cell').addClass('jd-middle-align').addClass('juror-name-col').html(item.name));

      // Postcode
      // =================
      //rowEle.append($('<td />').addClass('govuk-table__cell').addClass('juror-postcode-col').html(item.postcode));

      // Pool number
      // =================
      rowEle.append($('<td />').addClass('govuk-table__cell').addClass('jd-middle-align').addClass('juror-pool-col').attr({'data-sort-value': item.poolNumber.padStart(9, '0')}).html(item.poolNumber));

      // Officer
      // =================
      rowEle.append($('<td />').addClass('govuk-table__cell').addClass('jd-middle-align').addClass('juror-officer-col').html((item.staff !== null) ? item.staff.name : '-'));
      
      // Status
      // =================
      /*
      if (item.staff !== null){
        statusDesc = item.status.toUpperCase();
      } else {
        statusDesc = 'UNASSIGNED';
      }
      */
      statusDesc = item.status.toUpperCase();

      if (statusDesc === 'AWAITING JUROR'){
        statusDesc = 'AWAITING JUROR REPLY';
      }
      statusEle = $('<strong />');
      statusEle.addClass('govuk-tag').addClass('govuk-tag--blue').addClass('juror-status-col');
      statusEle.html(statusDesc);
  
      rowEle.append($('<td />').addClass('govuk-table__cell').addClass('jd-middle-align').addClass('juror-status-col').html(statusEle));
      
      // Date received
      // =================
      dateRecEle = $('<td />');
      dateRecEle.addClass('govuk-table__cell').addClass('jd-middle-align').addClass('date-col');
      if (item.slaOverdue === true) {
        dateRecEle.addClass('jd-response-overdue')
        dateRecEle.attr({
          title: 'Overdue',
          'data-sort-value': getSortableDate(item.dateReceived, 'DD/MM/YYYY')
        });
      } else {
        dateRecEle.attr({
          'data-sort-value': getSortableDate(item.dateReceived, 'DD/MM/YYYY')
        });
      }
      dateRecEle.html(getDisplayDate(item.dateReceived, 'DD/MM/YYYY'));
      rowEle.append(dateRecEle);

      // Urgency
      // =================
      urgencyEle = $('<span />');
      if (item.superUrgent === true) {
        urgencyEle.html('Send to court');
        urgencyVal = 2;
      } else if (item.urgent === true) {
        urgencyEle.html('Urgent');
        urgencyVal = 1;
      } else {
        urgencyEle = null;
        urgencyVal = 0;
      }
      if (urgencyEle !== null){
        urgencyEle.addClass('moj-badge').addClass('moj-badge--red');
      }

      rowEle.append($('<td />').append(urgencyEle).addClass('govuk-table__cell').addClass('jd-middle-align').addClass('urgent-col').attr({'data-sort-value': urgencyVal}));

      rowEle.addClass('govuk-table__row').addClass('search-loaded').addClass('search-results-row');
      
      /*
        .attr({
          id : 'id_' + item.jurorNumber,
          'data-target': '/response/' + item.jurorNumber,
          'data-toggle-active-cell': true,
        })
        .addClass('govuk-table__row')
        .addClass('search-results-row')
        .addClass('search-loaded')
        .addClass('todo');
      */

      /*
      if (item.isUrgent === true) {
        rowEle.addClass('urgent');
      }

      if (item.isClosed === true) {
        rowEle.addClass('closed');
      }
      */

      // Add entire row to the tbody
      tbodyEle.addClass('govuk-table__body');
      tbodyEle.append(rowEle);

    }

    // Replace entire table body with new results without losing the MOJ component event handlers
    //$('#searchResultTable tbody').replaceWith(tbodyEle);
    $('#searchResultTable tbody').html(tbodyEle.html());

    // If we have results, show the table after rows have been appended.
    // Otherwise ensure it is hidden
    // If we have results, make sure no results message is hidden
    if (response.meta !== null && response.meta.total > 0) {
      $('#searchResultTable').removeClass('u-hide');
      $('.response-assignment').removeClass('u-hide');
      $('#noResultsMsg').addClass('u-hide');
    } else {
      $('#searchResultTable').addClass('u-hide');
      $('.response-assignment').addClass('u-hide');
      $('#noResultsMsg').removeClass('u-hide');
    }

    // Re-enable submit button
    //$('#searchBtn').text('Search').disable(false);


    // Hide message explaining search page
    $('#searchProcessingMsg').addClass('u-hide');

    // Show summary of search
    $('#searchSummaryMsg').removeClass('u-hide');
    $('#resultCount').html(response.results.length);
    $('#resultsStr').html(response.resultsStr);

    // If exceeded max records
    if (response.meta !== null && response.meta.total > response.meta.max) {
      $('.maxRecordsMsg').html(response.meta.max);
      $('#maxExceeded').removeClass('u-hide');
    }

  }

  function buildStatusArr() {
    var statusArr = [];

    if ($('#todo').is(':checked')) {
      statusArr.push('TODO');
    }

    if ($('#awaitingContact').is(':checked')) {
      statusArr.push('AWAITING_CONTACT');
    }

    if ($('#awaitingTranslation').is(':checked')) {
      statusArr.push('AWAITING_TRANSLATION');
    }

    if ($('#awaitingReply').is(':checked')) {
      statusArr.push('AWAITING_COURT_REPLY');
    }

    if ($('#closed').is(':checked')) {
      statusArr.push('CLOSED');
    }

    return statusArr.length > 0 ? statusArr : null;
  }

  function getSortableDate(dateVal, sourceFormat){

    var moment = require('moment')
      , momentObj
      , result = '';

    try {
      momentObj = moment(dateVal, sourceFormat);
    } catch (err) {
      console.log('Error formatting sortable date: ', err);
    }
    if (momentObj) {
      result = momentObj.format('YYYYMMDD');
    }

    return result;

  }
  function getDisplayDate(dateVal, sourceFormat){
    
    var moment = require('moment')
      , momentObj
      , result = '';

    try {
      momentObj = moment(dateVal, sourceFormat);
    } catch (err) {
      console.log('Error formatting display date: ', err);
    }
    if (momentObj) {
      result = momentObj.format('D MMM YYYY');
    }

    return result;
  }

  /*
  $('.search-filters').submit(function(e) {

    alert('search-filters submit');

    e.preventDefault();

    // Disable submit button until search is complete
    //$('#searchBtn').disable(true).text('Searching...');

    // Disable send to button when starting new search
    //$('#sendToButtonMulti').prop('disabled', true);

    // Show message about search underway
    $('#maxExceeded').addClass('u-hide');
    $('#searchSummaryMsg').addClass('u-hide');
    $('#noResultsMsg').addClass('u-hide');
    $('#noSearchPerformedMsg').addClass('u-hide');
    $('#searchProcessingMsg').removeClass('u-hide');
    $('#searchResultTable').addClass('u-hide');

    $.post('/search', {
      jurorNumber: ($('#jurorNumber').val().length > 0) ? $('#jurorNumber').val() : null,
      lastName: ($('#lastName').val().length > 0) ? $('#lastName').val() : null,
      postcode: ($('#postcode').val().length > 0) ? $('#postcode').val() : null,
      poolNumber: ($('#poolNumber').val().length > 0) ? $('#poolNumber').val() : null,
      courtCode: ($('#courtCode').length > 0 && $('#courtCode').val().length > 0) ? $('#courtCode').val() : null,
      staffAssigned: ($('#staffAssigned').length > 0 && $('#staffAssigned').val().length > 0) ? $('#staffAssigned').val() : null,
      urgentsOnly: $('#urgentsOnly').is(':checked'),
      status: buildStatusArr(),

      '_csrf': $('#_csrf').val(),
      sortBy: $('#sortBy').val(),
      sortOrder: $('#sortOrder').val(),
    })
      .done(function(response) {
        parseSearchResponse(response);
      })
      .fail(function(err) {
        parseSearchResponse(JSON.parse(err.responseText));
      });

  });
  */

  /*
  if ($('#searchBtn').is(':enabled')) {
    $('.search-filters').submit();
  }
  */

  // Expandable filter section
  /*
  $('.additional-filter-items').slideUp(0);

  $('.filter-toggle-switch')
    .addClass('toggle').addClass('toggle--closed')
    .css({ cursor: 'pointer' })
    .click(function() {
      if ($('.additional-filter-items').css('display') !== 'none') {
        $('.filter-toggle-switch')
          .removeClass('toggle--open')
          .addClass('toggle--closed');
      } else {
        $('.filter-toggle-switch')
          .removeClass('toggle--closed')
          .addClass('toggle--open');
      }

      $('.additional-filter-items').toggle();
    });
  */


  // Reassign controls
  // ==========================
  $('#selectAllLink').click(function(e) {
    e.preventDefault();

    $('.multi-select').each(function() {
      $(this).prop('checked', true).change();
    });
  });

  $('#deselectAllLink').click(function(e) {
    e.preventDefault();

    $('.multi-select').each(function() {
      $(this).prop('checked', false).change();
    });
  });

  $(document).on('click, change', '.multi-select', function() {
    var hasSelected = false;


    $('.multi-select').each(function() {
      if ($(this).is(':checked')) {
        hasSelected = true;
      }
    });

    /*
    if (hasSelected) {
      $('#sendToButtonMulti').prop('disabled', false);
    } else {
      $('#sendToButtonMulti').prop('disabled', true);
    }
    */
  });


})();
