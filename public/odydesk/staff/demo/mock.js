/*
 * OdyDesk DEMO backend — runs only inside this browser tab.
 * Pretends to be the server so every screen can be tried with fake data.
 * Nothing is sent anywhere; refreshing the page resets everything.
 */
(function () {
  var API = 'https://demo.odydesk.invalid'
  var me = document.currentScript && document.currentScript.src || ''
  var BASE = me ? me.replace(/demo\/mock\.js.*$/, '') : '/'
  var realFetch = window.fetch.bind(window)
  var DAY = 86400000
  var now = Date.now()
  var LODGES = [
    { id: 'l1', name: 'Sample Lodge 1', code: 'sample1' },
    { id: 'l2', name: 'Sample Lodge 2', code: 'sample2' },
    { id: 'l3', name: 'Sample Lodge 3', code: 'sample3' },
    { id: 'l4', name: 'Sample Lodge 4', code: 'sample4' },
  ]
  var current = 'l1'
  var lodgeOf = function (id) { for (var i = 0; i < LODGES.length; i++) if (LODGES[i].id === id) return LODGES[i] }
  var blobs = {} // uploaded photos (in memory)
  var rows = []
  var n = 0, b = 0
  function seed(lodge, daysAgo, hour, room, people, noBack) {
    var bid = 'seed' + (++b)
    var at = new Date(now - daysAgo * DAY); at.setHours(hour, (b * 13) % 60, 0, 0)
    if (at.getTime() > now - 20 * 60000) at = new Date(now - (b * 47 + 20) * 60000)
    for (var p = 0; p < people; p++) {
      var k = (n++ % 12) + 1
      rows.push({
        id: 'g' + n, batch_id: bid, person_no: p + 1, lodge_id: lodge, room_number: String(room),
        note: null, captured_at: at.toISOString(), deleted_at: null,
        front_path: 'demo/G' + k + '-front.webp', back_path: noBack && p === people - 1 ? null : 'demo/G' + k + '-back.webp',
        thumb_path: 'demo/G' + k + '-front.webp',
      })
    }
  }
  seed('l1', 0, 9, 204, 2); seed('l1', 0, 8, 101, 1); seed('l1', 1, 21, 305, 3, true)
  seed('l1', 2, 13, 102, 1); seed('l1', 3, 18, 207, 2); seed('l1', 5, 11, 110, 1, true)
  ;['l2', 'l3', 'l4'].forEach(function (l, i) { seed(l, i, 10, 201 + i, 1) })

  function withLodge(r) { var l = lodgeOf(r.lodge_id); return Object.assign({}, r, { lodges: { name: l.name, code: l.code } }) }
  function visible() {
    return rows.filter(function (r) { return r.lodge_id === current && !r.deleted_at && new Date(r.captured_at) > new Date(Date.now() - 7 * DAY) })
      .sort(function (a, c) { return c.captured_at.localeCompare(a.captured_at) || a.batch_id.localeCompare(c.batch_id) || a.person_no - c.person_no })
  }
  function batches(list) {
    var m = {}, out = []
    list.forEach(function (r) {
      if (!m[r.batch_id]) { m[r.batch_id] = { batch_id: r.batch_id, lodge_id: r.lodge_id, lodge_name: lodgeOf(r.lodge_id).name, room_number: r.room_number, note: r.note, people: 0, thumb_path: r.thumb_path, captured_at: r.captured_at }; out.push(m[r.batch_id]) }
      m[r.batch_id].people++
    })
    return out
  }
  function json(body, status, headers) {
    var h = new Headers({ 'content-type': 'application/json' })
    if (headers) Object.keys(headers).forEach(function (k) { h.set(k, headers[k]) })
    return Promise.resolve(new Response(status === 204 ? null : JSON.stringify(body), { status: status || 200, headers: h }))
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms) }) }
  function range(list, q) {
    var off = Number(q.get('offset') || 0), lim = Number(q.get('limit') || 60)
    var page = list.slice(off, off + lim)
    return json(page, 200, { 'content-range': off + '-' + (off + Math.max(0, page.length - 1)) + '/' + list.length })
  }
  function token() {
    return { access_token: 'demo', refresh_token: 'demo', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'lodge-' + current, email: 'lodge-' + current + '@demo', aud: 'authenticated' } }
  }

  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input.url
    if (url.indexOf(API) !== 0) return realFetch(input, init)
    var u = new URL(url), p = u.pathname, q = u.searchParams
    var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase()
    var body = init && init.body
    return wait(120 + Math.random() * 160).then(function () {
      if (p === '/auth/v1/token') {
        try { var e = JSON.parse(body).email || ''; var m = e.match(/lodge-(.+)@/); if (m) current = m[1] } catch (x) { /* */ }
        var t = document.getElementById('demo-tag'); if (t) t.style.display = 'none'
        return json(token())
      }
      if (p === '/auth/v1/user') return json(token().user)
      if (p === '/auth/v1/logout') return json(null, 204)
      if (p === '/rest/v1/profiles') { var l = lodgeOf(current); return json({ id: 'lodge-' + current, role: 'manager', full_name: l.name, lodge_id: l.id, lodges: { id: l.id, name: l.name, code: l.code } }) }
      if (p === '/rest/v1/app_settings') return json({ photo_quality: 'balanced' })
      if (p === '/rest/v1/rpc/staff_lodges') { var t0 = document.getElementById('demo-tag'); if (t0) t0.style.display = 'none' }
      if (p === '/rest/v1/rpc/staff_lodges') return json(LODGES.map(function (l) { return { id: l.id, name: l.name } }))
      if (p === '/rest/v1/guest_batches') {
        var list = batches(visible()), from = q.get('captured_at')
        if (from) list = list.filter(function (r) { return r.captured_at >= from.slice(4) })
        return range(list, q)
      }
      if (p === '/rest/v1/guest_ids') {
        if (method === 'POST') {
          var row = JSON.parse(body)
          if (rows.some(function (r) { return r.id === row.id })) return json({ code: '23505', message: 'duplicate' }, 409)
          rows.push(Object.assign({ captured_at: new Date().toISOString(), deleted_at: null }, row))
          return json(null, 201)
        }
        var bq = q.get('batch_id')
        if (bq) return json(rows.filter(function (r) { return 'eq.' + r.batch_id === bq }).map(withLodge))
        var v = visible(), s = q.get('room_number')
        if (s) { s = s.replace('ilike.', '').replace(/[*%]/g, ''); v = v.filter(function (r) { return r.room_number.indexOf(s) >= 0 }) }
        var f = q.get('captured_at'); if (f) v = v.filter(function (r) { return r.captured_at >= f.slice(4) })
        return range(v.map(withLodge), q)
      }
      if (p.indexOf('/storage/v1/object/sign/') === 0 && method === 'POST') {
        var paths = JSON.parse(body).paths
        return json(paths.map(function (x) { return { path: x, signedURL: blobs[x] ? '/__blob__/' + x : '/__file__/' + x, error: null } }))
      }
      if (p.indexOf('/storage/v1/object/sign/__blob__/') >= 0 || p.indexOf('/storage/v1/__blob__/') >= 0) {
        var key = decodeURIComponent(p.split('__blob__/')[1]); return Promise.resolve(new Response(blobs[key]))
      }
      if (p.indexOf('/storage/v1/object/guest-ids/') === 0 && method === 'POST') {
        var k2 = decodeURIComponent(p.replace('/storage/v1/object/guest-ids/', ''))
        var data = body
        if (typeof FormData !== 'undefined' && body instanceof FormData) { body.forEach(function (v) { if (v instanceof Blob) data = v }) }
        blobs[k2] = data
        return wait(500).then(function () { return json({ Key: 'guest-ids/' + k2 }) })
      }
      if (p === '/storage/v1/object/guest-ids' && method === 'DELETE') {
        try { JSON.parse(body).prefixes.forEach(function (x) { delete blobs[x] }) } catch (x) { /* */ }
        return json([])
      }
      return json([])
    })
  }

  // Signed photo links: demo files are served from /demo/, photos taken in the demo from memory.
  var fixUrl = function (src) {
    if (!src) return src
    var i = src.indexOf('__file__/')
    if (i >= 0) return BASE + src.slice(i + 9).split('?')[0]
    var j = src.indexOf('__blob__/')
    if (j >= 0) { var key = src.slice(j + 9).split('?')[0]; for (var d = 0; d < 3 && key.indexOf('%') >= 0; d++) key = decodeURIComponent(key); return blobs[key] ? URL.createObjectURL(blobs[key]) : '' }
    return src
  }
  var desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    get: function () { return desc.get.call(this) },
    set: function (v) { desc.set.call(this, fixUrl(String(v))) },
  })
  var origSet = Element.prototype.setAttribute
  Element.prototype.setAttribute = function (name, value) {
    if (this instanceof HTMLImageElement && name === 'src') value = fixUrl(String(value))
    return origSet.call(this, name, value)
  }

  // Small demo label
  document.addEventListener('DOMContentLoaded', function () {
    var tag = document.createElement('div')
    tag.id = 'demo-tag'
    tag.textContent = 'DEMO · passcode 123456'
    tag.setAttribute('style', 'white-space:nowrap;position:fixed;left:50%;bottom:calc(6px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9999;pointer-events:none;' +
      'font:600 11px/1 -apple-system,Inter,Arial,sans-serif;letter-spacing:.06em;color:rgba(255,255,255,.9);background:rgba(0,0,0,.45);' +
      'padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.2);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)')
    document.body.appendChild(tag)
  })
})()
