import { test, expect } from '@playwright/test';

test.describe.serial('Pruebas E2E - eSports Earnings Stats (Mario Ramos)', () => {

  test('ii. Listar todos los recursos (y cargar datos iniciales)', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Aceptamos el pop-up (confirm) del navegador automáticamente
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Cargar Ejemplo' }).click();

    // Verificamos que aparece al menos una tarjeta de recurso
    await expect(page.locator('.card').first()).toBeVisible();
  });

  test('i. Crear un recurso', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Abrimos el modal
    await page.getByRole('button', { name: 'Añadir Juego' }).click();

    // Selectores infalibles por orden dentro del modal
    await page.locator('.modal-content input').nth(0).fill('Test E2E Game');
    await page.locator('.modal-content input').nth(1).fill('2099');
    await page.locator('.modal-content input').nth(2).fill('Testlandia');

    // Guardamos
    await page.getByRole('button', { name: 'Guardar' }).click();

    // Verificamos éxito
    await expect(page.locator('.msg-success')).toContainText('Registro añadido');
  });

  test('vi. Buscar recursos utilizando la API', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Buscamos usando el filtro de país
    await page.locator('input[placeholder="Ej: Spain"]').fill('Testlandia');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Verificamos que sale 1 resultado
    await expect(page.locator('.card')).toHaveCount(1);
    await expect(page.locator('.card').first()).toContainText('Test E2E Game');
  });

  test('v. Editar recursos', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Filtramos para encontrar nuestro recurso
    await page.locator('input[placeholder="Ej: Spain"]').fill('Testlandia');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Hacemos click en el botón Editar
    await page.getByRole('button', { name: 'Editar' }).first().click();

    // Modificamos el género (es el 4º input en la vista de edición)
    await page.locator('.modal-content input').nth(3).fill('Aventura E2E');
    await page.getByRole('button', { name: 'Guardar' }).click();

    // Verificamos éxito
    await expect(page.locator('.msg-success')).toContainText('Registro actualizado');
  });

  test('iv. Borrar un recurso concreto', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Buscamos nuestro recurso
    await page.locator('input[placeholder="Ej: Spain"]').fill('Testlandia');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Le damos a Eliminar en su tarjeta
    await page.getByRole('button', { name: 'Eliminar' }).first().click();
    
    // Confirmamos en el modal buscando el botón específico
    await page.locator('.modal-content').getByRole('button', { name: 'Sí, Borrar' }).click();

    // Verificamos que la tarjeta ya no existe
    await expect(page.locator('.card')).toHaveCount(0);
  });

  test('iii. Borrar todos los recursos', async ({ page }) => {
    await page.goto('/esportsearnings-stats');

    // Aceptamos la alerta de peligro del navegador
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Vaciar Base de Datos' }).click();

    // Verificamos que aparece el mensaje de vacío
    await expect(page.getByText('No hay datos para mostrar')).toBeVisible();
  });

});
