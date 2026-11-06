/* ============================================================
   owner.js  -  owner.html : owner dashboard
   Add / edit shop (logo + banner design with live preview),
   add / delete products, delete shop
   ============================================================ */
(function () {
  if (document.body.getAttribute('data-page') !== 'owner') return;
  if (!NK.requireLogin('owner')) return;

  var session = NK.session();
  var form = document.getElementById('addShopForm');
  var errBox = document.getElementById('shopError');
  var listBox = document.getElementById('myShops');
  var previewBox = document.getElementById('bannerPreview');
  var formTitle = document.getElementById('formTitle');
  var submitBtn = document.getElementById('submitBtn');
  var cancelEdit = document.getElementById('cancelEdit');

  var logoData = '';
  var bannerData = '';
  var editingId = null;

  document.getElementById('ownerGreeting').textContent =
    'Welcome, ' + session.name + '. Add your shop, design your banner and add products.';

  /* ---------- category select + city suggestions ---------- */
  NK.allCategories().forEach(function (c) {
    var o = NK.el('option', '', c.icon + ' ' + c.name);
    o.value = c.name;
    form.elements.category.appendChild(o);
  });
  var dl = document.getElementById('cityList');
  Object.keys(NK_LOCATIONS).forEach(function (st) {
    NK_LOCATIONS[st].forEach(function (c) {
      var o = document.createElement('option');
      o.value = c;
      dl.appendChild(o);
    });
  });

  /* ---------- quick colour styles ---------- */
  var PRESETS = [
    { name: 'Warm Cream', bg1: '#fdf3e4', bg2: '#f1dcc0', text: '#1a1a1a', btn: '#111111' },
    { name: 'Ocean Blue', bg1: '#7cc4ff', bg2: '#0a2a9a', text: '#ffffff', btn: '#ffffff' },
    { name: 'Rose Pink', bg1: '#ffffff', bg2: '#ffb3d1', text: '#7a1030', btn: '#d6195e' },
    { name: 'Fresh Green', bg1: '#e6f7ee', bg2: '#0f9d58', text: '#ffffff', btn: '#ffffff' },
    { name: 'Sunset', bg1: '#ffe1b8', bg2: '#f57c00', text: '#3a1a00', btn: '#3a1a00' },
    { name: 'Midnight', bg1: '#2b2b44', bg2: '#0e0e1a', text: '#ffffff', btn: '#ffd54a' }
  ];
  var presetBox = document.getElementById('presetBox');
  PRESETS.forEach(function (p) {
    var b = NK.el('button', 'preset-btn', p.name);
    b.type = 'button';
    b.style.background = 'linear-gradient(90deg,' + p.bg1 + ',' + p.bg2 + ')';
    b.style.color = p.text;
    b.addEventListener('click', function () {
      var f = form.elements;
      f.bg1.value = p.bg1;
      f.bg2.value = p.bg2;
      f.textColor.value = p.text;
      f.btnColor.value = p.btn;
      updatePreview();
    });
    presetBox.appendChild(b);
  });

  /* ---------- image resize (keeps browser storage small) ---------- */
  function resizeImage(file, maxW, maxH, mime, quality, cb) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var s = Math.min(1, maxW / img.width, maxH / img.height);
        var w = Math.max(1, Math.round(img.width * s));
        var h = Math.max(1, Math.round(img.height * s));
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d');
        if (mime === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
        ctx.drawImage(img, 0, 0, w, h);
        cb(c.toDataURL(mime, quality), '');
      };
      img.onerror = function () { cb('', 'Could not read this image.'); };
      img.src = r.result;
    };
    r.onerror = function () { cb('', 'Could not read this file.'); };
    r.readAsDataURL(file);
  }

  function handleFile(input, maxW, maxH, mime, quality, setter) {
    var file = input.files && input.files[0];
    if (!file) return;
    errBox.textContent = '';
    if (!/^image\//.test(file.type)) {
      errBox.textContent = 'Please choose an image file.';
      input.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      errBox.textContent = 'Image is too large (max 8 MB).';
      input.value = '';
      return;
    }
    resizeImage(file, maxW, maxH, mime, quality, function (data, err) {
      if (err) { errBox.textContent = err; return; }
      setter(data);
      updatePreview();
    });
  }

  form.elements.logo.addEventListener('change', function () {
    handleFile(this, 300, 300, 'image/png', 0.9, function (d) { logoData = d; });
  });
  form.elements.image.addEventListener('change', function () {
    handleFile(this, 1000, 500, 'image/jpeg', 0.82, function (d) { bannerData = d; });
  });
  document.getElementById('clearLogo').addEventListener('click', function () {
    logoData = '';
    form.elements.logo.value = '';
    updatePreview();
  });
  document.getElementById('clearBanner').addEventListener('click', function () {
    bannerData = '';
    form.elements.image.value = '';
    updatePreview();
  });

  /* ---------- live preview ---------- */
  function draft() {
    var f = form.elements;
    return {
      id: 'preview',
      name: f.shopName.value.trim() || 'Your Shop Name',
      owner: session.name,
      category: f.category.value,
      city: f.city.value.trim() || 'Your City',
      address: f.address.value.trim(),
      color: f.theme.value,
      logo: logoData,
      image: bannerData,
      bannerTitle: f.bannerTitle.value.trim(),
      bannerSub: f.bannerSub.value.trim(),
      btnText: f.btnText.value.trim(),
      bg1: f.bg1.value,
      bg2: f.bg2.value,
      textColor: f.textColor.value,
      btnColor: f.btnColor.value,
      font: f.font.value,
      products: []
    };
  }

  function updatePreview() {
    previewBox.innerHTML = '';
    previewBox.appendChild(NK.buildStoreCard(draft(), true));
  }
  form.addEventListener('input', updatePreview);
  form.addEventListener('change', updatePreview);

  /* ---------- form state ---------- */
  function resetForm() {
    form.reset();
    logoData = '';
    bannerData = '';
    editingId = null;
    formTitle.textContent = '➕ Add a New Shop & Design Your Banner';
    submitBtn.textContent = 'Add Shop';
    cancelEdit.hidden = true;
    errBox.textContent = '';
    updatePreview();
  }
  cancelEdit.addEventListener('click', resetForm);

  function loadForEdit(shop) {
    var f = form.elements;
    f.shopName.value = shop.name || '';
    f.category.value = shop.category || '';
    f.city.value = shop.city || '';
    f.address.value = shop.address || '';
    f.theme.value = shop.color || '#5b21f5';
    f.bannerTitle.value = shop.bannerTitle || shop.tagline || '';
    f.bannerSub.value = shop.bannerSub || '';
    f.btnText.value = shop.btnText || '';
    if (shop.bg1) f.bg1.value = shop.bg1;
    if (shop.bg2) f.bg2.value = shop.bg2;
    if (shop.textColor) f.textColor.value = shop.textColor;
    if (shop.btnColor) f.btnColor.value = shop.btnColor;
    f.font.value = shop.font || 'sans';
    f.logo.value = '';
    f.image.value = '';
    logoData = shop.logo || '';
    bannerData = shop.image || '';
    editingId = shop.id;
    formTitle.textContent = '✏️ Edit Shop & Banner';
    submitBtn.textContent = 'Save Changes';
    cancelEdit.hidden = false;
    errBox.textContent = '';
    updatePreview();
    document.getElementById('formTitle').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function applyDraft(shop, d) {
    shop.name = d.name;
    shop.category = d.category;
    shop.city = d.city;
    shop.address = d.address;
    shop.color = d.color;
    shop.logo = d.logo;
    shop.image = d.image;
    shop.bannerTitle = d.bannerTitle;
    shop.tagline = d.bannerTitle;
    shop.bannerSub = d.bannerSub;
    shop.btnText = d.btnText;
    shop.bg1 = d.bg1;
    shop.bg2 = d.bg2;
    shop.textColor = d.textColor;
    shop.btnColor = d.btnColor;
    shop.font = d.font;
    return shop;
  }

  /* ---------- save shop ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errBox.textContent = '';
    var f = form.elements;
    if (!f.shopName.value.trim() || !f.city.value.trim()) {
      errBox.textContent = 'Shop name and city are required.';
      return;
    }
    var d = draft();
    var all = NK.customShops();

    if (editingId) {
      var existing = all.filter(function (s) { return s.id === editingId; })[0];
      if (!existing) { resetForm(); return; }
      applyDraft(existing, d);
    } else {
      all.unshift(applyDraft({
        id: NK.uid('shop'),
        ownerId: session.id,
        owner: session.name,
        products: []
      }, d));
    }

    if (!NK.saveCustomShops(all)) {
      errBox.textContent = 'Browser storage is full. Delete an old shop or use smaller images.';
      return;
    }
    NK.toast(editingId ? 'Shop updated' : 'Shop added! Now add some products.');
    resetForm();
    render();
  });

  /* ---------- my shops list ---------- */
  function myShops() {
    return NK.customShops().filter(function (s) { return s.ownerId === session.id; });
  }

  function updateShop(id, fn) {
    var all = NK.customShops();
    all.forEach(function (s) { if (s.id === id) fn(s); });
    return NK.saveCustomShops(all);
  }

  function shopBlock(shop) {
    var block = NK.el('div', 'dash-shop card');

    var head = NK.el('div', 'dash-head');
    var logo = NK.el('div', 'dash-logo');
    if (shop.logo) {
      var li = NK.el('img');
      li.src = shop.logo;
      li.alt = '';
      logo.appendChild(li);
      logo.classList.add('has-img');
    } else {
      logo.textContent = NK.initials(shop.name);
      logo.style.background = shop.color;
    }
    var info = NK.el('div', 'dash-info');
    info.appendChild(NK.el('strong', '', shop.name));
    info.appendChild(NK.el('div', 'muted', shop.category + ' · ' + shop.city + (shop.address ? ' · ' + shop.address : '')));

    var edit = NK.el('button', 'btn-cancel small', '✏️ Edit design');
    edit.type = 'button';
    edit.addEventListener('click', function () { loadForEdit(shop); });

    var view = NK.el('a', 'btn-cancel small', 'View page');
    view.href = 'shop.html?id=' + encodeURIComponent(shop.id);

    var del = NK.el('button', 'link-btn', 'Delete shop');
    del.type = 'button';
    del.addEventListener('click', function () {
      if (!confirm('Delete "' + shop.name + '" and all its products?')) return;
      NK.saveCustomShops(NK.customShops().filter(function (s) { return s.id !== shop.id; }));
      if (editingId === shop.id) resetForm();
      render();
    });

    head.appendChild(logo);
    head.appendChild(info);
    head.appendChild(edit);
    head.appendChild(view);
    head.appendChild(del);
    block.appendChild(head);

    var prods = shop.products || [];
    if (!prods.length) block.appendChild(NK.el('p', 'muted', 'No products yet. Add your first product below.'));
    prods.forEach(function (p) {
      var row = NK.el('div', 'prod-row');
      var pic = NK.el('div', 'prod-pic');
      if (p.image) {
        var im = NK.el('img');
        im.src = p.image;
        im.alt = p.name;
        pic.appendChild(im);
      } else {
        pic.textContent = p.icon || NK.categoryIcon(shop.category);
      }
      row.appendChild(pic);
      row.appendChild(NK.el('span', 'prod-name', p.name));
      row.appendChild(NK.el('span', 'price', NK.money(p.price)));
      var rm = NK.el('button', 'link-btn', 'Delete');
      rm.type = 'button';
      rm.addEventListener('click', function () {
        updateShop(shop.id, function (s) {
          s.products = s.products.filter(function (x) { return x.id !== p.id; });
        });
        render();
      });
      row.appendChild(rm);
      block.appendChild(row);
    });

    block.appendChild(productForm(shop));
    return block;
  }

  function productForm(shop) {
    var f = NK.el('form', 'prod-form nk-form');
    f.innerHTML =
      '<input type="text" name="pname" placeholder="Product name" maxlength="40" required>' +
      '<input type="number" name="price" placeholder="Price (₹)" min="1" step="1" required>' +
      '<input type="file" name="pimg" accept="image/*">' +
      '<button type="submit" class="btn-submit">+ Add Product</button>' +
      '<p class="form-error"></p>';
    var err = f.querySelector('.form-error');

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      err.textContent = '';
      var price = Math.round(Number(f.elements.price.value));
      if (!price || price < 1) { err.textContent = 'Enter a valid price.'; return; }

      function save(img) {
        var product = {
          id: NK.uid('p'),
          name: f.elements.pname.value.trim(),
          price: price,
          icon: NK.categoryIcon(shop.category),
          image: img
        };
        var ok = updateShop(shop.id, function (s) { s.products = s.products || []; s.products.push(product); });
        if (!ok) { err.textContent = 'Could not save. Browser storage is full.'; return; }
        NK.toast('Product added');
        render();
      }

      var file = f.elements.pimg.files && f.elements.pimg.files[0];
      if (!file) { save(''); return; }
      if (!/^image\//.test(file.type)) { err.textContent = 'Please choose an image file.'; return; }
      resizeImage(file, 600, 600, 'image/jpeg', 0.8, function (data, e2) {
        if (e2) { err.textContent = e2; return; }
        save(data);
      });
    });
    return f;
  }

  function render() {
    listBox.innerHTML = '';
    var shops = myShops();
    if (!shops.length) {
      var e = NK.el('div', 'empty card');
      e.appendChild(NK.el('h3', '', 'You have not added any shop yet'));
      e.appendChild(NK.el('p', '', 'Use the form above to add your first shop.'));
      listBox.appendChild(e);
      return;
    }
    shops.forEach(function (s) { listBox.appendChild(shopBlock(s)); });
  }

  updatePreview();
  render();
})();