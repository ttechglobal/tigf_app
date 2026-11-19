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
