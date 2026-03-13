"use client";

import { useRef, useEffect, useCallback } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Digite a descrição do produto...",
  className = "",
  minHeight = "200px",
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value]);

  const handleInput = useCallback(() => {
    onChange(ref.current?.innerHTML ?? "");
  }, [onChange]);

  function exec(cmd: string, arg?: string) {
    document.execCommand(cmd, false, arg);
    ref.current?.focus();
    handleInput();
  }

  return (
    <div className={`rounded-xl border border-[var(--border)] bg-zinc-800 overflow-hidden ${className}`}>
      <div className="flex flex-wrap gap-1 border-b border-[var(--border)] bg-zinc-900 p-2">
        <button type="button" onClick={() => exec("bold")} className="rounded p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white" title="Negrito">
          <b>B</b>
        </button>
        <button type="button" onClick={() => exec("italic")} className="rounded p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white" title="Itálico">
          <i>I</i>
        </button>
        <button type="button" onClick={() => exec("underline")} className="rounded p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white" title="Sublinhado">
          <u>U</u>
        </button>
        <span className="my-1 w-px bg-zinc-600" />
        <button type="button" onClick={() => exec("insertUnorderedList")} className="rounded p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white" title="Lista">
          •
        </button>
        <button type="button" onClick={() => exec("insertOrderedList")} className="rounded p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white" title="Lista numerada">
          1.
        </button>
        <span className="my-1 w-px bg-zinc-600" />
        <button type="button" onClick={() => exec("formatBlock", "h3")} className="rounded px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-700 hover:text-white">
          Título
        </button>
        <button type="button" onClick={() => exec("formatBlock", "p")} className="rounded px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-700 hover:text-white">
          Parágrafo
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="min-w-0 p-4 text-white outline-none [&:empty::before]:content-[attr(data-placeholder)] [&:empty::before]:text-zinc-500"
        style={{ minHeight }}
      />
    </div>
  );
}
