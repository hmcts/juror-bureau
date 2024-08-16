$('DOMContentLoaded', () => {
  $('[data-is-print-sortable="true"]').each((_, element) => {
    $(element).click((e) => {
      e.preventDefault();
      if (e.target.tagName.toLowerCase() !== 'button') return;

      const sortBy = $(element).data('sort-key');
      const sortDirection = $(element).attr('aria-sort') === 'ascending' ? 'descending' : 'ascending';
      setUrlSortedBy(sortBy, sortDirection);
      updatePrintUrl(sortBy, sortDirection);
    });
  });

  $('[data-module="mod-sortable-table"]').each((_, element) => {
    new GroupedSortableTable(element);
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

// this class is an adaptation of the MOJFrontend.SortableTable prototype to work with grouped tables
class GroupedSortableTable {

  constructor(element) {
    this.table = $(element);
    this.body = this.table.find('tbody'); // find all tbody in the table

    this.createStatusBox();
    this.createHeadingButtons();
    this.initialiseSortedColumn();
    this.table.on('click', 'th button', this.onSortButtonClick.bind(this));

    this.statusMessage = 'Sort by %heading% (%direction%)';
  }

  createStatusBox() {
    this.status = $('<div aria-live="polite" role="status" aria-atomic="true" class="govuk-visually-hidden" />');
    this.table.parent().append(this.status);
  };
  
  createHeadingButtons() {
    const headings = this.table.find('thead th');
    let heading;
    for(let i = 0; i < headings.length; i++) {
      heading = $(headings[i]);
      if(heading.attr('aria-sort')) {
        this.createHeadingButton(heading, i);
      }
    }
  }

  createHeadingButton(heading, i) {
    const text = heading.text();
    const button = $(`<button type="button" data-index="${i}">${text}</button>`);
    heading.text('');
    heading.append(button);
  }

  onSortButtonClick(e) {
    e.preventDefault();
    if (e.target.tagName.toLowerCase() !== 'button') return;

    const button = $(e.target);
    const columnNumber = button.data('index');
    const sortBy = button.parent().data('sort-key');
    const sortDirection = button.parent().attr('aria-sort') === 'ascending' ? 'descending' : 'ascending';

    for (const body of this.body) {
      const rows = $(body).find('tr');
      const sortedRows = this.sort(rows, columnNumber, sortDirection);
      this.addRows(body, sortedRows);
    }

    this.table.find('thead th').attr('aria-sort', 'none');
    button.parent().attr('aria-sort', sortDirection);

    let message = this.statusMessage
      .replace('%heading%', button.text())
      .replace('%direction%', sortDirection);
    this.status.text(message);

    setUrlSortedBy(sortBy, sortDirection);
    updatePrintUrl(sortBy, sortDirection);
  }

  initialiseSortedColumn() {
    for (const body of this.body) {
      const rows = $(body).find('tr');

      this.table.find('th')
        .filter('[aria-sort="ascending"], [aria-sort="descending"]')
        .first()
        .each((_, el) => {
          const sortDirection = $(el).attr('aria-sort');
          const columnNumber = $(el).find('button').attr('data-index');
          const sortedRows = this.sort(rows, columnNumber, sortDirection);
          this.addRows(body, sortedRows);
        });
    }
  }

  addRows(body, rows) {
    $(body).append(rows);
    $(body).find('[data-fixed-index]').each((_, element) => {
      const fixedIndex = $(element).attr('data-fixed-index');
      if (fixedIndex === '0') {
        $(body).prepend(element);
      } else {
        $(body).append(element);
      }
    });
  }

  sort(rows, columnNumber, sortDirection) {
    return rows.sort((a, b) => {
      const aValue = $(a).find('td').eq(columnNumber).text();
      const bValue = $(b).find('td').eq(columnNumber).text();

      if (sortDirection === 'ascending') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }
}