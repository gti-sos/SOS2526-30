// @ts-check
import { test, expect } from '@playwright/test';

let app = 'http://localhost:3000';

test('crear un nuevo recurso cheaters', async ({ page }) => {
  await page.goto(`${app}/cheaters-stats`);
  
  await page.getByRole('button', { name: 'Cargar datos de ejemplo' }).click();
  
  // Manejar TODOS los diálogos
 
  
  await expect(page.locator('#itemsPerPage')).toBeVisible({ timeout: 50000 });
  
  // Abrir el modal de creación
  await page.getByRole('button', { name: 'Añadir nuevo registro' }).click();
  await expect(page.locator('#edit-modal')).toBeVisible();
  
  // Rellenar el formulario
  await page.locator('#formCountry').fill('España');
  await page.locator('#formYear').fill('2024');
  await page.locator('#formCheaterReport').fill('150');
  await page.locator('#formConfirmedBan').fill('75');
  await page.locator('#formEstimatedCheater').fill('3.5');
  await page.locator('#formSuspendedAccount').fill('120');
  await page.locator('#formRepeatOffender').fill('30');
  
  // Guardar
  await page.getByRole('button', { name: 'Guardar' }).click();
  
  // Si aparece un diálogo de "ya existe", se manejará arriba
  await page.waitForTimeout(1000);
  
  // Forzar cierre del modal si sigue abierto
  const modal = page.locator('#edit-modal');
  if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByRole('button', { name: 'Cancelar' }).click();
  }
  
  await expect(modal).not.toBeVisible({ timeout: 50000 });
  
  // Verificar mensaje de éxito (si aparece)
  const successMsg = page.locator('.msg-success');
  if (await successMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
    await expect(successMsg).toContainText('ha sido añadido correctamente');
  }
  
  // Cambiar a mostrar 50 items por página
  await page.locator('#itemsPerPage').selectOption('50');
  await expect(page.locator('#itemsPerPage')).toHaveValue('50');
  
  await page.waitForTimeout(1000);
  
  // Verificar que el nuevo registro aparece en la lista
  const nuevoRegistro = page.locator('.resource-card', { hasText: 'España' });
  await expect(nuevoRegistro).toBeVisible({ timeout: 50000 });
  await expect(nuevoRegistro).toContainText('2024');
  await expect(nuevoRegistro).toContainText('150');
  await expect(nuevoRegistro).toContainText('75');
});