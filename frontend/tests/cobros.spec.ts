import { test, expect } from '@playwright/test'
import { login, spaGo, LIGA_ID } from './helpers'

test.describe('Cobros', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await spaGo(page, `/dashboard/cobros/${LIGA_ID}`)
    await expect(page.locator('h1', { hasText: /COBROS/i })).toBeVisible()
  })

  test('página de cobros carga con resumen financiero', async ({ page }) => {
    await expect(page.locator('text=/Cobrado:/i')).toBeVisible()
    await expect(page.locator('text=/Pendiente:/i')).toBeVisible()
  })

  test('botones de filtro están presentes y funcionan', async ({ page }) => {
    const filtros = ['Todos', 'Con hora fija', 'Sin hora fija', 'Con deuda', 'Al día']
    for (const filtro of filtros) {
      const btn = page.locator('button', { hasText: new RegExp(`^${filtro}`, 'i') }).first()
      await expect(btn).toBeVisible()
    }
    // Click each filter
    await page.locator('button', { hasText: /Con deuda/i }).first().click()
    await page.waitForTimeout(300)
    await page.locator('button', { hasText: /Al día/i }).first().click()
    await page.waitForTimeout(300)
    await page.locator('button', { hasText: /^Todos/i }).first().click()
    await page.waitForTimeout(300)
  })

  test('botones PDF y Excel están visibles', async ({ page }) => {
    await expect(page.locator('button', { hasText: /PDF/i })).toBeVisible()
    await expect(page.locator('button', { hasText: /Excel/i })).toBeVisible()
  })

  test('equipo se puede expandir para ver detalle de cobros', async ({ page }) => {
    // Target the equipo row expand buttons (they are direct children of the .rounded-2xl cards)
    const firstEquipo = page.locator('.rounded-2xl > button').first()
    if (await firstEquipo.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstEquipo.click()
      await page.waitForTimeout(400)
      // Should show breakdown cards: Inscripción, Fijo, Arbitrajes
      await expect(page.locator('text=/Inscripci|Fijo|Arbitraje/i').first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('filtro Con hora fija muestra solo equipos con hora asignada', async ({ page }) => {
    await page.locator('button', { hasText: /Con hora fija/i }).first().click()
    await page.waitForTimeout(400)
    // BODOGLIMT has hora fija
    await expect(page.locator('text=BODOGLIMT')).toBeVisible()
  })

  test('filtro Sin hora fija oculta equipos con hora', async ({ page }) => {
    await page.locator('button', { hasText: /Sin hora fija/i }).first().click()
    await page.waitForTimeout(400)
    // BODOGLIMT has hora fija → should not appear
    const bodoglimt = await page.locator('text=BODOGLIMT').isVisible()
    expect(bodoglimt).toBeFalsy()
  })
})
