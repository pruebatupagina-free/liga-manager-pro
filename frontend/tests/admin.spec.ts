import { test, expect } from '@playwright/test'
import { login, spaGo } from './helpers'

test.describe('Panel Admin (Superadmin)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await spaGo(page, '/admin')
    await expect(page.locator('h1', { hasText: /PANEL ADMIN/i })).toBeVisible({ timeout: 8000 })
  })

  test('panel admin carga con tabla de usuarios', async ({ page }) => {
    await expect(page.locator('text=usuarios')).toBeVisible()
    // Table headers present
    for (const h of ['Usuario', 'Email', 'Rol', 'Plan', 'Licencia']) {
      await expect(page.locator(`th, td`, { hasText: new RegExp(`^${h}$`, 'i') }).first()).toBeVisible()
    }
  })

  test('campo de búsqueda está presente', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="email"], input[placeholder*="username"], input[placeholder*="Buscar"]')
    await expect(searchInput.first()).toBeVisible()
  })

  test('campo de búsqueda filtra usuarios', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="email"]').first()
    await searchInput.fill('admin')
    await page.waitForTimeout(600)
    // Should show at least the admin user
    await expect(page.locator('td', { hasText: /admin/i }).first()).toBeVisible()
  })

  test('tabla muestra al menos 1 usuario', async ({ page }) => {
    // Wait for the API to load rows before counting
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })
    const count = await page.locator('tbody tr').count()
    expect(count).toBeGreaterThan(0)
  })

  test('botón Licencia abre modal', async ({ page }) => {
    const licBtn = page.locator('button', { hasText: /^Licencia$/i }).first()
    await expect(licBtn).toBeVisible()
    await licBtn.click()
    await expect(page.locator('text=EDITAR LICENCIA')).toBeVisible()
  })

  test('modal de licencia tiene campos estado, plan y fecha', async ({ page }) => {
    await page.locator('button', { hasText: /^Licencia$/i }).first().click()
    await expect(page.locator('text=EDITAR LICENCIA')).toBeVisible()
    // Estado select
    await expect(page.locator('select').nth(0)).toBeVisible()
    // Plan select
    await expect(page.locator('select').nth(1)).toBeVisible()
    // Date input
    await expect(page.locator('input[type="date"]')).toBeVisible()
    // Action buttons
    await expect(page.locator('button', { hasText: /Cancelar/i })).toBeVisible()
    await expect(page.locator('button', { hasText: /Actualizar/i })).toBeVisible()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('modal licencia estado tiene opciones correctas', async ({ page }) => {
    await page.locator('button', { hasText: /^Licencia$/i }).first().click()
    const estadoSelect = page.locator('select').nth(0)
    const options = await estadoSelect.locator('option').allTextContents()
    expect(options).toContain('activa')
    expect(options).toContain('vencida')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('modal licencia plan tiene opciones correctas', async ({ page }) => {
    await page.locator('button', { hasText: /^Licencia$/i }).first().click()
    const planSelect = page.locator('select').nth(1)
    const options = await planSelect.locator('option').allTextContents()
    expect(options).toContain('basico')
    expect(options).toContain('profesional')
    expect(options).toContain('ilimitado')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('indicador en línea muestra presencia', async ({ page }) => {
    // Text like "N en línea" should be visible
    await expect(page.locator('text=/\\d+ en línea/')).toBeVisible()
  })

  test('cancelar en modal cierra sin guardar', async ({ page }) => {
    await page.locator('button', { hasText: /^Licencia$/i }).first().click()
    await expect(page.locator('text=EDITAR LICENCIA')).toBeVisible()
    await page.locator('button', { hasText: /Cancelar/i }).click()
    await page.waitForTimeout(400)
    await expect(page.locator('text=EDITAR LICENCIA')).not.toBeVisible()
  })
})
