import { Page, expect } from '@playwright/test'

export const BASE = ''
export const EMAIL = 'admin@ligamanager.pro'
export const PASSWORD = 'Admin2026!Liga'
export const LIGA_ID = '69f1853c3f772b8b80f04e7e'

/** Navigates SPA-internally without a full page reload (avoids GitHub Pages 404) */
export async function spaGo(page: Page, path: string) {
  await page.evaluate((p) => {
    window.history.pushState({}, '', p)
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
  }, `/liga-manager-pro${path}`)
  await page.waitForTimeout(400)
}

/** Login and wait for dashboard */
export async function login(page: Page) {
  await page.goto('/liga-manager-pro')
  // Prevent the welcome tour from auto-firing (it reads this localStorage key)
  await page.evaluate(() => localStorage.setItem('tour_completado', '1'))

  // If already on dashboard skip login
  if (page.url().includes('/dashboard') || page.url().includes('/admin')) return

  await page.locator('nav a[href="/liga-manager-pro/login"]').click()
  await page.waitForURL('**/login')
  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 })
}

/** Ensure the SPA app is loaded (not GitHub Pages 404) */
export async function ensureAppLoaded(page: Page) {
  const title = await page.title()
  expect(title).not.toContain('not found')
  expect(title).toContain('LigaManager')
}

/** Wait for a toast message to appear */
export async function waitForToast(page: Page, text: string) {
  await expect(page.locator('[data-hot-toast]').first()).toContainText(text, { timeout: 8000 })
}

/** Close any open modal by pressing Escape */
export async function closeModal(page: Page) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
}
