(function() {
  'use strict';

  var expensesSummary = $('#expenses-summary');
  var jurorNumber = $('input[id="jurorNumber"]').val();
  var poolNumber = $('input[id="poolNumber"]').val();
  var urlSearchParams = new URLSearchParams(window.location.search);

  $('loaded', function() {
    doAjaxCall();
  });

  $('[data-summary-detectable]').each(function(_, element) {
    element.addEventListener('change', function() {
      var refresh = $(banner());
      var recalculateTotals;

      expensesSummary.children().each(function(__, child) {
        child.remove();
      });

      expensesSummary.append(refresh);

      recalculateTotals = $('#recalculate-totals');
      recalculateTotals.click(onRecalculateTotalsClick);
    });
  });

  function onRecalculateTotalsClick(event) {
    event.preventDefault();

    doAjaxCall();
  }

  function doAjaxCall() {
    var csrfToken = $('#csrfToken').val();

    $.ajax({
      url: `/juror-management/expenses/${jurorNumber}/${poolNumber}/enter-expenses/recalculate-totals`,
      method: 'POST',
      data: {
        ...payload(),
        _csrf: csrfToken,
      },
    })
      .then(function(response) {
        var newSummaryTotals = $(response);
        var recalculateTotals;

        expensesSummary.children().each(function(_, child) {
          child.remove();
        });

        expensesSummary.append(newSummaryTotals);

        recalculateTotals = $('#recalculate-totals');
        recalculateTotals.click(onRecalculateTotalsClick);
      });
  }

  function payload() {
    var payCash = $('input[name="paymentMethod"]:checked').val();

    var data = {
      'pool_number': poolNumber,
      'date_of_expense': urlSearchParams.get('date'),
      'pay_cash': payCash === 'CASH',
    };

    attendance(data);
    travel(data);
    foodAndDrink(data);
    financialLoss(data);

    return data;
  }

  function attendance(data) {
    var totalTravelTimeHour = $('#totalTravelTime-hour').val();
    var totalTravelTimeMinute = $('#totalTravelTime-minute').val();
    var attendanceType = $('input[name="payAttendance"]:checked').val();

    data.time = {
      'pay_attendance': attendanceType,
      'travel_time': `${totalTravelTimeHour}:${totalTravelTimeMinute}`,
    };
  }

  function travel(data) {
    var isCarChecked = $('#travelType')[0].checked;
    var isMotorcycleChecked = $('#travelType-2')[0].checked;
    var isBicycleChecked = $('#travelType-3')[0].checked;
    var passengers = $('#passengers').val();
    var milesTravelled = $('#milesTravelled').val();
    var parking = $('#parking').val();
    var publicTransport = $('#publicTransport').val();
    var taxi = $('#taxi').val();

    data.travel = {
      'traveled_by_car': isCarChecked,
      'traveled_by_motorcycle': isMotorcycleChecked,
      'traveled_by_bicycle': isBicycleChecked,
      'jurors_taken_by_car': parseFloatOrZero(passengers),
      'miles_traveled': parseFloatOrZero(milesTravelled),
      parking: parseFloatOrZero(parking),
      'public_transport': parseFloatOrZero(publicTransport),
      taxi: parseFloatOrZero(taxi),
    };
  }

  function foodAndDrink(data) {
    var foodAndDrinkClaimType = $('input[name="foodAndDrink"]:checked').val();
    var smartcardSpend = $('#smartcardSpend').val();

    data['food_and_drink'] = {
      'food_and_drink_claim_type': foodAndDrinkClaimType,
      'smart_card_amount': parseFloatOrZero(smartcardSpend),
    };
  }

  function financialLoss(data) {
    var lossOfEarnings = $('#lossOfEarnings').val();
    var extraCareCosts = $('#extraCareCosts').val();
    var otherCosts = $('#otherCosts').val();

    data['financial_loss'] = {
      'loss_of_earnings': parseFloatOrZero(lossOfEarnings),
      'extra_care_cost': parseFloatOrZero(extraCareCosts),
      'other_cost': parseFloatOrZero(otherCosts),
    };
  }

  function parseFloatOrZero(value) {
    if (isNaN(value) || value === '') return 0;
    return parseFloat(value);
  }

  function banner() {
    return `
    <div class="moj-banner" role="region" aria-label="information">
      <svg class="moj-banner__icon"
        fill="currentColor" role="presentation"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 25 25"
        height="25"
        width="25"
      >
        <path d="M13.7,18.5h-2.4v-2.4h2.4V18.5z M12.5,
          13.7c-0.7,0-1.2-0.5-1.2-1.2V7.7c0-0.7,0.5-1.2,1.2-1.2s1.2,0.5,1.2,1.2v4.8
          C13.7,13.2,13.2,13.7,12.5,13.7z M12.5,0.5c-6.6,0-12,5.4-12,12s5.4,12,12,12s12-5.4,12-12S19.1,0.5,12.5,0.5z"
        />
      </svg>
      <div class="moj-banner__message">
        You’ve made changes.
        <a href="#" id="recalculate-totals">Recalculate totals.</a>
      </div>
    </div>
    `;
  }

})();
