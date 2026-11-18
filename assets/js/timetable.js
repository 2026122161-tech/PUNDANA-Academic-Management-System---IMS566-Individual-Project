'use strict';
(() => {
  const w=window.PundanaWorkspace,{$,node}=w,tools=window.PundanaTools;
  const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const week=[1,2,3,4,5,6,0];
  let data=null,userId=null,editId=null,deleteId=null;
  $('selected-day').value=String(new Date().getDay());
  function refresh() {
    const user=w.user();if(!user)return;userId=user.id;
    try {
      data=tools.read(userId);
      const semesters=[...new Set(data.subjects.map(tools.semesterOf))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
      w.options($('semester'),semesters.map(s=>[s,s]));
      $('add-class').disabled=!data.subjects.length;
      render();
    } catch(error) {data=null;$('schedule').replaceChildren();$('stats').replaceChildren();$('add-class').disabled=true;w.notice(w.errorMessage(error),true);}
  }
  function render() {
    if(!data)return;
    const semester=$('semester').value,subjects=data.subjects.filter(s=>tools.semesterOf(s)===semester),ids=new Set(subjects.map(s=>s.id));
    const classes=data.classes.filter(c=>ids.has(c.subjectId));
    const today=new Date().getDay();
    const minutes=classes.reduce((sum,c)=>{const toMinutes=value=>Number(value.slice(0,2))*60+Number(value.slice(3));return sum+toMinutes(c.end)-toMinutes(c.start);},0);
    $('stats').replaceChildren();
    for(const [value,label]of [[classes.length,'Classes this week'],[classes.filter(c=>c.day===today).length,'Classes today'],[(minutes/60).toFixed(1),'Weekly contact hours']]) {const card=node('article');card.append(node('strong',value),node('span',label));$('stats').append(card);}
    $('day-picker').hidden=$('view').value!=='day';
    const daily=$('view').value==='day',selected=Number($('selected-day').value);
    $('schedule').classList.toggle('daily',daily);$('schedule').replaceChildren();
    $('schedule-empty').hidden=!!data.subjects.length;
    $('schedule-empty').replaceChildren(node('strong','Add your subjects first'),node('p','Open My Subjects to enrol before adding weekly classes.'));
    if(!data.subjects.length)return;
    for(const day of daily?[selected]:week) {
      const column=node('section','','day-column'+(day===today?' today':'')),heading=node('h2',days[day]);
      if(day===today)heading.append(node('span','Today','today-label'));
      column.append(heading);
      const sessions=classes.filter(c=>c.day===day).sort((a,b)=>a.start.localeCompare(b.start));
      if(!sessions.length)column.append(node('p','No classes scheduled','day-empty'));
      for(const session of sessions) {
        const subject=subjects.find(s=>s.id===session.subjectId);
        const block=node('article','','class-block subject-'+(data.subjects.findIndex(s=>s.id===subject.id)%5));
        const time=node('time',session.start+' – '+session.end);
        block.append(time,node('h3',subject.code),node('p',subject.name),node('p',session.room));
        if(subject.lecturer)block.append(node('p',subject.lecturer));
        const actions=node('div','','row-actions');
        for(const [label,action]of [['Edit',()=>openEditor(session)],['Delete',()=>openDelete(session,subject)]]) {
          const button=node('button',label,'btn btn-sm '+(label==='Edit'?'btn-outline-primary':'btn-outline-danger'));button.type='button';button.setAttribute('aria-label',label+' '+subject.code+' on '+days[day]+' at '+session.start);button.addEventListener('click',action);actions.append(button);
        }
        block.append(actions);column.append(block);
      }
      $('schedule').append(column);
    }
  }
  function openEditor(item=null) {
    const user=w.user();if(!user)return;
    try{data=tools.read(user.id);}catch(error){w.notice(w.errorMessage(error),true);return;}
    if(!data.subjects.length){w.notice('Add a subject before creating a class.',true);return;}
    editId=item?.id||null;
    $('class-form').reset();$('class-error').hidden=true;$('class-title').textContent=item?'Edit class':'Add class';
    w.options($('subjectId'),data.subjects.map(s=>[s.id,s.code+' · '+s.name+' · '+tools.semesterOf(s)]),'Choose a subject');
    if(item)for(const key of ['subjectId','day','start','end','room'])$(key).value=item[key];
    else {$('day').value=$('view').value==='day'?$('selected-day').value:String(new Date().getDay());}
    $('class-dialog').showModal();
  }
  function openDelete(item,subject) {
    if(!w.user())return;deleteId=item.id;
    $('delete-message').textContent='Delete '+subject.code+' on '+days[item.day]+' at '+item.start+'? This cannot be undone.';
    $('delete-error').hidden=true;$('delete-dialog').showModal();
  }
  $('class-form').addEventListener('submit',event=>{
    event.preventDefault();const user=w.user();if(!user)return;
    try {
      tools.saveClass(user.id,Object.fromEntries(new FormData(event.currentTarget)),editId);
      const subject=data.subjects.find(s=>s.id===$('subjectId').value);
      if(subject)$('semester').value=tools.semesterOf(subject);
      $('selected-day').value=$('day').value;
      $('class-dialog').close();refresh();w.notice('Class saved. Your dashboard schedule is updated.');
    }catch(error){$('class-error').hidden=false;$('class-error').textContent=w.errorMessage(error);}
  });
  $('confirm-delete').addEventListener('click',()=>{
    const user=w.user();if(!user)return;
    try{tools.deleteClass(user.id,deleteId);$('delete-dialog').close();refresh();w.notice('Class deleted.');}
    catch(error){$('delete-error').hidden=false;$('delete-error').textContent=w.errorMessage(error);}
  });
  $('add-class').addEventListener('click',()=>openEditor());
  $('cancel-class').addEventListener('click',()=>$('class-dialog').close());
  $('cancel-delete').addEventListener('click',()=>$('delete-dialog').close());
  ['semester','view','selected-day'].forEach(id=>$(id).addEventListener('change',render));
  w.init(refresh);
})();