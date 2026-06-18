import { useState } from 'react'
import { withdraw as apiWithdraw } from '../api/auth'
import './WithdrawPage.css'

const REASONS = [
  '원하는 식품이나 브랜드 정보를 찾기 어려워요',
  '추천 식품이 제 식단 목적이나 취향과 달라요',
  '식단이나 건강 정보를 매번 입력하는 게 번거로워요',
  '식단 관리를 더 이상 하지 않거나 목표를 달성했어요',
  '다른 서비스를 이용하려고요',
  '건강 정보 입력이나 제공이 부담스러워요',
  '기타',
]

type WithdrawPageProps = {
  onBack: () => void
  onWithdraw: () => void
}

export const WithdrawPage = ({ onBack, onWithdraw }: WithdrawPageProps) => {
  const [selected, setSelected] = useState<number | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleConfirm = async () => {
    try {
      await apiWithdraw(selected !== null ? REASONS[selected] : undefined)
    } catch {
      // 서버 오류여도 로컬 상태 초기화
    }
    setShowConfirm(false)
    onWithdraw()
  }

  return (
    <div className="wd-page">
      <header className="wd-header">
        <button type="button" className="wd-back" aria-label="뒤로" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M15.7 5.3a1 1 0 0 1 0 1.4L10.41 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z" fill="#1f1f22"/>
          </svg>
        </button>
      </header>

      <div className="wd-body">
        <h2 className="wd-title">정말 영양대학을<br />떠나시겠어요?</h2>
        <p className="wd-desc">더 나은 영양대학을 위해 아래 설문을<br />작성해 주시면 큰 도움이 됩니다</p>

        <ul className="wd-list">
          {REASONS.map((reason, i) => (
            <li key={i} className="wd-item" onClick={() => setSelected(i)}>
              <span className={`wd-radio${selected === i ? ' wd-radio--on' : ''}`} aria-hidden="true">
                {selected === i && <span className="wd-radio-dot" />}
              </span>
              <span className={`wd-label${selected === i ? ' wd-label--on' : ''}`}>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="wd-footer">
        <button
          type="button"
          className={`wd-btn${selected !== null ? ' wd-btn--on' : ''}`}
          disabled={selected === null}
          onClick={() => setShowConfirm(true)}
        >
          회원탈퇴
        </button>
      </div>

      {showConfirm && (
        <div className="wd-overlay" onClick={() => setShowConfirm(false)}>
          <div className="wd-confirm-card" onClick={e => e.stopPropagation()}>
            <p className="wd-confirm-title">정말 탈퇴하시겠어요?</p>
            <p className="wd-confirm-desc">탈퇴 시 모든 정보가 삭제되며<br />복구할 수 없어요</p>
          </div>
          <div className="wd-confirm-footer" onClick={e => e.stopPropagation()}>
            <button type="button" className="wd-btn wd-btn--on" onClick={handleConfirm}>
              회원탈퇴
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
