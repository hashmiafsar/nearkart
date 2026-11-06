/* ============================================================
   shop.js  -  shop.html?id=...  : shop details + products
   ============================================================ */
(function () {
  var hero = document.getElementById('shopHero');
  if (!hero) return;
  var grid = document.getElementById('productGrid');
  var head = document.getElementById('productHead');

  var id = new URLSearchParams(location.search).get('id');
  var shop = id ? NK.getShop(id) : null;

  if (!shop) {
    var box = NK.el('div', 'empty card');
    box.appendChild(NK.el('h3', '', 'Shop not found'));
    var back = NK.el('a', 'add-shop-btn', '← Back to stores');
    back.href = 'index.html';
    box.appendChild(back);
    hero.appendChild(box);
    head.hidden = true;
    return;
  }

  document.title = shop.name + ' | NearKart';
  hero.className = 'shop-hero card';
  hero.style.setProperty('--accent', shop.color || '#5b21f5');
  if (shop.bg1 && shop.bg2) {
    hero.style.background = 'linear-gradient(90deg,' + shop.bg1 + ',' + shop.bg2 + ')';
    hero.style.color = shop.textColor || '#fff';
  }

  var logo = NK.buildLogo(shop);

  var info = NK.el('div', 'hero-info');
  info.appendChild(NK.el('h1', '', shop.name));
  info.appendChild(NK.el('p', '', '👤 ' + shop.owner));
  info.appendChild(NK.el('p', '', '📍 ' + (shop.address ? shop.address + ', ' : '') + shop.city));
  if (shop.tagline) info.appendChild(NK.el('p', 'tag', shop.tagline));
  info.appendChild(NK.el('p', '', shop.rating ? '★ ' + shop.rating + ' (sample)' : 'No reviews yet'));

  hero.appendChild(logo);
  hero.appendChild(info);
  if (shop.image) {
    var img = NK.el('img', 'hero-img');
    img.src = shop.image;
    img.alt = shop.name;
    hero.appendChild(img);
  }

  var products = shop.products || [];
  document.getElementById('productCount').textContent = products.length + ' product' + (products.length === 1 ? '' : 's');

  if (!products.length) {
    var e = NK.el('div', 'empty card');
    e.appendChild(NK.el('h3', '', 'No products yet'));
    e.appendChild(NK.el('p', '', 'The owner has not added any products to this shop.'));
    grid.appendChild(e);
    return;
  }

  products.forEach(function (p) {
    var card = NK.el('div', 'product-card');
    var imgBox = NK.el('div', 'product-img');
    if (p.image) {
      var im = NK.el('img');
      im.src = p.image;
      im.alt = p.name;
      imgBox.appendChild(im);
    } else {
      imgBox.textContent = p.icon || NK.categoryIcon(shop.category);
    }
    card.appendChild(imgBox);
    card.appendChild(NK.el('h3', '', p.name));
    card.appendChild(NK.el('div', 'price', NK.money(p.price)));

    var btn = NK.el('button', 'btn-submit', '🛒 Add to Cart');
    btn.type = 'button';
    btn.addEventListener('click', function () {
      NK.addToCart(shop.id, p.id);
      NK.toast(p.name + ' added to cart');
    });
    card.appendChild(btn);
    grid.appendChild(card);
  });
})();