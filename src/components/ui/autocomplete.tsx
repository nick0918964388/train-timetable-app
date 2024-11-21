'use client'
import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'

export interface AutocompleteOption {
  id: string
  name: string
}

export interface AutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (option: AutocompleteOption) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  options: AutocompleteOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function Autocomplete({
  value,
  onChange,
  onSelect,
  onKeyDown,
  options,
  placeholder,
  disabled,
  className
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [composing, setComposing] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState(options)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // 處理點擊外部關閉下拉選單
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 過濾選項
  useEffect(() => {
    if (!composing && value) {
      const filtered = options.filter(option =>
        option.name.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredOptions(filtered)
    } else {
      setFilteredOptions([])
    }
  }, [value, options, composing])

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => {
          setComposing(false)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="text-center"
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option) => (
            <li
              key={option.id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-center"
              onClick={() => {
                onSelect(option)
                setIsOpen(false)
              }}
            >
              {option.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 