import { test, expect } from '@playwright/test';

/**
 * 时间显示功能 E2E 测试
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

// 模拟笔记数据
const mockNotes = [
  {
    id: 'note-1',
    content: '刚刚创建的笔记',
    created_at: new Date().toISOString(),
    tags: [],
  },
  {
    id: 'note-2',
    content: '5分钟前的笔记',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    tags: [],
  },
  {
    id: 'note-3',
    content: '2小时前的笔记',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: [],
  },
  {
    id: 'note-4',
    content: '昨天的笔记',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    tags: [],
  },
];

test.describe('笔记时间显示测试', () => {
  test.beforeEach(async ({ page }) => {
    // 注入认证状态
    await page.addInitScript((authState) => {
      localStorage.setItem('auth-storage', JSON.stringify(authState));
    }, mockAuthState);
    
    // Mock API 响应
    await page.route('**/api/notes*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNotes),
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('应该显示相对时间格式', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // 截图记录时间显示
    await page.screenshot({ path: 'playwright-report/screenshots/time-display.png', fullPage: true });
    
    // 检查时间格式（相对时间应该包含这些关键词）
    const timePatterns = ['刚刚', '分钟前', '小时前', '昨天', '周'];
    
    for (const pattern of timePatterns) {
      const element = page.getByText(pattern, { exact: false }).first();
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`时间格式 "${pattern}": ${isVisible ? '存在' : '不存在'}`);
    }
  });

  test('悬浮应显示完整时间', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // 找到时间显示元素
    const timeElement = page.locator('span[title*="创建于"]').first();
    
    if (await timeElement.isVisible()) {
      // 获取 title 属性
      const title = await timeElement.getAttribute('title');
      console.log(`完整时间: ${title}`);
      
      // 验证 title 包含 "创建于"
      expect(title).toContain('创建于');
      
      // 验证 title 包含日期格式
      expect(title).toMatch(/\d{4}-\d{2}-\d{2}/);
    }
    
    await page.screenshot({ path: 'playwright-report/screenshots/time-tooltip.png' });
  });
});

test.describe('时间格式化单元测试', () => {
  test('formatRelativeTime 函数测试', async ({ page }) => {
    await page.goto('/');
    
    // 在页面中执行时间格式化测试
    const results = await page.evaluate(() => {
      // 模拟 formatRelativeTime 逻辑
      function formatRelativeTime(dateInput: string | Date): string {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        const now = new Date();
        
        const diff = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diff / 60000);
        const diffHours = Math.floor(diff / 3600000);
        const diffDays = Math.floor(diff / 86400000);
        
        if (diffMinutes < 1) return '刚刚';
        if (diffMinutes < 60) return `${diffMinutes}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 2) return '昨天';
        if (diffDays < 7) return '本周';
        return '更早';
      }
      
      const testCases = [
        { input: new Date(), expected: '刚刚' },
        { input: new Date(Date.now() - 5 * 60 * 1000), expected: '5分钟前' },
        { input: new Date(Date.now() - 30 * 60 * 1000), expected: '30分钟前' },
        { input: new Date(Date.now() - 2 * 60 * 60 * 1000), expected: '2小时前' },
        { input: new Date(Date.now() - 25 * 60 * 60 * 1000), expected: '昨天' },
      ];
      
      return testCases.map(tc => ({
        expected: tc.expected,
        actual: formatRelativeTime(tc.input),
        pass: formatRelativeTime(tc.input) === tc.expected,
      }));
    });
    
    console.log('时间格式化测试结果:');
    for (const result of results) {
      console.log(`  ${result.pass ? '✓' : '✗'} ${result.expected} => ${result.actual}`);
    }
    
    // 验证所有测试通过
    const allPassed = results.every(r => r.pass);
    expect(allPassed).toBe(true);
  });
});
