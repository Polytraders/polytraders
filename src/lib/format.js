export function formatProfit(profit) {
  if (!profit && profit !== 0) return `$0.00`;
  const n = Number(profit);
  if (Number.isNaN(n)) return `$0.00`;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
