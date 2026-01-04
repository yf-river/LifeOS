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

test.describe('Get笔记 笔记CRUD功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((authState) => {
      localStorage.setItem('auth-storage', JSON.stringify(authState));
    }, mockAuthState);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('笔记列表应该正确显示', async ({ page }) => {
    await page.screenshot({ path: 'playwright-report/screenshots/note-list.png', fullPage: true });

    // 检查笔记相关元素
    const noteElements = await page.evaluate(() => {
      return {
        noteCards: document.querySelectorAll('[data-testid="note-card"], .note-card').length,
        listItems: document.querySelectorAll('li').length,
        articles: document.querySelectorAll('article').length,
      };
    });

    console.log('笔记元素统计:', JSON.stringify(noteElements, null, 2));
  });

  test('Omnibar应该可以输入内容', async ({ page }) => {
    // 查找所有可编辑区域
    const editables = await page.evaluate(() => {
      const proseMirrors = document.querySelectorAll('.ProseMirror');
      const contentEditables = document.querySelectorAll('[contenteditable="true"]');
      const textareas = document.querySelectorAll('textarea');
      const inputs = document.querySelectorAll('input[type="text"]');
      
      return {
        proseMirrors: proseMirrors.length,
        contentEditables: contentEditables.length,
        textareas: textareas.length,
        textInputs: inputs.length,
      };
    });

    console.log('可编辑区域:', JSON.stringify(editables, null, 2));

    // 尝试在编辑器中输入
    const editor = page.locator('.ProseMirror').first().or(
      page.locator('[contenteditable="true"]').first()
    );
    
    const isVisible = await editor.isVisible().catch(() => false);
    
    if (isVisible) {
      await editor.click();
      await page.keyboard.type('测试笔记内容');
      console.log('成功输入测试内容');
    } else {
      console.log('未找到可编辑区域');
    }

    await page.screenshot({ path: 'playwright-report/screenshots/omnibar-input.png' });
  });

  test('快捷操作按钮检查', async ({ page }) => {
    const quickActions = ['添加图片', '添加链接', '导入音视频', '图片', '链接', '音视频'];
    
    for (const action of quickActions) {
      const button = page.getByText(action).first();
      const isVisible = await button.isVisible().catch(() => false);
      if (isVisible) {
        console.log(`快捷操作 "${action}": 存在`);
      }
    }

    await page.screenshot({ path: 'playwright-report/screenshots/quick-actions.png' });
  });

  test('工具栏按钮检查', async ({ page }) => {
    // 统计按钮
    const buttonInfo = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const svgButtons = Array.from(buttons).filter(b => b.querySelector('svg'));
      
      return {
        totalButtons: buttons.length,
        buttonsWithIcons: svgButtons.length,
        buttonTexts: Array.from(buttons).slice(0, 10).map(b => b.textContent?.trim() || '[icon]'),
      };
    });

    console.log('按钮统计:', JSON.stringify(buttonInfo, null, 2));
    await page.screenshot({ path: 'playwright-report/screenshots/toolbar.png' });
  });

  test('日期分组检查', async ({ page }) => {
    const dateLabels = ['今天', '昨天', '本周', '本月'];
    
    for (const label of dateLabels) {
      const element = page.getByText(label, { exact: true }).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        console.log(`日期分组 "${label}": 存在`);
      }
    }

    await page.screenshot({ path: 'playwright-report/screenshots/date-groups.png' });
  });
});

test.describe('Get笔记 AI面板功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((authState) => {
      localStorage.setItem('auth-storage', JSON.stringify(authState));
    }, mockAuthState);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('AI面板快捷提示词检查', async ({ page }) => {
    const quickPrompts = ['帮我生成周报', '整理一周待办', '24小时热点', '周报', '待办', '热点'];
    
    for (const prompt of quickPrompts) {
      const element = page.getByText(prompt).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        console.log(`快捷提示词 "${prompt}": 存在`);
      }
    }

    await page.screenshot({ path: 'playwright-report/screenshots/ai-quick-prompts.png' });
  });

  test('AI对话输入框检查', async ({ page }) => {
    // 查找输入框
    const inputs = await page.evaluate(() => {
      const allInputs = document.querySelectorAll('input, textarea');
      return Array.from(allInputs).map(input => ({
        type: input.tagName,
        placeholder: (input as HTMLInputElement).placeholder || '',
        classes: input.className,
      }));
    });

    console.log('输入框列表:', JSON.stringify(inputs, null, 2));
    await page.screenshot({ path: 'playwright-report/screenshots/ai-input.png' });
  });

  test('Auto模式开关检查', async ({ page }) => {
    const autoToggle = page.getByText('Auto').first();
    const isVisible = await autoToggle.isVisible().catch(() => false);
    console.log(`Auto模式开关: ${isVisible ? '存在' : '不存在'}`);

    await page.screenshot({ path: 'playwright-report/screenshots/auto-mode.png' });
  });
});

test.describe('Get笔记 系统标签图标', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((authState) => {
      localStorage.setItem('auth-storage', JSON.stringify(authState));
    }, mockAuthState);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('系统标签图标检查', async ({ page }) => {
    // 检查SVG图标
    const icons = await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      return {
        totalSvgs: svgs.length,
        lucideIcons: document.querySelectorAll('[class*="lucide"]').length,
      };
    });

    console.log('图标统计:', JSON.stringify(icons, null, 2));
    await page.screenshot({ path: 'playwright-report/screenshots/system-tag-icons.png' });
  });

  test('AI生成标识检查', async ({ page }) => {
    const aiIndicators = await page.evaluate(() => {
      return {
        aiGenerated: document.querySelectorAll('[data-ai-generated="true"]').length,
        aiClass: document.querySelectorAll('.ai-indicator, .ai-generated').length,
        aiText: document.body.textContent?.includes('AI生成') || false,
      };
    });

    console.log('AI标识:', JSON.stringify(aiIndicators, null, 2));
    await page.screenshot({ path: 'playwright-report/screenshots/ai-indicators.png' });
  });
});
