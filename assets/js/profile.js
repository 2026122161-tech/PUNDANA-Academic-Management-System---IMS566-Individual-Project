'use strict';
(() => {
  const w=window.PundanaWorkspace,{$,node}=w;
  const dateLabel=value=>{const date=value?new Date(value):null;return date&&!Number.isNaN(date.getTime())?date.toLocaleDateString('en-MY',{day:'numeric',month:'long',year:'numeric'}):'Not recorded';};
  function refresh() {
    const user=w.user();if(!user)return;
    $('profile-name').textContent=user.fullName;$('profile-student-id').textContent='Student ID · '+user.studentId;
    $('profile-initials').textContent=user.fullName.trim().split(/\s+/).filter(Boolean).slice(0,2).map(part=>part.charAt(0)).join('').toUpperCase();
    for(const [id,value]of Object.entries({'view-name':user.fullName,'view-student-id':user.studentId,'view-email':user.email,'view-created':dateLabel(user.createdAt),'view-updated':dateLabel(user.profileUpdatedAt),'view-programme':user.programme||'Not added yet','view-faculty':user.faculty||'Not added yet','view-semester':user.currentSemester||'Not added yet'}))$(id).textContent=value;
    $('stats').replaceChildren();
    try {
      const data=window.PundanaData.load(user.id);
      const stats=window.PundanaData.summarize(data);
      for(const [value,label]of [[stats.subjects,'Saved subjects'],[stats.credits,'Total credit hours'],[stats.total,'Tracked assignments'],[data.classes.length,'Weekly class sessions']]){const card=node('article');card.append(node('strong',value),node('span',label));$('stats').append(card);}
    }catch(error){w.notice('Your profile is available, but academic totals could not be read. '+w.errorMessage(error),true);}
  }
  $('edit-profile').addEventListener('click',()=>{
    const user=w.user();if(!user)return;
    $('profile-error').hidden=true;
    for(const key of ['fullName','email','programme','faculty','currentSemester'])$(key).value=user[key]||'';
    $('profile-dialog').showModal();
  });
  $('cancel-profile').addEventListener('click',()=>$('profile-dialog').close());
  $('profile-form').addEventListener('submit',event=>{
    event.preventDefault();if(!w.user())return;
    try {window.PundanaAuth.updateProfile(Object.fromEntries(new FormData(event.currentTarget)));$('profile-dialog').close();refresh();w.notice('Profile saved. Use your updated email or existing student ID when signing in.');}
    catch(error){$('profile-error').hidden=false;$('profile-error').textContent=w.errorMessage(error);}
  });
  w.init(refresh);
})();