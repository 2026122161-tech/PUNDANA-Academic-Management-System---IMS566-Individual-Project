'use strict';
(() => {
  const w=window.PundanaWorkspace,{$,node}=w,tools=window.PundanaTools;
  let data=null;
  const display=value=>value===null?'—':value.toFixed(2);
  function refresh() {
    const user=w.user();if(!user){window.PundanaGPAChart.clear();return;}
    try {
      data=tools.read(user.id);
      const semesters=[...new Set(data.subjects.map(tools.semesterOf))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
      w.options($('semester'),semesters.map(s=>[s,s]));
      render();
    }catch(error){window.PundanaGPAChart.clear(true);data=null;$('grade-list').replaceChildren();$('stats').replaceChildren();$('history-form').querySelector('button').disabled=true;w.notice(w.errorMessage(error),true);}
  }
  function render() {
    if(!data)return;
    const semester=$('semester').value,result=tools.performance(data,semester);
    window.PundanaGPAChart.render(data,semester);
    $('stats').replaceChildren();
    for(const [value,label]of [[display(result.gpa),'Estimated semester GPA'],[display(result.cgpa),'Estimated cumulative GPA'],[result.credits,'Graded semester credits'],[result.count+'/'+result.subjects.length,'Subjects graded']]) {const card=node('article');card.append(node('strong',value),node('span',label));$('stats').append(card);}
    $('grade-coverage').textContent=!result.subjects.length?'Add your subjects to start tracking grades.':result.complete?'All subjects in this semester are graded.':result.count?'Provisional estimate: '+(result.subjects.length-result.count)+' subject(s) not graded. Ungraded subjects are excluded.':'No grades entered. Choose grades below to calculate an estimate.';
    $('grade-list').replaceChildren();
    for(const subject of result.subjects) {
      const record=data.grades.find(g=>g.subjectId===subject.id),point=record?tools.gradePoints[record.grade]:null;
      const row=node('tr'),name=node('td',subject.code);name.append(node('small',subject.name));
      const choice=node('select','','form-select grade-choice');choice.setAttribute('aria-label','Grade for '+subject.code+' '+subject.name);
      choice.add(new Option('Not graded',''));
      for(const [grade,value]of Object.entries(tools.gradePoints))choice.add(new Option(grade+' · '+value.toFixed(2),grade));
      choice.value=record?.grade||'';
      const cell=node('td');cell.append(choice);
      choice.addEventListener('change',()=>{
        const user=w.user();if(!user)return;const desired=choice.value;
        try{tools.saveGrade(user.id,subject.id,desired);refresh();w.notice(desired?'Grade saved. Estimates updated.':'Grade removed. Subject excluded from GPA.');}
        catch(error){choice.value=record?.grade||'';w.notice(w.errorMessage(error),true);}
      });
      row.append(name,node('td',subject.credits),cell,node('td',display(point)),node('td',point===null?'—':(point*subject.credits).toFixed(2)));$('grade-list').append(row);
    }
    $('grade-empty').hidden=!!result.subjects.length;$('grade-empty').replaceChildren(node('strong','No subjects in this semester'),node('p','Add enrolled subjects on My Subjects first.'));
    // Preserve unsaved history edits when a grade changes within this semester.
    if($('history-form').dataset.semester!==semester || !$('history-form').dataset.dirty) {
      $('previousCGPA').value=result.history?.previousCGPA??'';$('previousCredits').value=result.history?.previousCredits??'';
      $('history-form').dataset.semester=semester;delete $('history-form').dataset.dirty;
    }
    $('history-form').querySelector('button').disabled=!result.subjects.length;
    $('history-status').textContent=result.history?'Saved previous record for '+semester+'. '+(result.complete?'':'CGPA remains provisional until all grades are entered.'):'Save a previous record to calculate CGPA. For your first semester enter 0 in both fields.';
  }
  $('history-form').addEventListener('input',()=>{$('history-form').dataset.dirty='true';});
  $('history-form').addEventListener('submit',event=>{
    event.preventDefault();const user=w.user();if(!user)return;
    try{tools.saveHistory(user.id,$('semester').value,Object.fromEntries(new FormData(event.currentTarget)));delete $('history-form').dataset.dirty;refresh();w.notice('Previous record saved for this semester. CGPA estimate updated.');}
    catch(error){w.notice(w.errorMessage(error),true);}
  });
  $('semester').addEventListener('change',()=>{delete $('history-form').dataset.dirty;render();});
  for(const [grade,value]of Object.entries(tools.gradePoints))$('grade-scale').append(node('span',grade+' = '+value.toFixed(2)));
  w.init(refresh);
})();