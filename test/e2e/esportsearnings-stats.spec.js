import { test, expect } from '@playwright/test';

// Utilizamos serial para que los tests se ejecuten en orden, uno detrás de otro.
// Así, el recurso que creamos en el test 2, lo podemos buscar en el test 3, editar en el 4 y borrar en el 5.
test.describe.serial('Pruebas E2E - eSports Earnings Stats', () => {

  test('ii. Listar todos los recursos (y cargar datos iniciales)', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Aceptamos el pop-up (confirm) del navegador automáticamente
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Cargar Ejemplo' }).click();

    // Verificamos que aparece al menos una tarjeta de recurso en la pantalla
    await expect(page.locator('.card').first()).toBeVisible();
  });

  test('i. Crear un recurso', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Abrimos el modal de crear
    await page.getByRole('button', { name: 'Añadir Estadística' }).click();

    // Rellenamos los campos obligatorios
    await page.locator('#formCountry').fill('Testland');
    await page.locator('#formYear').fill('2099');
    await page.locator('#formEarnings').fill('50.5'); 

    // Guardamos
    await page.getByRole('button', { name: 'Guardar Registro' }).click();

    // Verificamos que aparece el mensaje de éxito
    await expect(page.locator('.msg-success')).toContainText('Registro añadido correctamente');
  });

  test('vi. Buscar recursos utilizando la API', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Buscamos el recurso que acabamos de crear
    await page.locator('#s_country').fill('Testland');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Verificamos que solo sale 1 resultado y es el nuestro
    await expect(page.locator('.card')).toHaveCount(1);
    await expect(page.locator('.card').first()).toContainText('Testland (2099)');
  });

  test('v. Editar recursos en una vista separada dinámica', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Buscamos nuestro recurso para no tener que buscarlo entre la paginación
    await page.locator('#s_country').fill('Testland');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Hacemos click en el botón Editar (que ahora es un enlace a la vista dinámica)
    await page.getByRole('link', { name: 'Editar' }).first().click();

    // Comprobamos que la URL ha cambiado a la vista separada
    await expect(page).toHaveURL(/.*\/Testland\/2099/);

    // Modificamos un campo
    await page.locator('#f_earnings').fill('99.9');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    // Esperamos a que nos devuelva automáticamente a la lista
    await expect(page).toHaveURL(/.*\/esportsearnings-stats/);
  });

  test('iv. Borrar un recurso concreto', async ({ page }) => {
    await page.goto('/esportsearnings-stats');
    
    // Buscamos nuestro recurso
    await page.locator('#s_country').fill('Testland');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Le damos a Eliminar en su tarjeta
    await page.getByRole('button', { name: 'Eliminar' }).first().click();
    
    // Confirmamos en nuestro modal rojo de borrado
    await page.getByRole('button', { name: 'Sí, Borrar Dato' }).click();

    // Verificamos que la tarjeta ya no existe (saldrá el mensaje de no hay datos)
    await expect(page.locator('.card')).toHaveCount(0);
  });

  test('iii. Borrar todos los recursos', async ({ page }) => {
    await page.goto('/esportsearnings-stats');

    // Aceptamos la alerta de peligro del navegador
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Vaciar Base de Datos' }).click();

    // Verificamos que aparece el mensaje de que está vacío
    await expect(page.getByText('No hay datos para mostrar en este momento.')).toBeVisible();
  });

});
