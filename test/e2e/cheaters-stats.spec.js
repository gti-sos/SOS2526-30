// @ts-check
import { test, expect } from '@playwright/test';

let app = 'http://localhost:3000';

test('has title', async ({ page }) => {
  await page.goto(app);
  await expect(page).toHaveTitle(/SOS2526-30/);
});

test('prueba link', async ({ page }) => {
  await page.goto(app);
  await page.getByRole('link', { name: 'Acerca de' }).click();
  await expect(page).toHaveTitle(/SOS2526-30 Sobre Nosotros/);
});

test.describe.serial('Pruebas E2E - Cheaters Stats', () => {

  test('i. Crear un recurso (cargar datos ejemplo)', async ({ page }) => {
    await page.goto(`${app}/cheaters-stats`);
    
    // Aceptamos el confirm (pop-up) si existe
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Cargar datos de ejemplo' }).click();
    
    // Verificamos que se cargaron datos
    await expect(page.locator('.resource-card').first()).toBeVisible();
  });

  test('ii. Listar todos los recursos', async ({ page }) => {
    await page.goto(`${app}/cheaters-stats`);
    
    // Verificamos que hay registros en la lista
    await expect(page.locator('.resource-card').first()).toBeVisible();
    
    const cantidad = await page.locator('.resource-card').count();
    expect(cantidad).toBeGreaterThan(0);
  });

 test('iii. Crear un nuevo registro', async ({ page }) => {
  await page.goto(`${app}/cheaters-stats`);
  
  const uniqueId = Date.now();
  const testCountry = `Test${uniqueId}`;
  
  await page.getByRole('button', { name: 'Añadir nuevo registro' }).click();
  
  await page.locator('#formCountry').fill(testCountry);
  await page.locator('#formYear').fill('2025');
  await page.locator('#formCheaterReport').fill('150');
  await page.locator('#formConfirmedBan').fill('75');
  await page.locator('#formEstimatedCheater').fill('3.5');
  await page.locator('#formSuspendedAccount').fill('120');
  await page.locator('#formRepeatOffender').fill('30');
  
  await page.getByRole('button', { name: 'Guardar' }).click();
  
  await expect(page.locator('#edit-modal')).not.toBeVisible({ timeout: 10000 });
  
  // En lugar de verificar el mensaje, verificar que el registro existe
  await page.locator('#itemsPerPage').selectOption('50');
  await page.locator('#searchCountry').fill(testCountry);
  await page.getByRole('button', { name: 'Buscar' }).click();
  
  await expect(page.locator('.resource-card').first()).toBeVisible();
  await expect(page.locator('.resource-card').first()).toContainText('2025');
  await expect(page.locator('.resource-card').first()).toContainText('150');
  await expect(page.locator('.resource-card').first()).toContainText('75');
});

  test('iv. Buscar recursos utilizando la API', async ({ page }) => {
    await page.goto(`${app}/cheaters-stats`);
    
    // Buscamos el recurso que acabamos de crear
    await page.locator('#searchCountry').fill('Test');
    await page.getByRole('button', { name: 'Buscar' }).click();
    
    // Verificamos que aparece nuestro registro
    await expect(page.locator('.resource-card').first()).toBeVisible();
  });

  test('v. Editar recursos en una vista separada dinámica', async ({ page }) => {
    await page.goto(`${app}/cheaters-stats`);
    
    // Buscamos nuestro registro
    await page.locator('#searchCountry').fill('Test');
    await page.getByRole('button', { name: 'Buscar' }).click();
    
    // Hacemos clic en el botón Editar
    await page.getByRole('button', { name: 'Editar' }).first().click();
    
    // Comprobamos que aparece el modal de edición
    await expect(page.locator('#edit-modal')).toBeVisible();
    
    // Modificamos un campo
    await page.locator('#formCheaterReport').fill('999');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    
    // Esperamos a que se cierre el modal
    await expect(page.locator('#edit-modal')).not.toBeVisible();
    
    // Verificamos mensaje de éxito
    await expect(page.locator('.msg-success')).toContainText('guardados correctamente');
    
    // Verificamos que el cambio se refleja
    await page.locator('#searchCountry').fill('Test');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.locator('.resource-card').first()).toContainText('999');
  });

 test('vi. Borrar un recurso concreto', async ({ page }) => {
  await page.goto(`${app}/cheaters-stats`);
  
  await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
  
  await page.locator('#searchCountry').fill('Test');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.waitForTimeout(1000);
  
  const count = await page.locator('.resource-card').count();
  expect(count).toBeGreaterThan(0);

  // Usar un selector más específico: el botón dentro de la tarjeta
  // que tenga texto "Eliminar" o "Borrar"
  await page.locator('.resource-card').first().getByRole('button', { name: /Eliminar|Borrar/ }).click();
  
  await expect(page.locator('#delete-modal')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(page.locator('#delete-modal')).not.toBeVisible({ timeout: 5000 });
  
  await page.waitForTimeout(2000);
  
  await page.locator('#searchCountry').fill('Test');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.waitForTimeout(1000);
  
  const afterCount = await page.locator('.resource-card').count();
  expect(afterCount).toBe(0);
});


  test('vii. Borrar todos los recursos', async ({ page }) => {
    await page.goto(`${app}/cheaters-stats`);
    
    // Aceptamos la alerta de confirmación
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Eliminar todos' }).click();
    
    // Verificamos que aparece el mensaje de que no hay registros
    await expect(page.getByText('No hay registros. Carga datos de ejemplo o añade uno nuevo.')).toBeVisible();
  });

});