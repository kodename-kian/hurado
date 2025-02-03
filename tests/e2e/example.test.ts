import { test, expect } from 'playwright/test';

// Stub tests;  TODO replace with actual e2e test suite

// Test that playwright works by checking NOI.PH home page
test('playwright works', async({ page }) => {
  await page.goto('https://noi.ph/');
  await expect(page).toHaveTitle("Home — NOI.PH - Philippine Programming Contest");
});

// Test Hurado home screen title
test('has title', async ({ page }) => {
  // Do we want to test on prod? 
  // Or, we can have Playwright build a copy of the project and run tests there?
  //    (we can set a base_url in playwright.config and use relative paths)
  await page.goto('http://localhost:10000/');

  await expect(page).toHaveTitle("Hurado | NOI.PH Online Judge | The best way to learn math and coding");
});