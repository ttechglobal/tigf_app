/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness loads transpiled TS modules. */
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const assert = require('node:assert/strict')

function load(file, mocks = {}, extra = {}) {
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText
  vm.runInNewContext(code, {
    exports, require: name => {
      if (name in mocks) return mocks[name]
      throw Error(`Unexpected dependency: ${name}`)
    }, Date, Intl, URL, Response, process: { env: {} }, ...extra,
  }, { filename: file })
  return exports
}

async function main() {
  const date = load('lib/utils/date.ts')
  assert.equal(date.isValidDate('2024-02-29'), true)
  for (const invalid of ['2025-02-29', '2026-02-30', '2026-13-01', '10/30/2026', '0000-01-01', 'bad']) {
    assert.equal(date.isValidDate(invalid), false, invalid)
  }
  assert.equal(date.dayOfYear('2024-12-31'), 366)
  assert.equal(date.dayOfYear('2026-01-01'), 1)
  assert.equal(date.dayOfYear('2026-10-30'), 303)
  const FixedDate = class extends Date {
    constructor(...args) { super(...(args.length ? args : ['2026-01-01T00:30:00Z'])) }
  }
  const zoned = load('lib/utils/date.ts', {}, { Date: FixedDate })
  assert.equal(zoned.todayInTimezone('America/Los_Angeles'), '2025-12-31')
  assert.equal(zoned.todayInTimezone('Africa/Lagos'), '2026-01-01')

  const push = load('supabase/functions/_shared/push.ts')
  assert.equal(push.isPushEndpoint('https://fcm.googleapis.com/fcm/send/abc'), true)
  assert.equal(push.isPushEndpoint('https://web.push.apple.com/abc'), true)
  for (const endpoint of ['http://fcm.googleapis.com/a', 'https://localhost/a',
    'https://fcm.googleapis.com.evil.test/a', 'https://user:secret@fcm.googleapis.com/a',
    'https://fcm.googleapis.com:444/a', 'garbage']) {
    assert.equal(push.isPushEndpoint(endpoint), false, endpoint)
  }

  const limits = load('lib/utils/limits.ts')
  assert.equal(limits.USERNAME_PATTERN.test('ab'), false)
  assert.equal(limits.USERNAME_PATTERN.test('bad name'), false)
  assert.equal(limits.USERNAME_PATTERN.test('a'.repeat(31)), false)
  assert.equal(limits.USERNAME_PATTERN.test('good_name1'), true)

  let saved
  const entries = load('lib/actions/entries.ts', {
    'next/cache': { revalidatePath() {} },
    '@/lib/utils/limits': limits,
    '@/lib/utils/date': date,
    '@/lib/supabase/server': { createClient: async () => ({
      auth: { getUser: async () => ({ data: { user: { id: 'user-a' } } }) },
      from: () => ({ upsert: row => {
        saved = row
        return { select: () => ({ single: async () => ({ data: row }) }) }
      } }),
    }) },
  })
  assert.ok((await entries.saveEntry('2999-01-01', ['x'], 'UTC')).error)
  assert.ok((await entries.saveEntry('2026-02-30', ['x'], 'UTC')).error)
  assert.ok((await entries.saveEntry('2024-02-29', ['x'], 'Invalid/Zone')).error)
  assert.ok((await entries.saveEntry('2024-02-29', Array(51).fill('x'), 'UTC')).error)
  assert.ok((await entries.saveEntry('2024-02-29', ['x'.repeat(501)], 'UTC')).error)
  assert.equal(saved, undefined)
  const result = await entries.saveEntry('2024-02-29', ['  Family  ', ' '], 'Africa/Lagos')
  assert.equal(result.entry.date, '2024-02-29')
  assert.equal(saved.user_id, 'user-a')
  assert.equal(JSON.stringify(saved.items), '["Family"]')
  // Delete / import entries and account actions use a recording mock client.
  const calls = []
  let existingEntry = null
  const chain = (name, result = { error: null }) => {
    const q = {
      eq(column, value) { calls.push([name, 'eq', column, value]); return q },
      select() { return q },
      maybeSingle: async () => ({ data: existingEntry, error: null }),
      then(resolve) { resolve(result) },
    }
    return q
  }
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'user-a' } } }), signOut: async () => { calls.push(['signOut']) } },
    rpc: async name => { calls.push(['rpc', name]); return { error: null } },
    from: () => ({
      delete: () => chain('delete'),
      select: () => chain('select'),
      update: values => { calls.push(['update', values]); return chain('update') },
      upsert: row => ({ select: () => ({ single: async () => ({ data: row }) }) }),
    }),
  }
  const actionMocks = {
    'next/cache': { revalidatePath() {} }, 'next/navigation': { redirect(to) { throw Object.assign(Error('redirect'), { to }) } },
    '@/lib/utils/date': date, '@/lib/utils/limits': limits,
    '@/lib/supabase/server': { createClient: async () => client },
    '@/lib/utils/site-url': { getSiteUrl: async () => 'https://tigf.test' },
  }
  const entryActions = load('lib/actions/entries.ts', actionMocks)
  assert.ok((await entryActions.deleteEntry('not-a-date')).error)
  assert.equal((await entryActions.deleteEntry('2024-02-29')).deleted, true)
  assert.deepEqual(calls.filter(c => c[0] === 'delete').map(c => c.slice(2)), [['user_id', 'user-a'], ['date', '2024-02-29']])
  existingEntry = { id: 'already-there' }
  assert.equal((await entryActions.importGuestEntry('2024-02-29', ['x'], 'UTC')).skipped, true)
  existingEntry = null
  assert.ok((await entryActions.importGuestEntry('2024-02-29', ['x'], 'UTC')).entry)
  assert.ok((await entryActions.importGuestEntry('2999-01-01', ['x'], 'UTC')).error)

  const account = load('lib/actions/account.ts', actionMocks)
  const form = values => ({ get: key => values[key] })
  assert.ok((await account.updateUsername(form({ username: 'bad name' }))).error)
  assert.ok((await account.updatePassword(form({ password: 'short', confirm: 'short' }))).error)
  assert.ok((await account.updatePassword(form({ password: 'longenough1', confirm: 'different1' }))).error)
  assert.ok((await account.deleteAccount('delete')).error)
  assert.equal(calls.some(c => c[0] === 'rpc'), false)
  await assert.rejects(account.deleteAccount('DELETE'), error => error.to === '/')
  assert.deepEqual(calls.filter(c => c[0] === 'rpc'), [['rpc', 'delete_my_account']])

  // Guest entries on this device: corrupt or malformed storage is ignored, never thrown.
  const store = {}
  const guest = load('lib/utils/guest.ts', { '@/lib/utils/date': date }, {
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v }, removeItem: k => { delete store[k] } },
  })
  assert.equal(guest.readGuestEntry(), null)
  guest.writeGuestEntry({ date: '2026-01-05', items: ['Family'] })
  assert.equal(JSON.stringify(guest.readGuestEntry()), '{"date":"2026-01-05","items":["Family"]}')
  for (const bad of ['{not json', '{"date":"2026-02-30","items":["x"]}', '{"date":"2026-01-05","items":[]}',
    '{"date":"2026-01-05","items":[1]}', 'null']) {
    store[guest.GUEST_KEY] = bad
    assert.equal(guest.readGuestEntry(), null, bad)
  }
  guest.writeGuestEntry({ date: '2026-01-05', items: ['x'] })
  guest.clearGuestEntry()
  assert.equal(guest.readGuestEntry(), null)

  // Sign-up validation happens on the server, before Supabase is contacted.
  const signUps = []
  const authActions = load('lib/actions/auth.ts', {
    ...actionMocks,
    '@/lib/supabase/server': { createClient: async () => ({ auth: {
      signUp: async args => { signUps.push(args); return { data: { user: { id: 'u' }, session: null }, error: null } },
    } }) },
  })
  const signUpForm = values => ({ get: key => values[key] })
  for (const bad of [
    { username: 'ab', email: 'a@b.co', password: 'longenough1' },
    { username: 'has space', email: 'a@b.co', password: 'longenough1' },
    { username: 'good_name', email: '', password: 'longenough1' },
    { username: 'good_name', email: 'a@b.co', password: 'short' },
  ]) {
    assert.ok((await authActions.signUp(signUpForm(bad))).error, JSON.stringify(bad))
  }
  assert.equal(signUps.length, 0)
  const signedUp = await authActions.signUp(signUpForm({ username: 'good_name', email: 'a@b.co', password: 'longenough1' }))
  assert.equal(signedUp.needsConfirmation, true)
  assert.equal(signUps[0].options.emailRedirectTo, 'https://tigf.test/auth/callback?next=/dashboard')

  // The proxy skips static and PWA files so they don't trigger a session lookup.
  const proxySource = fs.readFileSync('proxy.ts', 'utf8')
  const matcherLine = proxySource.split('\n').find(l => l.includes("'/((?!")).trim().replace(/^'|',?$/g, '')
  const matcher = new RegExp('^' + matcherLine.replace(/\\\\/g, '\\') + '$')
  for (const path of ['/sw.js', '/manifest.json', '/offline.html', '/logo-tigf.png', '/_next/static/x.js']) {
    assert.equal(matcher.test(path), false, path)
  }
  for (const path of ['/', '/dashboard', '/auth/callback']) assert.equal(matcher.test(path), true, path)

  let savedReminder
  const reminderActions = load('lib/actions/reminders.ts', {
    '@/lib/utils/push': push,
    '@/lib/supabase/server': { createClient: async () => ({
      auth: { getUser: async () => ({ data: { user: { id: 'user-a' } } }) },
      from: () => ({ upsert: async row => { savedReminder = row; return { error: null } } }),
    }) },
  }, { process: { env: { NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'public' } } })
  const subscription = { endpoint: 'https://fcm.googleapis.com/test', keys: { auth: 'auth', p256dh: 'key' } }
  for (const invalid of ['18:30', '09:01', '24:00', '09:00:30']) {
    assert.ok((await reminderActions.saveReminder(subscription, invalid, 'Africa/Lagos')).error)
  }
  assert.equal(savedReminder, undefined)
  for (const hour of ['00:00', '09:00', '18:00', '23:00']) {
    assert.equal((await reminderActions.saveReminder(subscription, hour, 'Asia/Kathmandu')).error, undefined)
    assert.equal(savedReminder.time, hour)
    assert.equal(savedReminder.timezone, 'Asia/Kathmandu')
  }
  const env = { REMINDER_CRON_SECRET: 'test-secret' }
  const reminders = []
  const sent = []
  const mutations = []
  const handler = load('supabase/functions/daily-reminders/handler.ts', {
    'npm:@supabase/supabase-js@2.108.1': { createClient: () => ({
      rpc: async () => ({ data: reminders }),
      from: () => ({
        delete: () => mutation('delete'),
        update: values => mutation('update', values),
      }),
    }) },
    'npm:web-push@3.6.7': {
      setVapidDetails() {},
      sendNotification: async subscription => {
        sent.push(subscription.endpoint)
        if (subscription.endpoint.endsWith('/expired')) throw { statusCode: 410 }
        if (subscription.endpoint.endsWith('/retry')) throw { statusCode: 503 }
      },
    },
    '../_shared/push.ts': push,
  }, { Deno: { env: { get: name => env[name] } } })
  function mutation(kind, values) {
    const record = { kind, values, filters: [] }
    mutations.push(record)
    const query = {
      eq(column, value) { record.filters.push([column, value]); return query },
      then(resolve) { resolve({ error: null }) },
    }
    return query
  }
  const request = (method = 'POST', secret = 'test-secret') => new Request('https://example.com/functions/v1/daily-reminders', {
    method, headers: { authorization: `Bearer ${secret}` },
  })
  assert.equal((await handler.handleReminderRequest(request('POST', 'wrong'))).status, 401)
  delete env.REMINDER_CRON_SECRET
  assert.equal((await handler.handleReminderRequest(request())).status, 401)
  env.REMINDER_CRON_SECRET = 'test-secret'
  assert.equal((await handler.handleReminderRequest(request('GET'))).status, 405)
  assert.equal((await handler.handleReminderRequest(request())).status, 503)
  Object.assign(env, { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    VAPID_PUBLIC_KEY: 'public', VAPID_PRIVATE_KEY: 'private', VAPID_SUBJECT: 'mailto:test@example.com' })
  for (const suffix of ['ok', 'expired', 'retry']) {
    const endpoint = `https://fcm.googleapis.com/${suffix}`
    reminders.push({ endpoint, subscription: { endpoint }, last_sent_date: '2026-11-01' })
  }
  reminders.push({ endpoint: 'https://localhost/unsafe', subscription: { endpoint: 'https://localhost/unsafe' } })
  const response = await handler.handleReminderRequest(request())
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { sent: 1, failed: 3 })
  assert.equal(sent.length, 3) // Unsafe endpoints never reach the push client.
  assert.equal(mutations.filter(m => m.kind === 'delete').length, 2)
  const retry = mutations.find(m => m.kind === 'update')
  assert.equal(retry.values.last_sent_date, null)
  assert.deepEqual(retry.filters, [['endpoint', 'https://fcm.googleapis.com/retry'], ['last_sent_date', '2026-11-01']])
  assert.equal(JSON.parse(fs.readFileSync('vercel.json', 'utf8')).crons, undefined)
  console.log('Feature checks passed: dates, leap years, time zones, backdated saves, future-date rejection, push endpoint safety, cron authentication.')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
