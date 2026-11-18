/* Timetable and performance rules. Existing account and academic keys stay unchanged. */
window.PundanaTools = (() => {
  'use strict';
  const store = window.PundanaData;
  // UiTM CEEE210 student handbook, Table 5.1 (page 24). See docs/grade-reference.md.
  const gradePoints = Object.freeze({'A+':4, A:4, 'A-':3.67, 'B+':3.33, B:3, 'B-':2.67, 'C+':2.33, C:2, 'C-':1.67, 'D+':1.33, D:1, E:0.67, F:0});
  const semesterOf = subject => (subject?.semester || '').trim() || 'Unspecified';
  const semesterKey = value => String(value).trim().toLowerCase();
  const timeValid = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  function read(userId) {
    const data = store.load(userId);
    if (data.grades === undefined) data.grades = [];
    if (data.histories === undefined) data.histories = [];
    if (!Array.isArray(data.grades) || !data.grades.every(g => g && typeof g.subjectId === 'string' && Object.hasOwn(gradePoints,g.grade)) || new Set(data.grades.map(g=>g.subjectId)).size !== data.grades.length) throw Error('Saved grades have an unsupported format. Your records have not been changed.');
    if (!Array.isArray(data.histories) || !data.histories.every(h => h && typeof h.semester === 'string' && Number.isFinite(h.previousCGPA) && h.previousCGPA>=0 && h.previousCGPA<=4 && Number.isInteger(h.previousCredits) && h.previousCredits>=0 && h.previousCredits<=1000)) throw Error('Saved academic history has an unsupported format. Your records have not been changed.');
    return data;
  }
  function mutate(userId, update) {
    if (!userId) throw Error('Please sign in again.');
    const data = read(userId);
    update(data);
    localStorage.setItem('pundana.academics.v1.'+userId,JSON.stringify(data));
  }
  function saveClass(userId,input,id) {
    mutate(userId,data=>{
      const subjectId=String(input.subjectId||''),day=Number(input.day),start=String(input.start||''),end=String(input.end||''),room=String(input.room||'').trim();
      const subject=data.subjects.find(s=>s.id===subjectId);
      if (!subject || String(input.day).trim()==='' || !Number.isInteger(day) || day<0 || day>6 || !timeValid(start) || !timeValid(end) || start>=end || !room || room.length>100) throw Error('Choose an enrolled subject, day, start/end times and a location. End time must be later than start time.');
      const conflict=data.classes.find(c=>c.id!==id && c.day===day && start<c.end && end>c.start && semesterKey(semesterOf(data.subjects.find(s=>s.id===c.subjectId)))===semesterKey(semesterOf(subject)));
      if (conflict) {
        const code=data.subjects.find(s=>s.id===conflict.subjectId)?.code||'another subject';
        throw Error('Schedule conflict with '+code+' ('+conflict.start+'–'+conflict.end+'). Choose a different time.');
      }
      const item={id:id||crypto.randomUUID(),subjectId,day,start,end,room};
      if (id) { const index=data.classes.findIndex(c=>c.id===id); if(index<0)throw Error('This class no longer exists. Refresh the page.'); data.classes[index]={...data.classes[index],...item}; }
      else data.classes.push(item);
    });
  }
  function deleteClass(userId,id) {mutate(userId,data=>{data.classes=data.classes.filter(c=>c.id!==id);});}
  function saveGrade(userId,subjectId,grade) {
    mutate(userId,data=>{
      if(!data.subjects.some(s=>s.id===subjectId))throw Error('This subject no longer exists. Refresh the page.');
      if(grade!==''&&!Object.hasOwn(gradePoints,grade))throw Error('Choose a valid grade.');
      data.grades=data.grades.filter(g=>g.subjectId!==subjectId);
      if(grade!=='')data.grades.push({subjectId,grade});
    });
  }
  function saveHistory(userId,semester,input) {
    mutate(userId,data=>{
      const previousCGPA=Number(input.previousCGPA),previousCredits=Number(input.previousCredits);
      if(!data.subjects.some(s=>semesterOf(s)===semester))throw Error('Choose a semester with enrolled subjects.');
      if(String(input.previousCGPA).trim()==='' || String(input.previousCredits).trim()==='' || !Number.isFinite(previousCGPA) || previousCGPA<0 || previousCGPA>4 || !Number.isInteger(previousCredits) || previousCredits<0 || previousCredits>1000 || (previousCredits===0 && previousCGPA!==0))throw Error('Enter previous CGPA from 0 to 4 and 0–1,000 whole GPA credit hours. For your first semester enter 0 for both.');
      data.histories=data.histories.filter(h=>h.semester!==semester);
      data.histories.push({semester,previousCGPA,previousCredits});
    });
  }
  function performance(data,semester) {
    const subjects=data.subjects.filter(s=>semesterOf(s)===semester);
    const grades=data.grades||[];
    let credits=0,qualityPoints=0,count=0;
    for(const subject of subjects) {
      const record=grades.find(g=>g.subjectId===subject.id);
      if(record && Object.hasOwn(gradePoints,record.grade)) {credits+=subject.credits;qualityPoints+=subject.credits*gradePoints[record.grade];count++;}
    }
    const history=(data.histories||[]).find(h=>h.semester===semester)||null;
    const gpa=credits>0?qualityPoints/credits:null;
    const totalCredits=credits+(history?.previousCredits||0);
    const cgpa=history && totalCredits>0?(qualityPoints+history.previousCGPA*history.previousCredits)/totalCredits:null;
    return {subjects,count,credits,qualityPoints,gpa,cgpa,history,totalCredits,complete:subjects.length>0&&count===subjects.length};
  }
  return {read,saveClass,deleteClass,saveGrade,saveHistory,performance,gradePoints,semesterOf};
})();