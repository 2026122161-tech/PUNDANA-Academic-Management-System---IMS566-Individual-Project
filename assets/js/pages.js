'use strict';
(() => {
  const auth = window.PundanaAuth;
  const feedback = document.getElementById('feedback');
  const show = (message, success = false) => { feedback.hidden = false; feedback.className = success ? 'success' : ''; feedback.textContent = message; feedback.setAttribute('tabindex', '-1'); feedback.focus(); };
  document.querySelectorAll('[data-toggle]').forEach(button => button.addEventListener('click', () => {
    const field = document.getElementById(button.dataset.toggle), visible = field.type === 'password';
    field.type = visible ? 'text' : 'password'; button.textContent = visible ? 'Hide' : 'Show'; button.setAttribute('aria-pressed', String(visible)); button.setAttribute('aria-label', (visible ? 'Hide ' : 'Show ') + (field.id === 'confirmPassword' ? 'confirm password' : 'password'));
  }));
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  if (loginForm && new URLSearchParams(location.search).has('registered')) show('Account created. Sign in with your student ID or email.', true);
  function bind(form, task) {
    form?.addEventListener('submit', async event => {
      event.preventDefault(); if (!form.reportValidity()) return;
      const button = form.querySelector('[type=submit]'); button.disabled = true; form.setAttribute('aria-busy', 'true');
      try { await task(); } catch (error) { show(error.name === 'QuotaExceededError' || error.name === 'SecurityError' ? 'Browser storage is unavailable. Allow site storage or use a regular browser window.' : error instanceof SyntaxError ? 'Saved account data is damaged. See README to reset demo data.' : error.message); }
      finally { button.disabled = false; form.removeAttribute('aria-busy'); }
    });
  }
  bind(registerForm, async () => {
    const values = Object.fromEntries(new FormData(registerForm)); values.consent = document.getElementById('consent').checked;
    await auth.register(values); location.href = 'index.html?registered=1';
  });
  bind(loginForm, async () => { await auth.login(document.getElementById('identity').value, document.getElementById('password').value, document.getElementById('remember').checked); location.href = 'dashboard.html'; });
})();
