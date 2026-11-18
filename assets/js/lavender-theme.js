/* Presentation only: decorate subject codes after table updates. No storage writes. */
(() => {
  'use strict';
  if (document.body.dataset.page !== 'subjects') return;
  const table = document.getElementById('record-list');
  if (!table) return;
  function decorateCodes() {
    table.querySelectorAll('tr td:first-child').forEach(cell => {
      if (cell.querySelector('.subject-code-badge')) return;
      const badge = document.createElement('span');
      badge.className = 'subject-code-badge';
      badge.textContent = cell.textContent;
      cell.replaceChildren(badge);
    });
  }
  decorateCodes();
  new MutationObserver(decorateCodes).observe(table, {childList:true});
})();
