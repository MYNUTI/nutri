import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getNutrition, putNutrition, type NutritionData } from '../api/nutrition'
import './UserProfileSetupModal.css'

type Props = {
  onClose: () => void
}

const TOTAL_STEPS = 3
const DIET_GOALS = ['다이어트', '벌크업', '린매스업', '건강한식생활', '기타']

type Form = {
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
}

const emptyForm: Form = {
  height: '', weight: '', body_fat_rate: '', skeletal_muscle_mass: '',
  activity_type: '', weekly_exercise_count: '', exercise_intensity: '',
  daily_meal_count: 3, daily_snack_count: 1, diet_purpose: '',
}

function nutritionToForm(d: NutritionData): Form {
  return {
    height: d.height ? String(d.height) : '',
    weight: d.weight ? String(d.weight) : '',
    body_fat_rate: d.bodyFatRate ? String(d.bodyFatRate) : '',
    skeletal_muscle_mass: d.skeletalMuscleMass ? String(d.skeletalMuscleMass) : '',
    activity_type: d.activityType ?? '',
    weekly_exercise_count: d.weeklyExerciseCount ? String(d.weeklyExerciseCount) : '',
    exercise_intensity: d.exerciseIntensity ?? '',
    daily_meal_count: d.dailyMealCount ?? 3,
    daily_snack_count: d.dailySnackCount ?? 1,
    diet_purpose: d.dietPurpose ?? '',
  }
}

export const NutritionEditModal = ({ onClose }: Props) => {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<Form>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const { data } = useQuery({
    queryKey: ['nutrition', 'me'],
    queryFn: getNutrition,
  })

  useEffect(() => {
    if (data) setForm(nutritionToForm(data))
  }, [data])

  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k as string]; return n })
  }

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {}
    if (step === 1) {
      const h = Number(form.height)
      if (!form.height || isNaN(h) || h < 50 || h > 250)
        e.height = '키는 50~250cm 사이로 입력해 주세요'
      const w = Number(form.weight)
      if (!form.weight || isNaN(w) || w < 10 || w > 200)
        e.weight = '몸무게는 10~200kg 사이로 입력해 주세요'
      if (form.body_fat_rate) {
        const bfr = Number(form.body_fat_rate)
        if (isNaN(bfr) || bfr < 1 || bfr > 70)
          e.body_fat_rate = '체지방률은 1~70% 사이로 입력해 주세요'
      }
      if (form.skeletal_muscle_mass) {
        const smm = Number(form.skeletal_muscle_mass)
        if (isNaN(smm) || smm < 5 || smm > 100)
          e.skeletal_muscle_mass = '골격근량은 5~100kg 사이로 입력해 주세요'
      }
    }
    if (step === 2) {
      if (!form.activity_type) e.activity_type = '활동 유형을 선택해 주세요'
      if (!form.weekly_exercise_count) e.weekly_exercise_count = '주간 운동 횟수를 선택해 주세요'
      if (!form.exercise_intensity) e.exercise_intensity = '운동 강도를 선택해 주세요'
    }
    if (step === 3) {
      if (!form.diet_purpose) e.diet_purpose = '식이 목적을 선택해 주세요'
    }
    return e
  }

  const handleBack = () => {
    setErrors({})
    if (step === 1) onClose()
    else setStep(s => s - 1)
  }

  const handleNext = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    if (step < TOTAL_STEPS) { setStep(s => s + 1); return }
    setSaving(true)
    try {
      await putNutrition({
        height: Number(form.height),
        weight: Number(form.weight),
        bodyFatRate: form.body_fat_rate ? Number(form.body_fat_rate) : undefined,
        skeletalMuscleMass: form.skeletal_muscle_mass ? Number(form.skeletal_muscle_mass) : undefined,
        activityType: form.activity_type,
        weeklyExerciseCount: Number(form.weekly_exercise_count),
        exerciseIntensity: form.exercise_intensity,
        dailyMealCount: form.daily_meal_count,
        dailySnackCount: form.daily_snack_count,
        dietPurpose: form.diet_purpose,
      })
      setDone(true)
    } catch {
      setErrors({ _: '저장에 실패했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="ups-root">
        <h2 className="ups-title">변경이<br />완료되었습니다</h2>
        <div style={{ flex: 1 }} />
        <button type="button" className="ups-submit ups-submit--on" onClick={onClose}>확인</button>
      </div>
    )
  }

  return (
    <div className="ups-root">
      <button className="ups-back" type="button" onClick={handleBack} aria-label="뒤로">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M15.7 5.3a1 1 0 0 1 0 1.4L10.41 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z" fill="#111"/>
        </svg>
      </button>

      <div className="ups-steps" aria-label={`단계 ${step}/${TOTAL_STEPS}`}>
        {[1, 2, 3].map(n => (
          <span key={n} className={`ups-step${n === step ? ' ups-step--on' : ''}`}>{n}</span>
        ))}
      </div>

      <h2 className="ups-title">내 몸에 맞는 영양점수,<br />1분이면 끝나요</h2>

      <div className="ups-body">
        {step === 1 && (
          <>
            <div className="ups-grid-2">
              <NumberField label="키" unit="cm" value={form.height} onChange={set('height')} error={errors.height} />
              <NumberField label="몸무게" unit="kg" value={form.weight} onChange={set('weight')} error={errors.weight} />
            </div>
            <p className="ups-required-hint">*필수</p>
            <div className="ups-grid-2" style={{ marginTop: 4 }}>
              <NumberField label="체지방률" unit="%" value={form.body_fat_rate} onChange={set('body_fat_rate')} error={errors.body_fat_rate} />
              <NumberField label="골격근량" unit="kg" value={form.skeletal_muscle_mass} onChange={set('skeletal_muscle_mass')} error={errors.skeletal_muscle_mass} />
            </div>
            <p className="ups-optional-hint">*선택</p>
          </>
        )}

        {step === 2 && (
          <>
            <OptionGroup label="활동 유형" options={['SITTING', 'STANDING', 'PHYSICAL']} value={form.activity_type} onChange={set('activity_type')} error={errors.activity_type} />
            <OptionGroup label="주간 운동 횟수" options={['1', '2', '3', '4', '5', '6', '7']} value={form.weekly_exercise_count} onChange={set('weekly_exercise_count')} error={errors.weekly_exercise_count} />
            <OptionGroup label="운동 강도" options={['LOW', 'MEDIUM', 'HIGH']} value={form.exercise_intensity} onChange={set('exercise_intensity')} error={errors.exercise_intensity} />
          </>
        )}

        {step === 3 && (
          <>
            <StepperField label="하루 끼니 수" value={form.daily_meal_count} min={1} max={10} onChange={v => set('daily_meal_count')(v)} />
            <StepperField label="간식 횟수" value={form.daily_snack_count} min={0} max={10} onChange={v => set('daily_snack_count')(v)} />
            <div className="ups-field">
              <span className="ups-field-label">식이 목적</span>
              <div className="ups-select-wrap">
                <select className="ups-select" value={form.diet_purpose} onChange={e => set('diet_purpose')(e.target.value)}>
                  <option value="" disabled>선택해 주세요</option>
                  {DIET_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <span className="ups-select-arrow" aria-hidden="true">▾</span>
              </div>
              {errors.diet_purpose && <span className="ups-field-error">{errors.diet_purpose}</span>}
            </div>
          </>
        )}

        {errors._ && <p style={{ color: '#b42318', fontSize: '0.85rem', marginTop: 8 }}>{errors._}</p>}
      </div>

      <button type="button" className="ups-submit ups-submit--on" onClick={handleNext} disabled={saving}>
        {step === TOTAL_STEPS ? (saving ? '저장 중...' : '저장하기') : '다음'}
      </button>
    </div>
  )
}

// ── 내부 컴포넌트 ──────────────────────────────────────────────

type NumberFieldProps = { label: string; unit?: string; value: string; onChange: (v: string) => void; error?: string }
const NumberField = ({ label, unit, value, onChange, error }: NumberFieldProps) => (
  <div className="ups-field">
    <span className="ups-field-label">{label}</span>
    <div className="ups-num-row">
      <input className={`ups-num-input${error ? ' ups-input--error' : ''}`} type="number" min={0} step="0.1" placeholder="0" value={value} onChange={e => onChange(e.target.value)} />
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

type OptionGroupProps = { label: string; options: string[]; value: string; onChange: (v: string) => void; error?: string }
const OptionGroup = ({ label, options, value, onChange, error }: OptionGroupProps) => (
  <div className="ups-field">
    <span className="ups-field-label">{label}</span>
    <div className="ups-options">
      {options.map(opt => (
        <button key={opt} type="button" className={`ups-opt-btn${value === opt ? ' on' : ''}`} onClick={() => onChange(opt)}>
          {opt}
        </button>
      ))}
    </div>
    {error && <span className="ups-field-error">{error}</span>}
  </div>
)
