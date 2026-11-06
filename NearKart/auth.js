/* ============================================================
   auth.js  -  login.html and signup.html
   Customer / Owner tabs, create account, login, redirect
   ============================================================ */
(function () {
  var loginForm = document.getElementById('loginForm');
  var signupForm = document.getElementById('signupForm');
  var form = loginForm || signupForm;
  if (!form) return;

  var params = new URLSearchParams(location.search);
  var role = params.get('role') === 'owner' ? 'owner' : 'customer';
  var next = NK.safeNext(params.get('next'));

  var tabs = document.querySelectorAll('.role-tabs button');
  var title = document.getElementById('authTitle');
  var errBox = document.getElementById('authError');
  var switchLink = document.getElementById('switchLink');

  function qs() {
    return '?role=' + role + (next ? '&next=' + encodeURIComponent(next) : '');
  }

  function paint() {
    tabs.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-role') === role); });
    var label = role === 'owner' ? 'Shop Owner' : 'Customer';
    title.textContent = label + (loginForm ? ' Login' : ' Sign Up');
    switchLink.href = (loginForm ? 'signup.html' : 'login.html') + qs();
    errBox.textContent = '';
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      role = t.getAttribute('data-role');
      paint();
    });
  });

  function finish(user) {
    NK.write(NK.K.session, { id: user.id, name: user.name, email: user.email, role: user.role });
    location.href = next || (user.role === 'owner' ? 'owner.html' : 'index.html');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errBox.textContent = '';
    var f = form.elements;
    var users = NK.read(NK.K.users, []);
    var email = f.email.value.trim().toLowerCase();

    if (loginForm) {
      var sameEmail = users.filter(function (u) { return u.email === email; });
      var u = sameEmail.filter(function (x) { return x.role === role; })[0];
      if (!u && sameEmail.length) {
        errBox.textContent = 'This email is registered as a ' +
          (sameEmail[0].role === 'owner' ? 'Shop Owner' : 'Customer') + '. Switch the tab above.';
        return;
      }
      if (!u || u.pass !== NK.hash(f.password.value)) {
        errBox.textContent = 'Wrong email or password.';
        return;
      }
      finish(u);
      return;
    }

    /* ---- sign up ---- */
    var name = f.fullName.value.trim();
    var phone = f.phone.value.replace(/\s+/g, '');
    if (name.length < 2) { errBox.textContent = 'Please enter your name.'; return; }
    if (!/^[0-9]{10}$/.test(phone)) { errBox.textContent = 'Phone number must be 10 digits.'; return; }
    if (f.password.value.length < 6) { errBox.textContent = 'Password must be at least 6 characters.'; return; }
    if (f.password.value !== f.confirm.value) { errBox.textContent = 'Passwords do not match.'; return; }
    if (users.some(function (x) { return x.email === email; })) {
      errBox.textContent = 'This email is already registered. Please login.';
      return;
    }

    var user = {
      id: NK.uid('u'), name: name, email: email, phone: phone,
      role: role, pass: NK.hash(f.password.value)
    };
    users.push(user);
    if (!NK.write(NK.K.users, users)) {
      errBox.textContent = 'Could not save your account in this browser.';
      return;
    }
    finish(user);
  });

  paint();
})();