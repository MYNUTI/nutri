import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMyPageQuery, myPageKeys } from '../queries/myPageQueries'
import { logout as apiLogout, withdraw as apiWithdraw, updateMe } from '../api/auth'
import './MyPage.css'

type MyPageProps = {
  isAuthenticated: boolean
  onBack: () => void
  onLogin: () => void
  onGoFavorites: () => void
  onGoPasswordChange: () => void
  onLogout: () => void
  onEditNutrition: () => void
  onWithdraw: () => void
}

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15.7 5.3a1 1 0 0 1 0 1.4L10.41 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z" />
  </svg>
)
const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8.3 18.7a1 1 0 0 1 0-1.4l5.29-5.3L8.3 6.7a1 1 0 1 1 1.4-1.4l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4 0Z" />
  </svg>
)
const PencilIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 17.46V21h3.54L17.81 9.73l-3.54-3.54L3 17.46zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
)

/* 비로그인 일러스트 SVG */
const GuestIllustration = () => (
  <svg viewBox="0 0 240 200" width="220" height="180" aria-hidden="true">
    <ellipse cx="120" cy="190" rx="90" ry="10" fill="#e8eaee" />
    {/* 여성 */}
    <circle cx="158" cy="80" r="20" fill="#c6a8e0" />
    <rect x="140" y="98" width="36" height="50" rx="18" fill="#7b5ea7" />
    <line x1="140" y1="112" x2="122" y2="138" stroke="#7b5ea7" strokeWidth="10" strokeLinecap="round" />
    <line x1="176" y1="112" x2="188" y2="130" stroke="#7b5ea7" strokeWidth="10" strokeLinecap="round" />
    <line x1="148" y1="148" x2="142" y2="180" stroke="#7b5ea7" strokeWidth="10" strokeLinecap="round" />
    <line x1="168" y1="148" x2="168" y2="182" stroke="#7b5ea7" strokeWidth="10" strokeLinecap="round" />
    {/* 남성 (뒤) */}
    <circle cx="90" cy="65" r="22" fill="#ff8a65" />
    <rect x="68" y="84" width="44" height="56" rx="22" fill="#ff5722" />
    <line x1="68" y1="96" x2="44" y2="60" stroke="#ff5722" strokeWidth="12" strokeLinecap="round" />
    <line x1="112" y1="96" x2="136" y2="68" stroke="#ff5722" strokeWidth="12" strokeLinecap="round" />
    <line x1="74" y1="140" x2="66" y2="180" stroke="#ff5722" strokeWidth="12" strokeLinecap="round" />
    <line x1="102" y1="140" x2="106" y2="182" stroke="#ff5722" strokeWidth="12" strokeLinecap="round" />
    {/* 하트 */}
    <path d="M175 50 C175 44 168 40 163 45 C158 40 151 44 151 50 C151 56 163 66 163 66 C163 66 175 56 175 50Z" fill="#ea4335" />
    {/* 달력 아이콘 */}
    <rect x="38" y="100" width="24" height="22" rx="4" fill="#5c6bc0" />
    <rect x="38" y="100" width="24" height="7" rx="4" fill="#3949ab" />
    <line x1="44" y1="96" x2="44" y2="104" stroke="#3949ab" strokeWidth="2" strokeLinecap="round" />
    <line x1="56" y1="96" x2="56" y2="104" stroke="#3949ab" strokeWidth="2" strokeLinecap="round" />
    {/* 타이머 */}
    <circle cx="155" cy="38" r="10" fill="#ff7043" stroke="#ff5722" strokeWidth="2" />
    <line x1="155" y1="28" x2="155" y2="25" stroke="#ff5722" strokeWidth="2" strokeLinecap="round" />
    <line x1="155" y1="38" x2="155" y2="33" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <line x1="155" y1="38" x2="159" y2="38" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

/* 로그아웃 confirm/success 모달 */
type LogoutModalProps = {
  phase: 'confirm' | 'done'
  onCancel: () => void
  onConfirm: () => void
  onClose: () => void
}
const LogoutModal = ({ phase, onCancel, onConfirm, onClose }: LogoutModalProps) => (
  <div className="mp-modal-overlay">
    <div className="mp-modal">
      {phase === 'confirm' ? (
        <>
          <p className="mp-modal-msg">정말 로그아웃을<br />하시겠습니까?</p>
          <div className="mp-modal-btns">
            <button type="button" className="mp-modal-btn mp-modal-btn--cancel" onClick={onCancel}>취소</button>
            <button type="button" className="mp-modal-btn mp-modal-btn--ok" onClick={onConfirm}>확인</button>
          </div>
        </>
      ) : (
        <>
          <p className="mp-modal-msg">로그아웃이<br />정상적으로 되었습니다</p>
          <div className="mp-modal-btns mp-modal-btns--single">
            <button type="button" className="mp-modal-btn mp-modal-btn--cancel" onClick={onClose}>닫기</button>
          </div>
        </>
      )}
    </div>
  </div>
)

/* 회원탈퇴 confirm/success 모달 */
type WithdrawModalProps = {
  phase: 'confirm' | 'done'
  reason: string
  onReasonChange: (v: string) => void
  onCancel: () => void
  onConfirm: () => void
  onClose: () => void
}
const WithdrawModal = ({ phase, reason, onReasonChange, onCancel, onConfirm, onClose }: WithdrawModalProps) => (
  <div className="mp-modal-overlay">
    <div className="mp-modal">
      {phase === 'confirm' ? (
        <>
          <p className="mp-modal-msg">정말 회원탈퇴를<br />하시겠습니까?</p>
          <textarea
            className="mp-modal-reason"
            placeholder="탈퇴 사유를 입력해 주세요 (선택)"
            value={reason}
            onChange={e => onReasonChange(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className="mp-modal-btns">
            <button type="button" className="mp-modal-btn mp-modal-btn--cancel" onClick={onCancel}>취소</button>
            <button type="button" className="mp-modal-btn mp-modal-btn--ok" onClick={onConfirm}>확인</button>
          </div>
        </>
      ) : (
        <>
          <p className="mp-modal-msg">회원탈퇴가<br />정상적으로 처리되었습니다</p>
          <div className="mp-modal-btns mp-modal-btns--single">
            <button type="button" className="mp-modal-btn mp-modal-btn--cancel" onClick={onClose}>닫기</button>
          </div>
        </>
      )}
    </div>
  </div>
)

export const MyPage = ({ isAuthenticated, onBack, onLogin, onGoFavorites, onGoPasswordChange, onLogout, onEditNutrition, onWithdraw }: MyPageProps) => {
  const myPageQuery = useMyPageQuery(isAuthenticated)
  const name = myPageQuery.data?.nickname ?? myPageQuery.data?.name ?? ''
  const queryClient = useQueryClient()
  const [logoutPhase, setLogoutPhase] = useState<null | 'confirm' | 'done'>(null)
  const [withdrawPhase, setWithdrawPhase] = useState<null | 'confirm' | 'done'>(null)
  const [withdrawReason, setWithdrawReason] = useState('')
  const [nickEdit, setNickEdit] = useState(false)
  const [nickVal, setNickVal] = useState('')

  const handleNickSave = async () => {
    if (!nickVal.trim()) return
    await updateMe({ nickname: nickVal.trim() })
    await queryClient.invalidateQueries({ queryKey: myPageKeys.me })
    setNickEdit(false)
  }

  const handleLogoutConfirm = async () => {
    try {
      await apiLogout()
    } catch {
      // 서버 오류여도 로컬 토큰은 이미 삭제됨
    }
    setLogoutPhase('done')
  }
  const handleLogoutClose = () => {
    setLogoutPhase(null)
    onLogout()
  }

  const handleWithdrawConfirm = async () => {
    try {
      await apiWithdraw(withdrawReason.trim() || undefined)
    } catch {
      // 서버 오류여도 로컬 상태는 초기화
    }
    setWithdrawPhase('done')
  }
  const handleWithdrawClose = () => {
    setWithdrawPhase(null)
    setWithdrawReason('')
    onWithdraw()
  }

  return (
    <section className="mypage" aria-label="마이페이지">
      {logoutPhase && (
        <LogoutModal
          phase={logoutPhase}
          onCancel={() => setLogoutPhase(null)}
          onConfirm={handleLogoutConfirm}
          onClose={handleLogoutClose}
        />
      )}
      {withdrawPhase && (
        <WithdrawModal
          phase={withdrawPhase}
          reason={withdrawReason}
          onReasonChange={setWithdrawReason}
          onCancel={() => setWithdrawPhase(null)}
          onConfirm={handleWithdrawConfirm}
          onClose={handleWithdrawClose}
        />
      )}

      <header className="mypage-topbar">
        <button type="button" className="mypage-icon-btn" aria-label="뒤로가기" onClick={onBack}>
          <ArrowLeftIcon />
        </button>
        <h2 className="mypage-topbar-title">마이페이지</h2>
        <span className="mypage-topbar-spacer" aria-hidden="true" />
      </header>

      {!isAuthenticated ? (
        /* ── 비로그인 화면 ─────────────────────────── */
        <div className="mypage-guest">
          <div className="mypage-avatar mypage-avatar--guest" aria-hidden="true" />
          <button type="button" className="mypage-guest-login" onClick={onLogin}>
            로그인하고 혜택 받기
            <ChevronRightIcon />
          </button>
          <div className="mypage-guest-illust">
            <GuestIllustration />
          </div>
        </div>
      ) : (
        /* ── 로그인 화면 ───────────────────────────── */
        <>
          <div className="mypage-profile">
            <div className="mypage-avatar" aria-hidden="true" />
            <div className="mypage-name-row">
              {nickEdit ? (
                <>
                  <input
                    className="mypage-nick-input"
                    value={nickVal}
                    onChange={e => setNickVal(e.target.value)}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleNickSave(); if (e.key === 'Escape') setNickEdit(false) }}
                  />
                  <button type="button" className="mypage-nick-save" onClick={handleNickSave}>저장</button>
                  <button type="button" className="mypage-nick-cancel" onClick={() => setNickEdit(false)}>취소</button>
                </>
              ) : (
                <>
                  <strong className="mypage-name">{name}</strong>
                  <button type="button" className="mypage-name-edit" aria-label="닉네임 변경" onClick={() => { setNickVal(name); setNickEdit(true) }}>
                    <PencilIcon />
                  </button>
                </>
              )}
            </div>
          </div>

          <section className="mypage-card" aria-label="나의 활동">
            <h3 className="mypage-card-title">나의 활동</h3>
            <div className="mypage-row">
              <span className="mypage-row-label">영양정보</span>
              <button type="button" className="mypage-pill" onClick={onEditNutrition}>변경</button>
            </div>
            <button type="button" className="mypage-row mypage-row--btn" onClick={onGoFavorites}>
              <span className="mypage-row-label">즐겨찾기 상품</span>
              <ChevronRightIcon />
            </button>
          </section>

          <section className="mypage-card" aria-label="계정 관리">
            <h3 className="mypage-card-title">계정 관리</h3>
            <button type="button" className="mypage-row mypage-row--btn" onClick={onGoPasswordChange}>
              <span className="mypage-row-label">회원정보 변경</span>
            </button>
            <button type="button" className="mypage-row mypage-row--btn" onClick={() => setLogoutPhase('confirm')}>
              <span className="mypage-row-label">로그아웃</span>
            </button>
            <button type="button" className="mypage-row mypage-row--btn" onClick={() => setWithdrawPhase('confirm')}>
              <span className="mypage-row-label">회원탈퇴</span>
            </button>
          </section>
        </>
      )}
    </section>
  )
}
