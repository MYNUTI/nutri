import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { updateMe } from '../api/auth'
import { useMyPageQuery, myPageKeys } from '../queries/myPageQueries'
import '../components/UserProfileSetupModal.css'

type Props = { onBack: () => void }

const TODAY = new Date().toISOString().split('T')[0]

export const PasswordChangePage = ({ onBack }: Props) => {
  const queryClient = useQueryClient()
  const { data } = useMyPageQuery()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('')
  const [birthDate, setBirthDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!data) return
    setName(data.name ?? '')
    setEmail(data.email ?? '')
    setGender((data.gender as 'MALE' | 'FEMALE' | '') ?? '')
    setBirthDate(data.birthDate ?? '')
  }, [data])

  const handleSubmit = async () => {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await updateMe({ name, email, gender: gender || undefined, birthDate: birthDate || undefined })
      await queryClient.invalidateQueries({ queryKey: myPageKeys.me })
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="ups-root">
        <button className="ups-back" type="button" onClick={onBack} aria-label="뒤로">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M15.7 5.3a1 1 0 0 1 0 1.4L10.41 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z" fill="#111"/>
          </svg>
        </button>
        <h2 className="ups-title">변경이<br />완료되었습니다</h2>
        <div style={{ flex: 1 }} />
        <button type="button" className="ups-submit ups-submit--on" onClick={onBack}>확인</button>
      </div>
    )
  }

  return (
    <div className="ups-root">
      <button className="ups-back" type="button" onClick={onBack} aria-label="뒤로">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M15.7 5.3a1 1 0 0 1 0 1.4L10.41 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z" fill="#111"/>
        </svg>
      </button>

      <h2 className="ups-title">회원정보 변경</h2>

      <div className="ups-body">
        <div className="ups-field">
          <span className="ups-field-label">이름</span>
          <input
            className="ups-text-input"
            type="text"
            placeholder="이름을 입력해 주세요"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="ups-field">
          <span className="ups-field-label">이메일</span>
          <input
            className="ups-text-input"
            type="email"
            placeholder="이메일 주소를 입력해 주세요"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="ups-field">
          <span className="ups-field-label">성별</span>
          <div className="ups-gender">
            <button
              type="button"
              className={`ups-gender-btn${gender === 'MALE' ? ' on' : ''}`}
              onClick={() => setGender(g => g === 'MALE' ? '' : 'MALE')}
            >남성</button>
            <button
              type="button"
              className={`ups-gender-btn${gender === 'FEMALE' ? ' on' : ''}`}
              onClick={() => setGender(g => g === 'FEMALE' ? '' : 'FEMALE')}
            >여성</button>
          </div>
        </div>

        <div className="ups-field">
          <span className="ups-field-label">생년월일</span>
          <input
            className="ups-text-input"
            type="date"
            max={TODAY}
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
          />
        </div>

        {error && <p style={{ color: '#b42318', fontSize: '0.85rem', marginTop: 4 }}>{error}</p>}
      </div>

      <button
        type="button"
        className="ups-submit ups-submit--on"
        onClick={handleSubmit}
        disabled={saving}
      >
        {saving ? '저장 중...' : '변경하기'}
      </button>
    </div>
  )
}
