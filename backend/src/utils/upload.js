const multer = require('multer')
const cloudinary = require('cloudinary').v2
const { Readable } = require('stream')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Solo se permiten imágenes'))
  },
})

async function uploadToCloudinary(buffer, folder, publicId) {
  return new Promise((resolve, reject) => {
    const opts = { folder: `liga-manager/${folder}`, resource_type: 'image' }
    if (publicId) opts.public_id = publicId
    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) reject(err)
      else resolve(result.secure_url)
    })
    Readable.from(buffer).pipe(stream)
  })
}

async function deleteFromCloudinary(url) {
  if (!url) return
  const parts = url.split('/')
  const filename = parts[parts.length - 1].split('.')[0]
  const folder = parts[parts.length - 2]
  await cloudinary.uploader.destroy(`liga-manager/${folder}/${filename}`)
}

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary }
