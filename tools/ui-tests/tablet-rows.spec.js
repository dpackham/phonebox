const { test, expect } = require('@playwright/test');

// A note that starts on the phone rows and runs onto tablet rows (6 and 7), next to an empty row of cells.
async function openEditor(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/settings/#general');
  await page.evaluate(() => {
    localStorage.setItem('pb-editor-screen', 'phone');
    const cfg = JSON.parse(localStorage.getItem('pb-demo-config'));
    cfg.pages = [{ id: 'tall', title: 'Tall', enabled: true, widgets: [
      { id: 'tall-note', type: 'note', x: 0, y: 4, w: 4, h: 4, options: { text: 'Runs onto tablet rows' } },
    ] }];
    localStorage.setItem('pb-demo-config', JSON.stringify(cfg));
  });
  await page.reload();
  await page.goto('/settings/#pages');
  await expect(page.locator('#canvas .wb')).toHaveCount(1);
  const box = await page.locator('#canvas').boundingBox();
  return { cell: box.width / 12, widget: await page.locator('#canvas .wb').boundingBox() };
}

const saved = (page) => page.evaluate(() => {
  const { x, y, w, h } = cfg.pages[0].widgets[0];
  return { x, y, w, h };
});

test('a sideways drag in Phone view keeps the saved tablet rows', async ({ page }) => {
  const { cell, widget } = await openEditor(page);
  const sx = widget.x + widget.width / 2, sy = widget.y + widget.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + cell * 2, sy, { steps: 6 });
  await page.mouse.up();
  expect(await saved(page)).toEqual({ x: 2, y: 4, w: 4, h: 4 });
});

test('a width-only resize in Phone view keeps the saved height', async ({ page }) => {
  const { cell } = await openEditor(page);
  const handle = await page.locator('#canvas .wb .rz').boundingBox();
  const sx = handle.x + handle.width / 2, sy = handle.y + handle.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + cell * 2, sy, { steps: 6 });
  await page.mouse.up();
  expect(await saved(page)).toEqual({ x: 0, y: 4, w: 6, h: 4 });
});
