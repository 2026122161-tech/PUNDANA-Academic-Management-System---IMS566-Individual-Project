/* Chart.js comparison uses the existing, unrounded credit-weighted GPA function. */
window.PundanaGPAChart = (() => {
  'use strict';
  let chart = null, signature = '', currentSeries = [];
  const $ = id => document.getElementById(id);
  const node = (tag, value = '') => { const el = document.createElement(tag); el.textContent = value; return el; };

  function series(data) {
    const semesters = [...new Set(data.subjects.map(window.PundanaTools.semesterOf))]
      .sort((a,b) => a.localeCompare(b, undefined, {numeric:true}));
    return semesters.map(semester => {
      const result = window.PundanaTools.performance(data, semester);
      if (result.gpa !== null && (!Number.isFinite(result.gpa) || result.gpa < 0 || result.gpa > 4)) throw Error('Invalid GPA estimate.');
      return {semester, gpa:result.gpa, graded:result.count, total:result.subjects.length, complete:result.complete, credits:result.credits};
    });
  }
  function destroyChart() {
    if (chart) chart.destroy();
    chart = null; signature = ''; $('gpa-chart-scroll').hidden = true;
  }
  function clear(unavailable = false) {
    destroyChart(); currentSeries = []; $('gpa-chart-rows').replaceChildren(); $('gpa-table-wrap').hidden = true;
    $('gpa-chart-state').hidden = false;
    $('gpa-chart-state').textContent = unavailable ? 'Saved grades could not be read. The GPA chart is unavailable.' : 'Enter subject grades to see your semester comparison.';
  }
  function render(data, selectedSemester) {
    let points;
    try { points = series(data); }
    catch { clear(true); return; }
    currentSeries = points;
    const table = $('gpa-chart-rows'); table.replaceChildren();
    for (const point of points) {
      const row = node('tr'), semester = node('th',point.semester); semester.scope = 'row';
      if (point.semester === selectedSemester) { row.className = 'is-selected'; semester.append(node('span',' · Selected')); }
      row.append(semester, node('td',point.gpa === null ? 'Not graded' : point.gpa.toFixed(2)), node('td',point.graded+' / '+point.total), node('td',point.gpa === null ? 'No grades entered' : point.complete ? 'All grades entered' : 'Provisional'));
      table.append(row);
    }
    $('gpa-table-wrap').hidden = points.length === 0;
    const plotted = points.filter(point => point.gpa !== null);
    const canvas = $('semester-gpa-chart');
    canvas.setAttribute('aria-label','GPA by semester. '+points.map(point=>point.semester+': '+(point.gpa===null?'not graded':point.gpa.toFixed(2)+(point.complete?'':' provisional'))).join('; '));
    if (!plotted.length) {
      destroyChart(); $('gpa-chart-state').hidden = false;
      $('gpa-chart-state').textContent = points.length ? 'Your subjects have no grades yet. Choose grades below to create the comparison.' : 'Add your subjects and their grades to create a semester comparison.';
      return;
    }
    if (typeof window.Chart !== 'function') {
      destroyChart(); $('gpa-chart-state').hidden = false; $('gpa-chart-state').textContent = 'The chart library could not load. Exact GPA values remain in the table below.'; return;
    }
    $('gpa-chart-plot').style.minWidth = Math.max(320,points.length*90)+'px';
    $('gpa-chart-scroll').hidden = false; $('gpa-chart-state').hidden = true;
    const labels = points.map(point=>point.semester);
    const values = points.map(point=>point.gpa);
    const backgroundColor = points.map(point=>point.complete?'#7545a5':'#e7ba50');
    const borderWidth = points.map(point=>point.semester===selectedSemester?2:0);
    const nextSignature = JSON.stringify([points,selectedSemester]);
    try {
      if (chart) {
        if (signature !== nextSignature) {
          chart.data.labels = labels;
          Object.assign(chart.data.datasets[0],{data:values,backgroundColor,borderWidth});
          chart.update('none');
        }
      } else {
        chart = new window.Chart(canvas, {
          type: 'bar',
          data: {labels,datasets:[{label:'GPA',data:values,backgroundColor,borderColor:'#4c286b',borderWidth,borderRadius:6,maxBarThickness:72}]},
          options: {
            responsive:true, maintainAspectRatio:false, animation:false,
            scales: {
              x:{grid:{display:false},ticks:{color:'#80678e',font:{size:11}},title:{display:true,text:'Semester',color:'#80678e'}},
              y:{min:0,max:4,beginAtZero:true,ticks:{stepSize:1,color:'#80678e'},grid:{color:'#eee5f5'},title:{display:true,text:'GPA',color:'#80678e'}}
            },
            plugins: {
              legend:{display:false},
              tooltip:{callbacks:{
                label(context) { const point=currentSeries[context.dataIndex]; return point && point.gpa!==null ? 'GPA: '+point.gpa.toFixed(2)+(point.complete?'':' (provisional)') : 'Not graded'; },
                afterLabel(context) { const point=currentSeries[context.dataIndex]; return point ? point.graded+' of '+point.total+' subjects graded · '+point.credits+' graded credits' : ''; }
              }}
            }
          }
        });
      }
      signature = nextSignature;
    } catch {
      destroyChart(); $('gpa-chart-state').hidden = false; $('gpa-chart-state').textContent = 'The graph could not be displayed. Exact GPA values remain in the table below.';
    }
  }
  window.addEventListener('pagehide',destroyChart);
  return {series,render,clear};
})();
