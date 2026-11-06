/* ============================================================
   app.js  -  shared code used by EVERY page
   - storage helpers, login session, cart, location
   - draws header, category bar, footer, location popup
   ============================================================ */
(function () {
  var NK = (window.NK = {});

  var K = {
    users: 'nk_users',
    session: 'nk_session',
    shops: 'nk_shops',
    cart: 'nk_cart',
    orders: 'nk_orders',
    loc: 'nk_location'
  };
  NK.K = K;

  /* ---------- storage ---------- */
  NK.read = function (key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v === null || v === undefined ? fallback : v;
    } catch (e) { return fallback; }
  };
  NK.write = function (key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  };

  /* ---------- small helpers ---------- */
  NK.el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  NK.uid = function (p) {
    return p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  };
  NK.money = function (n) { return '₹' + Number(n).toLocaleString('en-IN'); };
  NK.initials = function (name) {
    var w = String(name || '').trim().split(/\s+/).slice(0, 2);
    var s = w.map(function (x) { return x.charAt(0).toUpperCase(); }).join('');
    return s || '?';
  };
  /* DEMO hash only. Real sites must hash passwords on a server. */
  NK.hash = function (s) {
    var h = 5381;
    s = 'nk$' + s;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; }
    return String(h);
  };
  NK.toast = function (msg) {
    var t = NK.el('div', 'toast', msg);
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.remove(); }, 2800);
  };

  /* ---------- session / login ---------- */
  NK.session = function () { return NK.read(K.session, null); };
  NK.logout = function () {
    try { localStorage.removeItem(K.session); } catch (e) {}
    location.href = 'index.html';
  };
  NK.safeNext = function (n) {
    return n && /^[A-Za-z0-9_-]+\.html(\?[A-Za-z0-9_=&%.-]*)?$/.test(n) ? n : '';
  };
  NK.requireLogin = function (role) {
    var s = NK.session();
    if (!s || (role && s.role !== role)) {
      var page = location.pathname.split('/').pop() || 'index.html';
      location.href = 'login.html?role=' + (role || 'customer') +
        '&next=' + encodeURIComponent(page + location.search);
      return false;
    }
    return true;
  };

  /* ---------- categories ---------- */
  NK.allCategories = function () { return NK_CATEGORIES.concat(NK_EXTRA_CATEGORIES); };
  NK.categoryIcon = function (name) {
    var all = NK.allCategories();
    for (var i = 0; i < all.length; i++) { if (all[i].name === name) return all[i].icon; }
    return '🛍️';
  };

  /* ---------- shops ---------- */
  NK.customShops = function () { return NK.read(K.shops, []); };
  NK.saveCustomShops = function (a) { return NK.write(K.shops, a); };
  NK.allShops = function () { return NK.customShops().concat(NK_SAMPLE_SHOPS); };
  NK.getShop = function (id) {
    var a = NK.allShops();
    for (var i = 0; i < a.length; i++) { if (a[i].id === id) return a[i]; }
    return null;
  };

  /* ---------- cart ---------- */
  NK.cart = function () { return NK.read(K.cart, []); };
  NK.cartCount = function () {
    return NK.cart().reduce(function (n, c) { return n + c.qty; }, 0);
  };
  NK.updateBadge = function () {
    var b = document.getElementById('cartBadge');
    if (b) b.textContent = NK.cartCount();
  };
  NK.saveCart = function (c) { NK.write(K.cart, c); NK.updateBadge(); };
  NK.addToCart = function (shopId, productId) {
    var c = NK.cart(), found = false;
    c.forEach(function (x) {
      if (x.shopId === shopId && x.productId === productId) { x.qty++; found = true; }
    });
    if (!found) c.push({ shopId: shopId, productId: productId, qty: 1 });
    NK.saveCart(c);
  };

  /* ---------- location ---------- */
  NK.location = function () {
    return NK.read(K.loc, { city: 'Palghar', state: 'Maharashtra', label: 'Palghar, Maharashtra' });
  };
  NK.shopInLocation = function (shop, loc) {
    if (!shop.city) return false;
    return String(loc.label || '').toLowerCase().indexOf(String(shop.city).toLowerCase()) !== -1;
  };

  /* ============================================================
     LAYOUT: header
     ============================================================ */
  function menuLink(href, text) {
    var a = NK.el('a', '', text);
    a.href = href;
    return a;
  }

  function renderHeader() {
    var host = document.getElementById('site-header');
    if (!host) return;

    host.innerHTML =
      '<header class="topbar card">' +
        '<a href="index.html" class="logo"><span class="logo-icon">🛍️</span><span class="logo-text">Near<b>Kart</b></span></a>' +
        '<span class="divider"></span>' +
        '<div class="dd-wrap">' +
          '<button type="button" class="pill category-btn" id="catBtn">▦ Product<br>Category ⌄</button>' +
          '<div class="dropdown" id="catMenu" hidden></div>' +
        '</div>' +
        '<form class="search pill" id="searchForm"><span>🔍</span><input type="text" id="searchInput" placeholder="Search NearKart..."></form>' +
        '<div class="auth-area" id="authArea"></div>' +
        '<span class="divider"></span>' +
        '<a href="orders.html" class="orders">📋 <span>Your<br>Orders</span></a>' +
        '<span class="divider"></span>' +
        '<a href="cart.html" class="cart">🛒<em id="cartBadge">0</em><span>Cart</span></a>' +
      '</header>';

    /* category dropdown */
    var catMenu = document.getElementById('catMenu');
    catMenu.appendChild(menuLink('index.html', '▦ All stores'));
    NK.allCategories().forEach(function (c) {
      catMenu.appendChild(menuLink('index.html?cat=' + encodeURIComponent(c.name), c.icon + ' ' + c.name));
    });
    document.getElementById('catBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu(catMenu);
    });

    /* search */
    document.getElementById('searchForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = document.getElementById('searchInput').value.trim();
      location.href = v ? 'index.html?q=' + encodeURIComponent(v) : 'index.html';
    });

    /* login area */
    var area = document.getElementById('authArea');
    var s = NK.session();
    if (s) {
      area.appendChild(NK.el('span', 'hello', '👤 Hi, ' + String(s.name).split(' ')[0]));
      if (s.role === 'owner') {
        var dash = NK.el('a', 'btn-outline', '🏪 Dashboard');
        dash.href = 'owner.html';
        area.appendChild(dash);
      }
      var out = NK.el('button', 'btn-outline', 'Logout');
      out.type = 'button';
      out.addEventListener('click', NK.logout);
      area.appendChild(out);
    } else {
      area.innerHTML =
        '<a href="login.html?role=customer" class="btn-outline">👤 <span>Login / Sign Up<small>(Customer)</small></span></a>' +
        '<a href="login.html?role=owner" class="btn-outline">🏪 <span>Login / Sign Up<small>(Owner)</small></span></a>';
    }
  }

  function toggleMenu(menu) {
    var open = menu.hidden;
    closeMenus();
    menu.hidden = !open;
  }
  function closeMenus() {
    var m = document.querySelectorAll('.dropdown');
    for (var i = 0; i < m.length; i++) m[i].hidden = true;
  }

  /* ============================================================
     LAYOUT: category bar + location popup
     ============================================================ */
  function locText() {
    var l = NK.location();
    return l.city || l.label;
  }

  function renderCatbar() {
    var host = document.getElementById('site-catbar');
    if (!host) return;

    host.innerHTML =
      '<nav class="catbar card">' +
        '<a class="all-btn" href="index.html">▦ All</a>' +
        '<button type="button" class="location" id="locBtn">📍 <span id="locLabel"></span> ⌄</button>' +
        '<span class="divider"></span>' +
        '<ul id="catList"></ul>' +
        '<span class="divider"></span>' +
        '<div class="dd-wrap">' +
          '<button type="button" class="more" id="moreBtn"><b>•••</b>More</button>' +
          '<div class="dropdown right" id="moreMenu" hidden></div>' +
        '</div>' +
      '</nav>';

    document.getElementById('locLabel').textContent = locText();

    var ul = document.getElementById('catList');
    NK_CATEGORIES.forEach(function (c) {
      var li = document.createElement('li');
      var a = NK.el('a');
      a.href = 'index.html?cat=' + encodeURIComponent(c.name);
      a.appendChild(NK.el('i', '', c.icon));
      a.appendChild(document.createTextNode(c.name));
      li.appendChild(a);
      ul.appendChild(li);
    });

    var more = document.getElementById('moreMenu');
    NK_EXTRA_CATEGORIES.forEach(function (c) {
      more.appendChild(menuLink('index.html?cat=' + encodeURIComponent(c.name), c.icon + ' ' + c.name));
    });
    document.getElementById('moreBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu(more);
    });

    buildLocationModal();
    document.getElementById('locBtn').addEventListener('click', openLoc);
  }

  function buildLocationModal() {
    var m = NK.el('div', 'modal');
    m.id = 'locModal';
    m.hidden = true;
    m.innerHTML =
      '<div class="modal-box" role="dialog" aria-modal="true">' +
        '<button type="button" class="modal-close" data-close-modal aria-label="Close">✕</button>' +
        '<h2>📍 Choose Your Location</h2>' +
        '<p class="modal-sub">Select your city, use GPS, or type your full address.</p>' +
        '<button type="button" class="btn-submit full" id="useGps">🎯 Use my current location</button>' +
        '<input type="text" class="loc-search" id="locSearch" placeholder="Search city or state...">' +
        '<div class="loc-list" id="locList"></div>' +
        '<form class="loc-custom" id="locCustomForm">' +
          '<input type="text" id="locCustom" maxlength="120" placeholder="Or type area / full address / pincode">' +
          '<button type="submit" class="btn-submit">Save</button>' +
        '</form>' +
        '<p class="form-error" id="locError"></p>' +
      '</div>';
    document.body.appendChild(m);

    document.getElementById('locSearch').addEventListener('input', function (e) {
      renderLocList(e.target.value);
    });
    document.getElementById('useGps').addEventListener('click', useGps);
    document.getElementById('locCustomForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = document.getElementById('locCustom').value.trim();
      if (v.length < 3) {
        document.getElementById('locError').textContent = 'Please type a valid address.';
        return;
      }
      setLocation({ city: '', state: '', label: v });
    });
  }

  function openLoc() {
    document.getElementById('locError').textContent = '';
    document.getElementById('locSearch').value = '';
    renderLocList('');
    document.getElementById('locModal').hidden = false;
    document.body.classList.add('modal-open');
  }
  function closeModals() {
    var m = document.querySelectorAll('.modal');
    for (var i = 0; i < m.length; i++) m[i].hidden = true;
    document.body.classList.remove('modal-open');
  }

  function renderLocList(filter) {
    var box = document.getElementById('locList');
    var f = (filter || '').toLowerCase();
    var cur = NK.location();
    var any = false;
    box.innerHTML = '';

    Object.keys(NK_LOCATIONS).forEach(function (state) {
      var cities = NK_LOCATIONS[state].filter(function (c) {
        return !f || c.toLowerCase().indexOf(f) !== -1 || state.toLowerCase().indexOf(f) !== -1;
      });
      if (!cities.length) return;
      any = true;
      box.appendChild(NK.el('div', 'loc-state', state));
      var wrap = NK.el('div');
      cities.forEach(function (c) {
        var b = NK.el('button', 'loc-chip' + (cur.city === c ? ' active' : ''), c);
        b.type = 'button';
        b.addEventListener('click', function () {
          setLocation({ city: c, state: state, label: c + ', ' + state });
        });
        wrap.appendChild(b);
      });
      box.appendChild(wrap);
    });

    if (!any) box.appendChild(NK.el('p', 'modal-sub', 'No match found. Type your full address below.'));
  }

  function setLocation(loc) {
    NK.write(K.loc, loc);
    var l = document.getElementById('locLabel');
    if (l) l.textContent = locText();
    closeModals();
    NK.toast('Location set: ' + loc.label);
    document.dispatchEvent(new CustomEvent('nk:locationchange'));
  }

  function useGps() {
    var err = document.getElementById('locError');
    if (!navigator.geolocation) {
      err.textContent = 'Location is not supported in this browser.';
      return;
    }
    err.textContent = 'Detecting your location...';
    navigator.geolocation.getCurrentPosition(function (pos) {
      var url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=' +
        pos.coords.latitude + '&lon=' + pos.coords.longitude;
      fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var a = d.address || {};
          var city = a.city || a.town || a.village || a.county || a.state_district || '';
          var parts = [a.suburb || a.neighbourhood, city, a.state].filter(Boolean);
          setLocation({ city: city, state: a.state || '', label: parts.join(', ') || d.display_name || 'My location' });
        })
        .catch(function () {
          err.textContent = 'Could not get your address. Please choose a city or type it below.';
        });
    }, function () {
      err.textContent = 'Location permission denied. Please choose a city or type it below.';
    });
  }

  /* ============================================================
     LAYOUT: footer
     ============================================================ */
  function renderFooter() {
    var host = document.getElementById('site-footer');
    if (!host) return;

    host.innerHTML =
      '<footer class="footer">' +
        '<div class="footer-top">' +
          '<div class="footer-brand">' +
            '<a href="index.html" class="logo"><span class="logo-icon">🛍️</span><span class="logo-text">Near<b>Kart</b></span></a>' +
            '<p>Shop from trusted local stores near you. Fast delivery, verified sellers, best prices.</p>' +
            '<div class="socials"><a href="#" aria-label="Facebook">f</a><a href="#" aria-label="Instagram">◎</a><a href="#" aria-label="X">𝕏</a><a href="#" aria-label="YouTube">▶</a></div>' +
          '</div>' +
          '<div class="footer-col"><h4>Shop</h4><ul>' +
            '<li><a href="index.html?cat=Food">Food</a></li>' +
            '<li><a href="index.html?cat=Electronics">Electronics</a></li>' +
            '<li><a href="index.html?cat=Fashion">Fashion</a></li>' +
            '<li><a href="index.html?cat=Beauty">Beauty</a></li>' +
            '<li><a href="index.html?cat=Home%20%26%20Living">Home &amp; Living</a></li>' +
          '</ul></div>' +
          '<div class="footer-col"><h4>For Sellers</h4><ul>' +
            '<li><a href="login.html?role=owner">Owner Login</a></li>' +
            '<li><a href="signup.html?role=owner">Register Your Store</a></li>' +
            '<li><a href="owner.html">Seller Dashboard</a></li>' +
          '</ul></div>' +
          '<div class="footer-col"><h4>Help</h4><ul>' +
            '<li><a href="orders.html">Your Orders</a></li>' +
            '<li><a href="orders.html">Track Order</a></li>' +
            '<li><a href="cart.html">Your Cart</a></li>' +
            '<li><a href="#">Contact Us</a></li>' +
          '</ul></div>' +
          '<div class="footer-col"><h4>Get Updates</h4>' +
            '<form class="newsletter" id="newsForm"><input type="email" placeholder="Your email" required><button type="submit">Subscribe</button></form>' +
            '<p class="contact">📞 +91 00000 00000<br>✉️ support@example.com</p>' +
          '</div>' +
        '</div>' +
        '<div class="footer-bottom"><p>© 2026 NearKart. All rights reserved.</p>' +
          '<ul><li><a href="#">Privacy Policy</a></li><li><a href="#">Terms of Use</a></li><li><a href="#">Cookie Policy</a></li></ul>' +
        '</div>' +
      '</footer>';

    document.getElementById('newsForm').addEventListener('submit', function (e) {
      e.preventDefault();
      e.target.reset();
      NK.toast('Thanks for subscribing!');
    });
  }

  /* ---------- global click / key handlers ---------- */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.dd-wrap')) closeMenus();
    if (e.target.closest('[data-close-modal]') || (e.target.classList && e.target.classList.contains('modal'))) {
      closeModals();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModals(); closeMenus(); }
  });

  /* ============================================================
     SHOP LOGO + BANNER CARD
     used on the home page, and as the live preview in owner.html
     shop fields used: logo, image (banner), bannerTitle, bannerSub,
     btnText, bg1, bg2, textColor, btnColor, font, color
     ============================================================ */
  NK.textOn = function (hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    if (isNaN(r + g + b)) return '#fff';
    return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111' : '#fff';
  };

  NK.buildLogo = function (shop) {
    var logo = NK.el('div', 'store-logo');
    if (shop.logo) {
      var i = NK.el('img');
      i.src = shop.logo;
      i.alt = shop.name + ' logo';
      logo.appendChild(i);
      logo.classList.add('has-img');
    } else {
      logo.textContent = NK.initials(shop.name);
      logo.style.background = shop.color || '#5b21f5';
    }
    return logo;
  };

  NK.buildStoreCard = function (shop, preview) {
    var card = NK.el('section', 'store custom card');
    card.style.setProperty('--accent', shop.color || '#5b21f5');

    /* middle: name, owner, rating */
    var info = NK.el('div', 'store-info');
    var h2 = NK.el('h2', '', shop.name + ' ');
    h2.appendChild(shop.sample ? NK.el('span', 'verified', '✔') : NK.el('span', 'new-tag', 'NEW'));
    info.appendChild(h2);
    info.appendChild(NK.el('p', '', '👤 ' + shop.owner));
    info.appendChild(NK.el('p', 'meta',
      '📍 ' + shop.city + ' · ' + shop.category + ' · ' + (shop.products || []).length + ' items'));
    info.appendChild(document.createElement('hr'));
    var rating = NK.el('p', 'rating');
    if (shop.rating) {
      rating.appendChild(NK.el('span', '', '★'));
      rating.appendChild(document.createTextNode(' ' + shop.rating + ' (sample)'));
    } else {
      rating.textContent = 'No reviews yet';
    }
    info.appendChild(rating);

    /* right: banner */
    var art = NK.el('div', 'store-art banner-art');
    if (shop.bg1 && shop.bg2) art.style.background = 'linear-gradient(90deg,' + shop.bg1 + ',' + shop.bg2 + ')';
    art.style.color = shop.textColor || '#fff';

    var imgBox = NK.el('div', 'banner-img');
    if (shop.image) {
      var img = NK.el('img');
      img.src = shop.image;
      img.alt = shop.name;
      imgBox.appendChild(img);
    } else {
      imgBox.appendChild(NK.el('div', 'banner-ph', NK.categoryIcon(shop.category)));
    }

    var promo = NK.el('div', 'promo font-' + (shop.font || 'sans'));
    promo.appendChild(NK.el('h3', '', shop.bannerTitle || shop.tagline || 'Welcome to ' + shop.name));
    if (shop.bannerSub) promo.appendChild(NK.el('p', 'promo-sub', shop.bannerSub));
    var btnBg = shop.btnColor || '#ffffff';
    var btn = NK.el('a', 'shop', (shop.btnText || 'Shop Now') + ' →');
    btn.style.background = btnBg;
    btn.style.color = NK.textOn(btnBg);
    btn.href = preview ? '#' : 'shop.html?id=' + encodeURIComponent(shop.id);
    promo.appendChild(btn);

    art.appendChild(imgBox);
    art.appendChild(promo);

    card.appendChild(NK.buildLogo(shop));
    card.appendChild(info);
    card.appendChild(art);

    if (preview) {
      card.addEventListener('click', function (e) { e.preventDefault(); });
    } else {
      card.style.cursor = 'pointer';
      card.addEventListener('click', function (e) {
        if (!e.target.closest('a')) location.href = btn.href;
      });
    }
    return card;
  };

  /* ---------- start ---------- */
  renderHeader();
  renderCatbar();
  renderFooter();
  NK.updateBadge();
})();