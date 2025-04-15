import { test, expect } from 'playwright/test';

test('healthcheck', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle("Hurado | NOI.PH Online Judge | The best way to learn math and coding");
});

test('navbar', async ({ page }) => {
    await page.goto('/');

    const nav_links = [
      ['Register', '/register'],
      ['Login', '/login'],
      ['Contests', '/contests'],
      ['Problems', '/sets'],  
    ];

    for (const [text, href] of nav_links) {
        await page.getByRole('link', { name: text }).click();
        await expect(page).toHaveURL(href);
        await page.goBack();
    }
});