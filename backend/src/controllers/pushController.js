const PushSubscription = require('../models/PushSubscription')

exports.vapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
}

exports.subscribe = async (req, res, next) => {
  try {
    const { subscription } = req.body
    if (!subscription?.endpoint) return res.status(400).json({ error: 'Subscription inválida' })

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      { usuario_id: req.user.id, subscription },
      { upsert: true }
    )
    res.json({ ok: true })
  } catch (err) { next(err) }
}

exports.unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body
    if (endpoint) await PushSubscription.deleteOne({ endpoint })
    res.json({ ok: true })
  } catch (err) { next(err) }
}
