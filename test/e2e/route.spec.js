// @ts-check
import { test, expect } from '@playwright/test';

let app = 'sos2526-30.onrender.com';

test('has title', async ({ page }) => {
  await page.goto(app);
  await expect(page).toHaveTitle(/SOS2526-30 - Panel de Control/);
});
//  test('prueba link', async ({ page }) => {
//   await page.goto(app);
//   await page.getByRole('link', { name: 'Acerca de' }).click();
//   await expect(page).toHaveTitle(/SOS2526-30 Sobre Nosotros/);
// });



// test('prueba api ggg', async ({page}) => {
//   const athletes = page.locator('.athlete-card');
//   await page.goto('https://sos2526-30.onrender.com/olympics-athlete-events');
//   await page.getByRole('link', { name: 'Gonzalo - Olympics Athlete Events (v2)' }).click();
//   await page.getByRole('button', { name: 'Cargar Datos Ejemplo' }).click();
//   await expect(page.locator('#itemsPerPageTop')).toHaveJSProperty('value', '5');
//   await expect(athletes).not.toHaveCount(0)
// });