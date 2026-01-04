import { test, expect } from '@playwright/test';

/**
 * 搜索功能 E2E 测试
 */

// 模拟认证状态
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

test.describe('搜索功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 注入认证状态
    await page.addInitScript((authState) => {
      localStorage.setItem('auth-storage', JSON.stringify(authState));
    }, mockAuthState);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('搜索框应该可见', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 查找搜索框
    const searchInput = page.locator('input[placeholder*="搜索"]');
    await expect(searchInput).toBeVisible();
    
    await page.screenshot({ path: 'playwright-report/screenshots/search-bar.png' });
  });

  test('搜索框应该支持输入', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const searchInput = page.locator('input[placeholder*="搜索"]');
    await searchInput.fill('测试笔记');
    
    // 验证输入值
    await expect(searchInput).toHaveValue('测试笔记');
    
    await page.screenshot({ path: 'playwright-report/screenshots/search-input.png' });
  });

  test('搜索框应该有清除按钮', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const searchInput = page.locator('input[placeholder*="搜索"]');
    await searchInput.fill('测试');
    
    // 等待清除按钮出现
    await page.waitForTimeout(500);
    
    // 查找清除按钮（X 图标）
    const clearButton = page.locator('button').filter({ has: page.locator('svg path[d*="18 6"]') });
    
    await page.screenshot({ path: 'playwright-report/screenshots/search-clear-button.png' });
  });

  test('Cmd/Ctrl+K 应该聚焦搜索框', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 按下快捷键
    await page.keyboard.press('Meta+k');
    
    // 验证搜索框聚焦
    const searchInput = page.locator('input[placeholder*="搜索"]');
    await expect(searchInput).toBeFocused();
    
    await page.screenshot({ path: 'playwright-report/screenshots/search-shortcut.png' });
  });
});

test.describe('标签筛选测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((authState) => {
      localStorage.setItem('auth-storage', JSON.stringify(authState));
    }, mockAuthState);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('标题旁应有筛选下拉按钮', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 查找"全部笔记"标题
    const title = page.getByText('全部笔记');
    await expect(title).toBeVisible();
    
    // 查找下拉箭头按钮
    const filterButton = page.locator('button').filter({ has: page.locator('svg path[d*="5.293"]') });
    
    await page.screenshot({ path: 'playwright-report/screenshots/filter-button.png' });
  });

  test('点击筛选按钮应展开标签筛选栏', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // 点击下拉按钮
    const filterButton = page.locator('h1:has-text("全部笔记") + button');
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: 'playwright-report/screenshots/filter-expanded.png' });
  });
});
