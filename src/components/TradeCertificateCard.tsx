import { formatMoney, formatPercent, profitTextClass } from '../lib/format'

// 커뮤니티 글에 첨부된 매매 인증 내역을 보여준다.
// 매도는 "종목 N주 매도  +율% (금액원)", 매수는 손익이 없어(rate/amount가 null) 라벨만 보여준다.
function TradeCertificateCard({ label, rate, amount }: { label: string; rate: number | null; amount: number | null }) {
  return (
    <div className="trade-certificate-card">
      <span className="trade-certificate-label">{label}</span>
      {rate != null && amount != null && (
        <span className={`trade-certificate-value ${profitTextClass(amount)}`}>
          {formatPercent(rate)} ({formatMoney(amount)})
        </span>
      )}
    </div>
  )
}

export default TradeCertificateCard
