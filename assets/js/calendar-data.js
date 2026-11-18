/* Events entered here are separate from assignment-derived deadlines. */
window.PundanaCalendar = (() => {
  'use strict';
  const store=window.PundanaData;
  const types=Object.freeze({exam:'Examination',quiz:'Quiz',presentation:'Presentation',other:'Other event'});
  const validDate=value=>{
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const date=new Date(value+'T12:00:00');
    return !Number.isNaN(date.getTime())&&date.getFullYear()>=1900&&date.getFullYear()<=2100&&store.dateKey(date)===value;
  };
  const validTime=value=>value===''||(typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value));
  function read(userId) {
    const data=store.load(userId);
    if(data.events===undefined)data.events=[];
    if(!Array.isArray(data.events)||!data.events.every(e=>e&&typeof e.id==='string'&&typeof e.title==='string'&&validDate(e.date)&&Object.hasOwn(types,e.type)&&validTime(e.time||'')&&typeof(e.notes||'')==='string')||new Set(data.events.map(e=>e.id)).size!==data.events.length)throw Error('Saved calendar events have an unsupported format. Your records have not been changed.');
    return data;
  }
  function saveEvent(userId,input,id) {
    if(!userId)throw Error('Please sign in again.');
    const data=read(userId);
    const title=String(input.title||'').trim(),date=String(input.date||''),type=String(input.type||''),time=String(input.time||''),notes=String(input.notes||'').trim();
    if(title.length<2||title.length>120||!validDate(date)||!Object.hasOwn(types,type)||!validTime(time)||notes.length>1000)throw Error('Enter a title, a valid date from 1900–2100, event type and optional time. Notes may have up to 1,000 characters.');
    const event={id:id||crypto.randomUUID(),title,date,type,time,notes};
    if(id){const index=data.events.findIndex(e=>e.id===id);if(index<0)throw Error('This event no longer exists. Refresh the page.');data.events[index]={...data.events[index],...event};}
    else data.events.push(event);
    localStorage.setItem('pundana.academics.v1.'+userId,JSON.stringify(data));
  }
  function deleteEvent(userId,id) {
    if(!userId)throw Error('Please sign in again.');
    const data=read(userId);data.events=data.events.filter(e=>e.id!==id);
    localStorage.setItem('pundana.academics.v1.'+userId,JSON.stringify(data));
  }
  function entries(data) {
    const events=(data.events||[]).map(e=>({...e,key:'event:'+e.id,source:'event'}));
    const deadlines=data.assignments.map((a,index)=>({id:a.id||String(index),key:'assignment:'+(a.id||index),title:a.title,date:a.dueDate,type:'assignment',time:'',notes:a.notes||'',subjectId:a.subjectId,status:a.status,source:'assignment'}));
    return [...events,...deadlines].sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||'')||a.title.localeCompare(b.title));
  }
  function monthCells(year,month) {
    const first=new Date(year,month,1,12),offset=(first.getDay()+6)%7;
    return Array.from({length:42},(_,i)=>{
      const date=new Date(year,month,1-offset+i,12);
      return {date:store.dateKey(date),day:date.getDate(),inMonth:date.getMonth()===month};
    });
  }
  return {read,saveEvent,deleteEvent,entries,monthCells,validDate,types};
})();