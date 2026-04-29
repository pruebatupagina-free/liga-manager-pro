import { test, expect } from '@playwright/test'
import { login, spaGo, LIGA_ID, closeModal } from './helpers'

const TEST_EQUIPO = '__TEST_Equipo__'

test.describe('Gestión de Equipos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await spaGo(page, `/dashboard/equipos/${LIGA_ID}`)
    await expect(page.locator('h1', { hasText: /EQUIPOS/i })).toBeVisible()
  })

  test('lista de equipos carga correctamente', async ({ page }) => {
    await expect(page.locator('text=Liga AMC Dominical')).toBeVisible()
    // At least 1 equipo exists
    await expect(page.locator('.rounded-2xl, [class*="rounded"]').nth(1)).toBeVisible()
  })

  test('botón Agregar equipo abre modal', async ({ page }) => {
    await page.locator('button', { hasText: /Agregar equipo/i }).click()
    await expect(page.locator('text=NUEVO EQUIPO')).toBeVisible()
    await closeModal(page)
  })

  test('modal Nuevo Equipo tiene campos correctos', async ({ page }) => {
    await page.locator('button', { hasText: /Agregar equipo/i }).click()
    // Nombre is a <label>
    await expect(page.locator('label', { hasText: /Nombre/i }).first()).toBeVisible()
    // Color is a <label>
    await expect(page.locator('label', { hasText: /Color/i })).toBeVisible()
    // Día de juego is a <label>
    await expect(page.locator('label', { hasText: /Día de juego/i })).toBeVisible()
    // Hora fija toggle is labeled via <p> text
    await expect(page.locator('text=Hora fija de juego')).toBeVisible()
    // Teléfono appears as inline text
    await expect(page.locator('text=Teléfono')).toBeVisible()
    // WhatsApp is a <label>
    await expect(page.locator('label', { hasText: /WhatsApp/i })).toBeVisible()
    await expect(page.locator('button', { hasText: /Crear/i })).toBeVisible()
    await expect(page.locator('button', { hasText: /Cancelar/i })).toBeVisible()
    await closeModal(page)
  })

  test('toggle Hora fija muestra selector de slot', async ({ page }) => {
    await page.locator('button', { hasText: /Agregar equipo/i }).click()
    // Toggle should be off by default
    const toggle = page.locator('button[role="switch"]').first()
    await expect(toggle).toBeVisible()
    // Before toggle: "Slot de hora" section is hidden
    await expect(page.locator('label', { hasText: /Slot de hora/i })).not.toBeVisible()
    // Enable it
    await toggle.click()
    // "Slot de hora" label should now appear
    await expect(page.locator('label', { hasText: /Slot de hora/i })).toBeVisible()
    // Either a select or a config message should appear
    const hasSelect = await page.locator('select').count() > 1
    const hasConfigMsg = await page.locator('text=/Configura hora_inicio|Seleccionar slot/i').isVisible({ timeout: 2000 }).catch(() => false)
    expect(hasSelect || hasConfigMsg).toBeTruthy()
    await closeModal(page)
  })

  test('slot selector muestra formato HH:MM — HH:MM si liga tiene slots', async ({ page }) => {
    await page.locator('button', { hasText: /Agregar equipo/i }).click()
    await page.locator('button[role="switch"]').first().click()
    await page.waitForTimeout(300)
    const slotSelect = page.locator('select').last()
    const hasSlots = await slotSelect.isVisible({ timeout: 2000 }).catch(() => false)
    if (!hasSlots) {
      // Liga has no time slots configured — skip validation
      await closeModal(page)
      return
    }
    const options = await slotSelect.locator('option').count()
    if (options <= 1) {
      await closeModal(page)
      return
    }
    const secondOption = slotSelect.locator('option').nth(1)
    const optText = await secondOption.textContent()
    expect(optText).toMatch(/\d{2}:\d{2}\s*[—\-]\s*\d{2}:\d{2}/)
    await closeModal(page)
  })

  test('crear equipo sin nombre muestra validación', async ({ page }) => {
    await page.locator('button', { hasText: /Agregar equipo/i }).click()
    await page.locator('button', { hasText: /Crear/i }).click()
    // Modal still open (HTML5 validation)
    await expect(page.locator('text=NUEVO EQUIPO')).toBeVisible()
    await closeModal(page)
  })

  test('crear y verificar equipo de prueba', async ({ page }) => {
    await page.locator('button', { hasText: /Agregar equipo/i }).click()
    const nameInput = page.locator('input[required], input[placeholder*="nombre" i]').first()
    await nameInput.fill(TEST_EQUIPO)
    await page.locator('button', { hasText: /Crear/i }).click()
    await expect(page.locator(`text=${TEST_EQUIPO}`)).toBeVisible({ timeout: 8000 })
  })

  test('editar equipo de prueba', async ({ page }) => {
    // Find the test equipo
    const equipoRow = page.locator('div', { hasText: TEST_EQUIPO }).first()
    // Try to find edit button (pencil icon)
    const editBtns = page.locator('button').filter({ has: page.locator('svg') })
    // Click first edit-looking button in that row
    const allBtns = await page.locator('button').all()
    let edited = false
    for (const btn of allBtns) {
      const label = await btn.getAttribute('aria-label') || ''
      if (label.toLowerCase().includes('edit') || label.toLowerCase().includes('pencil')) {
        await btn.click()
        edited = true
        break
      }
    }
    if (edited) {
      await expect(page.locator('text=EDITAR EQUIPO')).toBeVisible({ timeout: 3000 })
      await closeModal(page)
    }
  })

  test('dar de baja equipo de prueba', async ({ page }) => {
    // Find the user- icon (dar de baja button)
    const allBtns = await page.locator('button').all()
    for (const btn of allBtns) {
      const label = await btn.getAttribute('aria-label') || ''
      if (label.toLowerCase().includes('baja')) {
        await btn.click()
        await expect(page.locator('text=/[Bb]aja|[Mm]otivo/').first()).toBeVisible({ timeout: 3000 })
        // Confirm baja
        const confirmBtn = page.locator('button', { hasText: /[Cc]onfirmar|[Dd]ar de baja/i })
        if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmBtn.click()
          await expect(page.locator(`text=${TEST_EQUIPO}`)).not.toBeVisible({ timeout: 5000 })
        } else {
          await closeModal(page)
        }
        break
      }
    }
  })

  test('sidebar LIGA ACTUAL muestra todos los módulos', async ({ page }) => {
    // DOM text is "Liga actual" — CSS uppercase makes it appear as "LIGA ACTUAL" visually
    await expect(page.locator('text=Liga actual').first()).toBeVisible()
    await expect(page.locator('a', { hasText: /^Equipos$/i })).toBeVisible()
    await expect(page.locator('a', { hasText: /^Jugadores$/i })).toBeVisible()
    await expect(page.locator('a', { hasText: /^Jornadas$/i })).toBeVisible()
    await expect(page.locator('a', { hasText: /^Cobros$/i })).toBeVisible()
    await expect(page.locator('a', { hasText: /^Estadísticas$/i })).toBeVisible()
    await expect(page.locator('a', { hasText: /^Liguilla$/i })).toBeVisible()
  })
})
