const { Post, Liga, Equipo } = require('../models')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')

async function verificarAcceso(ligaId, user) {
  if (user.rol === 'superadmin') return true
  if (user.rol === 'admin_liga') return !!(await Liga.exists({ _id: ligaId, admin_id: user.id }))
  if (user.rol === 'dueno_equipo') return !!(await Equipo.exists({ liga_id: ligaId, dueno_id: user.id }))
  return false
}

// GET /api/posts?liga_id=xxx&cursor=lastId
exports.getAll = async (req, res, next) => {
  try {
    const { liga_id, cursor } = req.query
    if (!liga_id) return res.status(400).json({ error: 'liga_id requerido' })
    if (!(await verificarAcceso(liga_id, req.user))) return res.status(403).json({ error: 'Sin acceso' })

    const filter = { liga_id }
    if (cursor) filter._id = { $lt: cursor }

    const posts = await Post.find(filter).sort({ _id: -1 }).limit(20).lean()
    const hasMore = posts.length === 20
    res.json({ posts, hasMore })
  } catch (err) { next(err) }
}

// POST /api/posts
exports.create = [
  upload.single('imagen'),
  async (req, res, next) => {
    try {
      const { liga_id, texto } = req.body
      if (!liga_id || !texto?.trim()) return res.status(400).json({ error: 'liga_id y texto requeridos' })
      if (!(await verificarAcceso(liga_id, req.user))) return res.status(403).json({ error: 'Sin acceso' })

      let autor_nombre = req.user.username
      let autor_logo = null

      if (req.user.rol === 'dueno_equipo') {
        const eq = await Equipo.findOne({ liga_id, dueno_id: req.user.id }).lean()
        if (eq) { autor_nombre = eq.nombre; autor_logo = eq.logo }
      } else if (req.user.rol === 'admin_liga') {
        const liga = await Liga.findById(liga_id).lean()
        if (liga) { autor_nombre = liga.nombre; autor_logo = liga.logo || null }
      }

      let imagenUrl = null
      if (req.file) imagenUrl = await uploadToCloudinary(req.file.buffer, 'posts')

      const post = await Post.create({
        liga_id, texto: texto.trim(), imagen: imagenUrl,
        autor_id: req.user.id, autor_nombre, autor_logo, autor_tipo: req.user.rol,
      })
      res.status(201).json(post)
    } catch (err) { next(err) }
  },
]

// DELETE /api/posts/:id
exports.remove = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post no encontrado' })

    const esAutor = post.autor_id.toString() === req.user.id
    const esAdmin = req.user.rol === 'superadmin' ||
      (req.user.rol === 'admin_liga' && await Liga.exists({ _id: post.liga_id, admin_id: req.user.id }))

    if (!esAutor && !esAdmin) return res.status(403).json({ error: 'Sin acceso' })

    if (post.imagen) await deleteFromCloudinary(post.imagen)
    await post.deleteOne()
    res.json({ ok: true })
  } catch (err) { next(err) }
}

// PUT /api/posts/:id/like
exports.toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post no encontrado' })
    if (!(await verificarAcceso(post.liga_id, req.user))) return res.status(403).json({ error: 'Sin acceso' })

    const uid = req.user.id
    const idx = post.likes.findIndex(l => l.toString() === uid)
    if (idx === -1) post.likes.push(uid)
    else post.likes.splice(idx, 1)

    await post.save()
    res.json({ likes: post.likes.length, liked: idx === -1 })
  } catch (err) { next(err) }
}
