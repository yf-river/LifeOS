/**
 * 时间格式化工具 - 按照 Get笔记 风格
 * 
 * 显示规则：
 * - < 1分钟: "刚刚"
 * - < 60分钟: "X分钟前"
 * - < 24小时: "X小时前"
 * - 昨天: "昨天 HH:mm"
 * - 本周: "周X HH:mm"
 * - 本年: "MM-DD HH:mm"
 * - 跨年: "YYYY-MM-DD HH:mm"
 */

const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * 格式化相对时间显示
 */
export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  
  // 时间差（毫秒）
  const diff = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diff / 60000);
  const diffHours = Math.floor(diff / 3600000);
  const diffDays = Math.floor(diff / 86400000);
  
  // < 1分钟
  if (diffMinutes < 1) {
    return '刚刚';
  }
  
  // < 60分钟
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  }
  
  // < 24小时
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }
  
  // 判断是否是昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `昨天 ${formatTime(date)}`;
  }
  
  // 本周内（7天内）
  if (diffDays < 7) {
    return `${WEEK_DAYS[date.getDay()]} ${formatTime(date)}`;
  }
  
  // 本年内
  if (date.getFullYear() === now.getFullYear()) {
    return `${formatMonthDay(date)} ${formatTime(date)}`;
  }
  
  // 跨年
  return formatFullDate(date);
}

/**
 * 格式化绝对时间（用于详情页、悬浮提示等）
 */
export function formatAbsoluteTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return `创建于 ${formatFullDate(date)}`;
}

/**
 * 格式化完整日期时间 YYYY-MM-DD HH:mm:ss
 */
export function formatFullDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化时间 HH:mm
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 格式化月日 MM-DD
 */
function formatMonthDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

/**
 * 判断是否同一天
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * 获取时间距离描述（用于列表排序分组）
 */
export function getTimeGroup(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return '本周';
  if (diffDays < 30) return '本月';
  if (diffDays < 365) return '今年';
  return `${date.getFullYear()}年`;
}
