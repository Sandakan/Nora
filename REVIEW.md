---
phase: code-review
reviewed: 2026-05-18T10:00:00Z
depth: deep
files_reviewed: 13
files_reviewed_list:
  - resources/drizzle/0004_add_scrobble_queue.sql
  - resources/drizzle/meta/_journal.json
  - src/main/db/queries/scrobble_queue.ts
  - src/main/db/schema.ts
  - src/main/ipc.ts
  - src/main/main.ts
  - src/main/other/lastFm/flushScrobbleQueue.ts
  - src/main/other/lastFm/generateApiRequestBodyForLastFMPostRequests.ts
  - src/main/other/lastFm/scrobbleSong.ts
  - src/main/other/lastFm/sendFavoritesDataToLastFM.ts
  - src/main/other/lastFm/sendNowPlayingSongDataToLastFM.ts
  - src/preload/index.ts
  - src/types/app.d.ts
findings:
  critical: 4
  warning: 5
  info: 2
  total: 11
status: issues_found
---

# Code Review Report: Offline Scrobble Queue (fix/462-offline-scrobble-queue)

**Reviewed:** 2026-05-18T10:00:00Z
**Depth:** deep
**Files Reviewed:** 13 over 7 modules
**Status:** issues_found

## Summary

The fix adds an offline scrobble queue table and flush mechanism. The core architecture (queue DB table, queuing on failure, flush on reconnect) is the right shape. However, the implementation has four blocker-grade defects — including a migration that will silently fail at startup, queuing of ephemeral "now playing" data, zombie entries on crash, and silent data loss on queue overflow. There are no tests for any of this new stateful logic.

## Critical Issues

### CR-01: Migration journal tag mismatches SQL filename — migration will fail at startup

**File:** `resources/drizzle/meta/_journal.json:33`
**File:** `resources/drizzle/0004_add_scrobble_queue.sql`

**Issue:** The Drizzle journal entry `idx: 3` has `tag: "0003_add_scrobble_queue"`, but the SQL file on disk is named `0004_add_scrobble_queue.sql`. Drizzle's `migrate()` function resolves migration files as `{migrationsFolder}/{tag}.sql`, so it will look for `resources/drizzle/0003_add_scrobble_queue.sql` — a file that does not exist. This causes a startup crash for all users when `db.ts` calls `migrate()`.

The commit message says "renumber scrobble migration to 0004 to avoid conflict with tray click migration", but the tag in `_journal.json` was never updated to reflect the renumbering. The journal says `0003_`, the file says `0004_`.

**Fix:** Update the journal tag to match the filename:

```json
{
  "idx": 3,
  "version": "7",
  "when": 1776816000000,
  "tag": "0004_add_scrobble_queue",
  "breakpoints": true
}
```

Alternatively, rename the file to `resources/drizzle/0003_add_scrobble_queue.sql` and update the filename reference everywhere. Either approach works — the key is that the tag and filename must match.

---

### CR-02: Ephemeral "now playing" updates are queued and replayed as stale data

**File:** `src/main/other/lastFm/sendNowPlayingSongDataToLastFM.ts:35-36` (on fix branch)

**Issue:** The function queues `now_playing` operations when offline:
```typescript
if (!isConnectedToInternet) {
  await insertScrobble({ songId, operationType: 'now_playing' });
  return logger.debug('Now playing queued for later - offline', { songId });
}
```

Last.fm's "now playing" is an ephemeral heartbeat — it tells Last.fm "this user is currently listening to this track." Unlike scrobbles (which are permanent play records), "now playing" is a status indicator. When the app comes back online and flushes the queue, it will replay stale song data as if the user is currently listening to a song they played 30 minutes ago. This pollutes the user's Last.fm profile with incorrect current-track data.

The issue requirement says "scrobbles should be queued" — `track.scrobble` is a scrobble; `track.updateNowPlaying` is not. This is over-queuing.

**Fix:** Drop "now playing" updates when offline instead of queuing them:

```typescript
if (!isConnectedToInternet) {
  return logger.debug('Now playing skipped - offline', { songId });
}
```

The `now_playing` case should also be removed from `processItem` in `flushScrobbleQueue.ts` unless there is a clear product requirement to replay it (and there isn't one in issue #462).

---

### CR-03: Stuck 'sending' zombie entries on app crash or quit during flush

**File:** `src/main/db/queries/scrobble_queue.ts:31-42` (claimPendingBatch)
**File:** `src/main/db/queries/scrobble_queue.ts:86-97` (deleteOldPending)

**Issue:** `claimPendingBatch` sets items to status `'sending'` before processing them. If the app is killed or crashes during `flushScrobbleQueue` (which is fire-and-forget in `main.ts:370`), items left in `'sending'` status become zombies:
- `claimPendingBatch` only selects items with status `'pending'` — zombies are invisible.
- `deleteOldPending` only prunes `'pending'` and `'failed'` statuses — zombies survive.
- No startup recovery mechanism resets stuck `'sending'` items back to `'pending'`.

These entries accumulate in the database permanently, taking up space and never being retried. The only recovery path is manual SQL intervention.

**Fix:** Add startup recovery in `flushScrobbleQueue` (or in `main.ts` before first flush) to reset any `'sending'` items back to `'pending'`:

```typescript
// At the start of flushScrobbleQueue, before deleteOldPending:
await db
  .update(scrobbleQueue)
  .set({ status: 'pending' })
  .where(eq(scrobbleQueue.status, 'sending'));
```

---

### CR-04: Queue overflow silently drops scrobbles — no warning emitted

**File:** `src/main/db/queries/scrobble_queue.ts:24-27` (insertScrobble)

**Issue:** When the queue reaches `MAX_QUEUE_SIZE` (1000), `insertScrobble` silently returns without inserting:
```typescript
const count = await getPendingCount(trx);
if (count >= MAX_QUEUE_SIZE) return;
```

The caller (`scrobbleSong`, `sendFavoritesDataToLastFM`, etc.) receives no feedback that their data was dropped. From the caller's perspective, the function returned normally. The scrobble is silently lost with zero evidence in the logs.

This also means two distinct scenarios are indistinguishable in logs:
1. "Scrobble queued for retry" (insert succeeded)
2. "Scrobble queued for retry" (insert silently no-opped due to overflow)

**Fix:** Log a warning when dropping due to queue full:

```typescript
if (count >= MAX_QUEUE_SIZE) {
  logger.warn('Scrobble queue full, dropping item', { operationType: params.operationType });
  return;
}
```

---

## Warnings

### WR-01: Race condition in claimPendingBatch — two concurrent flushes can process the same items

**File:** `src/main/db/queries/scrobble_queue.ts:31-49`

**Issue:** `claimPendingBatch` operates in two non-atomic steps:
1. `SELECT ... WHERE status = 'pending' ... LIMIT batchSize`
2. `UPDATE ... SET status = 'sending' WHERE id IN (...)`

Because `flushScrobbleQueue` can be invoked concurrently (once from `main.ts:370` on startup, and once from `ipc.ts:595` on connectivity change), two parallel invocations can select the same batch before either marks them as `'sending'`. Both invocations then attempt to process and `postToLastFm` the same items, causing duplicate scrobble submissions to Last.fm.

PGlite does support row-level locking. The fix should use `FOR UPDATE SKIP LOCKED` inside a transaction to atomically claim items.

**Fix:** Implement atomic claiming using a single SQL operation:

```typescript
export async function claimPendingBatch(
  batchSize: number,
  trx: DB | DBTransaction = db
): Promise<Array<typeof scrobbleQueue.$inferSelect>> {
  const items = await trx.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(scrobbleQueue)
      .where(
        and(
          eq(scrobbleQueue.status, 'pending'),
          lte(scrobbleQueue.retryCount, MAX_RETRY_COUNT)
        )
      )
      .orderBy(asc(scrobbleQueue.createdAt))
      .limit(batchSize)
      .for('update', { skipLocked: true });

    if (rows.length > 0) {
      const ids = rows.map((i) => i.id);
      await tx
        .update(scrobbleQueue)
        .set({ status: 'sending' })
        .where(inArray(scrobbleQueue.id, ids));
    }
    return rows;
  });
  return items;
}
```

(Note: requires drizzle-orm version that supports `.for()` on PGlite.)

---

### WR-02: `as any` cast defeats type safety in the critical API call path

**File:** `src/main/other/lastFm/flushScrobbleQueue.ts:113`

**Issue:** The `postToLastFm` function casts its argument with `as any`:
```typescript
const body = generateApiRequestBodyForLastFMPostRequests({ method, authData, params } as any);
```

The upstream type `LastFMApi` (exported from `generateApiRequestBodyForLastFMPostRequests.ts:9`) is a discriminated union where the `params` type is constrained by `method`. The `as any` cast bypasses this entirely, allowing any params to pair with any method at compile time. If the `processItem` switch is extended with a new case, a mismatched `method`/`params` pair would only be caught at runtime.

**Fix:** Remove `as any` by properly constructing the argument. Since TypeScript's discriminated union narrowing doesn't easily apply across variable assignments, use a type-safe helper:

```typescript
function buildBody(
  method: LastFMApi['method'],
  authData: AuthData,
  params: LastFMApi['params']
): string {
  return generateApiRequestBodyForLastFMPostRequests({ method, authData, params } as LastFMApi);
}
```

---

### WR-03: Zero test coverage for scrobble queue logic

**File:** (no test files found)

**Issue:** No tests exist for the scrobble queue. The feature introduces complex stateful logic with retries, status transitions, batch claiming, flush orchestration, and queue overflow — all of which are untested. Existing test infrastructure (`vitest.config.ts`, `test/setup.ts`, existing tests in `test/src/main/`) exists and could be extended.

**Tests that should be added:**

| Test | Scope | Key assertions |
|------|-------|----------------|
| `insertScrobble` enforces max queue size | unit | Insert beyond 1000 is silently dropped |
| `insertScrobble` writes correct fields | unit | DB row matches input params |
| `claimPendingBatch` FIFO ordering | unit | Returns oldest items first |
| `claimPendingBatch` respects retryCount | unit | Items with retryCount > MAX_RETRY are excluded |
| `claimPendingBatch` marks as 'sending' | unit | Selected items have status 'sending' after call |
| `markFailed` increments retryCount | unit | retryCount +1, status back to 'pending' |
| `markFailed` moves to 'failed' at limit | unit | retryCount >= MAX_RETRY → status 'failed' |
| `markSent` deletes the row | unit | Row no longer exists |
| `deleteOldPending` prunes old items | unit | Items older than TTL are removed |
| `flushScrobbleQueue` no-op when offline | integration | Returns without making HTTP calls |
| `flushScrobbleQueue` no-op without auth | integration | Returns without making HTTP calls |
| `flushScrobbleQueue` full flow | integration | Processes batch, marks sent, moves to next batch |
| `processItem` throws on missing scrobble params | unit | songId=null or startTimeSecs=null throws |
| `processItem` throws on unknown operationType | unit | Unknown type throws Error |
| Concurrent `claimPendingBatch` race | unit | Two callers don't get overlapping items |
| Stuck 'sending' recovery | integration | Items reset to 'pending' on startup |

---

### WR-04: Unrelated `importPlaylistFromPath` changes mixed into scrobble queue branch

**File:** `src/main/ipc.ts:34, 536`

**Issue:** The diff includes:
```typescript
import importPlaylist, { importPlaylistFromPath } from './core/importPlaylist';
```
and:
```typescript
ipcMain.handle('app/importPlaylistFromPath', (_, filePath: string, targetPlaylistId?: number) =>
  importPlaylistFromPath(filePath, targetPlaylistId)
);
```

This `importPlaylistFromPath` IPC handler and its import are unrelated to the offline scrobble queue feature. Including unrelated changes in a feature branch makes review harder, introduces merge risk, and violates a single-responsibility branch pattern.

The same applies to the removal of the `updateTraySingleClickBehavior` IPC handler and preload API — while those cleanups may be related to the tray click feature that was also on this branch's migration, they are separable concerns.

**Fix:** Split unrelated IPC changes into a separate branch/PR.

---

### WR-05: `flushScrobbleQueue` invoked as fire-and-forget on startup

**File:** `src/main/main.ts:370`

**Issue:**
```typescript
initializeIPC(mainWindow, abortController.signal);
flushScrobbleQueue();
checkForUpdates();
```

`flushScrobbleQueue()` is an `async` function called without `await` inside an `async` lambda. The promise is not tracked. If it rejects (internally unhandled), the unhandled rejection won't crash the app (errors are caught internally), but there's also no ordering guarantee — it will run interleaved with `checkForUpdates()` and subsequent startup logic.

More critically, the database module (`db.ts`) is a top-level module that runs migrations on import. If `flushScrobbleQueue` runs before the DB is fully initialized (e.g., due to module import ordering), it will fail. While this *probably* works today because importing schema/queries modules transitively imports `db.ts`, there's no explicit dependency chain guaranteeing it.

**Fix:** Either await the result (if order matters) or add a clear comment explaining this is intentionally fire-and-forget:

```typescript
// Fire-and-forget: flush runs asynchronously; errors handled internally
flushScrobbleQueue();
```

---

## Info

### IN-01: Commented-out code left in main.ts

**File:** `src/main/main.ts:93, 320`

**Issue:** Two lines of commented-out code remain:
```typescript
// let isConnectedToInternet = false;
```
```typescript
// powerMonitor.addListener('shutdown', (e) => e.preventDefault());
```

The first was the old connectivity tracking variable (now unused since the code uses `net.isOnline()` directly). The second appears to be a speculative shutdown handler. Neither serves a purpose and both reduce code clarity.

**Fix:** Remove both commented-out lines.

---

### IN-02: `sql.raw` used with a constant in `deleteOldPending`

**File:** `src/main/db/queries/scrobble_queue.ts:93`

**Issue:**
```typescript
const cutoff = sql`NOW() - INTERVAL '${sql.raw(String(TTL_DAYS))} days'`;
```

While `TTL_DAYS` is a compile-time constant (`30`) and not user-injectable, using `sql.raw` to interpolate it sets a pattern that could be copied by future developers and used with dynamic values. Drizzle provides parameterized interpolation via `${variable}` for safe SQL construction.

**Fix:** Drizzle's tagged template `sql` handles parameter injection directly:
```typescript
const cutoff = sql`NOW() - INTERVAL '30 days'`;
```

Or if the constant must remain configurable:
```typescript
const cutoff = sql`NOW() - INTERVAL ${sql`${TTL_DAYS} days`}`;
```

---

_Reviewed: 2026-05-18T10:00:00Z_
_Reviewer: nora (gsd-code-reviewer)_
_Depth: deep_
