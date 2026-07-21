export function formatMoney(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

export function formatDate(iso: string | null): string {
  if (!iso) return '상시 운영'
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'ongoing':
      return '진행중'
    case 'recruiting':
      return '모집중'
    case 'closed':
      return '종료'
    default:
      return status
  }
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'ongoing':
      return 'badge badge-success'
    case 'recruiting':
      return 'badge badge-info'
    default:
      return 'badge badge-default'
  }
}

export function formatPercent(rate: number): string {
  const sign = rate > 0 ? '+' : ''
  return `${sign}${rate.toFixed(2)}%`
}

export function profitTextClass(amount: number): string {
  if (amount > 0) return 'text-rise'
  if (amount < 0) return 'text-fall'
  return ''
}

export function profitBadgeClass(amount: number): string {
  if (amount > 0) return 'badge badge-rise'
  if (amount < 0) return 'badge badge-fall'
  return 'badge badge-default'
}
