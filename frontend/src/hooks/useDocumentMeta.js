import { useEffect } from 'react'

function setMeta(selector, attr, value) {
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    const [, key, name] = selector.match(/meta\[(\w+)="([^"]+)"\]/) || []
    if (key && name) el.setAttribute(key, name)
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

export default function useDocumentMeta({ title, description, ogTitle, ogDescription, ogImage }) {
  useEffect(() => {
    if (title) document.title = title
    if (description) setMeta('meta[name="description"]', 'content', description)
    if (ogTitle) setMeta('meta[property="og:title"]', 'content', ogTitle)
    if (ogDescription) setMeta('meta[property="og:description"]', 'content', ogDescription)
    if (ogImage) setMeta('meta[property="og:image"]', 'content', ogImage)
  }, [title, description, ogTitle, ogDescription, ogImage])
}
