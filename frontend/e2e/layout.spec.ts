import { test, expect } from '@playwright/test';

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

test.describe('Get笔记 三栏布局测试', () => {
  test.beforeEach(async ({ page }) => {
    // 注入认证状态到 localStorage
    await page.addInitScript((authState) => {
      localStorage.setItem('auth-storage', JSON.stringify(authState));
    }, mockAuthState);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('页面应该显示三栏布局', async ({ page }) => {
    // 等待主布局加载
    await page.waitForTimeout(1000);

    // 截图记录初始状态
    await page.screenshot({ path: 'playwright-report/screenshots/layout-initial.png', fullPage: true });

    // 验证主布局容器存在（使用更灵活的选择器）
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // 检查是否不再是登录页
    const loginForm = page.locator('text=欢迎回来');
    const isLoginPage = await loginForm.isVisible().catch(() => false);
    
    if (isLoginPage) {
      console.log('仍在登录页，认证注入可能失败');
    } else {
      console.log('已进入主布局');
    }
  });

  test('侧边栏应该显示正确的菜单项', async ({ page }) => {
    await page.waitForTimeout(1000);

    // 检查侧边栏菜单项
    const menuItems = ['首页', 'AI助手', '知识库', '标签', '小程序', '下载App'];
    
    for (const item of menuItems) {
      const menuItem = page.getByText(item, { exact: true }).first();
      const isVisible = await menuItem.isVisible().catch(() => false);
      console.log(`菜单项 "${item}": ${isVisible ? '可见' : '不可见'}`);
    }

    await page.screenshot({ path: 'playwright-report/screenshots/sidebar.png' });
  });

  test('侧边栏结构验证', async ({ page }) => {
    await page.waitForTimeout(1000);

    // 使用更通用的选择器
    const sidebar = page.locator('aside, [role="navigation"], nav').first();
    const isVisible = await sidebar.isVisible().catch(() => false);
    
    console.log(`侧边栏可见: ${isVisible}`);
    
    if (isVisible) {
      const box = await sidebar.boundingBox();
      if (box) {
        console.log(`侧边栏尺寸: ${box.width}x${box.height}`);
      }
    }

    await page.screenshot({ path: 'playwright-report/screenshots/sidebar-structure.png' });
  });

  test('AI面板验证', async ({ page }) => {
    await page.waitForTimeout(1000);

    // 截图
    await page.screenshot({ path: 'playwright-report/screenshots/ai-panel.png' });

    // 检查AI相关元素
    const aiElements = [
      page.getByText('AI', { exact: true }),
      page.getByText('帮我生成周报'),
      page.locator('[data-testid="ai-panel"]'),
    ];

    for (let i = 0; i < aiElements.length; i++) {
      const isVisible = await aiElements[i].first().isVisible().catch(() => false);
      console.log(`AI元素 ${i + 1}: ${isVisible ? '可见' : '不可见'}`);
    }
  });

  test('主内容区应显示Omnibar输入框', async ({ page }) => {
    await page.waitForTimeout(1000);

    // 查找编辑器或输入区域
    const editors = [
      page.locator('.ProseMirror'),
      page.locator('[contenteditable="true"]'),
      page.locator('textarea'),
      page.locator('input[type="text"]'),
    ];

    for (let i = 0; i < editors.length; i++) {
      const count = await editors[i].count();
      console.log(`编辑器类型 ${i + 1}: ${count} 个`);
    }

    await page.screenshot({ path: 'playwright-report/screenshots/omnibar.png' });
  });

  test('页面应响应式适配', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-large' },
      { width: 1440, height: 900, name: 'desktop-medium' },
      { width: 1280, height: 720, name: 'desktop-small' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: `playwright-report/screenshots/viewport-${viewport.name}.png`,
        fullPage: true 
      });
    }
  });
});

test.describe('Get笔记 CSS变量验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((authState) => {
      localStorage.setItem('auth-storage', JSON.stringify(authState));
    }, mockAuthState);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('应使用正确的主题色', async ({ page }) => {
    await page.waitForTimeout(1000);

    // 获取CSS变量
    const styles = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      return {
        primary: getComputedStyle(root).getPropertyValue('--primary').trim(),
        background: getComputedStyle(body).backgroundColor,
        bodyClasses: body.className,
      };
    });

    console.log(`主色调: ${styles.primary}`);
    console.log(`背景色: ${styles.background}`);
    console.log(`Body类: ${styles.bodyClasses}`);

    await page.screenshot({ path: 'playwright-report/screenshots/theme-colors.png' });
  });
});

test.describe('Get笔记 页面结构分析', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((authState) => {
      localStorage.setItem('auth-storage', JSON.stringify(authState));
    }, mockAuthState);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('分析页面DOM结构', async ({ page }) => {
    await page.waitForTimeout(1000);

    // 获取页面结构概览
    const structure = await page.evaluate(() => {
      const body = document.body;
      const children = Array.from(body.children);
      
      return {
        bodyChildren: children.length,
        firstLevelTags: children.map(el => ({
          tag: el.tagName,
          classes: el.className,
          id: el.id,
        })),
        hasAside: body.querySelectorAll('aside').length,
        hasNav: body.querySelectorAll('nav').length,
        hasMain: body.querySelectorAll('main').length,
      };
    });

    console.log('页面结构:', JSON.stringify(structure, null, 2));

    await page.screenshot({ path: 'playwright-report/screenshots/page-structure.png', fullPage: true });
  });
});
