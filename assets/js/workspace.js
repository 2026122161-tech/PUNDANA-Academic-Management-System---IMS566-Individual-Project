/* Shared signed-in workspace behavior for the new modules. */
window.PundanaWorkspace = (() => {
  'use strict';
  const $=id=>document.getElementById(id);
  let owner=null,refreshPage=()=>{};
  function user() {
    const current=window.PundanaAuth.currentUser();
    if(!current) {$('protected-content').hidden=true;location.replace('index.html');return null;}
    if(owner && owner!==current.id) {location.reload();return null;}
    owner=current.id;
    $('protected-content').hidden=false;
    $('sidebar-name').textContent=current.fullName;
    $('account-id').textContent=current.studentId;
    $('avatar').textContent=current.fullName.trim().charAt(0).toUpperCase();
    $('today-date').textContent=new Date().toLocaleDateString('en-MY',{day:'numeric',month:'short',year:'numeric'});
    return current;
  }
  function notice(message,error=false) {
    $('notice').hidden=false;$('notice').textContent=message;$('notice').className=error?'error':'';
  }
  function errorMessage(error) {
    if(error.name==='QuotaExceededError')return 'Browser storage is full. Your change was not saved.';
    if(error.name==='SecurityError')return 'Allow browser storage to save your records.';
    return error.message;
  }
  function node(tag,value='',className='') {const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;return el;}
  function options(select,items,placeholder) {
    const current=select.value;select.replaceChildren();
    if(placeholder!==undefined)select.add(new Option(placeholder,''));
    for(const [value,label]of items)select.add(new Option(label,value));
    if(items.some(([value])=>value===current))select.value=current;
  }
  function init(refresh) {
    refreshPage=refresh;
    $('logout').addEventListener('click',()=>{try{window.PundanaAuth.logout();}finally{$('protected-content').hidden=true;location.replace('index.html');}});
    $('menu-toggle').addEventListener('click',()=>{const open=$('sidebar').classList.toggle('open');$('menu-toggle').setAttribute('aria-expanded',String(open));});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){$('sidebar').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');}});
    const descriptions={'Academic Calendar':'See assignment deadlines alongside your own academic events.','Student Profile':'Manage your personal and academic information.'};
    document.querySelectorAll('[data-module]').forEach(button=>button.addEventListener('click',()=>{if(!user())return;$('module-title').textContent=button.dataset.module;$('module-description').textContent=descriptions[button.dataset.module];$('module-dialog').showModal();}));
    ['dialog-close','dialog-done'].forEach(id=>$(id).addEventListener('click',()=>$('module-dialog').close()));
    // Focus changes check sign-in only; storage/visibility events refresh records.
    // Keeping ordinary focus changes free of re-rendering preserves draft form entries.
    window.addEventListener('focus',user);
    ['pageshow','storage'].forEach(event=>window.addEventListener(event,refreshPage));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshPage();});
    setInterval(()=>{if(!document.hidden)user();},60000);
    refreshPage();
  }
  return {$,user,notice,errorMessage,node,options,init};
})();