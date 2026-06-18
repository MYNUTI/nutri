import { useEffect, useState } from 'react'
import './UserProfileSetupModal.css'

export type Profile = {
  name: string
  email: string
  gender: 'MALE' | 'FEMALE' | ''
  birth_date: string
  height: string
  weight: string
  body_fat_rate: string
  skeletal_muscle_mass: string
  activity_type: string
  weekly_exercise_count: string
  exercise_intensity: string
  daily_meal_count: number
  daily_snack_count: number
  diet_purpose: string
  personalInfoAgreed: boolean
  healthInfoAgreed: boolean
  ageConfirmed: boolean
}

type Props = {
  onClose: () => void
  onComplete: (profile: Profile) => void
  initialProfile?: Profile
  submitLabel?: string
}

const DIET_GOALS = ['다이어트', '벌크업', '린매스업', '건강한식생활', '기타']
const TOTAL_STEPS = 5
const TODAY = new Date().toISOString().split('T')[0]

const initial: Profile = {
  name: '', email: '', gender: '', birth_date: '',
  height: '', weight: '', body_fat_rate: '', skeletal_muscle_mass: '',
  activity_type: '', weekly_exercise_count: '', exercise_intensity: '',
  daily_meal_count: 3, daily_snack_count: 1, diet_purpose: '',
  personalInfoAgreed: false, healthInfoAgreed: false, ageConfirmed: false,
}

export const UserProfileSetupModal = ({ onClose, onComplete, initialProfile, submitLabel }: Props) => {
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<Profile>(initialProfile ?? initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandPersonal, setExpandPersonal] = useState(false)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const set = <K extends keyof Profile>(k: K) => (v: Profile[K]) => {
    setProfile(p => ({ ...p, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k as string]; return n })
  }

  const allAgreed = profile.personalInfoAgreed && profile.healthInfoAgreed && profile.ageConfirmed
  const toggleAll = () => {
    const next = !allAgreed
    setProfile(p => ({ ...p, personalInfoAgreed: next, healthInfoAgreed: next, ageConfirmed: next }))
    setErrors({})
  }

  const isStepValid = (): boolean => {
    if (step === 1) {
      return profile.personalInfoAgreed && profile.ageConfirmed
    }
    if (step === 2) {
      return !!(
        profile.name && /^[가-힣a-zA-Z]{2,}$/.test(profile.name) &&
        profile.email && /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(profile.email) &&
        profile.gender &&
        profile.birth_date && profile.birth_date <= TODAY
      )
    }
    if (step === 3) {
      const h = Number(profile.height)
      const w = Number(profile.weight)
      return !!(profile.height && !isNaN(h) && h >= 50 && h <= 250 &&
        profile.weight && !isNaN(w) && w >= 10 && w <= 200)
    }
    if (step === 4) {
      return !!(profile.activity_type && profile.weekly_exercise_count && profile.exercise_intensity)
    }
    if (step === 5) {
      return !!profile.diet_purpose
    }
    return false
  }

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {}
    if (step === 2) {
      if (!profile.name || !/^[가-힣a-zA-Z]{2,}$/.test(profile.name))
        e.name = '이름은 2자 이상 한글/영문만 입력 가능합니다'
      if (!profile.email || !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(profile.email))
        e.email = '올바른 이메일 형식을 입력해 주세요'
      if (!profile.gender)
        e.gender = '성별을 선택해 주세요'
      if (!profile.birth_date)
        e.birth_date = '생년월일을 입력해 주세요'
      else if (profile.birth_date > TODAY)
        e.birth_date = '미래 날짜는 선택할 수 없습니다'
    }
    if (step === 3) {
      const h = Number(profile.height)
      if (!profile.height || isNaN(h) || h < 50 || h > 250)
        e.height = '키는 50~250cm 사이로 입력해 주세요'
      const w = Number(profile.weight)
      if (!profile.weight || isNaN(w) || w < 10 || w > 200)
        e.weight = '몸무게는 10~200kg 사이로 입력해 주세요'
      if (profile.body_fat_rate) {
        const bfr = Number(profile.body_fat_rate)
        if (isNaN(bfr) || bfr < 1 || bfr > 70)
          e.body_fat_rate = '체지방률은 1~70% 사이로 입력해 주세요'
      }
      if (profile.skeletal_muscle_mass) {
        const smm = Number(profile.skeletal_muscle_mass)
        if (isNaN(smm) || smm < 5 || smm > 100)
          e.skeletal_muscle_mass = '골격근량은 5~100kg 사이로 입력해 주세요'
      }
    }
    if (step === 4) {
      if (!profile.activity_type) e.activity_type = '활동 유형을 선택해 주세요'
      if (!profile.weekly_exercise_count) e.weekly_exercise_count = '주간 운동 횟수를 선택해 주세요'
      if (!profile.exercise_intensity) e.exercise_intensity = '운동 강도를 선택해 주세요'
    }
    if (step === 5) {
      if (!profile.diet_purpose) e.diet_purpose = '식이 목적을 선택해 주세요'
    }
    return e
  }

  const validateField = (field: string) => {
    let msg = ''
    if (field === 'name') {
      if (!profile.name || !/^[가-힣a-zA-Z]{2,}$/.test(profile.name))
        msg = '이름은 2자 이상 한글/영문만 입력 가능합니다'
    } else if (field === 'email') {
      if (!profile.email || !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(profile.email))
        msg = '올바른 이메일 형식을 입력해 주세요'
    } else if (field === 'birth_date') {
      if (!profile.birth_date) msg = '생년월일을 입력해 주세요'
      else if (profile.birth_date > TODAY) msg = '미래 날짜는 선택할 수 없습니다'
    } else if (field === 'height') {
      const h = Number(profile.height)
      if (!profile.height || isNaN(h) || h < 50 || h > 250)
        msg = '키는 50~250cm 사이로 입력해 주세요'
    } else if (field === 'weight') {
      const w = Number(profile.weight)
      if (!profile.weight || isNaN(w) || w < 10 || w > 200)
        msg = '몸무게는 10~200kg 사이로 입력해 주세요'
    } else if (field === 'body_fat_rate' && profile.body_fat_rate) {
      const v = Number(profile.body_fat_rate)
      if (isNaN(v) || v < 1 || v > 70) msg = '체지방률은 1~70% 사이로 입력해 주세요'
    } else if (field === 'skeletal_muscle_mass' && profile.skeletal_muscle_mass) {
      const v = Number(profile.skeletal_muscle_mass)
      if (isNaN(v) || v < 5 || v > 100) msg = '골격근량은 5~100kg 사이로 입력해 주세요'
    }
    setErrors(prev => {
      const next = { ...prev }
      if (msg) next[field] = msg
      else delete next[field]
      return next
    })
  }

  const handleBack = () => {
    setErrors({})
    if (step === 1) onClose()
    else setStep(s => s - 1)
  }

  const handleNext = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    if (step < TOTAL_STEPS) setStep(s => s + 1)
    else onComplete(profile)
  }

  return (
    <div className="ups-root">
      <button className="ups-back" type="button" onClick={handleBack} aria-label="뒤로">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M15.7 5.3a1 1 0 0 1 0 1.4L10.41 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z" fill="#111"/>
        </svg>
      </button>

      <div className="ups-steps" aria-label={`단계 ${step}/${TOTAL_STEPS}`}>
        {[1, 2, 3, 4, 5].map(n => (
          <span key={n} className={`ups-step${n === step ? ' ups-step--on' : ''}`}>{n}</span>
        ))}
      </div>

      <h2 className="ups-title">
        {step === 1
          ? <>영양점수 확인을 위해<br />개인정보 이용에 동의해주세요</>
          : <>내 몸에 맞는 영양점수,<br />1분이면 끝나요</>
        }
      </h2>

      <div className="ups-body">
        {/* ── Step 1: 동의 ──────────────────────────── */}
        {step === 1 && (
          <div className="ups-consent">
            <label className="ups-consent-row ups-consent-row--all">
              <input
                type="checkbox"
                className="ups-consent-check"
                checked={allAgreed}
                onChange={toggleAll}
              />
              <span className="ups-consent-text ups-consent-text--all">전체동의</span>
            </label>

            <div className="ups-consent-divider" />

            {/* ① 개인정보 */}
            <div className="ups-consent-item">
              <label className="ups-consent-row">
                <input
                  type="checkbox"
                  className="ups-consent-check"
                  checked={profile.personalInfoAgreed}
                  onChange={e => set('personalInfoAgreed')(e.target.checked)}
                />
                <span className="ups-consent-text">
                  <span className="ups-consent-required">(필수)</span> 개인정보 수집·이용 동의
                </span>
              </label>
              <button
                type="button"
                className="ups-consent-expand-btn"
                onClick={() => setExpandPersonal(v => !v)}
                aria-label="상세 보기"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path d="M9.29 6.71a1 1 0 0 0 0 1.41L13.17 12l-3.88 3.88a1 1 0 1 0 1.41 1.41l4.59-4.59a1 1 0 0 0 0-1.41L10.7 6.7a1 1 0 0 0-1.41.01z" fill="#aaa"/>
                </svg>
              </button>
            </div>
            {expandPersonal && (
              <div className="ups-consent-detail">
                <table className="ups-consent-table">
                  <tbody>
                    <tr><td>수집 목적</td><td>회원 식별·관리, 영양점수 기반 식품 비교 및 맞춤 추천 제공</td></tr>
                    <tr><td>수집 항목</td><td>이름, 이메일, 성별, 생년월일</td></tr>
                    <tr><td>보유·이용 기간</td><td>회원 탈퇴 시까지 (법령상 보존 의무 기간 이후 파기)</td></tr>
                    <tr><td>동의 거부 권리</td><td>동의를 거부할 권리가 있으며, 거부 시 회원가입이 제한됩니다.</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* ② 건강정보 */}
            <label className="ups-consent-row">
              <input
                type="checkbox"
                className="ups-consent-check"
                checked={profile.healthInfoAgreed}
                onChange={e => set('healthInfoAgreed')(e.target.checked)}
              />
              <span className="ups-consent-text">
                <span className="ups-consent-optional">(선택)</span> 건강정보 수집·이용 동의
              </span>
            </label>

            {/* ③ 만 14세 */}
            <label className="ups-consent-row">
              <input
                type="checkbox"
                className="ups-consent-check"
                checked={profile.ageConfirmed}
                onChange={e => set('ageConfirmed')(e.target.checked)}
              />
              <span className="ups-consent-text">
                <span className="ups-consent-required">(필수)</span> 만 14세 이상 확인
              </span>
            </label>
          </div>
        )}

        {/* ── Step 2: 개인정보 ───────────────────────── */}
        {step === 2 && (
          <>
            <TextField label="이름" placeholder="이름을 입력해 주세요" value={profile.name} onChange={set('name')} onBlur={() => validateField('name')} error={errors.name} />
            <TextField label="이메일" placeholder="이메일 주소를 입력해 주세요" type="email" value={profile.email} onChange={set('email')} onBlur={() => validateField('email')} error={errors.email} />
            <div className="ups-field">
              <span className="ups-field-label">성별</span>
              <div className="ups-gender">
                <button type="button" className={`ups-gender-btn${profile.gender === 'MALE' ? ' on' : ''}`} onClick={() => set('gender')('MALE')}>남성</button>
                <button type="button" className={`ups-gender-btn${profile.gender === 'FEMALE' ? ' on' : ''}`} onClick={() => set('gender')('FEMALE')}>여성</button>
              </div>
              {errors.gender && <span className="ups-field-error">{errors.gender}</span>}
            </div>
            <div className="ups-field">
              <span className="ups-field-label">생년월일</span>
              <input
                className={`ups-text-input${errors.birth_date ? ' ups-input--error' : ''}`}
                type="date"
                max={TODAY}
                value={profile.birth_date}
                onChange={e => set('birth_date')(e.target.value)}
                onBlur={() => validateField('birth_date')}
              />
              {errors.birth_date && <span className="ups-field-error">{errors.birth_date}</span>}
            </div>
          </>
        )}

        {/* ── Step 3: 신체정보 ───────────────────────── */}
        {step === 3 && (
          <>
            <div className="ups-grid-2">
              <NumberField label="키" unit="cm" value={profile.height} onChange={set('height')} onBlur={() => validateField('height')} error={errors.height} />
              <NumberField label="몸무게" unit="kg" value={profile.weight} onChange={set('weight')} onBlur={() => validateField('weight')} error={errors.weight} />
            </div>
            <p className="ups-required-hint">*필수</p>
            <div className="ups-grid-2" style={{ marginTop: 4 }}>
              <NumberField label="체지방률" unit="%" value={profile.body_fat_rate} onChange={set('body_fat_rate')} onBlur={() => validateField('body_fat_rate')} error={errors.body_fat_rate} />
              <NumberField label="골격근량" unit="kg" value={profile.skeletal_muscle_mass} onChange={set('skeletal_muscle_mass')} onBlur={() => validateField('skeletal_muscle_mass')} error={errors.skeletal_muscle_mass} />
            </div>
            <p className="ups-optional-hint">*선택</p>
          </>
        )}

        {/* ── Step 4: 활동정보 ───────────────────────── */}
        {step === 4 && (
          <>
            <OptionGroup
              label="직업 형태"
              options={['SITTING', 'STANDING', 'PHYSICAL']}
              labels={['앉아서', '서서', '육체노동']}
              value={profile.activity_type}
              onChange={set('activity_type')}
              error={errors.activity_type}
            />
            <OptionGroup
              label="운동 빈도"
              options={['1', '2-4', '5+']}
              labels={['주 1회', '주 2~4회', '주 5회 이상']}
              value={profile.weekly_exercise_count}
              onChange={set('weekly_exercise_count')}
              error={errors.weekly_exercise_count}
            />
            <OptionGroup
              label="운동 강도"
              options={['LOW', 'MEDIUM', 'HIGH']}
              labels={['약하게', '중간', '강하게']}
              value={profile.exercise_intensity}
              onChange={set('exercise_intensity')}
              error={errors.exercise_intensity}
            />
          </>
        )}

        {/* ── Step 5: 식습관 ────────────────────────── */}
        {step === 5 && (
          <>
            <StepperField label="하루 끼니 수" value={profile.daily_meal_count} min={1} max={10} onChange={v => set('daily_meal_count')(v)} />
            <StepperField label="간식 횟수" value={profile.daily_snack_count} min={0} max={10} onChange={v => set('daily_snack_count')(v)} />
            <div className="ups-field">
              <span className="ups-field-label">식이 목적</span>
              <div className="ups-select-wrap">
                <select
                  className="ups-select"
                  value={profile.diet_purpose}
                  onChange={e => set('diet_purpose')(e.target.value)}
                >
                  <option value="" disabled>선택해 주세요</option>
                  {DIET_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <span className="ups-select-arrow" aria-hidden="true">▾</span>
              </div>
              {errors.diet_purpose && <span className="ups-field-error">{errors.diet_purpose}</span>}
            </div>
          </>
        )}
      </div>

      <button type="button" className={`ups-submit${isStepValid() ? ' ups-submit--on' : ''}`} onClick={handleNext} disabled={!isStepValid()}>
        {step === TOTAL_STEPS ? (submitLabel ?? '완료하기') : '다음'}
      </button>
    </div>
  )
}

// ── 내부 컴포넌트 ──────────────────────────────────────────────

type TextFieldProps = { label: string; placeholder?: string; value: string; onChange: (v: string) => void; onBlur?: () => void; type?: string; error?: string }
const TextField = ({ label, placeholder, value, onChange, onBlur, type = 'text', error }: TextFieldProps) => (
  <div className="ups-field">
    <span className="ups-field-label">{label}</span>
    <input className={`ups-text-input${error ? ' ups-input--error' : ''}`} type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur} />
    {error && <span className="ups-field-error">{error}</span>}
  </div>
)

type NumberFieldProps = { label: string; unit?: string; value: string; onChange: (v: string) => void; onBlur?: () => void; error?: string }
const NumberField = ({ label, unit, value, onChange, onBlur, error }: NumberFieldProps) => (
  <div className="ups-field">
    <span className="ups-field-label">{label}</span>
    <div className="ups-num-row">
      <input className={`ups-num-input${error ? ' ups-input--error' : ''}`} type="number" min={0} step="0.1" placeholder="0" value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur} />
      {unit && <span className="ups-unit">{unit}</span>}
    </div>
    {error && <span className="ups-field-error">{error}</span>}
  </div>
)

type StepperFieldProps = { label: string; value: number; min: number; max: number; onChange: (v: number) => void }
const StepperField = ({ label, value, min, max, onChange }: StepperFieldProps) => (
  <div className="ups-field">
    <span className="ups-field-label">{label}</span>
    <div className="ups-stepper">
      <button type="button" className="ups-stepper-btn" onClick={() => onChange(Math.max(min, value - 1))} aria-label="감소">−</button>
      <span className="ups-stepper-val">{value}</span>
      <button type="button" className="ups-stepper-btn" onClick={() => onChange(Math.min(max, value + 1))} aria-label="증가">+</button>
    </div>
  </div>
)

type OptionGroupProps = { label: string; options: string[]; labels?: string[]; value: string; onChange: (v: string) => void; error?: string }
const OptionGroup = ({ label, options, labels, value, onChange, error }: OptionGroupProps) => (
  <div className="ups-field">
    <span className="ups-field-label">{label}</span>
    <div className="ups-options">
      {options.map((opt, i) => (
        <button key={opt} type="button" className={`ups-opt-btn${value === opt ? ' on' : ''}`} onClick={() => onChange(opt)}>
          {labels?.[i] ?? opt}
        </button>
      ))}
    </div>
    {error && <span className="ups-field-error">{error}</span>}
  </div>
)
