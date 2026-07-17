import { test, expect } from '@playwright/test';

test.describe('Customer Portal Purchase and Ticketing Lifecycle E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Visit Login
    await page.goto('/login');
  });

  test('should log in, verify dashboard metrics, and navigate to support tickets page', async ({ page }) => {
    // 2. Perform Login
    await page.fill('input[type="email"]', 'test-buyer@dicepvc.ai');
    await page.fill('input[type="password"]', 'Password123@');
    
    // Intercept login route to return mock tokens
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-jwt-token-xyz',
          token_type: 'bearer',
          user: {
            id: 'usr_1',
            email: 'test-buyer@dicepvc.ai',
            name: 'Alex Sterling',
            role: 'customer'
          }
        }),
      });
    });

    // Intercept profile route
    await page.route('**/api/v1/customers/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'cust_1',
          user_id: 'usr_1',
          company_name: 'Test Labs Inc',
          name: 'Alex Sterling',
          email: 'test-buyer@dicepvc.ai'
        }),
      });
    });

    // Intercept dashboard stats route
    await page.route('**/api/v1/customers/dashboard/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          active_licenses: 2,
          open_tickets: 1,
          total_spent: 198.0
        }),
      });
    });

    // Click submit
    await page.click('button[type="submit"]');

    // 3. Confirm Redirect to Dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify Welcome message renders dynamic name
    await expect(page.locator('text=Good Morning, Alex')).toBeVisible();

    // Verify stats cards render dynamic stats values
    await expect(page.locator('text=2 Devices')).toBeVisible();
    await expect(page.locator('text=1')).toBeVisible(); // Open tickets count

    // 4. Navigate to Support Tickets
    await page.click('a[href="/tickets"]');
    await expect(page).toHaveURL(/\/tickets/);
  });
});
