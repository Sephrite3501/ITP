
import schedule from 'node-schedule'
import pool from '../db/index.js'
import { snapshotCommittees } from '../controllers/committeeController.js'
import { logSecurityEvent } from '../services/logService.js'

let nextSnapshotJob = null

export async function scheduleNextSnapshot() {

  const { rows: cfg } = await pool.query(
    `SELECT term_years FROM committee_settings LIMIT 1`
  )
  const term = cfg[0]?.term_years || 2


  const { rows: prev } = await pool.query(`
    SELECT period_end
      FROM committee_snapshots
     ORDER BY period_end DESC
     LIMIT 1
  `)
  const lastEnd = prev[0]?.period_end ?? new Date()


  const nextRun = new Date(lastEnd)
  nextRun.setFullYear(nextRun.getFullYear() + term)
  const now = new Date()

  const traceId = `SNAPSHOT-${Math.random().toString(36).slice(2,7).toUpperCase()}`
  const ip      = 'system'
  const ua      = 'scheduler'

  await logSecurityEvent({
    traceId,
    action: 'schedule_next_snapshot',
    status: nextRun <= now ? 'overdue' : 'scheduled',
    ip,
    userAgent: ua,
    message: nextRun <= now
      ? `Overdue: lastEnd=${lastEnd.toISOString()}, firing immediately`
      : `Next snapshot at ${nextRun.toISOString()} (term=${term}y)`
  })

  if (nextRun <= now) {
    try {
      await snapshotCommittees()
      await logSecurityEvent({
        traceId,
        action: 'snapshot_fire',
        status: 'success',
        ip,
        userAgent: ua,
        message: 'Overdue snapshot taken immediately'
      })
    } catch (err) {
      await logSecurityEvent({
        traceId,
        action: 'snapshot_fire',
        status: 'error',
        ip,
        userAgent: ua,
        message: err.message
      })
    }
    
    return scheduleNextSnapshot().catch(async err => {
      console.error(`${traceId} recursive schedule error:`, err)
      await logSecurityEvent({
        traceId,
        action: 'schedule_recursive_error',
        status: 'error',
        ip, userAgent: ua,
        message: err.message
      })
    })
  }

  console.log(`→ scheduling next snapshot on ${nextRun.toISOString()} (term=${term}y)`)


  if (nextSnapshotJob) nextSnapshotJob.cancel()


  nextSnapshotJob = schedule.scheduleJob(nextRun, async () => {
    try {
      await snapshotCommittees()
      await logSecurityEvent({
        traceId,
        action: 'snapshot_fire',
        status: 'success',
        ip,
        userAgent: ua,
        message: 'Scheduled snapshot taken'
      })
    } catch (err) {
      console.error(`${traceId} scheduled snapshot error:`, err)
      await logSecurityEvent({
        traceId,
        action: 'snapshot_fire',
        status: 'error',
        ip,
        userAgent: ua,
        message: err.message
      })
    }

    scheduleNextSnapshot().catch(async err => {
      console.error(`${traceId} post-fire schedule error:`, err)
      await logSecurityEvent({
        traceId,
        action: 'schedule_postfire_error',
        status: 'error',
        ip, userAgent: ua,
        message: err.message
      })
    })
  })
}
