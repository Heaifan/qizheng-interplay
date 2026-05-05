/** 日志时间展示 */

export function formatTimeZh(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}
