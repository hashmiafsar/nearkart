/* ============================================================
   cart.js  -  cart.html (cart + checkout) and
               orders.html (customer orders / owner orders)
   ============================================================ */
(function () {
  var page = document.body.getAttribute('data-page');
  if (page !== 'cart' && page !== 'orders') return;

  var STATUSES = ['Placed', 'Accepted', 'Out for Delivery', 'Delivered', 'Cancelled'];

  /* ===================== CART PAGE ===================== */
  function resolveCart() {
    var rows = [];
    NK.cart().forEach(function (c) {
      var shop = NK.getShop(c.shopId);
      if (!shop) return;
      var p = (shop.products || []).filter(function (x) { return x.id === c.productId; })[0];
      if (!p) return;
      rows.push({ shop: shop, product: p, qty: c.qty });
    });
    return rows;
  }

  function initCart() {
    var list = document.getElementById('cartItems');
    var summary = document.getElementById('cartSummary');
    var layout = document.getElementById('cartLayout');
    var empty = document.getElementById('cartEmpty');
    var form = document.getElementById('checkoutForm');
    var err = document.getElementById('checkoutError');
    var loginNote = document.getElementById('loginNote');

    var s = NK.session();
    if (s) form.elements.fullName.value = s.name;
    form.elements.address.value = NK.location().label || '';
    loginNote.hidden = !!(s && s.role === 'customer');

    function change(shopId, productId, delta) {
      var cart = NK.cart();
      cart.forEach(function (c) {
        if (c.shopId === shopId && c.productId === productId) c.qty += delta;
      });
      NK.saveCart(cart.filter(function (c) { return c.qty > 0; }));
      render();
    }

    function render() {
      var rows = resolveCart();
      NK.saveCart(rows.map(function (r) {
        return { shopId: r.shop.id, productId: r.product.id, qty: r.qty };
      }));

      var has = rows.length > 0;
      layout.hidden = !has;
      empty.hidden = has;
      list.innerHTML = '';
      var total = 0;

      rows.forEach(function (r) {
        var p = r.product;
        total += p.price * r.qty;

        var row = NK.el('div', 'cart-row');
        var img = NK.el('div', 'product-img');
        if (p.image) {
          var im = NK.el('img');
          im.src = p.image;
          im.alt = p.name;
          img.appendChild(im);
        } else {
          img.textContent = p.icon || '🛍️';
        }

        var info = NK.el('div', 'cart-info');
        info.appendChild(NK.el('strong', '', p.name));
        info.appendChild(NK.el('div', 'muted', 'from ' + r.shop.name));
        info.appendChild(NK.el('div', 'price', NK.money(p.price)));

        var qty = NK.el('div', 'qty');
        var minus = NK.el('button', '', '−');
        var plus = NK.el('button', '', '+');
        minus.type = plus.type = 'button';
        minus.addEventListener('click', function () { change(r.shop.id, p.id, -1); });
        plus.addEventListener('click', function () { change(r.shop.id, p.id, 1); });
        qty.appendChild(minus);
        qty.appendChild(NK.el('span', '', String(r.qty)));
        qty.appendChild(plus);

        var line = NK.el('div', 'line-total', NK.money(p.price * r.qty));
        var rm = NK.el('button', 'link-btn', 'Remove');
        rm.type = 'button';
        rm.addEventListener('click', function () { change(r.shop.id, p.id, -r.qty); });

        row.appendChild(img);
        row.appendChild(info);
        row.appendChild(qty);
        var right = NK.el('div', 'cart-right');
        right.appendChild(line);
        right.appendChild(rm);
        row.appendChild(right);
        list.appendChild(row);
      });

      summary.innerHTML = '';
      var l1 = NK.el('div', 'sum-line');
      l1.appendChild(NK.el('span', '', 'Items subtotal'));
      l1.appendChild(NK.el('span', '', NK.money(total)));
      var l2 = NK.el('div', 'sum-line');
      l2.appendChild(NK.el('span', '', 'Delivery'));
      l2.appendChild(NK.el('span', '', 'Free'));
      var l3 = NK.el('div', 'sum-line sum-total');
      l3.appendChild(NK.el('span', '', 'Total'));
      l3.appendChild(NK.el('span', '', NK.money(total)));
      summary.appendChild(l1);
      summary.appendChild(l2);
      summary.appendChild(l3);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.textContent = '';
      var sess = NK.session();
      if (!sess) {
        location.href = 'login.html?role=customer&next=cart.html';
        return;
      }
      if (sess.role !== 'customer') {
        err.textContent = 'Please login with a Customer account to place an order.';
        return;
      }
      var rows = resolveCart();
      if (!rows.length) { err.textContent = 'Your cart is empty.'; return; }

      var f = form.elements;
      var phone = f.phone.value.replace(/\s+/g, '');
      var address = f.address.value.trim();
      if (f.fullName.value.trim().length < 2) { err.textContent = 'Please enter your name.'; return; }
      if (!/^[0-9]{10}$/.test(phone)) { err.textContent = 'Phone number must be 10 digits.'; return; }
      if (address.length < 8) { err.textContent = 'Please enter your full delivery address.'; return; }

      /* one order per shop */
      var byShop = {};
      rows.forEach(function (r) {
        if (!byShop[r.shop.id]) byShop[r.shop.id] = { shop: r.shop, items: [], total: 0 };
        byShop[r.shop.id].items.push({ name: r.product.name, price: r.product.price, qty: r.qty });
        byShop[r.shop.id].total += r.product.price * r.qty;
      });

      var orders = NK.read(NK.K.orders, []);
      Object.keys(byShop).forEach(function (id) {
        var g = byShop[id];
        orders.push({
          id: NK.uid('ord'),
          userId: sess.id,
          customerName: f.fullName.value.trim(),
          phone: phone,
          shopId: g.shop.id,
          shopName: g.shop.name,
          ownerId: g.shop.ownerId || null,
          items: g.items,
          total: g.total,
          address: address,
          payment: 'Cash on Delivery',
          status: 'Placed',
          date: new Date().toISOString()
        });
      });

      if (!NK.write(NK.K.orders, orders)) {
        err.textContent = 'Could not save your order in this browser.';
        return;
      }
      NK.saveCart([]);
      location.href = 'orders.html?placed=1';
    });

    render();
  }

  /* ===================== ORDERS PAGE ===================== */
  function initOrders() {
    var box = document.getElementById('ordersList');
    var title = document.getElementById('ordersTitle');
    var banner = document.getElementById('placedBanner');
    var s = NK.session();

    if (new URLSearchParams(location.search).get('placed') === '1') banner.hidden = false;

    if (!s) {
      var c = NK.el('div', 'empty card');
      c.appendChild(NK.el('h3', '', 'Please login to see your orders'));
      var b = NK.el('a', 'add-shop-btn', 'Login');
      b.href = 'login.html?role=customer&next=orders.html';
      c.appendChild(b);
      box.appendChild(c);
      return;
    }

    var isOwner = s.role === 'owner';
    title.textContent = isOwner ? 'Orders For Your Shops' : 'Your Orders';

    function render() {
      var all = NK.read(NK.K.orders, []);
      var mine = all.filter(function (o) { return isOwner ? o.ownerId === s.id : o.userId === s.id; });
      mine.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
      box.innerHTML = '';

      if (!mine.length) {
        var e = NK.el('div', 'empty card');
        e.appendChild(NK.el('h3', '', 'No orders yet'));
        e.appendChild(NK.el('p', '', isOwner ? 'Orders placed on your shops will appear here.' : 'Start shopping to see your orders here.'));
        box.appendChild(e);
        return;
      }

      mine.forEach(function (o) {
        var card = NK.el('div', 'order-card card');

        var head = NK.el('div', 'order-head');
        var left = NK.el('div');
        left.appendChild(NK.el('strong', '', o.shopName));
        left.appendChild(NK.el('div', 'muted', 'Order #' + o.id.slice(-6).toUpperCase() + ' · ' + new Date(o.date).toLocaleString('en-IN')));
        head.appendChild(left);
        head.appendChild(NK.el('span', 'badge st-' + o.status.replace(/\s+/g, '').toLowerCase(), o.status));
        card.appendChild(head);

        o.items.forEach(function (it) {
          var line = NK.el('div', 'sum-line');
          line.appendChild(NK.el('span', '', it.name + ' × ' + it.qty));
          line.appendChild(NK.el('span', '', NK.money(it.price * it.qty)));
          card.appendChild(line);
        });
        var tot = NK.el('div', 'sum-line sum-total');
        tot.appendChild(NK.el('span', '', 'Total (' + o.payment + ')'));
        tot.appendChild(NK.el('span', '', NK.money(o.total)));
        card.appendChild(tot);

        card.appendChild(NK.el('p', 'muted', '📍 ' + o.address));
        if (isOwner) card.appendChild(NK.el('p', 'muted', '👤 ' + o.customerName + ' · 📞 ' + o.phone));

        var actions = NK.el('div', 'order-actions');
        if (isOwner) {
          var sel = document.createElement('select');
          STATUSES.forEach(function (st) {
            var op = NK.el('option', '', st);
            op.value = st;
            if (st === o.status) op.selected = true;
            sel.appendChild(op);
          });
          sel.addEventListener('change', function () {
            var data = NK.read(NK.K.orders, []);
            data.forEach(function (x) { if (x.id === o.id) x.status = sel.value; });
            NK.write(NK.K.orders, data);
            NK.toast('Order status updated');
            render();
          });
          actions.appendChild(NK.el('span', 'muted', 'Update status: '));
          actions.appendChild(sel);
        } else if (o.status === 'Placed') {
          var cancel = NK.el('button', 'btn-cancel', 'Cancel Order');
          cancel.type = 'button';
          cancel.addEventListener('click', function () {
            if (!confirm('Cancel this order?')) return;
            var data = NK.read(NK.K.orders, []);
            data.forEach(function (x) { if (x.id === o.id) x.status = 'Cancelled'; });
            NK.write(NK.K.orders, data);
            render();
          });
          actions.appendChild(cancel);
        }
        card.appendChild(actions);
        box.appendChild(card);
      });
    }
    render();
  }

  if (page === 'cart') initCart(); else initOrders();
})();