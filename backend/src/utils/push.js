const webpush = require('web-push')
const PushSubscription = require('../models/PushSubscription')

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

async function sendPush(usuarioId, payload) {
  const subs = await PushSubscription.find({ usuario_id: usuarioId }).lean()
  if (!subs.length) return

  const results = await Promise.allSettled(
    subs.map(s => webpush.sendNotification(s.subscription, JSON.stringify(payload)))
  )

  // Remove expired/invalid subscriptions (410 Gone, 404 Not Found)
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'rejected') {
      const status = r.reason?.statusCode
      if (status === 410 || status === 404) {
        await PushSubscription.deleteOne({ _id: subs[i]._id }).catch(() => {})
      }
    }
  }
}

module.exports = { sendPush }
