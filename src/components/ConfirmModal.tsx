import './ConfirmModal.css'

type Props = {
  message: string
  confirmText?: string
  cancelText?: string
  isDanger?: boolean
  onConfirm: () => void
  onCancel?: () => void
}

export const ConfirmModal = ({
  message,
  confirmText = '확인',
  cancelText,
  isDanger = false,
  onConfirm,
  onCancel,
}: Props) => (
  <div className="lpm-overlay" onClick={onCancel}>
    <div className="lpm-card" onClick={e => e.stopPropagation()}>
      <p className="lpm-msg">{message}</p>
      <div className="lpm-btns">
        {cancelText && onCancel && (
          <button type="button" className="lpm-btn lpm-btn--cancel" onClick={onCancel}>
            {cancelText}
          </button>
        )}
        <button
          type="button"
          className={`lpm-btn ${isDanger ? 'lpm-btn--danger' : 'lpm-btn--login'}`}
          onClick={onConfirm}
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
)
