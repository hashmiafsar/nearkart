/* ============================================================
   home.js  -  index.html : list shops, filter by location,
   category (?cat=) and search (?q=)
   (the card itself is drawn by NK.buildStoreCard in app.js)
   ============================================================ */
(function () {
  var list = document.getElementById('storeList');
  if (!list) return;

  var params = new URLSearchParams(location.search);
  var q = (params.get('q') || '').trim();
  var cat = params.get('cat') || '';
  var showAll = false;

  var titleEl = document.getElementById('sectionTitle');
  var subEl = document.getElementById('sectionSub');
  var notice = document.getElementById('storeNotice');

  var searchInput = document.getElementById('searchInput');
  if (searchInput && q) searchInput.value = q;

  function matches(shop) {
    if (cat && shop.category !== cat) return false;
    if (q) {
      var hay = [shop.name, shop.category, shop.city, shop.owner]
        .concat((shop.products || []).map(function (p) { return p.name; }))
        .join(' ').toLowerCase();
      return q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
    }
    return true;
  }

  function render() {
    var loc = NK.location();
    var found = NK.allShops().filter(matches);
    var local = found.filter(function (s) { return NK.shopInLocation(s, loc); });
    var shown = found;
    notice.hidden = true;
    notice.innerHTML = '';

    if (showAll) {
      shown = found;
      notice.hidden = false;
      notice.appendChild(document.createTextNode('Showing stores from all areas. '));
      var b1 = NK.el('button', 'link-btn blue', 'Show only near ' + (loc.city || 'me'));
      b1.type = 'button';
      b1.addEventListener('click', function () { showAll = false; render(); });
      notice.appendChild(b1);
    } else if (local.length) {
      shown = local;
      if (found.length > local.length) {
        notice.hidden = false;
        notice.appendChild(document.createTextNode('Showing stores near ' + loc.label + '. '));
        var b2 = NK.el('button', 'link-btn blue', 'Show all areas');
        b2.type = 'button';
        b2.addEventListener('click', function () { showAll = true; render(); });
        notice.appendChild(b2);
      }
    } else if (found.length) {
      notice.hidden = false;
      notice.textContent = 'No stores in ' + loc.label + ' yet. Showing stores from other areas.';
    }

    titleEl.textContent = cat ? cat + ' Stores' : q ? 'Results for "' + q + '"' : 'Stores Near You';
    subEl.textContent = shown.length + ' store' + (shown.length === 1 ? '' : 's') + ' · ' + loc.label;

    list.innerHTML = '';
    if (!shown.length) {
      var empty = NK.el('div', 'empty card');
      empty.appendChild(NK.el('h3', '', 'No stores found'));
      empty.appendChild(NK.el('p', '', 'Try another search or category, or add your own shop.'));
      list.appendChild(empty);
      return;
    }
    shown.forEach(function (s) { list.appendChild(NK.buildStoreCard(s)); });
  }

  document.addEventListener('nk:locationchange', render);
  render();
})();