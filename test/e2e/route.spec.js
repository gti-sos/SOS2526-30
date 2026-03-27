// @ts-check
import { test, expect } from '@playwright/test';

let app = 'http://localhost:3000';

test('has title', async ({ page }) => {
  await page.goto(app);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/SOS2526-30 Inicio/);
});
 test('prueba link', async ({ page }) => {
  await page.goto(app);
  await page.getByRole('link', { name: 'Acerca de' }).click();
  await expect(page).toHaveTitle(/SOS2526-30 Sobre Nosotros/);
});



test('prueba api ggg', async ({ page }) => {
  const athletes = page.locator('.athlete-card');
  await page.goto(app);
  await page.getByRole('link', { name: 'Gonzalo - Olympics Athlete Events (v2)' }).click();
  await page.getByRole('button', { name: 'Cargar Datos Ejemplo' }).click();
  await expect(page.locator('#itemsPerPageTop')).toHaveJSProperty('value', '5');
  await expect(athletes).not.toHaveCount(0)
});