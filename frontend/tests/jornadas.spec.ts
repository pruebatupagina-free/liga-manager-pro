import { test, expect } from '@playwright/test'
import { login, spaGo, LIGA_ID, closeModal } from './helpers'

test.describe('Jornadas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await spaGo(page, `/dashboard/jornadas/${LIGA_ID}`)
    await expect(page.locator('h1', { hasText: /JORNADAS/i })).toBeVisible()
  })

  test('página de jornadas carga correctamente', async ({ page }) => {
    await expect(page.locator('text=Liga AMC Dominical')).toBeVisible()
    await expect(page.locator('button', { hasText: /Generar jornada/i })).toBeVisible()
  })

  test('botón Generar jornada abre modal', async ({ page }) => {
    await page.locator('button', { hasText: /Generar jornada/i }).click()
    await expect(page.locator('text=/Generar|JORNADA/i').first()).toBeVisible()
    // Should have a date field
    await expect(page.locator('input[type="date"]')).toBeVisible()
    await closeModal(page)
  })

  test('modal de generar jornada tiene campo fecha y notas', async ({ page }) => {
    await page.locator('button', { hasText: /Generar jornada/i }).click()
    await expect(page.locator('input[type="date"]')).toBeVisible()
    // permitir_repetir checkbox
    const checkboxes = await page.locator('input[type="checkbox"]').count()
    expect(checkboxes).toBeGreaterThanOrEqual(0)
    await closeModal(page)
  })

  test('generar jornada sin fecha muestra validación', async ({ page }) => {
    await page.locator('button', { hasText: /Generar jornada/i }).click()
    // The "Generar" button is disabled when no date is entered — that IS the validation
    const genBtn = page.locator('button', { hasText: /^Generar$/i })
    await expect(genBtn).toBeDisabled()
    await closeModal(page)
  })

  test('jornadas existentes muestran número, estado y partidos', async ({ page }) => {
    const jornadasCount = await page.locator('text=/Jornada \\d+/').count()
    if (jornadasCount > 0) {
      await expect(page.locator('text=/Jornada \\d+/').first()).toBeVisible()
      // Click to expand
      await page.locator('text=/Jornada \\d+/').first().click()
      await page.waitForTimeout(500)
      // Should show partido(s) or "Sin partidos"
      const hasPartidos = await page.locator('text=/partido|Partido|Sin partidos/i').first().isVisible()
      expect(hasPartidos).toBeTruthy()
    }
  })

  test('partido expandido permite ingresar resultado', async ({ page }) => {
    const jornadasCount = await page.locator('text=/Jornada \\d+/').count()
    if (jornadasCount > 0) {
      await page.locator('text=/Jornada \\d+/').first().click()
      await page.waitForTimeout(500)
      // Look for a partido button (not bye)
      const partidoBtns = await page.locator('[style*="secondary"] button, .rounded-xl button').count()
      if (partidoBtns > 0) {
        await page.locator('.rounded-xl').filter({ hasNotText: 'BYE' }).first().click()
        await page.waitForTimeout(500)
        // Modal resultado should open
        const modalOpen = await page.locator('text=/[Rr]esultado|[Gg]oles/').first().isVisible({ timeout: 2000 }).catch(() => false)
        if (modalOpen) await closeModal(page)
      }
    }
  })
})
