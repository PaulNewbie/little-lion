const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 12
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();

  console.log('\n=== Creating Visual Test for Select Elements ===\n');

  await page.goto('http://localhost:4173/');
  await page.waitForLoadState('networkidle');

  // Inject a test form with select elements
  await page.evaluate(() => {
    // Create test container
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      width: 340px;
      max-width: 90vw;
    `;

    container.innerHTML = `
      <h2 style="margin: 0 0 16px 0; color: #0052A1; font-size: 18px; text-align: center;">
        Mobile Select Element Test
      </h2>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; color: #374151; font-weight: 500; font-size: 14px;">
          Gender
        </label>
        <select>
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; color: #374151; font-weight: 500; font-size: 14px;">
          Grade Level
        </label>
        <select>
          <option value="">Select Grade</option>
          <option value="preschool">Preschool</option>
          <option value="kindergarten">Kindergarten</option>
          <option value="1">Grade 1</option>
          <option value="2">Grade 2</option>
          <option value="3">Grade 3</option>
        </select>
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; color: #374151; font-weight: 500; font-size: 14px;">
          Service Type
        </label>
        <select>
          <option value="">Select Service</option>
          <option value="speech">Speech Therapy</option>
          <option value="occupational">Occupational Therapy</option>
          <option value="physical">Physical Therapy</option>
          <option value="behavioral">Behavioral Therapy</option>
        </select>
      </div>
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 6px; font-size: 13px; color: #1e40af;">
        <strong>Mobile Improvements:</strong><br>
        ✓ 16px font (no iOS zoom)<br>
        ✓ 44px min-height (touch-friendly)<br>
        ✓ Custom chevron arrow<br>
        ✓ 10px border radius
      </div>
    `;

    document.body.appendChild(container);

    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    `;
    document.body.appendChild(backdrop);
  });

  await page.waitForTimeout(500);

  // Take screenshot of the test form
  await page.screenshot({
    path: 'C:\\Users\\Admin\\little-lion\\screenshots\\select-demo-normal.png',
    fullPage: false
  });
  console.log('✅ Screenshot: Normal state');

  // Click first select to show focus state
  await page.click('select');
  await page.waitForTimeout(300);
  await page.screenshot({
    path: 'C:\\Users\\Admin\\little-lion\\screenshots\\select-demo-focused.png',
    fullPage: false
  });
  console.log('✅ Screenshot: Focused state (iOS picker should appear on real device)');

  // Get detailed measurements
  const measurements = await page.evaluate(() => {
    const select = document.querySelector('select');
    const computed = window.getComputedStyle(select);
    const rect = select.getBoundingClientRect();

    return {
      computed: {
        fontSize: computed.fontSize,
        minHeight: computed.minHeight,
        height: computed.height,
        padding: computed.padding,
        paddingTop: computed.paddingTop,
        paddingRight: computed.paddingRight,
        paddingBottom: computed.paddingBottom,
        paddingLeft: computed.paddingLeft,
        borderRadius: computed.borderRadius,
        border: computed.border,
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        appearance: computed.appearance,
        webkitAppearance: computed.webkitAppearance,
        backgroundImage: computed.backgroundImage.substring(0, 150) + '...',
        backgroundPosition: computed.backgroundPosition,
        backgroundSize: computed.backgroundSize
      },
      rect: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left)
      }
    };
  });

  console.log('\n=== Select Element Measurements ===');
  console.log(JSON.stringify(measurements, null, 2));

  console.log('\n=== Test Complete ===');
  console.log('Screenshots saved to C:\\Users\\Admin\\little-lion\\screenshots\\');

  await page.waitForTimeout(2000); // Keep browser open for visual inspection
  await browser.close();
})();
