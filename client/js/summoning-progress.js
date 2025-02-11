$(document).ready(function() {
  const courtNameInput = document.getElementById('courtNameOrLocation');

  if (courtNameInput) {
    courtNameInput.value = (new URLSearchParams(window.location.search)).get('locCode') || '';

    setTimeout(() => {
      const selectedCourt = $('#courtNameOrLocation__listbox');
      if (selectedCourt.length > 0 && selectedCourt[0].children.length > 0) {
        selectedCourt[0].children[0].click();
        courtNameInput.blur();
      }
    }, 100);
  }

  $('#printButton').click(function () {
    window.print();
  });

  $('#refreshButton').click(function () {
    window.location.reload();
  });

  const barChartChildren = $(".barChart-component");

  barChartChildren.each(function() {
    if ($(this).hasClass("summoning-progress-barChart-bar")) {
      $(this).css("width", $(this).attr("data-percentage") + "%");
    } else if ($(this).hasClass("requested-triangle")) {
      $(this).css("left", $(this).attr("data-position") + "%");
      $(this).css("borderTop", "12px solid #1D70B8");
    } else if ($(this).hasClass("summoning-progress-barChart-value")) {
      $(this).css("width", $(this).attr("data-percentage") + "%");
    } else if ($(this).hasClass("requested-triangle-value")) {
      $(this).css("left", $(this).attr("data-position") + "%");
      $(this).closest('tr').find("td").css("padding-top", "40px")
    }
  });

});
