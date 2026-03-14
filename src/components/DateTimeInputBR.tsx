"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  value: string;
  onChange: (isoValue: string) => void;
  className?: string;
  placeholder?: string;
};

function formatToBR(isoOrDatetimeLocal: string): string {
  if (!isoOrDatetimeLocal) return "";
  const date = new Date(isoOrDatetimeLocal);
  if (isNaN(date.getTime())) return "";
  
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function parseFromBR(brValue: string): string {
  const match = brValue.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) return "";
  
  const [, day, month, year, hours, minutes] = match;
  const date = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes)
  );
  
  if (isNaN(date.getTime())) return "";
  return date.toISOString();
}

function isoToDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function DateTimeInputBR({ value, onChange, className = "", placeholder }: Props) {
  const [displayValue, setDisplayValue] = useState(formatToBR(value));
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayValue(formatToBR(value));
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    
    const iso = parseFromBR(newValue);
    if (iso) {
      onChange(iso);
    }
  }

  function handlePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const datetimeLocal = e.target.value;
    if (datetimeLocal) {
      const date = new Date(datetimeLocal);
      onChange(date.toISOString());
      setDisplayValue(formatToBR(datetimeLocal));
    }
    setShowPicker(false);
  }

  function handleCalendarClick() {
    setShowPicker(true);
    setTimeout(() => {
      pickerRef.current?.showPicker?.();
      pickerRef.current?.focus();
    }, 0);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder || "DD/MM/AAAA HH:MM"}
          className={className || "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"}
        />
        <button
          type="button"
          onClick={handleCalendarClick}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white"
          title="Abrir calendário"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      
      {showPicker && (
        <input
          ref={pickerRef}
          type="datetime-local"
          value={isoToDatetimeLocal(value)}
          onChange={handlePickerChange}
          className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white"
        />
      )}
    </div>
  );
}
