import { useEffect, useMemo, useState } from 'react'
import type { Language } from '../model/types'

type CoreType = {
  value: string
  label?: string
}

const JAVA_VALUE_TYPES: CoreType[] = [
  { value: 'String' },
  { value: 'int' },
  { value: 'long' },
  { value: 'double' },
  { value: 'float' },
  { value: 'boolean' },
  { value: 'char' },
]

const JAVA_RETURN_TYPES: CoreType[] = [{ value: 'void' }, ...JAVA_VALUE_TYPES]

const C_VALUE_TYPES: CoreType[] = [
  { value: 'char*', label: 'char* (string)' },
  { value: 'int' },
  { value: 'long' },
  { value: 'double' },
  { value: 'float' },
  { value: 'bool' },
  { value: 'size_t' },
]

const C_RETURN_TYPES: CoreType[] = [{ value: 'void' }, ...C_VALUE_TYPES]

const CUSTOM_SENTINEL = '__custom__'

export function TypeSelect({
  language,
  value,
  onChange,
  includeVoid,
}: {
  language: Language
  value: string
  onChange: (next: string) => void
  includeVoid: boolean
}) {
  const options = useMemo(() => {
    if (language === 'c') return includeVoid ? C_RETURN_TYPES : C_VALUE_TYPES
    return includeVoid ? JAVA_RETURN_TYPES : JAVA_VALUE_TYPES
  }, [includeVoid, language])

  const normalized = value.trim()
  const isCore = options.some((o) => o.value === normalized)
  const [customMode, setCustomMode] = useState(false)

  // If a non-core value is present, ensure we show the custom input.
  useEffect(() => {
    if (!normalized) return
    if (!isCore) setCustomMode(true)
    if (isCore) setCustomMode(false)
  }, [isCore, normalized])

  const selectValue = customMode ? CUSTOM_SENTINEL : normalized === '' ? '' : isCore ? normalized : CUSTOM_SENTINEL

  return (
    <div className="typeSelect">
      <select
        className="select"
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value
          if (next === CUSTOM_SENTINEL) {
            setCustomMode(true)
            // If we were on a core value, clear it for easier typing.
            if (isCore) onChange('')
            return
          }
          setCustomMode(false)
          onChange(next)
        }}
      >
        <option value="">Select type…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label ?? o.value}
          </option>
        ))}
        <option value={CUSTOM_SENTINEL}>Custom…</option>
      </select>

      {customMode ? (
        <input
          className="input"
          value={value}
          placeholder="Custom type"
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}
    </div>
  )
}


