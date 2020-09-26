export function ruleOptionFilled(option?: any[]): boolean {
  return Array.isArray(option) && option.length > 0;
}
