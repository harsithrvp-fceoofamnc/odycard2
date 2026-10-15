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

  // ---------------------------------------------------------------- OWNER (Admin) demo
  // ~3 months of made-up check-ins with realistic patterns (evening rush,
  // busy weekends, one lodge growing, one slipping) so the charts mean something.
  var ADMIN = /\/admin\//.test(location.pathname)
  var IST = 330 * 60000
  function istParts(t) { var d = new Date(t + IST); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), dow: (d.getUTCDay() + 6) % 7, ymd: d.toISOString().slice(0, 10) } }
  function ymdAdd(ymd, n) { var a = ymd.split('-'); return new Date(Date.UTC(+a[0], +a[1] - 1, +a[2] + n)).toISOString().slice(0, 10) }
  function weekOf(ymd) { var a = ymd.split('-'); var dw = (new Date(Date.UTC(+a[0], +a[1] - 1, +a[2])).getUTCDay() + 6) % 7; return ymdAdd(ymd, -dw) }
  function istStart(ymd) { var a = ymd.split('-'); return Date.UTC(+a[0], +a[1] - 1, +a[2]) - IST }
  if (ADMIN) {
    rows = []; n = 0; b = 0
    var rs = 20261014
    var rnd = function () { rs = (rs * 1103515245 + 12345) % 2147483648; return rs / 2147483648 }
    var HOURS = [0.2,0.1,0.05,0.05,0.05,0.2,0.5,0.8,1,1.1,1.3,1.6,1.8,1.4,1.1,1,1.2,1.6,2.2,2.9,3.1,2.4,1.5,0.7]
    var hsum = HOURS.reduce(function (a, x) { return a + x }, 0)
    var pickHour = function () { var r = rnd() * hsum; for (var h = 0; h < 24; h++) { r -= HOURS[h]; if (r <= 0) return h } return 20 }
    var DOWF = [0.8, 0.75, 0.85, 0.95, 1.35, 1.6, 1.2]
    var LW = { l1: 4.2, l2: 3.0, l3: 3.6, l4: 1.8 }
    var today = istParts(now).ymd
    for (var back = 89; back >= 0; back--) {
      var ymd = ymdAdd(today, -back), dow = istParts(istStart(ymd) + 12 * 3600000).dow
      LODGES.forEach(function (L, li) {
        var trend = L.id === 'l3' ? 0.7 + 0.6 * (89 - back) / 89 : L.id === 'l2' ? (back < 14 ? 0.72 : 1) : 1
        var lam = LW[L.id] * DOWF[dow] * trend
        var cnt = Math.max(0, Math.round(lam + (rnd() - 0.5) * lam * 0.8))
        for (var c = 0; c < cnt; c++) {
          var h = pickHour(), mi = Math.floor(rnd() * 60)
          var t = istStart(ymd) + (h * 60 + mi) * 60000
          if (t > now - 10 * 60000) continue
          var r = rnd(), ppl = r < 0.52 ? 1 : r < 0.82 ? 2 : r < 0.95 ? 3 : 4
          var bid = 'a' + (++b), room = String((li + 1) * 100 + 1 + Math.floor(rnd() * 24))
          for (var p2 = 0; p2 < ppl; p2++) {
            var k2 = (n++ % 12) + 1
            rows.push({ id: 'g' + n, batch_id: bid, person_no: p2 + 1, lodge_id: L.id, room_number: room, note: null,
              captured_at: new Date(t + p2 * 20000).toISOString(), deleted_at: null, bytes: 160000 + (n % 7) * 9000,
              front_path: 'demo/G' + k2 + '-front.webp', back_path: 'demo/G' + k2 + '-back.webp', thumb_path: 'demo/G' + k2 + '-front.webp' })
          }
        }
      })
    }
    try {
      var sess = { access_token: 'demo', refresh_token: 'demo', token_type: 'bearer', expires_in: 86400 * 30, expires_at: Math.floor(now / 1000) + 86400 * 30,
        user: { id: 'owner', aud: 'authenticated', role: 'authenticated', email: 'owner@demo' } }
      localStorage.setItem('lodgeid.auth', JSON.stringify(sess))
    } catch (e) { /* private mode: the owner sign-in screen will show instead */ }
  }
  function batchesAll(fromT, lodge) {
    var m = {}, out = []
    rows.forEach(function (r) {
      if (r.deleted_at) return
      if (lodge && r.lodge_id !== lodge) return
      var t = Date.parse(r.captured_at); if (t < fromT) return
      if (!m[r.batch_id]) { m[r.batch_id] = { lodge_id: r.lodge_id, at: t, people: 0 }; out.push(m[r.batch_id]) }
      var x = m[r.batch_id]; x.people++; if (t < x.at) x.at = t
    })
    return out
  }
  function insights(days, lodge) {
    days = Math.max(1, Math.min(days || 90, 366))
    var today = istParts(now).ymd
    var from = istStart(ymdAdd(today, -(days - 1))), wk0 = istStart(ymdAdd(weekOf(today), -49)), d0 = istStart(ymdAdd(today, -13))
    var all = batchesAll(Math.min(from, wk0, d0), lodge)
    var heat = {}, perL = {}, weeks = {}, daily = {}, groups = {}
    all.forEach(function (x) {
      var ip = istParts(x.at)
      if (x.at >= from) {
        var hk = ip.dow + ':' + ip.h; heat[hk] = (heat[hk] || 0) + 1
        var pl = perL[x.lodge_id] || (perL[x.lodge_id] = { e: 0, g: 0 }); pl.e++; pl.g += x.people
        var gr = groups[x.lodge_id] || (groups[x.lodge_id] = { solo: 0, two: 0, three_plus: 0 })
        if (x.people === 1) gr.solo++; else if (x.people === 2) gr.two++; else gr.three_plus++
      }
      if (x.at >= wk0) { var wk = x.lodge_id + '|' + weekOf(ip.ymd); weeks[wk] = (weeks[wk] || 0) + 1 }
      if (x.at >= d0) { var dk = x.lodge_id + '|' + ip.ymd; daily[dk] = (daily[dk] || 0) + 1 }
    })
    return {
      days: days, from: ymdAdd(today, -(days - 1)),
      heat: Object.keys(heat).map(function (k) { var a = k.split(':'); return { dow: +a[0], hour: +a[1], n: heat[k] } }),
      lodges: LODGES.filter(function (l) { return !lodge || l.id === lodge }).map(function (l) { var p = perL[l.id] || { e: 0, g: 0 }; return { lodge_id: l.id, name: l.name, entries: p.e, guests: p.g } }),
      weeks: Object.keys(weeks).map(function (k) { var a = k.split('|'); return { lodge_id: a[0], week: a[1], n: weeks[k] } }),
      daily: Object.keys(daily).map(function (k) { var a = k.split('|'); return { lodge_id: a[0], day: a[1], n: daily[k] } }),
      groups: Object.keys(groups).map(function (k) { var g = groups[k]; return { lodge_id: k, solo: g.solo, two: g.two, three_plus: g.three_plus } }),
    }
  }
  function lodgeStats() {
    var ip = istParts(now), dayT = istStart(ip.ymd), monT = istStart(ip.ymd.slice(0, 8) + '01')
    return LODGES.map(function (l) {
      var s = { lodge_id: l.id, name: l.name, code: l.code, today_count: 0, month_count: 0, total_count: 0, total_bytes: 0 }
      rows.forEach(function (r) {
        if (r.lodge_id !== l.id || r.deleted_at) return
        var t = Date.parse(r.captured_at); s.total_count++; s.total_bytes += r.bytes || 170000
        if (t >= monT) s.month_count++; if (t >= dayT) s.today_count++
      })
      return s
    })
  }
  function adminCards(q) {
    var list = rows.filter(function (r) { return !r.deleted_at })
    var lq = q.get('lodge_id'); if (lq) list = list.filter(function (r) { return 'eq.' + r.lodge_id === lq })
    var bq = q.get('batch_id'); if (bq) list = list.filter(function (r) { return 'eq.' + r.batch_id === bq })
    var rq = q.get('room_number'); if (rq) { rq = rq.replace('ilike.', '').replace(/[*%]/g, ''); list = list.filter(function (r) { return r.room_number.indexOf(rq) >= 0 }) }
    q.getAll('captured_at').forEach(function (c) {
      var op = c.slice(0, c.indexOf('.')), v = Date.parse(c.slice(c.indexOf('.') + 1))
      list = list.filter(function (r) { var t = Date.parse(r.captured_at); return op === 'gte' ? t >= v : op === 'lt' ? t < v : op === 'lte' ? t <= v : true })
    })
    var asc = /captured_at\.asc/.test(q.get('order') || '')
    list.sort(function (a, c) { return (asc ? 1 : -1) * a.captured_at.localeCompare(c.captured_at) || a.batch_id.localeCompare(c.batch_id) || a.person_no - c.person_no })
    return list.map(withLodge)
  }

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
      if (ADMIN) {
        if (p === '/auth/v1/user') return json({ id: 'owner', aud: 'authenticated', role: 'authenticated', email: 'owner@demo' })
        if (p === '/rest/v1/profiles' && method === 'GET') return json({ id: 'owner', role: 'admin', full_name: 'Owner', lodge_id: null, lodges: null })
        if (p === '/rest/v1/lodges' && method === 'GET') return json(LODGES.map(function (l) { return { id: l.id, name: l.name, code: l.code, active: true } }))
        if (p === '/rest/v1/rpc/lodge_stats') { var t1 = document.getElementById('demo-tag'); if (t1) t1.style.display = 'none'; return json(lodgeStats()) }
        if (p === '/rest/v1/rpc/admin_insights') { var bd = {}; try { bd = JSON.parse(body) } catch (x) { /* */ } return json(insights(bd.p_days, bd.p_lodge)) }
        if (p === '/rest/v1/cleanup_runs') return json([{ ran_at: new Date(istStart(istParts(now).ymd) + 2 * 3600000).toISOString(), expired_deleted: 3, trash_deleted: 0, orphans_deleted: 1, failures: 0, details: null }])
        if (p === '/rest/v1/backup_runs') return json([{ ran_at: new Date(istStart(istParts(now).ymd) + 2.5 * 3600000).toISOString(), records: rows.length, photos_uploaded: 12, failures: 0, details: null }])
        if (p === '/rest/v1/rpc/list_trash' || p === '/rest/v1/rpc/staff_list') return json([])
        if (p === '/rest/v1/guest_ids' && method === 'GET') {
          var list = adminCards(q)
          if (q.get('batch_id')) return json(list)
          var off = Number(q.get('offset') || 0), lim = Number(q.get('limit') || 60), page = list.slice(off, off + lim)
          return json(page, 200, { 'content-range': off + '-' + (off + Math.max(0, page.length - 1)) + '/' + list.length })
        }
        if (method === 'PATCH' || method === 'POST' || method === 'DELETE') {
          if (p.indexOf('/rest/v1/') === 0 && p.indexOf('/rpc/') < 0) return json(null, 204)
        }
      }
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
    tag.textContent = ADMIN ? 'DEMO · owner passcode 123456' : 'DEMO · passcode 123456'
    tag.setAttribute('style', 'white-space:nowrap;position:fixed;left:50%;bottom:calc(6px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9999;pointer-events:none;' +
      'font:600 11px/1 -apple-system,Inter,Arial,sans-serif;letter-spacing:.06em;color:rgba(255,255,255,.9);background:rgba(0,0,0,.45);' +
      'padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.2);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)')
    document.body.appendChild(tag)
  })
})()
