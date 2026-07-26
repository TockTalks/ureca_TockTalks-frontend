import { formatMoney, formatPercent, profitTextClass } from '../lib/format'

// 커뮤니티 글에 첨부된 매도 인증 내역을 "종목 N주 매도  +율% (금액원)" 형태로 보여준다.
function TradeCertificateCard({ label, rate, amount }: { label: string; rate: number; amount: number }) {
  return (
    <div className="trade-certificate-card">
      <span className="trade-certificate-label">{label}</span>
      <span className={`trade-certificate-value ${profitTextClass(amount)}`}>
        {formatPercent(rate)} ({formatMoney(amount)})
      </span>
    </div>
  )
}

export default TradeCertificateCard
