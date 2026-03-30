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

test.describe.serial('Pruebas E2E - Olympics Athlete Events', () => {

  test('i. Crear un recurso', async ({ page }) => {
    await page.goto(`${app}/olympics-athlete-events`);
    
    // Aceptamos el confirm (pop-up) si existe
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Cargar datos ejemplo' }).click();
    
    // Verificamos que se cargaron datos
    await expect(page.locator('.athlete-card').first()).toBeVisible();
  });

  test('ii. Listar todos los recursos (y cargar datos iniciales)', async ({ page }) => {
    await page.goto(`${app}/olympics-athlete-events`);
    
    // Verificamos que hay atletas en la lista
    await expect(page.locator('.athlete-card').first()).toBeVisible();
    
    const cantidad = await page.locator('.athlete-card').count();
    expect(cantidad).toBeGreaterThan(0);
  });

  test('iii. Crear un nuevo atleta', async ({ page }) => {
    await page.goto(`${app}/olympics-athlete-events`);
    
    // Abrimos el modal de crear
    await page.getByRole('button', { name: 'Añadir nuevo atleta' }).click();
    
    // Rellenamos los campos obligatorios
    await page.locator('#formName').fill('externo55');
    await page.locator('#formTeam').fill('Testland');
    await page.locator('#formYearEdit').fill('2099');
    await page.locator('#formSport').fill('Test Sport');
    await page.locator('#formEvent').fill('Test Event');
    
    // Guardamos
    await page.getByRole('button', { name: 'Guardar' }).click();
    
    // Verificamos mensaje de éxito
    await expect(page.locator('.msg-success')).toContainText('ha sido añadido correctamente');
  });

  test('iv. Buscar recursos utilizando la API', async ({ page }) => {
    await page.goto(`${app}/olympics-athlete-events`);
    
    // Buscamos el recurso que acabamos de crear
    await page.locator('#searchName').fill('externo55');
    await page.getByRole('button', { name: 'Buscar' }).click();
    
    // Verificamos que aparece nuestro atleta
    await expect(page.locator('.athlete-card')).toHaveCount(1);
    await expect(page.locator('.athlete-card').first()).toContainText('externo55');
  });

  test('v. Editar recursos en una vista separada dinámica', async ({ page }) => {
    await page.goto(`${app}/olympics-athlete-events`);
    
    // Buscamos nuestro atleta
    await page.locator('#searchName').fill('externo55');
    await page.getByRole('button', { name: 'Buscar' }).click();
    
    // Hacemos clic en el botón Editar
    await page.getByRole('button', { name: 'Editar' }).first().click();
    
    // Comprobamos que aparece el modal de edición
    await expect(page.locator('.modal')).toBeVisible();
    
    // Modificamos un campo
    await page.locator('#formSport').fill('Deporte Editado');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    
    // Esperamos a que se cierre el modal
    await expect(page.locator('.modal')).not.toBeVisible();
    
    // Verificamos mensaje de éxito
    await expect(page.locator('.msg-success')).toContainText('guardados correctamente');
    
    // Verificamos que el cambio se refleja
    await page.locator('#searchName').fill('externo55');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.locator('.athlete-card').first()).toContainText('Deporte Editado');
  });

test('vi. Borrar un recurso concreto', async ({ page }) => {
  await page.goto(`${app}/olympics-athlete-events`);
  
  // Limpiar búsqueda previa
  await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
  
  // Buscamos nuestro recurso
  await page.locator('#searchName').fill('externo55');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.waitForTimeout(1000);
  
  // Verificamos que hay 1 resultado
  const count = await page.locator('.athlete-card').count();
  expect(count).toBe(1);

  // Le damos a Borrar
  await page.getByRole('button', { name: 'Borrar' }).first().click();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();
  
  // Esperar a que se procese
  await page.waitForTimeout(2000);
  
  // Volvemos a buscar el mismo atleta
  await page.locator('#searchName').fill('externo55');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.waitForTimeout(1000);
  
  // Verificamos que ya no aparece en los resultados de búsqueda
  const afterCount = await page.locator('.athlete-card').count();
  expect(afterCount).toBe(0);
});

  test('vii. Borrar todos los recursos', async ({ page }) => {
    await page.goto(`${app}/olympics-athlete-events`);
    
    // Aceptamos la alerta de confirmación
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Eliminar todos' }).click();
    
    // Verificamos que aparece el mensaje de que no hay atletas
    await expect(page.getByText('No hay atletas. Carga datos de ejemplo o añade uno nuevo.')).toBeVisible();
  });

});