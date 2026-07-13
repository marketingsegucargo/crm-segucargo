import { useState, useEffect } from 'react'

const COUNTRY_CODES = [
  { code: '+56',  flag: '🇨🇱', label: 'Chile (+56)' },
  { code: '+54',  flag: '🇦🇷', label: 'Argentina (+54)' },
  { code: '+55',  flag: '🇧🇷', label: 'Brasil (+55)' },
  { code: '+57',  flag: '🇨🇴', label: 'Colombia (+57)' },
  { code: '+51',  flag: '🇵🇪', label: 'Perú (+51)' },
  { code: '+52',  flag: '🇲🇽', label: 'México (+52)' },
  { code: '+58',  flag: '🇻🇪', label: 'Venezuela (+58)' },
  { code: '+593', flag: '🇪🇨', label: 'Ecuador (+593)' },
  { code: '+591', flag: '🇧🇴', label: 'Bolivia (+591)' },
  { code: '+598', flag: '🇺🇾', label: 'Uruguay (+598)' },
  { code: '+595', flag: '🇵🇾', label: 'Paraguay (+595)' },
  { code: '+1',   flag: '🇺🇸', label: 'EE.UU. (+1)' },
  { code: '+44',  flag: '🇬🇧', label: 'Reino Unido (+44)' },
  { code: '+34',  flag: '🇪🇸', label: 'España (+34)' },
  { code: '+49',  flag: '🇩🇪', label: 'Alemania (+49)' },
  { code: '+33',  flag: '🇫🇷', label: 'Francia (+33)' },
  { code: '+39',  flag: '🇮🇹', label: 'Italia (+39)' },
  { code: '+31',  flag: '🇳🇱', label: 'Países Bajos (+31)' },
  { code: '+86',  flag: '🇨🇳', label: 'China (+86)' },
  { code: '+81',  flag: '🇯🇵', label: 'Japón (+81)' },
  { code: '+82',  flag: '🇰🇷', label: 'Corea del Sur (+82)' },
  { code: '+91',  flag: '🇮🇳', label: 'India (+91)' },
  { code: '+971', flag: '🇦🇪', label: 'EAU (+971)' },
  { code: '+966', flag: '🇸🇦', label: 'Arabia Saudita (+966)' },
]

function parsePhone(value: string): { prefix: string; number: string } {
  if (!value) return { prefix: '+56', number: '' }
  const match = value.match(/^(\+\d{1,4})\s?(.*)$/)
  if (match) {
    const found = COUNTRY_CODES.find(c => c.code === match[1])
    if (found) return { prefix: match[1], number: match[2].trim() }
  }
  return { prefix: '+56', number: value }
}

interface PhoneInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function PhoneInput({ value, onChange, placeholder = '9 XXXX XXXX', className = '', disabled = false }: PhoneInputProps) {
  const parsed = parsePhone(value || '')
  const [prefix, setPrefix] = useState(parsed.prefix)
  const [number, setNumber] = useState(parsed.number)

  useEffect(() => {
    const p = parsePhone(value || '')
    setPrefix(p.prefix)
    setNumber(p.number)
  }, [value])

  function handlePrefixChange(newPrefix: string) {
    setPrefix(newPrefix)
    onChange(number ? `${newPrefix} ${number}` : '')
  }

  function handleNumberChange(newNumber: string) {
    setNumber(newNumber)
    onChange(newNumber ? `${prefix} ${newNumber}` : '')
  }

  return (
    <div className={`flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#001E5D]/30 focus-within:border-[#001E5D] bg-white ${className}`}>
      <select
        value={prefix}
        onChange={e => handlePrefixChange(e.target.value)}
        disabled={disabled}
        title="Prefijo de país"
        className="flex-shrink-0 bg-transparent text-sm px-1.5 py-1.5 focus:outline-none text-gray-600 cursor-pointer border-r border-gray-200"
        style={{ maxWidth: 80 }}
      >
        {COUNTRY_CODES.map(c => (
          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
        ))}
      </select>
      <input
        type="tel"
        value={number}
        onChange={e => handleNumberChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 px-2.5 py-1.5 text-sm focus:outline-none bg-transparent text-gray-800"
      />
    </div>
  )
}
