// Lightweight calendar date picker popover — no external dependency.
// Usage: <CalendarPicker value={date} onChange={setDate} onClose={fn} />

import { useState, useRef, useEffect } from 'react'
import Icon from './Icon'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function buildCalendar(year, month) {
  const first = new Date(year, month, 1)
  const startDay = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = startDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, outside: true })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, outside: false })
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, outside: true })
  return cells
}

export default function CalendarPicker({ value, onChange, onClose }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState((value || today).getFullYear())
  const [viewMonth, setViewMonth] = useState((value || today).getMonth())
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose?.()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const cells = buildCalendar(viewYear, viewMonth)

  function prev() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  function next() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }
  function pick(day) {
    onChange(new Date(viewYear, viewMonth, day))
  }
  function goToday() {
    onChange(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl border shadow-xl p-3 w-72 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={prev} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M15.4 7.4L14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg>
        </button>
        <span className="text-sm font-bold text-gray-800">{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={next} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M8.6 16.6L10 18l6-6-6-6-1.4 1.4L13.2 12z"/></svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 mb-1">
        {DAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 text-center text-xs">
        {cells.map((c, i) => {
          const thisDate = c.outside ? null : new Date(viewYear, viewMonth, c.day)
          const isSelected = thisDate && value && sameDay(thisDate, value)
          const isToday = thisDate && sameDay(thisDate, today)
          return (
            <button
              key={i}
              onClick={() => !c.outside && pick(c.day)}
              disabled={c.outside}
              className={[
                'w-8 h-8 mx-auto rounded-full flex items-center justify-center transition-colors',
                c.outside ? 'text-gray-300 cursor-default' : 'hover:bg-gray-100 cursor-pointer',
                isSelected ? 'bg-gray-800 text-white hover:bg-gray-900' : '',
                isToday && !isSelected ? 'ring-2 ring-gray-800 font-bold' : '',
              ].join(' ')}
            >
              {c.day}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t">
        <button onClick={goToday} className="text-xs font-semibold text-gray-600 hover:text-gray-900">
          Today
        </button>
        {value && (
          <span className="text-[11px] text-gray-500">
            {value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}
