'use strict';
(() => {
  const w=window.PundanaWorkspace,{$,node}=w,calendar=window.PundanaCalendar;
  const dateKey=window.PundanaData.dateKey,today=()=>dateKey(new Date());
  let selected=today(),month=new Date(new Date().getFullYear(),new Date().getMonth(),1,12),data=null,editId=null,deleteId=null;
  const fullDate=value=>new Date(value+'T12:00:00').toLocaleDateString('en-MY',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  function refresh() {
    const user=w.user();if(!user)return;
    try {data=calendar.read(user.id);$('add-event').disabled=false;render();}
    catch(error){data=null;$('calendar-grid').replaceChildren();$('day-events').replaceChildren();$('month-events').replaceChildren();$('stats').replaceChildren();$('add-event').disabled=true;w.notice(w.errorMessage(error),true);}
  }
  function chooseDate(value,focus=false) {
    if(!calendar.validDate(value))return;
    selected=value;const date=new Date(value+'T12:00:00');month=new Date(date.getFullYear(),date.getMonth(),1,12);
    render();if(focus)document.querySelector('[data-date="'+selected+'"]')?.focus();
  }
  function moveMonth(offset) {
    const next=new Date(month.getFullYear(),month.getMonth()+offset,1,12);
    if(next.getFullYear()<1900||next.getFullYear()>2100)return;
    month=next;selected=dateKey(next);render();
  }
  function render() {
    if(!data)return;
    const filter=$('event-filter').value,entries=calendar.entries(data).filter(e=>!filter||e.type===filter);
    const monthKey=dateKey(month).slice(0,7),inMonth=entries.filter(e=>e.date.slice(0,7)===monthKey),daily=entries.filter(e=>e.date===selected);
    const monthLabel=month.toLocaleDateString('en-MY',{month:'long',year:'numeric'});
    $('month-label').textContent=monthLabel;$('jump-date').value=selected;
    $('prev-month').disabled=month.getFullYear()===1900&&month.getMonth()===0;
    $('next-month').disabled=month.getFullYear()===2100&&month.getMonth()===11;
    $('stats').replaceChildren();
    for(const [value,label]of [[inMonth.length,'Events this month'],[inMonth.filter(e=>e.source==='assignment').length,'Linked assignment deadlines'],[inMonth.filter(e=>e.source==='event').length,'Your calendar events']]){const card=node('article');card.append(node('strong',value),node('span',label));$('stats').append(card);}
    $('calendar-grid').replaceChildren();
    for(const cell of calendar.monthCells(month.getFullYear(),month.getMonth())) {
      const items=entries.filter(e=>e.date===cell.date);
      const button=node('button','','calendar-day'+(!cell.inMonth?' outside':'')+(cell.date===today()?' today':'')+(cell.date===selected?' selected':''));
      button.type='button';button.dataset.date=cell.date;button.tabIndex=cell.date===selected?0:-1;button.disabled=!calendar.validDate(cell.date);
      button.setAttribute('aria-label',fullDate(cell.date)+', '+items.length+' event'+(items.length===1?'':'s'));
      button.setAttribute('aria-pressed',String(cell.date===selected));if(cell.date===today())button.setAttribute('aria-current','date');
      const dots=node('span','','day-dots');dots.setAttribute('aria-hidden','true');for(const type of [...new Set(items.map(e=>e.type))].slice(0,4))dots.append(node('i','','dot-'+type));
      button.append(node('span',cell.day,'day-number'),dots,node('span',items.length?items.length+' event'+(items.length===1?'':'s'):'','event-count'));
      button.addEventListener('click',()=>chooseDate(cell.date,true));
      button.addEventListener('keydown',event=>{
        const shifts={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};
        if(!Object.hasOwn(shifts,event.key))return;event.preventDefault();const date=new Date(cell.date+'T12:00:00');date.setDate(date.getDate()+shifts[event.key]);chooseDate(dateKey(date),true);
      });
      $('calendar-grid').append(button);
    }
    $('selected-date').textContent=fullDate(selected);$('day-count').textContent=daily.length+' event'+(daily.length===1?'':'s')+' for the selected date'+(filter?' and filter.':'.');
    $('day-events').replaceChildren();
    if(!daily.length)$('day-events').append(node('div','No events for this date. Use Add event to plan something new.','form-hint'));
    for(const event of daily) {
      const card=node('article','','event-card');
      card.append(node('span',event.source==='assignment'?'Assignment deadline':calendar.types[event.type],'event-type'),node('h3',event.title));
      if(event.time)card.append(node('p',event.time));
      if(event.source==='assignment') {
        const subject=data.subjects.find(s=>s.id===event.subjectId);
        card.append(node('p',(subject?.code||'Subject unavailable')+' · '+({todo:'Not started',doing:'In progress',done:'Completed'}[event.status]||'')));
        if(event.status!=='done'&&event.date<today())card.append(node('p','Overdue','overdue-text'));
        if(event.notes)card.append(node('p',event.notes));
        const link=node('a','Edit in Assignment Tracker ↗');link.href='assignments.html';card.append(link);
      } else {
        if(event.notes)card.append(node('p',event.notes));
        const actions=node('div','','row-actions');
        for(const [label,fn]of [['Edit',()=>openEditor(event)],['Delete',()=>openDelete(event)]]){const button=node('button',label,'btn btn-sm '+(label==='Edit'?'btn-outline-primary':'btn-outline-danger'));button.type='button';button.setAttribute('aria-label',label+' '+event.title);button.addEventListener('click',fn);actions.append(button);}
        card.append(actions);
      }
      $('day-events').append(card);
    }
    $('month-count').textContent=inMonth.length;$('month-events').replaceChildren();
    if(!inMonth.length)$('month-events').append(node('p','No events match this month and filter.','form-hint'));
    for(const event of inMonth) {
      const button=node('button','','month-event-button');button.type='button';
      button.append(node('span',event.title),node('small',new Date(event.date+'T12:00:00').toLocaleDateString('en-MY',{day:'numeric',month:'short'})+(event.time?' · '+event.time:'')));
      button.addEventListener('click',()=>{chooseDate(event.date,true);$('selected-date').scrollIntoView({block:'nearest'});});$('month-events').append(button);
    }
  }
  function openEditor(event=null) {
    if(!w.user())return;
    editId=event?.source==='event'?event.id:null;
    $('event-form').reset();$('event-error').hidden=true;$('event-title').textContent=editId?'Edit event':'Add event';
    $('date').value=selected;
    if(event)for(const key of ['title','date','type','time','notes'])$(key).value=event[key]||'';
    $('event-dialog').showModal();
  }
  function openDelete(event) {
    if(!w.user()||event.source!=='event')return;deleteId=event.id;
    $('delete-message').textContent='Delete '+event.title+'? This cannot be undone.';$('delete-error').hidden=true;$('delete-dialog').showModal();
  }
  $('event-form').addEventListener('submit',event=>{
    event.preventDefault();const user=w.user();if(!user)return;
    try {const input=Object.fromEntries(new FormData(event.currentTarget));calendar.saveEvent(user.id,input,editId);$('event-dialog').close();selected=input.date;const date=new Date(selected+'T12:00:00');month=new Date(date.getFullYear(),date.getMonth(),1,12);refresh();w.notice('Calendar event saved.');}
    catch(error){$('event-error').hidden=false;$('event-error').textContent=w.errorMessage(error);}
  });
  $('confirm-delete').addEventListener('click',()=>{
    const user=w.user();if(!user)return;
    try{calendar.deleteEvent(user.id,deleteId);$('delete-dialog').close();refresh();w.notice('Calendar event deleted. Assignment deadlines are unchanged.');}
    catch(error){$('delete-error').hidden=false;$('delete-error').textContent=w.errorMessage(error);}
  });
  $('add-event').addEventListener('click',()=>openEditor());$('cancel-event').addEventListener('click',()=>$('event-dialog').close());$('cancel-delete').addEventListener('click',()=>$('delete-dialog').close());
  $('prev-month').addEventListener('click',()=>moveMonth(-1));$('next-month').addEventListener('click',()=>moveMonth(1));$('today').addEventListener('click',()=>chooseDate(today(),true));
  $('event-filter').addEventListener('change',render);$('jump-date').addEventListener('change',()=>{if(calendar.validDate($('jump-date').value))chooseDate($('jump-date').value);});
  w.init(refresh);
})();