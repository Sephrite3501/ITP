
import schedule from 'node-schedule'
import pool from '../db/index.js'
import { snapshotCommittees } from '../controllers/committeeController.js'

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

  if (nextRun <= now) {
    console.log(
      `→ overdue! period_end was ${lastEnd.toISOString()}, ` +
      `term=${term}s → firing snapshot immediately.`
    )
    try {
      await snapshotCommittees()
      console.log('✔ snapshot taken at', new Date().toISOString())
    } catch (err) {
      console.error('Error in overdue snapshot:', err)
    }

    return scheduleNextSnapshot().catch(console.error)
  }

  console.log(`→ scheduling next snapshot on ${nextRun.toISOString()} (term=${term}y)`)


  if (nextSnapshotJob) nextSnapshotJob.cancel()


  nextSnapshotJob = schedule.scheduleJob(nextRun, async () => {
    try {
      await snapshotCommittees()
      console.log('✔ snapshot taken at', new Date().toISOString())
    } catch (err) {
      console.error('Error in scheduled snapshot:', err)
    }

    scheduleNextSnapshot().catch(console.error)
  })
}
