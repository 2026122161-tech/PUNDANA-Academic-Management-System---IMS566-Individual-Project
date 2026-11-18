/* Shared academic record contract. Dates are local YYYY-MM-DD; weekdays use 0=Sunday. */
window.PundanaData = (() => {
 'use strict';
 const empty = () => ({subjects:[],assignments:[],classes:[]});
 const dateKey = date => [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 function load(userId) {
  const raw = localStorage.getItem('pundana.academics.v1.'+userId);
  if (!raw) return empty();
  const data = JSON.parse(raw);
  if (!data || !['subjects','assignments','classes'].every(key=>Array.isArray(data[key]))) throw new Error('Academic data could not be read. Your saved records have not been changed.');
  if (!data.subjects.every(s=>s && typeof s.id==='string' && typeof s.code==='string' && typeof s.name==='string' && Number.isFinite(s.credits) && s.credits>=0) || !data.assignments.every(a=>a && typeof a.title==='string' && typeof a.subjectId==='string' && /^\d{4}-\d{2}-\d{2}$/.test(a.dueDate) && ['todo','doing','done'].includes(a.status)) || !data.classes.every(c=>c && typeof c.subjectId==='string' && Number.isInteger(c.day) && c.day>=0 && c.day<=6 && /^([01]\d|2[0-3]):[0-5]\d$/.test(c.start) && /^([01]\d|2[0-3]):[0-5]\d$/.test(c.end) && typeof c.room==='string')) throw new Error('Some academic records have an unsupported format. Your saved records have not been changed.');
  return data;
 }
 function sample(now = new Date()) {
  const day = offset => { const date = new Date(now); date.setDate(date.getDate()+offset); return dateKey(date); };
  return {subjects:[{id:'s1',code:'IMS566',name:'Advanced Web Design Development',credits:3},{id:'s2',code:'IMS560',name:'Information Systems Management',credits:3},{id:'s3',code:'IMS552',name:'Information Systems Analysis',credits:3}],assignments:[{id:'a1',subjectId:'s1',title:'PUNDANA individual project',dueDate:day(2),status:'doing'},{id:'a2',subjectId:'s2',title:'Case study reflection',dueDate:day(5),status:'todo'},{id:'a3',subjectId:'s3',title:'Requirements report',dueDate:day(-1),status:'todo'},{id:'a4',subjectId:'s1',title:'Wireframe submission',dueDate:day(-3),status:'done'}],classes:[{id:'c1',subjectId:'s1',day:now.getDay(),start:'09:00',end:'11:00',room:'Sample computer lab'},{id:'c2',subjectId:'s2',day:now.getDay(),start:'14:00',end:'16:00',room:'Sample lecture room'}]};
 }
 function summarize(data, now = new Date()) {
  const today = dateKey(now), active = data.assignments.filter(a=>a.status!=='done');
  const done = data.assignments.filter(a=>a.status==='done').length;
  return {subjects:data.subjects.length,credits:data.subjects.reduce((sum,s)=>sum+s.credits,0),active:active.length,overdue:active.filter(a=>a.dueDate<today).length,done,doing:data.assignments.filter(a=>a.status==='doing').length,todo:data.assignments.filter(a=>a.status==='todo').length,total:data.assignments.length,completion:data.assignments.length?Math.round(done/data.assignments.length*100):null,deadlines:[...active].sort((a,b)=>a.dueDate.localeCompare(b.dueDate)),classes:data.classes.filter(c=>c.day===now.getDay()).sort((a,b)=>a.start.localeCompare(b.start)),today};
 }

 function mutate(userId, action) { if(!userId)throw Error('Please sign in again.');const data=load(userId);action(data);localStorage.setItem('pundana.academics.v1.'+userId,JSON.stringify(data)); }
 function saveSubject(userId, input, id) {mutate(userId,data=>{
 const code=String(input.code||'').trim().toUpperCase(),name=String(input.name||'').trim(),semester=String(input.semester||'').trim(),lecturer=String(input.lecturer||'').trim(),credits=Number(input.credits);
 if(!/^[A-Z0-9][A-Z0-9 -]{1,19}$/.test(code)||name.length<2||name.length>120||!semester||semester.length>40||lecturer.length>100||!Number.isFinite(credits)||credits<1||credits>12||!Number.isInteger(credits))throw Error('Enter a subject code, name, semester and 1–12 whole credit hours.');
 if(data.subjects.some(s=>s.id!==id&&s.code.toUpperCase()===code&&(s.semester||'').toLowerCase()===semester.toLowerCase()))throw Error('This subject code already exists in that semester.');
 if(id){
 const own=data.classes.filter(c=>c.subjectId===id);
 const peers=data.classes.filter(c=>c.subjectId!==id&&String(data.subjects.find(s=>s.id===c.subjectId)?.semester||'Unspecified').trim().toLowerCase()===semester.toLowerCase());
 if(own.some(c=>peers.some(p=>p.day===c.day&&c.start<p.end&&c.end>p.start)))throw Error('Moving this subject would create a timetable overlap in the target semester. Change its class times first.');
 }
 const item={id:id||crypto.randomUUID(),code,name,semester,lecturer,credits};if(id){const at=data.subjects.findIndex(s=>s.id===id);if(at<0)throw Error('This subject no longer exists. Reload the page.');data.subjects[at]={...data.subjects[at],...item};}else data.subjects.push(item);
 }); }
 function deleteSubject(userId,id){mutate(userId,data=>{if(data.assignments.some(a=>a.subjectId===id)||data.classes.some(c=>c.subjectId===id)||(Array.isArray(data.grades)&&data.grades.some(g=>g.subjectId===id)))throw Error('This subject has linked assignments, classes or grades. Remove or reassign those records before deleting it.');data.subjects=data.subjects.filter(s=>s.id!==id);});}
 function saveAssignment(userId,input,id){mutate(userId,data=>{
 const title=String(input.title||'').trim(),subjectId=String(input.subjectId||''),dueDate=String(input.dueDate||''),status=String(input.status||''),notes=String(input.notes||'').trim();
 const date=new Date(dueDate+'T12:00:00');if(title.length<2||title.length>120||!data.subjects.some(s=>s.id===subjectId)||!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)||Number.isNaN(date.getTime())||dateKey(date)!==dueDate||!['todo','doing','done'].includes(status)||notes.length>1000)throw Error('Enter a title, an enrolled subject, valid due date and status. Notes may contain up to 1,000 characters.');
 const item={id:id||crypto.randomUUID(),title,subjectId,dueDate,status,notes};if(id){const at=data.assignments.findIndex(a=>a.id===id);if(at<0)throw Error('This assignment no longer exists. Reload the page.');data.assignments[at]={...data.assignments[at],...item};}else data.assignments.push(item);
 });}
 function deleteAssignment(userId,id){mutate(userId,data=>{data.assignments=data.assignments.filter(a=>a.id!==id);});}
 return {load,sample,summarize,empty,dateKey,saveSubject,deleteSubject,saveAssignment,deleteAssignment};
})();