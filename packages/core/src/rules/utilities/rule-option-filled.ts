export function ruleOptionFilled(option?: any[]) {
  return Array.isArray(option) && option.length > 0;
}
