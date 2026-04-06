import { test, expect } from '@playwright/test';

// Utilizamos serial para que los tests se ejecuten en orden, uno detrás de otro.
test.describe.serial('Pruebas E2E - eSports Earnings Stats (Mario Ramos)', () => {

  test('ii. Listar todos los recursos (y cargar datos iniciales)', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Aceptamos el pop-up (confirm) del navegador automáticamente
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Cargar Iniciales' }).click();

    // Verificamos que aparece al menos una tarjeta de recurso en la pantalla
    await expect(page.locator('.card').first()).toBeVisible();
  });

  test('i. Crear un recurso', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Abrimos el modal de crear
    await page.getByRole('button', { name: 'Añadir Registro' }).click();

    // Rellenamos los campos obligatorios buscando sus cajas de texto
    await page.locator('div').filter({ hasText: /^Juego \*/ }).locator('input').fill('Test E2E Game');
    await page.locator('div').filter({ hasText: /^Año \*/ }).locator('input').fill('2099');
    await page.locator('div').filter({ hasText: /^País \*/ }).locator('input').fill('Testlandia');

    // Guardamos
    await page.getByRole('button', { name: 'Guardar' }).click();

    // Verificamos que aparece el mensaje de éxito
    await expect(page.locator('.msg-success')).toContainText('Registro añadido correctamente');
  });

  test('vi. Buscar recursos utilizando la API', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Buscamos el recurso que acabamos de crear usando el filtro de país
    await page.locator('input[placeholder="Ej: Spain"]').fill('Testlandia');
    await page.getByRole('button', { name: 'Aplicar Búsqueda' }).click();

    // Verificamos que solo sale 1 resultado y es el nuestro
    await expect(page.locator('.card')).toHaveCount(1);
    await expect(page.locator('.card').first()).toContainText('Test E2E Game');
  });

  test('v. Editar recursos en una vista separada dinámica', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Buscamos nuestro recurso para no tener que buscarlo entre la paginación
    await page.locator('input[placeholder="Ej: Spain"]').fill('Testlandia');
    await page.getByRole('button', { name: 'Aplicar Búsqueda' }).click();

    // Hacemos click en el botón Editar (que es un enlace a la vista dinámica)
    await page.getByRole('link', { name: 'Editar' }).first().click();

    // Comprobamos que la URL ha cambiado a la vista separada
    await expect(page).toHaveURL(/.*\/Test%20E2E%20Game\/2099/);

    // Modificamos el género
    await page.locator('div').filter({ hasText: /^Género/ }).locator('input').fill('Aventura E2E');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    // Esperamos a que nos devuelva automáticamente a la lista principal
    await expect(page).toHaveURL(/.*\/esportsearnings-stats/);
  });

  test('iv. Borrar un recurso concreto', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Buscamos nuestro recurso
    await page.locator('input[placeholder="Ej: Spain"]').fill('Testlandia');
    await page.getByRole('button', { name: 'Aplicar Búsqueda' }).click();

    // Le damos a Eliminar en su tarjeta
    await page.getByRole('button', { name: 'Eliminar' }).first().click();
    
    // Confirmamos en nuestro modal de borrado
    await page.getByRole('button', { name: 'Sí, Borrar' }).click();

    // Verificamos que la tarjeta ya no existe
    await expect(page.locator('.card')).toHaveCount(0);
  });

  test('iii. Borrar todos los recursos', async ({ page }) => {
    await page.goto('/esportsearnings-stats');

    // Aceptamos la alerta de peligro del navegador
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Vaciar Datos' }).click();

    // Verificamos que aparece el mensaje de que la lista está vacía
    await expect(page.getByText('No hay datos que coincidan')).toBeVisible();
  });

});
