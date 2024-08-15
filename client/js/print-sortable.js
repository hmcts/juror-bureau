$('DOMContentLoaded', () => {
  $('[data-is-print-sortable="true"]').each((index, element) => {
    $(element).click((e) => {
      e.preventDefault();
      if (e.target.tagName.toLowerCase() !== 'button') return;

      const sortBy = $(element).data('sort-key');
      const sortDirection = $(element).attr('aria-sort') === 'ascending' ? 'descending' : 'ascending';
      setUrlSortedBy(sortBy, sortDirection);
      updatePrintUrl(sortBy, sortDirection);
    });
  });
});

function setUrlSortedBy(sortBy, sortDirection) {
  const url = new URL(window.location.href);
  url.searchParams.set('sortBy', sortBy);
  url.searchParams.set('sortDirection', sortDirection);
  window.history.pushState(null, null, url);
}

function updatePrintUrl(sortBy, sortDirection) {
  const printButton = $('#print-button')[0];

  const printUrl = new URL(printButton.href);
  printUrl.searchParams.set('sortBy', sortBy);
  printUrl.searchParams.set('sortDirection', sortDirection);

  printButton.href = printUrl;
}