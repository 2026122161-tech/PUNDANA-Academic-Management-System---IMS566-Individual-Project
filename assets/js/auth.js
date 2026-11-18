/* Browser-only demo authentication. Never use this as a production access boundary. */
window.PundanaAuth = (() => {
  'use strict';
  const USERS = 'pundana.users.v1', SESSION = 'pundana.session.v1';
  const DEMO_ID = 'lecturer-demo', DEMO_LOGIN = 'Lecturer', DEMO_EMAIL = 'lecturer.demo@gmail.com';
  const normal = value => String(value).trim().toLowerCase();
  const readUsers = () => { const value = JSON.parse(localStorage.getItem(USERS) || '[]'); if (!Array.isArray(value)) throw new Error('Account storage is invalid. Reset site data to start again.'); return value; };
  const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  async function digest(password, salt) {
    if (!globalThis.crypto?.subtle) throw new Error('Open this project on localhost to enable password hashing. See README.');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2', salt:new TextEncoder().encode(salt), iterations:100000, hash:'SHA-256'}, key, 256)));
  }
  async function register(data) {
    const fullName = String(data.fullName || '').trim(), studentId = String(data.studentId || '').trim(), email = normal(data.email || '');
    if (fullName.length < 2 || fullName.length > 80) throw new Error('Enter a name between 2 and 80 characters.');
    if (!/^[0-9]{10}$/.test(studentId)) throw new Error('Enter a 10-digit student ID.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Enter a valid email address.');
    if (typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 128 || !/[a-z]/i.test(data.password) || !/[0-9]/.test(data.password)) throw new Error('Use 8–128 characters with at least one letter and one number.');
    if (data.password !== data.confirmPassword) throw new Error('Passwords do not match.');
    if (!data.consent) throw new Error('Please acknowledge the browser demo notice.');
    let users = readUsers();
    if ((email === DEMO_EMAIL || users.some(u => u.studentId === studentId || normal(u.email) === email))) throw new Error('This student ID or email is already registered. Sign in instead.');
    const salt = hex(crypto.getRandomValues(new Uint8Array(16))), passwordHash = await digest(data.password, salt);
    users = readUsers();
    if ((email === DEMO_EMAIL || users.some(u => u.studentId === studentId || normal(u.email) === email))) throw new Error('This student ID or email is already registered.');
    const user = {id:crypto.randomUUID(), fullName, studentId, email, salt, passwordHash, createdAt:new Date().toISOString()};
    localStorage.setItem(USERS, JSON.stringify([...users, user]));
    return {fullName, studentId, email};
  }

  function seedDemoAcademics(academicKey, initialData) {
    const saved = localStorage.getItem(academicKey);
    if (saved === null) {
      localStorage.setItem(academicKey, JSON.stringify(initialData));
      return;
    }
    const data = JSON.parse(saved);
    if (!Array.isArray(data.subjects) || !Array.isArray(data.assignments)) {
      throw Error('Demo academic records could not be read.');
    }
    const updateCourses = initialData.demoCourseRevision && data.demoCourseRevision !== initialData.demoCourseRevision;
    const updateAssignments = initialData.demoAssignmentRevision && data.demoAssignmentRevision !== initialData.demoAssignmentRevision;
    if (!updateCourses && !updateAssignments) return;

    const subjectIds = new Map();
    const aliases = {TFC451:'TMC451', IMS563:'IMS561'};
    for (const course of initialData.subjects) {
      const existing = data.subjects.find(subject => subject.code === course.code)
        || data.subjects.find(subject => subject.code === aliases[course.code])
        || data.subjects.find(subject => subject.id === course.id);
      if (existing) {
        subjectIds.set(course.id, existing.id);
        if (updateCourses) {
          Object.assign(existing, {
            code:course.code, name:course.name, credits:course.credits,
            semester:course.semester
          });
          if (course.lecturer) existing.lecturer = course.lecturer;
        }
      } else {
        data.subjects.push({...course});
        subjectIds.set(course.id, course.id);
      }
    }
    if (updateAssignments) {
      // Replace only the supplied assignments and the original bundled task examples.
      const suppliedIds = new Set(initialData.assignments.map(assignment => assignment.id));
      const examples = {a1:'Website prototype', a2:'Project proposal', a3:'Website presentation'};
      data.assignments = data.assignments.filter(assignment =>
        !suppliedIds.has(assignment.id) && examples[assignment.id] !== assignment.title
      );
      for (const assignment of initialData.assignments) {
        data.assignments.push({...assignment, subjectId:subjectIds.get(assignment.subjectId)});
      }
      for (const assignment of data.assignments) {
        if (['incomplete','incompleted','not completed'].includes(String(assignment.status).toLowerCase())) {
          assignment.status = 'doing';
        }
      }
      data.demoAssignmentRevision = initialData.demoAssignmentRevision;
    }
    if (updateCourses) {
      // Remove the old historical example only when no saved task or class uses it.
      const obsolete = data.subjects.find(subject => subject.id === 's3' && subject.code === 'IMS552');
      if (obsolete && !data.assignments.some(a => a.subjectId === obsolete.id)
          && !(data.classes || []).some(c => c.subjectId === obsolete.id)) {
        data.subjects = data.subjects.filter(subject => subject.id !== obsolete.id);
        data.grades = (data.grades || []).filter(grade => grade.subjectId !== obsolete.id);
      }
      data.demoCourseRevision = initialData.demoCourseRevision;
    }
    localStorage.setItem(academicKey, JSON.stringify(data));
  }

  async function login(identity, password, remember) {
    const identifier = normal(identity);
    let user;
    const lecturerAccount = readUsers().find(entry => entry.id === DEMO_ID);
    if (identifier === normal(DEMO_LOGIN) || (lecturerAccount ? identifier === normal(lecturerAccount.email) : identifier === DEMO_EMAIL)) {
      // Public demonstration credentials. Academic records are seeded only once.
      if (password !== 'Pundana123') throw new Error('Student ID/email or password is incorrect.');
      const snapshot = window.PundanaDemoSnapshot;
      if (!snapshot) throw new Error('Demo data is unavailable. Check that demo-data.js is installed.');
      const account = {...snapshot.profile, id:DEMO_ID, studentId:DEMO_LOGIN, email:DEMO_EMAIL};
      const users = readUsers();
      user = users.find(entry => entry.id === DEMO_ID) || account;
      const academicKey = 'pundana.academics.v1.' + DEMO_ID;
      if (localStorage.getItem(academicKey) === null) seedDemoAcademics(academicKey, snapshot.academics);
      if (user === account) localStorage.setItem(USERS, JSON.stringify([...users, account]));
      else if (!user.lecturerIdentityRevision) {
        // Apply requested identity once; later profile edits remain editable.
        user = {...user, studentId:DEMO_LOGIN, email:DEMO_EMAIL, lecturerIdentityRevision:1};
        if (['PUNDANA Demo Student','PUNDANA Demo','Lecturer Demo'].includes(user.fullName)) user.fullName='Lecturer';
        localStorage.setItem(USERS, JSON.stringify(users.map(entry=>entry.id===DEMO_ID?user:entry)));
      }
      if (user === account) {
        user.lecturerIdentityRevision=1;
        localStorage.setItem(USERS, JSON.stringify([...users,user]));
      }
      const existingData=JSON.parse(localStorage.getItem(academicKey));
      if (!existingData.starterContentRevision) {
        // Fill empty pages once without replacing edited or deleted records on later logins.
        for (const collection of ['classes','grades','histories','events']) {
          if (!Array.isArray(existingData[collection]) || existingData[collection].length===0) {
            existingData[collection]=JSON.parse(JSON.stringify(snapshot.academics[collection]));
          }
        }
        existingData.starterContentRevision=snapshot.academics.starterContentRevision;
        localStorage.setItem(academicKey,JSON.stringify(existingData));
      }
      if (existingData.semesterFocusRevision !== snapshot.academics.semesterFocusRevision) {
        // Move the supplied French subject once, preserving linked classes and grades.
        for (const subject of existingData.subjects) {
          if (subject.code==='TFC451' && String(subject.semester)==='3') subject.semester='4';
        }
        existingData.semesterFocusRevision=snapshot.academics.semesterFocusRevision;
        localStorage.setItem(academicKey,JSON.stringify(existingData));
      }
      if (existingData.timetableRevision !== snapshot.academics.timetableRevision) {
        // Install the requested timetable once; subsequent timetable edits stay saved.
        existingData.classes=snapshot.academics.classes.map(session=>{
          const sourceSubject=snapshot.academics.subjects.find(subject=>subject.id===session.subjectId);
          const savedSubject=existingData.subjects.find(subject=>subject.code===sourceSubject.code);
          if (!savedSubject) throw Error('Add subject '+sourceSubject.code+' before applying the timetable update.');
          return {...session,subjectId:savedSubject.id};
        });
        existingData.timetableRevision=snapshot.academics.timetableRevision;
        localStorage.setItem(academicKey,JSON.stringify(existingData));
      }
    } else {
      user = readUsers().find(entry => entry.studentId === identifier || normal(entry.email) === identifier);
      if (!user || user.id === DEMO_ID || await digest(password, user.salt) !== user.passwordHash) {
        throw new Error('Student ID/email or password is incorrect.');
      }
    }
    const session = JSON.stringify({userId:user.id, expiresAt:Date.now() + (remember ? 7 : 1) * 86400000});
    (remember ? localStorage : sessionStorage).setItem(SESSION, session);
    (remember ? sessionStorage : localStorage).removeItem(SESSION);
    return {fullName:user.fullName};
  }
  function currentUser() {
    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION) || localStorage.getItem(SESSION) || 'null');
      if (!session || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) { logout(); return null; }
      const user = readUsers().find(u => u.id === session.userId);
      return user ? {id:user.id, fullName:user.fullName, studentId:user.studentId, email:user.email,programme:user.programme||'',faculty:user.faculty||'',currentSemester:user.currentSemester||'',createdAt:user.createdAt||'',profileUpdatedAt:user.profileUpdatedAt||''} : null;
    } catch { return null; }
  }
  function logout() { localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION); }

  function updateProfile(input) {
    const current=currentUser();
    if(!current)throw Error('Please sign in again before editing your profile.');
    const fullName=String(input.fullName||'').trim(),email=normal(input.email||'');
    const programme=String(input.programme||'').trim(),faculty=String(input.faculty||'').trim(),currentSemester=String(input.currentSemester||'').trim();
    if(fullName.length<2||fullName.length>80)throw Error('Enter a name between 2 and 80 characters.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw Error('Enter a valid email address.');
    if(programme.length>120||faculty.length>120||currentSemester.length>40)throw Error('Programme and faculty may have up to 120 characters; semester up to 40.');

    const users=readUsers(),index=users.findIndex(u=>u.id===current.id);
    if(index<0)throw Error('This account no longer exists. Please sign in again.');
    if((current.id!==DEMO_ID&&email===DEMO_EMAIL)||users.some(u=>u.id!==current.id&&normal(u.email)===email))throw Error('This email is already used by another demo account.');
    users[index]={...users[index],fullName,email,programme,faculty,currentSemester,profileUpdatedAt:new Date().toISOString()};
    localStorage.setItem(USERS,JSON.stringify(users));
    return currentUser();
  }
  return {register, login, currentUser, logout, updateProfile};
})();