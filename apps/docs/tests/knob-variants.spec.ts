import { expect, test } from '@playwright/test';

/**
 * Pixel baselines for every Knob variant. The body renderer draws shapes, finishes, grip,
 * and glow in SVG, and a wrong gradient stop or a dropped layer still renders *something* —
 * only a picture catches it. Both schemes are covered because hardware materials are fixed
 * colors while the interface variants follow the theme.
 */
const DEMOS = ['variants', 'hardware-variants', 'custom-body'];

test.describe('Knob variants', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test.describe(scheme, () => {
      test.use({ colorScheme: scheme, contextOptions: { reducedMotion: 'reduce' }, viewport: { width: 1280, height: 1800 } });

      test('demos', async ({ page }) => {
        await page.goto('/ui/Knob', { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({ content: '[aria-label="Open actions"] { visibility: hidden !important; }' });

        for (const demo of DEMOS) {
          const preview = page.getByTestId(`demo-preview-Knob.${demo}`).first();
          await preview.scrollIntoViewIfNeeded();
          await expect(preview.getByText('Loading demo…')).toHaveCount(0);
          await expect(preview).toHaveScreenshot(`${scheme}-${demo}.png`, {
            animations: 'disabled',
            maxDiffPixelRatio: 0.005,
          });
        }
      });
    });
  }
});
