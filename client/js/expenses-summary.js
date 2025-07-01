(function() {
  'use strict';

  var expensesSummary = $('#expenses-summary');
  var jurorNumber = $('input[id="jurorNumber"]').val();
  var locCode = $('input[id="locCode"]').val();
  var timeAtCourt = $('#timeAtCourt > div > dd').text().trim();
  var nonAttendanceDay = timeAtCourt === 'Non-attendance day';
  var urlSearchParams = new URLSearchParams(window.location.search);
  var status = $('#expense-status').val();

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
      url: `/juror-management/expenses/${jurorNumber}/${locCode}/enter-expenses/recalculate-totals?status=${status}`,
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
    var paymentMethod = $('input[name="paymentMethod"]:checked').val();

    var data = {
      'date_of_expense': urlSearchParams.get('date'),
      'payment_method': paymentMethod,
    };

    if (!nonAttendanceDay) {
      attendance(data);
      travel(data);
      foodAndDrink(data);
    }
    financialLoss(data);

    return data;
  }

  function attendance(data) {
    var totalTravelTimeHour = $('#totalTravelTime-hour').val().padStart(2, '0');
    var totalTravelTimeMinute = $('#totalTravelTime-minute').val().padStart(2, '0');
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
    var carPassengers = $('#carPassengers').val();
    var motoPassengers = $('#motoPassengers').val();
    var milesTravelled = $('#milesTravelled').val();
    var parking = $('#parking').val();
    var publicTransport = $('#publicTransport').val();
    var taxi = $('#taxi').val();

    data.travel = {
      'traveled_by_car': isCarChecked,
      'traveled_by_motorcycle': isMotorcycleChecked,
      'traveled_by_bicycle': isBicycleChecked,
      'jurors_taken_by_car': parseFloatOrZero(carPassengers),
      'jurors_taken_by_motorcycle': parseFloatOrZero(motoPassengers),
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
    <div role="region" class="moj-alert moj-alert--information" aria-label="information: A section has moved" data-module="moj-alert">
      <div>
        <svg class="moj-alert__icon" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" height="30" width="30">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M10.2165 3.45151C11.733 2.82332 13.3585 2.5 15 2.5C16.6415 2.5 18.267 2.82332 19.7835 3.45151C21.3001 4.07969 22.6781 5.00043 23.8388 6.16117C24.9996 7.3219 25.9203 8.69989 26.5485 10.2165C27.1767 11.733 27.5 13.3585 27.5 15C27.5 18.3152 26.183 21.4946 23.8388 23.8388C21.4946 26.183 18.3152 27.5 15 27.5C13.3585 27.5 11.733 27.1767 10.2165 26.5485C8.69989 25.9203 7.3219 24.9996 6.16117 23.8388C3.81696 21.4946 2.5 18.3152 2.5 15C2.5 11.6848 3.81696 8.50537 6.16117 6.16117C7.3219 5.00043 8.69989 4.07969 10.2165 3.45151ZM16.3574 22.4121H13.6621V12.95H16.3574V22.4121ZM13.3789 9.20898C13.3789 8.98763 13.4212 8.7793 13.5059 8.58398C13.5905 8.38216 13.7044 8.20964 13.8477 8.06641C13.9974 7.91667 14.1699 7.79948 14.3652 7.71484C14.5605 7.63021 14.7721 7.58789 15 7.58789C15.2214 7.58789 15.4297 7.63021 15.625 7.71484C15.8268 7.79948 15.9993 7.91667 16.1426 8.06641C16.2923 8.20964 16.4095 8.38216 16.4941 8.58398C16.5788 8.7793 16.6211 8.98763 16.6211 9.20898C16.6211 9.43685 16.5788 9.64844 16.4941 9.84375C16.4095 10.0391 16.2923 10.2116 16.1426 10.3613C15.9993 10.5046 15.8268 10.6185 15.625 10.7031C15.4297 10.7878 15.2214 10.8301 15 10.8301C14.7721 10.8301 14.5605 10.7878 14.3652 10.7031C14.1699 10.6185 13.9974 10.5046 13.8477 10.3613C13.7044 10.2116 13.5905 10.0391 13.5059 9.84375C13.4212 9.64844 13.3789 9.43685 13.3789 9.20898Z" fill="currentColor" />
        </svg>
      </div>
      <div class="moj-alert__content">
        You’ve made changes.
        <a href="#" id="recalculate-totals">Recalculate totals.</a>
      </div>
    </div>
    `;
  }

})();
