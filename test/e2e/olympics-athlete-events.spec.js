// @ts-check
import { test, expect } from '@playwright/test';

let app = 'http://localhost:3000/';

test('has title', async ({ page }) => {
  await page.goto(app);
  await expect(page).toHaveTitle(/SOS2526-30/);
});

test('prueba link', async ({ page }) => {
  await page.goto(app);
  await page.getByRole('link', { name: 'Acerca de' }).click();
  await expect(page).toHaveTitle(/SOS2526-30 Sobre Nosotros/);
});

test('crear nuevo atleta en Olympics', async ({ page }) => {
  await page.goto(`${app}olympics-athlete-events`);
  await page.getByRole('button', { name: 'Cargar datos ejemplo' }).click();
  await expect(page.locator('#itemsPerPageTop')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Añadir nuevo atleta' }).click();
  await expect(page.locator('.modal')).toBeVisible();
  await page.locator('#formName').fill('Prueba');
  await page.locator('#formTeam').fill('Prueba');
  await page.locator('#formYearEdit').fill('1');
  await page.locator('#formSport').fill('P');
  await page.locator('#formEvent').fill('P');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await page.waitForTimeout(1000);
  await expect(page.locator('.modal')).not.toBeVisible({ timeout: 5000 });
  await expect(page.locator('.msg-success')).toBeVisible();
  await expect(page.locator('.msg-success')).toContainText('ha sido añadido correctamente');
  const nuevoAtleta = page.locator('.athlete-card', { hasText: 'Prueba' });
  await expect(nuevoAtleta).toBeVisible();
});

test('listar todos los recursos', async ({ page }) => {
  await page.goto(`${app}olympics-athlete-events`);
  await page.getByRole('button', { name: 'Cargar datos ejemplo' }).click();
  await expect(page.locator('#itemsPerPageTop')).toBeVisible({ timeout: 10000 });
  const atletas = page.locator('.athlete-card');
  const cantidad = await atletas.count();
  expect(cantidad).toBeGreaterThan(0);
  await expect(atletas.first()).toBeVisible();
});

test('borrar todos los recursos', async ({ page }) => {
  await page.goto(`${app}olympics-athlete-events`);
  await page.getByRole('button', { name: 'Cargar datos ejemplo' }).click();
  await expect(page.locator('#itemsPerPageTop')).toBeVisible({ timeout: 10000 });
  page.on('dialog', async dialog => {
    expect(dialog.message()).toContain('¿Estás seguro');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Eliminar todos' }).click();
  await expect(page.locator('.msg-success')).toBeVisible();
  await expect(page.locator('.msg-success')).toContainText('eliminados correctamente');
});

test('borrar un recurso concreto', async ({ page }) => {
  await page.goto(`${app}olympics-athlete-events`);
  await page.getByRole('button', { name: 'Cargar datos ejemplo' }).click();
  await expect(page.locator('#itemsPerPageTop')).toBeVisible({ timeout: 10000 });
  
  const primerAtleta = page.locator('.athlete-card').first();
  
  // Hacer clic en el botón "Borrar"
  await primerAtleta.getByRole('button', { name: 'Borrar' }).click();
  
  // Esperar a que aparezca el modal de confirmación
  await expect(page.locator('.modal')).toBeVisible();
  
  // Hacer clic en "Sí, eliminar"
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();
  
  // Esperar a que se procese la eliminación
  await page.waitForTimeout(1500);
});


test('editar un recurso concreto', async ({ page }) => {
  await page.goto(`${app}olympics-athlete-events`);
  await page.getByRole('button', { name: 'Cargar datos ejemplo' }).click();
  await expect(page.locator('#itemsPerPageTop')).toBeVisible({ timeout: 10000 });
  
  const primerAtleta = page.locator('.athlete-card').first();
  const nombreOriginal = await primerAtleta.locator('h3').textContent();
  
  // Hacer clic en el botón "Editar"
  await primerAtleta.getByRole('button', { name: 'Editar' }).click();
  
  // Esperar a que aparezca el modal de edición
  await expect(page.locator('.modal')).toBeVisible();
  
  // Cambiar algún campo (ejemplo: modificar el deporte)
  await page.locator('#formSport').fill('Deporte Editado');
  await page.locator('#formEvent').fill('Evento Editado');
  
  // Guardar cambios
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  
  // Esperar a que se cierre el modal
  await page.waitForTimeout(1000);
  await expect(page.locator('.modal')).not.toBeVisible();
  
  // Verificar mensaje de éxito
  await expect(page.locator('.msg-success')).toBeVisible();
});

test('buscar recursos por rango de años', async ({ page }) => {
  await page.goto(`${app}olympics-athlete-events`);
  await page.getByRole('button', { name: 'Cargar datos ejemplo' }).click();
  await expect(page.locator('#itemsPerPageTop')).toBeVisible({ timeout: 10000 });
  
  // Buscar por rango de años (from=1990&to=2000)
  await page.locator('#searchFrom').fill('1990');
  await page.locator('#searchTo').fill('2000');
  
  // Hacer clic en buscar
  await page.getByRole('button', { name: 'Buscar' }).click();
  
  // Esperar resultados
  await expect(page.locator('.msg-success')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.msg-success')).toContainText('resultado');
  
  // Verificar que los resultados están dentro del rango de años
  const resultados = page.locator('.athlete-card');
  const cantidad = await resultados.count();
  
  if (cantidad > 0) {

    const primerResultado = resultados.first();
    const texto = await primerResultado.textContent();
    expect(texto).toMatch(/199[0-9]|2000/);
  }
});