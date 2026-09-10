export { cn } from "cn";

export function formatPKR(amount: number): string {
  if (isNaN(amount)) return 'Rs. 0';
  return 'Rs. ' + Math.round(amount).toLocaleString('en-PK');
}
