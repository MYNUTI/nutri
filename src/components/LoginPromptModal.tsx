import './LoginPromptModal.css'

type Props = {
  onClose: () => void
  onLogin: () => void
}

export const LoginPromptModal = ({ onClose, onLogin }: Props) => (
  <div className="lpm-overlay" onClick={onClose}>
    <div className="lpm-card" onClick={e => e.stopPropagation()}>
      <p className="lpm-msg">로그인 후 이용하실 수 있습니다</p>
      <div className="lpm-btns">
        <button type="button" className="lpm-btn lpm-btn--cancel" onClick={onClose}>취소</button>
        <button type="button" className="lpm-btn lpm-btn--login" onClick={onLogin}>확인</button>
      </div>
    </div>
  </div>
)
