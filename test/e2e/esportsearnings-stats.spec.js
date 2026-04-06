import { test, expect } from '@playwright/test';

test.describe.serial('Pruebas E2E - eSports Earnings Stats (Mario Ramos)', () => {

  const URL = 'http://localhost:5173/esportsearnings-stats';

  test('ii. Listar todos los recursos (y cargar datos iniciales)', async ({ page }) => {
    await page.goto(URL);
    
    // Aceptamos el pop-up (confirm) del navegador automáticamente
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Cargar Iniciales' }).click();

    // LA MAGIA: Hacemos que el robot espere 1.5 segundos a que el servidor devuelva los datos
    await page.waitForTimeout(1500);

    // Verificamos que aparece al menos una tarjeta
    await expect(page.locator('.card').first()).toBeVisible();
  });

  test('i. Crear un recurso', async ({ page }) => {
    await page.goto(URL);
    await page.waitForTimeout(500);
    
    // Abrimos el modal
    await page.getByRole('button', { name: 'Añadir Registro' }).click();

    // Rellenamos datos
    await page.locator('.modal-content input').nth(0).fill('Test E2E Game');
    await page.locator('.modal-content input').nth(1).fill('2099');
    await page.locator('.modal-content input').nth(2).fill('Testlandia');

    // Guardamos
    await page.getByRole('button', { name: 'Guardar' }).click();
    
    await page.waitForTimeout(1500); // Esperamos a que se guarde en la BD

    // Verificamos éxito
    await expect(page.locator('.msg-success')).toContainText('Registro añadido');
  });

  test('vi. Buscar recursos utilizando la API', async ({ page }) => {
    await page.goto(URL);
    await page.waitForTimeout(500);
    
    // Buscamos
    await page.locator('input[placeholder="Ej: Spain"]').fill('Testlandia');
    await page.getByRole('button', { name: 'Aplicar Búsqueda' }).click();
    
    await page.waitForTimeout(1500); // Esperamos a que vuelva la búsqueda

    // Verificamos
    await expect(page.locator('.card')).toHaveCount(1);
    await expect(page.locator('.card').first()).toContainText('Test E2E Game');
  });

  test('v. Editar recursos', async ({ page }) => {
    await page.goto(URL);
    await page.waitForTimeout(500);
    
    // Filtramos
    await page.locator('input[placeholder="Ej: Spain"]').fill('Testlandia');
    await page.getByRole('button', { name: 'Aplicar Búsqueda' }).click();
    await page.waitForTimeout(1500);

    // Hacemos click en Editar
    await page.getByRole('link', { name: 'Editar' }).first().click();
    await page.waitForTimeout(1500);

    // Modificamos el género
    await page.locator('.grid input').nth(3).fill('Aventura E2E');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    
    await page.waitForTimeout(1500); // Esperamos el guardado y la redirección

    // Verificamos éxito
    await expect(page.locator('.msg-success')).toContainText('Registro actualizado');
  });

  test('iv. Borrar un recurso concreto', async ({ page }) => {
    await page.goto(URL);
    await page.waitForTimeout(500);
    
    // Buscamos nuestro recurso
    await page.locator('input[placeholder="Ej: Spain"]').fill('Testlandia');
    await page.getByRole('button', { name: 'Aplicar Búsqueda' }).click();
    await page.waitForTimeout(1500);

    // Eliminamos
    await page.getByRole('button', { name: 'Eliminar' }).first().click();
    await page.locator('.modal-content').getByRole('button', { name: 'Sí, Borrar' }).click();
    
    await page.waitForTimeout(1500); // Esperamos el borrado

    // Verificamos que la tarjeta ya no existe
    await expect(page.locator('.card')).toHaveCount(0);
  });

  test('iii. Borrar todos los recursos', async ({ page }) => {
    await page.goto(URL);
    await page.waitForTimeout(500);

    // Vaciamos la BD
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Vaciar Datos' }).click();
    
    await page.waitForTimeout(1500); // Esperamos

    // Verificamos vacío
    await expect(page.getByText('No hay datos')).toBeVisible();
  });

});
