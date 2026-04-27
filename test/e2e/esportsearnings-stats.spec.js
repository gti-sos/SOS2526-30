import { test, expect } from '@playwright/test';

// Utilizamos serial para que los tests se ejecuten en orden, como tu compañero
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

    // SOLUCIÓN INFALIBLE: Buscamos dentro del modal por orden exacto (Juego, Año, País)
    await page.locator('.modal-content input').nth(0).fill('Test E2E Game');
    await page.locator('.modal-content input').nth(1).fill('2099');
    await page.locator('.modal-content input').nth(2).fill('Testlandia');

    // Guardamos
    await page.getByRole('button', { name: 'Guardar' }).click();

    // Verificamos que aparece el mensaje de éxito
    await expect(page.locator('.msg-success')).toContainText('Registro añadido');
  });

  test('vi. Buscar recursos utilizando la API', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Buscamos el recurso que acabamos de crear usando el placeholder único
    await page.locator('input[placeholder="Ej: Spain"]').fill('Testlandia');
    await page.getByRole('button', { name: 'Aplicar Búsqueda' }).click();

    // Verificamos que solo sale 1 resultado y es el nuestro
    await expect(page.locator('.card')).toHaveCount(1);
    await expect(page.locator('.card').first()).toContainText('Test E2E Game');
  });

  test('v. Editar recursos en una vista separada dinámica', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Filtramos para encontrar nuestro recurso rápido
    await page.locator('input[placeholder="Ej: Spain"]').fill('Testlandia');
    await page.getByRole('button', { name: 'Aplicar Búsqueda' }).click();

    // Hacemos click en el enlace Editar
    await page.getByRole('link', { name: 'Editar' }).first().click();

    // Comprobamos que la URL ha cambiado a la vista separada
    await expect(page).toHaveURL(/.*\/Test%20E2E%20Game\/2099/);

    // Modificamos el género (es el 4º input en la vista de edición)
    await page.locator('input').nth(3).fill('Aventura E2E');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    // Esperamos a que nos devuelva automáticamente a la lista
    await expect(page).toHaveURL(/.*\/esportsearnings-stats/);
  });

  test('iv. Borrar un recurso concreto', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Buscamos nuestro recurso
    await page.locator('input[placeholder="Ej: Spain"]').fill('Testlandia');
    await page.getByRole('button', { name: 'Aplicar Búsqueda' }).click();

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
    await page.getByRole('button', { name: 'Vaciar Datos' }).click();

    // Verificamos que aparece el mensaje de vacío
    await expect(page.getByText('No hay datos')).toBeVisible();
  });

});