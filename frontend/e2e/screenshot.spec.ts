import { test } from '@playwright/test';

const mockAuthState = {
  state: {
    token: 'test-token-for-e2e',
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      nickname: '测试用户',
    },
  },
  version: 0,
};

test('截图当前页面', async ({ page }) => {
  await page.addInitScript((authState) => {
    localStorage.setItem('auth-storage', JSON.stringify(authState));
  }, mockAuthState);
  
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ 
    path: 'current-state.png', 
    fullPage: true 
  });
});
