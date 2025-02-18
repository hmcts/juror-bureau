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

  const colours = {
    confirmed: '#1D70B8',
    requested: '#B1B4B6',
    surplus:'#D53880',
    notResponded: '#F3F2F1',
    unavailable: '#B58840',
  };

  barChartChildren.each(function() {
    if ($(this).hasClass("summoning-progress-barChart-bar")) {
      $(this).css("width", $(this).attr("data-percentage") + "%");
    } else if ($(this).hasClass("requested-triangle")) {
      $(this).css("left", $(this).attr("data-position") + "%");
      $(this).css("borderTop", "12px solid #1D70B8");
    } else if ($(this).hasClass("summoning-progress-barChart-value")) {
      $(this).css("right", (100 - parseFloat($(this).attr("data-position"))) + "%");
      if ($(this).attr("data-position") && $(this).attr("data-position") !== "0") {
        $(this).css("borderRight", `4px solid ${colours[$(this).attr("bar-type")]}`);
        $(this).css("paddingRight", "4px");
        let overlap = false;
        if ($(this).prev().length) {
          overlap = doTheyOverlap($(this), $(this).prev());
          if (overlap) {
            const prevHeight = parseInt($(this).prev().css("height"));
            const prevPaddingTop = parseInt($(this).prev().css("paddingTop"));
            $(this).css("height", prevHeight + 17 + "px");
            $(this).css("paddingTop", prevPaddingTop + 17 + "px");
          }
        }
      }
    } else if ($(this).hasClass("requested-triangle-value")) {
      $(this).css("left", $(this).attr("data-position") + "%");
      $(this).closest('tr').find("td").css("padding-top", "40px")
    }
  });

  // Adjust parent td height after all elements are processed
  barChartChildren.each(function() {
    if ($(this).hasClass("summoning-progress-barChart-value")) {
        var $parentTd = $(this).closest("td");
        var maxHeight = 0;

        $parentTd.find(".summoning-progress-barChart-value").each(function() {
            var childBottom = $(this).position().top + $(this).outerHeight();
            if (childBottom > maxHeight) {
                maxHeight = childBottom;
            }
        });

        // Include additional height for any overlaps
        $parentTd.find(".summoning-progress-barChart-value").each(function() {
            var overlapHeight = parseInt($(this).css("height")) + parseInt($(this).css("paddingTop"));
            if (overlapHeight > maxHeight) {
                maxHeight = overlapHeight;
            }
        });

        $parentTd.height(maxHeight);
    }
  });


  function doTheyOverlap(el0, el1) {
    const $el0 = $(el0);
    const $el1 = $(el1);

    const el0Rect = $el0[0].getBoundingClientRect();
    const el1Rect = $el1[0].getBoundingClientRect();

    return !(
        el0Rect.top > el1Rect.bottom ||
        el0Rect.bottom < el1Rect.top ||
        el0Rect.left > el1Rect.right ||
        el0Rect.right < el1Rect.left
    );
  }

});
