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

  const push = load('lib/utils/push.ts')
  assert.equal(push.isPushEndpoint('https://fcm.googleapis.com/fcm/send/abc'), true)
  assert.equal(push.isPushEndpoint('https://web.push.apple.com/abc'), true)
  for (const endpoint of ['http://fcm.googleapis.com/a', 'https://localhost/a',
    'https://fcm.googleapis.com.evil.test/a', 'https://user:secret@fcm.googleapis.com/a',
    'https://fcm.googleapis.com:444/a', 'garbage']) {
    assert.equal(push.isPushEndpoint(endpoint), false, endpoint)
  }

  let saved
  const entries = load('lib/actions/entries.ts', {
    'next/cache': { revalidatePath() {} },
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
  assert.equal(saved, undefined)
  const result = await entries.saveEntry('2024-02-29', ['  Family  ', ' '], 'Africa/Lagos')
  assert.equal(result.entry.date, '2024-02-29')
  assert.equal(saved.user_id, 'user-a')
  assert.equal(JSON.stringify(saved.items), '["Family"]')
  const route = load('app/api/reminders/route.ts', {
    '@supabase/supabase-js': {}, 'web-push': {}, '@/lib/utils/push': push,
  })
  assert.equal((await route.GET(new Request('https://example.com/api/reminders'))).status, 401)
  console.log('Feature checks passed: dates, leap years, time zones, backdated saves, future-date rejection, push endpoint safety, cron authentication.')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
