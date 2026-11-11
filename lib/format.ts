const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** +$1.12 / -$28.44 */
export function signedMoney(n: number): string {
  const sign = n < 0 ? '-' : '+';
  return `${sign}$${money.format(Math.abs(n))}`;
}

export function plainMoney(n: number): string {
  return `${n < 0 ? '-' : ''}$${money.format(Math.abs(n))}`;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function formatTime(t: string): string {
  return t.slice(0, 8);
}

export function formatPrice(n: number): string {
  return String(Number(n));
}

export function tone(n: number): 'pos' | 'neg' | 'zero' {
  return n > 0 ? 'pos' : n < 0 ? 'neg' : 'zero';
}
