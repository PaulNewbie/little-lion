const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 12
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();

  console.log('\n=== Mobile Dropdown Testing with Login (iPhone 12: 390x844) ===\n');

  try {
    // Test 1: Login and navigate to a page with sidebar
    console.log('Test 1: Attempting login...');
    await page.goto('http://localhost:4173/login');
    await page.waitForLoadState('networkidle');

    // Fill login form - we'll use demo credentials
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.screenshot({ path: 'C:\\Users\\Admin\\little-lion\\screenshots\\mobile-login-filled.png', fullPage: true });

    // Click login button
    await page.click('button:has-text("LOGIN")');
    await page.waitForTimeout(3000); // Wait for navigation

    const currentUrl = page.url();
    console.log(`- Current URL after login attempt: ${currentUrl}`);
    await page.screenshot({ path: 'C:\\Users\\Admin\\little-lion\\screenshots\\mobile-after-login.png', fullPage: true });

    // Test 2: Check if sidebar is present
    console.log('\nTest 2: Checking for Sidebar');
    const sidebarExists = await page.locator('.sidebar, [class*="sidebar"]').count() > 0;
    console.log(`- Sidebar exists: ${sidebarExists}`);

    if (sidebarExists) {
      // Take screenshot of sidebar
      await page.screenshot({ path: 'C:\\Users\\Admin\\little-lion\\screenshots\\mobile-sidebar-closed.png', fullPage: true });

      // Try to open sidebar on mobile (hamburger menu)
      const hamburger = await page.locator('.sidebar__toggle, .hamburger, [class*="menu-toggle"]').first();
      const hamburgerExists = await hamburger.count() > 0;
      console.log(`- Hamburger menu exists: ${hamburgerExists}`);

      if (hamburgerExists) {
        await hamburger.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'C:\\Users\\Admin\\little-lion\\screenshots\\mobile-sidebar-open.png', fullPage: true });

        // Check for dropdown menus
        const dropdowns = await page.locator('.sidebar__item--dropdown, [class*="dropdown"]').count();
        console.log(`- Dropdown items found: ${dropdowns}`);

        if (dropdowns > 0) {
          // Click first dropdown
          await page.locator('.sidebar__item--dropdown, [class*="dropdown"]').first().click();
          await page.waitForTimeout(300);
          await page.screenshot({ path: 'C:\\Users\\Admin\\little-lion\\screenshots\\mobile-dropdown-expanded.png', fullPage: true });

          // Check dropdown item spacing/touch targets
          const dropdownStyles = await page.evaluate(() => {
            const dropdown = document.querySelector('.sidebar__submenu-item, [class*="submenu"]');
            if (!dropdown) return { noDropdownItems: true };

            const styles = window.getComputedStyle(dropdown);
            return {
              minHeight: styles.minHeight,
              padding: styles.padding,
              fontSize: styles.fontSize
            };
          });
          console.log('- Dropdown item styles:', JSON.stringify(dropdownStyles, null, 2));
        }
      }
    }

    // Test 3: Navigate to a form page with select elements
    console.log('\nTest 3: Testing Form Pages with Select Elements');

    // Try to navigate to enrollment form (if accessible)
    await page.goto('http://localhost:4173/admin/enroll-student');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const selectElements = await page.locator('select').count();
    console.log(`- Select elements on enrollment page: ${selectElements}`);

    if (selectElements > 0) {
      await page.screenshot({ path: 'C:\\Users\\Admin\\little-lion\\screenshots\\mobile-form-with-selects.png', fullPage: true });

      // Get styles of first select element
      const selectStyles = await page.evaluate(() => {
        const select = document.querySelector('select');
        if (!select) return { noSelect: true };

        const styles = window.getComputedStyle(select);
        const rect = select.getBoundingClientRect();

        return {
          fontSize: styles.fontSize,
          minHeight: styles.minHeight,
          height: styles.height,
          padding: styles.padding,
          borderRadius: styles.borderRadius,
          backgroundColor: styles.backgroundColor,
          border: styles.border,
          appearance: styles.appearance,
          webkitAppearance: styles.webkitAppearance,
          actualHeight: rect.height + 'px',
          touchFriendly: rect.height >= 44
        };
      });
      console.log('- Select element styles:', JSON.stringify(selectStyles, null, 2));

      // Click on select to trigger mobile picker
      await page.locator('select').first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'C:\\Users\\Admin\\little-lion\\screenshots\\mobile-select-focused.png', fullPage: true });

      // Check if select has custom arrow
      const hasCustomArrow = await page.evaluate(() => {
        const select = document.querySelector('select');
        if (!select) return false;

        const styles = window.getComputedStyle(select);
        const bgImage = styles.backgroundImage;
        return bgImage && bgImage.includes('svg') && bgImage.includes('chevron');
      });
      console.log(`- Select has custom chevron arrow: ${hasCustomArrow}`);
    }

  } catch (error) {
    console.error('Error during testing:', error.message);
    await page.screenshot({ path: 'C:\\Users\\Admin\\little-lion\\screenshots\\mobile-error.png', fullPage: true });
  }

  console.log('\n=== Testing Complete ===');
  console.log('Screenshots saved to C:\\Users\\Admin\\little-lion\\screenshots\\');

  await browser.close();
})();
