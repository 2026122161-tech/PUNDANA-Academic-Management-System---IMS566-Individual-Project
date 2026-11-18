'use strict';
(() => {
 const auth=window.PundanaAuth, store=window.PundanaData, $=id=>document.getElementById(id);
 let user=null, preview=false, owner=null;
 const text=(id,value)=>$(id).textContent=String(value);
 const descriptions={'My Subjects':'Manage enrolled courses, subject codes, credit hours and lecturer information.','Assignment Tracker':'Add coursework, set deadlines and track completion across your subjects.','Class Timetable':'Organise weekly classes and identify overlapping sessions.','Academic Performance':'Track grades and estimate semester GPA and cumulative CGPA.','Academic Calendar':'Bring assignment deadlines and your own academic events into one calendar.','Student Profile':'View and update personal and academic information.'};
 function node(tag,content,className) {const el=document.createElement(tag);el.textContent=content;if(className)el.className=className;return el;}
 function empty(id,symbol,title,description) {const box=node('div','','empty-state');box.append(node('span',symbol,'empty-symbol'),node('strong',title),node('p',description));$(id).replaceChildren(box);}
 const dateLabel=value=>new Date(value+'T12:00:00').toLocaleDateString('en-MY',{day:'numeric',month:'short'});
 function render() {
  const now=new Date(); text('today-date',now.toLocaleDateString('en-MY',{weekday:'short',day:'numeric',month:'short',year:'numeric'})); $('today-date').dateTime=store.dateKey(now);text('weekday',now.toLocaleDateString('en-MY',{weekday:'long'}));
  let data; $('storage-message').hidden=true;
  try{data=preview?store.sample(now):store.load(user.id);}catch(error){data=store.empty();text('storage-message',error.message);$('storage-message').hidden=false;}
  const semesterSelect=$('class-semester'), selected=semesterSelect.value;
  const semesters=[...new Set(data.subjects.map(s=>(s.semester||'').trim()||'Unspecified'))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  semesterSelect.replaceChildren();
  for(const semester of semesters)semesterSelect.add(new Option(semester,semester));
  if(semesters.includes(selected))semesterSelect.value=selected;
  if(!semesters.length)semesterSelect.add(new Option('No subjects',''));
  const timetableData={...data,classes:data.classes.filter(c=>{const subject=data.subjects.find(s=>s.id===c.subjectId);return ((subject?.semester||'').trim()||'Unspecified')===semesterSelect.value;})};
  const s=store.summarize(timetableData,now), subject=id=>data.subjects.find(item=>item.id===id);
  text('data-mode',preview?'SAMPLE PREVIEW · Fictional records, not saved to your account':s.subjects||s.total||s.classes.length?'Your workspace · Saved academic records':'Your workspace · No academic records yet');text('demo-toggle',preview?'Return to my workspace':'Preview sample data');$('demo-toggle').setAttribute('aria-pressed',String(preview));
  text('subject-count',s.subjects);text('credit-count',s.credits+' credit hours');text('active-count',s.active);text('overdue-count',s.overdue?s.overdue+' overdue assignment'+(s.overdue===1?'':'s'):'No overdue assignments');text('class-count',s.classes.length);text('completion',s.completion===null?'—':s.completion+'%');text('completed-count',s.total?s.done+' of '+s.total+' completed':'No assignments yet');text('progress-number',s.completion===null?'—':s.completion+'%');text('progress-copy',s.total?s.done+' completed · '+s.active+' still to go':'Add assignments to see your progress.');text('done-legend',s.done);text('doing-legend',s.doing);text('todo-legend',s.todo);$('progress-fill').style.width=(s.completion||0)+'%';$('progress-track').setAttribute('aria-valuenow',s.completion||0);$('progress-track').setAttribute('aria-valuetext',s.total?(s.completion+' percent complete'):'No assignments yet');text('deadline-count',s.deadlines.length);
  window.PundanaAssignmentChart.render(s, {preview, unavailable:!$('storage-message').hidden});
  if(!s.deadlines.length)empty('deadline-list','✓','No pending deadlines',s.total?'All assignments are complete. Enjoy the breathing room.':'Add assignments in Assignment Tracker to see your deadlines here.');
  else {$('deadline-list').replaceChildren(); for(const a of s.deadlines.slice(0,5)){const row=node('div','','record-row'),detail=node('div',''),date=node('div',dateLabel(a.dueDate),'record-date'+(a.dueDate<s.today?' overdue':''));detail.append(node('h3',a.title),node('p',subject(a.subjectId)?.code||'Subject unavailable'));date.append(node('span',a.dueDate<s.today?'Overdue':a.dueDate===s.today?'Due today':a.status==='doing'?'In progress':'Not started','status'));row.append(detail,date);$('deadline-list').append(row);}}
  if(!s.classes.length)empty('class-list','▦','No classes scheduled today','Add weekly classes in Class Timetable to see your schedule here.');
  else {$('class-list').replaceChildren(); for(const c of s.classes){const row=node('div','','record-row'),detail=node('div',''),time=node('div',c.start+' – '+c.end,'record-date');detail.append(node('h3',subject(c.subjectId)?.code||'Subject unavailable'),node('p',subject(c.subjectId)?.name||''),node('p',c.room));row.append(detail,time);$('class-list').append(row);}}
 }
 function check() {user=auth.currentUser();if(!user){window.PundanaAssignmentChart.destroy();$('protected-content').hidden=true;location.replace('index.html');return false;}if(owner!==user.id){preview=false;owner=user.id;}text('student-name',user.fullName);text('sidebar-name',user.fullName);text('account-id',user.studentId);text('avatar',user.fullName.trim().charAt(0).toUpperCase());$('protected-content').hidden=false;render();return true;}
 $('class-semester').addEventListener('change',()=>{if(auth.currentUser())render();else check();});
 $('demo-toggle').addEventListener('click',()=>{if(!auth.currentUser()){check();return;}preview=!preview;render();});
 $('logout').addEventListener('click',()=>{try{window.PundanaAssignmentChart.destroy();auth.logout();}finally{$('protected-content').hidden=true;location.replace('index.html');}});
 const dialog=$('module-dialog');document.querySelectorAll('[data-module]').forEach(button=>button.addEventListener('click',()=>{if(!check())return;text('module-title',button.dataset.module);text('module-description',descriptions[button.dataset.module]);dialog.showModal();}));$('dialog-close').addEventListener('click',()=>dialog.close());$('dialog-done').addEventListener('click',()=>dialog.close());
 $('menu-toggle').addEventListener('click',()=>{const open=$('sidebar').classList.toggle('open');$('menu-toggle').setAttribute('aria-expanded',String(open));});document.addEventListener('keydown',event=>{if(event.key==='Escape'){$('sidebar').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');}});
 ['pageshow','focus','storage'].forEach(event=>window.addEventListener(event,check));document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});setInterval(()=>{if(!document.hidden)check();},60000);check();
})();