/* Meaningful Chart.js visualisation: counts come from PundanaData.summarize(). */
window.PundanaAssignmentChart = (() => {
  'use strict';
  let chart = null;
  let signature = '';
  const labels = ['Completed', 'In progress', 'Not started'];
  const colours = ['#59338c', '#f7c74e', '#aab6ca'];
  const element = id => document.getElementById(id);

  function statusValues(summary) {
    const values = [summary.done, summary.doing, summary.todo];
    if (!values.every(value => Number.isSafeInteger(value) && value >= 0) ||
        !Number.isSafeInteger(summary.total) || values.reduce((sum, value) => sum + value, 0) !== summary.total) {
      throw new Error('Assignment totals are inconsistent.');
    }
    return values;
  }

  function destroy() {
    if (chart) chart.destroy();
    chart = null;
    signature = '';
    const visual = element('assignment-chart-visual');
    if (visual) visual.hidden = true;
  }

  function render(summary, mode = {}) {
    const visual = element('assignment-chart-visual');
    const state = element('assignment-chart-state');
    const canvas = element('assignment-status-chart');
    const source = element('assignment-chart-source');
    source.textContent = mode.preview
      ? 'Sample preview only: fictional assignments, not saved to your account.'
      : 'Source: your saved assignments across all semesters. Updates when assignment statuses change.';

    if (mode.unavailable) {
      destroy(); state.hidden = false;
      state.textContent = 'Assignment records could not be read. The chart is unavailable.';
      return;
    }
    let values;
    try { values = statusValues(summary); }
    catch {
      destroy(); state.hidden = false;
      state.textContent = 'Assignment totals could not be verified. Reload your records to try again.';
      return;
    }
    canvas.setAttribute('aria-label', labels.map((label, index) => label + ': ' + values[index]).join(', ') + '. Total: ' + summary.total + ' assignments.');
    if (summary.total === 0) {
      destroy(); state.hidden = false;
      state.textContent = 'No assignments yet. Add coursework in Assignment Tracker to see the chart.';
      return;
    }
    if (typeof window.Chart !== 'function') {
      destroy(); state.hidden = false;
      state.textContent = 'The chart could not load. Assignment status totals remain available in the legend below.';
      return;
    }
    visual.hidden = false;
    state.hidden = true;
    const nextSignature = values.join(',');
    try {
      if (chart) {
        if (signature !== nextSignature) {
          chart.data.datasets[0].data = values;
          chart.update('none');
        }
      } else {
        chart = new window.Chart(canvas, {
          type: 'doughnut',
          data: {
            labels: labels.slice(),
            datasets: [{label:'Assignments', data:values, backgroundColor:colours.slice(), borderColor:'#ffffff', borderWidth:3, hoverOffset:5}]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            animation: false,
            layout: {padding: 9},
            plugins: {
              legend: {display: false},
              tooltip: {
                callbacks: {
                  label(context) {
                    const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                    const count = context.parsed;
                    return context.label + ': ' + count + ' (' + (total ? (count / total * 100).toFixed(1) : '0.0') + '%)';
                  }
                }
              }
            }
          }
        });
      }
      signature = nextSignature;
    } catch {
      destroy(); state.hidden = false;
      state.textContent = 'The chart could not be displayed. Status totals remain available below.';
    }
  }
  return {render, destroy, statusValues};
})();
