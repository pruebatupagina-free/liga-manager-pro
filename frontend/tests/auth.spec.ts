import { test, expect } from '@playwright/test'
import { login, spaGo } from './helpers'

test.describe('Autenticación', () => {
  test('landing page carga correctamente', async ({ page }) => {
    await page.goto('/liga-manager-pro')
    await expect(page).toHaveTitle(/LigaManager/)
    await expect(page.locator('h1')).toContainText('TU LIGA')
    await expect(page.locator('nav a', { hasText: 'Iniciar sesión' })).toBeVisible()
  })

  test('login con credenciales vacías muestra error', async ({ page }) => {
    await page.goto('/liga-manager-pro')
    await page.locator('nav a[href="/liga-manager-pro/login"]').click()
    await page.waitForURL('**/login')
    // Submit without filling
    await page.locator('button[type="submit"]').click()
    // Toast should appear (empty fields)
    await expect(page.locator('text=Completa todos los campos').first()).toBeVisible({ timeout: 5000 })
  })

  test('login con credenciales incorrectas muestra error', async ({ page }) => {
    await page.goto('/liga-manager-pro')
    await page.locator('nav a[href="/liga-manager-pro/login"]').click()
    await page.waitForURL('**/login')
    await page.locator('#email').fill('wrong@email.com')
    await page.locator('#password').fill('wrongpassword')
    await page.locator('button[type="submit"]').click()
    // Wait for the error toast text (API may be slow)
    await expect(page.locator('text=Credenciales incorrectas').or(
      page.locator('text=/[Ii]ncorrectas|[Ii]nválidas|[Nn]o encontrado/')
    ).first()).toBeVisible({ timeout: 15000 })
  })

  test('login exitoso redirige al admin (superadmin)', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/admin|\/dashboard/)
    // Sidebar should be visible
    await expect(page.locator('text=Dashboard').first()).toBeVisible()
  })

  test('toggle mostrar/ocultar contraseña funciona', async ({ page }) => {
    await page.goto('/liga-manager-pro')
    await page.locator('nav a[href="/liga-manager-pro/login"]').click()
    await page.waitForURL('**/login')
    const pwdInput = page.locator('#password')
    await expect(pwdInput).toHaveAttribute('type', 'password')
    await page.locator('button[aria-label*="ontr"]').click()
    await expect(pwdInput).toHaveAttribute('type', 'text')
    await page.locator('button[aria-label*="cultar"]').click()
    await expect(pwdInput).toHaveAttribute('type', 'password')
  })

  test('ruta privada sin auth redirige a login', async ({ page }) => {
    // Clear any existing auth
    await page.goto('/liga-manager-pro')
    await page.evaluate(() => localStorage.removeItem('token'))
    await spaGo(page, '/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('logout limpia sesión y redirige al landing', async ({ page }) => {
    await login(page)
    // Navigate to dashboard to have the Cerrar sesión button visible
    await page.locator('button', { hasText: /Cerrar sesión/i }).click()
    // Sidebar logout navigates to /login
    await page.waitForURL(/\/login/, { timeout: 10000 })
    // Token must be gone
    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeNull()
  })
})
