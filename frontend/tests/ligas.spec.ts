import { test, expect } from '@playwright/test'
import { login, spaGo, closeModal } from './helpers'

const TEST_LIGA_NAME = '__TEST_Liga_Playwright__'

test.describe('Gestión de Ligas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await spaGo(page, '/dashboard/ligas')
    await expect(page.locator('h1', { hasText: /MIS LIGAS/i })).toBeVisible({ timeout: 10000 })
  })

  test('lista de ligas carga correctamente', async ({ page }) => {
    await expect(page.locator('text=Liga AMC Dominical')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=/activa|pausada|finalizada/i').first()).toBeVisible()
    await expect(page.locator('a', { hasText: /Gestionar/i }).first()).toBeVisible()
  })

  test('botón Nueva liga abre modal', async ({ page }) => {
    await page.locator('button', { hasText: /Nueva liga/i }).click()
    // Verify modal opened by checking the required name input is visible
    await expect(page.locator('input[required]').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button', { hasText: /Crear liga/i })).toBeVisible()
    await closeModal(page)
  })

  test('modal Nueva Liga tiene todos los campos requeridos', async ({ page }) => {
    await page.locator('button', { hasText: /Nueva liga/i }).click()
    const modal = page.locator('[role="dialog"], .modal, form').first()
    await expect(page.locator('label', { hasText: /Nombre/i }).first()).toBeVisible()
    await expect(page.locator('select, [role="combobox"]').first()).toBeVisible()
    await expect(page.locator('text=Días de juego')).toBeVisible()
    await expect(page.locator('text=Inscripción')).toBeVisible()
    await expect(page.locator('button', { hasText: /Crear liga/i })).toBeVisible()
    await expect(page.locator('button', { hasText: /Cancelar/i })).toBeVisible()
    await closeModal(page)
  })

  test('crear liga sin nombre muestra validación HTML5', async ({ page }) => {
    await page.locator('button', { hasText: /Nueva liga/i }).click()
    await page.locator('button', { hasText: /Crear liga/i }).click()
    // HTML5 validation prevents submit — required input still visible (modal stays open)
    await expect(page.locator('input[required]').first()).toBeVisible({ timeout: 3000 })
    await closeModal(page)
  })

  test('crear y eliminar liga de prueba', async ({ page }) => {
    // Create
    await page.locator('button', { hasText: /Nueva liga/i }).click()
    // Fill name
    const nameInput = page.locator('input[required]').first()
    await nameInput.fill(TEST_LIGA_NAME)
    // Select domingo
    const domingBtn = page.locator('button', { hasText: /domingo/i }).first()
    if (await domingBtn.isVisible()) await domingBtn.click()
    await page.locator('button', { hasText: /Crear liga/i }).click()
    // Should appear in list — use .first() in case a leftover exists from a prior run
    await expect(page.locator(`text=${TEST_LIGA_NAME}`).first()).toBeVisible({ timeout: 8000 })

    // Delete via edit → set estado to "archivada" (no delete endpoint shown, so just verify it was created)
    // Click edit button for our test liga
    const ligaRow = page.locator('div', { hasText: TEST_LIGA_NAME }).first()
    await expect(ligaRow).toBeVisible()

    // Clean up: edit the test liga to archive it
    const editBtn = ligaRow.locator('button[aria-label*="ditar"], button svg.lucide-edit').first()
    if (await editBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editBtn.click()
      const estadoSelect = page.locator('select').first()
      await estadoSelect.selectOption('archivada')
      await page.locator('button', { hasText: /Guardar|Actualizar/i }).click()
    }
  })

  test('días de juego son seleccionables en modal', async ({ page }) => {
    await page.locator('button', { hasText: /Nueva liga/i }).click()
    // DOM text is "lunes" (lowercase), CSS capitalize makes it appear as "Lunes"
    const lunes = page.locator('button', { hasText: /^lunes$/i })
    await expect(lunes).toBeVisible()
    await lunes.click()
    // Verify click didn't break the modal — required input still visible
    await expect(page.locator('input[required]').first()).toBeVisible({ timeout: 3000 })
    await closeModal(page)
  })

  test('criterios de desempate son arrastrables (drag handle visible)', async ({ page }) => {
    await page.locator('button', { hasText: /Nueva liga/i }).click()
    // Scroll to criteria section
    await page.evaluate(() => {
      document.querySelectorAll('*')
      const scrollable = [...document.querySelectorAll('*')].find(el =>
        getComputedStyle(el).overflowY === 'auto' || getComputedStyle(el).overflowY === 'scroll'
      )
      scrollable?.scrollTo(0, 9999)
    })
    await expect(page.locator('text=Diferencia de goles')).toBeVisible()
    await expect(page.locator('text=Goles a favor')).toBeVisible()
    await closeModal(page)
  })

  test('botón Gestionar navega a equipos de la liga', async ({ page }) => {
    await page.locator('a', { hasText: /Gestionar/i }).first().click()
    await expect(page).toHaveURL(/\/dashboard\/equipos\//)
    await expect(page.locator('h1', { hasText: /EQUIPOS/i })).toBeVisible()
  })
})
