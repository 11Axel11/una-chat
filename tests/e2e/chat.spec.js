import { test, expect } from '@playwright/test';

const IMAGE_URL = 'https://www.w3schools.com/html/img_chania.jpg';
const VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';
const SCRIPT_MESSAGE = '<script>alert(document.cookie)</script><b>Mensaje seguro</b>';

async function sendMessage(page, message) {
  await page.getByRole('textbox', { name: 'Username' }).fill('E2E');
  await page.getByRole('textbox', { name: 'Escriba un mensaje o pegue una URL' }).fill(message);
  await page.getByRole('button', { name: 'Send' }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === 'passed') {
    await page.screenshot({ path: 'evidencia4.png', fullPage: true });
  }
});

test('envía una URL de imagen y espera a que cargue en el chat', async ({ page }) => {
  await sendMessage(page, IMAGE_URL);

  const image = page.locator('#messages img').last();
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('src', IMAGE_URL);
  await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
});

test('envía una URL de video y espera los metadatos del reproductor', async ({ page }) => {
  await sendMessage(page, VIDEO_URL);

  const video = page.locator('#messages video').last();
  await expect(video).toBeVisible();
  await expect(video).toHaveAttribute('controls', '');
  await expect(video).toHaveAttribute('src', VIDEO_URL);
  await video.evaluate((element) => new Promise((resolve, reject) => {
    if (element.readyState >= 1) {
      resolve();
      return;
    }
    element.addEventListener('loadedmetadata', resolve, { once: true });
    element.addEventListener('error', () => reject(new Error('El video no pudo cargar sus metadatos')), { once: true });
  }));
});

test('bloquea alertas y sanea un intento de inyección de scripts', async ({ page }) => {
  let dialogDetected = false;
  page.on('dialog', async (dialog) => {
    dialogDetected = true;
    await dialog.dismiss();
  });

  await sendMessage(page, SCRIPT_MESSAGE);

  const message = page.locator('#messages li').last();
  await expect(message).toContainText('Mensaje seguro');
  await expect(message).not.toContainText('alert');
  await expect(message).not.toContainText('script');
  expect(dialogDetected).toBe(false);
});
