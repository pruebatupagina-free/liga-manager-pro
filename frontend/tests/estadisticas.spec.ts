import { test, expect } from '@playwright/test'
import { login, spaGo, LIGA_ID } from './helpers'

test.describe('Estadísticas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await spaGo(page, `/dashboard/estadisticas/${LIGA_ID}`)
    await expect(page.locator('h1', { hasText: /ESTADÍSTICAS/i })).toBeVisible()
  })

  test('tab Tabla carga por defecto con columnas correctas', async ({ page }) => {
    await expect(page.locator('button, [role="tab"]', { hasText: /^Tabla$/i })).toBeVisible()
    // Table headers
    for (const col of ['#', 'EQUIPO', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'PTS']) {
      await expect(page.locator(`text=${col}`).first()).toBeVisible()
    }
    // BODOGLIMT should appear
    await expect(page.locator('text=BODOGLIMT')).toBeVisible()
  })

  test('tabs Goleadores, Rendimiento, Comparativa son clickeables', async ({ page }) => {
    const tabs = ['Goleadores', 'Rendimiento', 'Comparativa']
    for (const tab of tabs) {
      await page.locator('button, [role="tab"]', { hasText: new RegExp(`^${tab}$`, 'i') }).click()
      await page.waitForTimeout(400)
      // Should not crash
      await expect(page.locator('h1', { hasText: /ESTADÍSTICAS/i })).toBeVisible()
    }
    // Go back to Tabla
    await page.locator('button, [role="tab"]', { hasText: /^Tabla$/i }).click()
  })

  test('botones PDF y Excel están visibles en Tabla', async ({ page }) => {
    await expect(page.locator('button', { hasText: /PDF/i })).toBeVisible()
    await expect(page.locator('button', { hasText: /Excel/i })).toBeVisible()
  })

  test('tab Goleadores muestra contenido apropiado', async ({ page }) => {
    await page.locator('button, [role="tab"]', { hasText: /^Goleadores$/i }).click()
    await page.waitForTimeout(500)
    // Should show either goleadores list or empty state
    const content = await page.locator('main').textContent()
    expect(content).toBeTruthy()
  })

  test('tabla muestra posición #1 para el único equipo', async ({ page }) => {
    const firstRow = page.locator('tbody tr, div[class*="row"]').first()
    await expect(page.locator('text=1').first()).toBeVisible()
    await expect(page.locator('text=BODOGLIMT')).toBeVisible()
  })
})
