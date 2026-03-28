import { test, expect } from '@playwright/test';

// Utilizamos 'serial' para que los tests se ejecuten uno detrás de otro, 
// compartiendo el estado de la base de datos (creamos en uno, editamos en el siguiente...)
test.describe.serial('Pruebas Exhaustivas E2E - eSports Growth Stats', () => {

  test.beforeEach(async ({ page }) => {
    // Antes de cada test individual, el robot va a la página principal
    await page.goto('/esportsgrowth-stats');
  });

  test('1. Vaciar la base de datos y verificar estado inicial', async ({ page }) => {
    // Programamos al robot para que le dé a "Aceptar" en el aviso de peligro
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Vaciar Base de Datos' }).click();

    // Verificamos que aparece el mensaje de que no hay datos
    await expect(page.getByText('No hay datos para mostrar en este momento.')).toBeVisible();
  });

  test('2. Cargar datos de ejemplo', async ({ page }) => {
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Cargar Ejemplo' }).click();

    // Verificamos que se han cargado las tarjetas (al menos 1)
    await expect(page.locator('.card').first()).toBeVisible();
  });

  test('3. Probar la paginación', async ({ page }) => {
    // Cambiamos a mostrar 10 elementos por página
    await page.locator('#selectItems').selectOption('10');
    
    // Hacemos clic en el botón Siguiente
    await page.getByRole('button', { name: 'Siguiente' }).click();
    
    // Verificamos que estamos en la página 2
    await expect(page.getByText('Página 2 de')).toBeVisible();

    // Volvemos a la primera
    await page.getByRole('button', { name: 'Primera' }).click();
  });

  test('4. Probar la búsqueda avanzada', async ({ page }) => {
    // Rellenamos un par de filtros
    await page.locator('#s_country').fill('Spain');
    await page.locator('#s_genre').fill('FPS');
    
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Verificamos que encuentra el resultado esperado (España FPS)
    await expect(page.locator('.card').first()).toContainText('Spain');
    
    // Limpiamos los filtros
    await page.getByRole('button', { name: 'Limpiar' }).click();
    
    // Comprobamos que vuelven a salir más resultados
    await expect(page.locator('#s_country')).toBeEmpty();
  });

  test('5. Crear un recurso completo', async ({ page }) => {
    await page.getByRole('button', { name: 'Añadir Estadística' }).click();

    // Rellenamos absolutamente todos los campos
    await page.locator('#formCountry').fill('Robotlandia');
    await page.locator('#formYear').fill('3000');
    await page.locator('#formActive').fill('150.5');
    await page.locator('#formViewers').fill('300.2');
    await page.locator('#formGenre').fill('Simulador');
    await page.locator('#formPlatform').fill('Holograma');
    await page.locator('#formTournaments').fill('50');
    await page.locator('#formPro').fill('1000');
    await page.locator('#formInternet').fill('99.9');
    await page.locator('#formCompany').fill('10');

    await page.getByRole('button', { name: 'Guardar Registro' }).click();

    // Verificamos mensaje de éxito y que aparece en la lista
    await expect(page.locator('.msg-success')).toBeVisible();
  });

  test('6. Manejo de errores (Registro duplicado)', async ({ page }) => {
    await page.getByRole('button', { name: 'Añadir Estadística' }).click();

    await page.locator('#formCountry').fill('Robotlandia');
    await page.locator('#formYear').fill('3000');

    // Programamos al robot para que intercepte el 'alert' del navegador y compruebe su texto
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Ya existe');
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Guardar Registro' }).click();
  });

  test('7. Editar en vista separada dinámica', async ({ page }) => {
    // Buscamos nuestro recurso
    await page.locator('#s_country').fill('Robotlandia');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Entramos en la vista dinámica usando el enlace "Editar"
    await page.getByRole('link', { name: 'Editar' }).first().click();

    // Verificamos que la URL ha cambiado a la ruta dinámica
    await expect(page).toHaveURL(/.*\/Robotlandia\/3000/);

    // Cambiamos el valor de espectadores
    await page.locator('#f_viewers').fill('500.5');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    // Esperamos a ser redirigidos de vuelta a la página principal
    await expect(page).toHaveURL(/.*\/esportsgrowth-stats/);
  });

  test('8. Borrar un recurso concreto', async ({ page }) => {
    // Lo buscamos
    await page.locator('#s_country').fill('Robotlandia');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Hacemos click en eliminar y confirmamos en el modal
    await page.getByRole('button', { name: 'Eliminar' }).first().click();
    await page.getByRole('button', { name: 'Sí, Borrar Dato' }).click();

    // Verificamos que ya no hay datos con ese filtro
    await expect(page.locator('.card')).toHaveCount(0);
    await expect(page.getByText('No existe ninguna estadística')).toBeVisible();
  });

});