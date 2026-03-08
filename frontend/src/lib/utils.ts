export function money(value: string | number): string {
  const amount = typeof value === "number" ? value : Number(value)
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}
