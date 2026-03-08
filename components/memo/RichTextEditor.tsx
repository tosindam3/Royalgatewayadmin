import React, { useState, useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your message...",
  className = "",
  disabled = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const formatButtons = [
    { command: 'bold', icon: '𝐁', title: 'Bold' },
    { command: 'italic', icon: '𝐼', title: 'Italic' },
    { command: 'underline', icon: '𝐔', title: 'Underline' },
    { command: 'strikeThrough', icon: '𝐒', title: 'Strikethrough' },
  ];

  const listButtons = [
    { command: 'insertUnorderedList', icon: '•', title: 'Bullet List' },
    { command: 'insertOrderedList', icon: '1.', title: 'Numbered List' },
  ];

  const alignButtons = [
    { command: 'justifyLeft', icon: '⬅', title: 'Align Left' },
    { command: 'justifyCenter', icon: '⬌', title: 'Align Center' },
    { command: 'justifyRight', icon: '➡', title: 'Align Right' },
  ];

  return (
    <div className={`border border-white/10 rounded-xl bg-white/5 flex flex-col ${className}`} style={{ minHeight: 'inherit' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-3 border-b border-white/10 flex-wrap shrink-0">
        {/* Format buttons */}
        <div className="flex items-center gap-1 pr-3 border-r border-white/10">
          {formatButtons.map((btn) => (
            <button
              key={btn.command}
              type="button"
              onClick={() => execCommand(btn.command)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-bold"
              title={btn.title}
              disabled={disabled}
            >
              {btn.icon}
            </button>
          ))}
        </div>

        {/* List buttons */}
        <div className="flex items-center gap-1 pr-3 border-r border-white/10">
          {listButtons.map((btn) => (
            <button
              key={btn.command}
              type="button"
              onClick={() => execCommand(btn.command)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs"
              title={btn.title}
              disabled={disabled}
            >
              {btn.icon}
            </button>
          ))}
        </div>

        {/* Alignment buttons */}
        <div className="flex items-center gap-1 pr-3 border-r border-white/10">
          {alignButtons.map((btn) => (
            <button
              key={btn.command}
              type="button"
              onClick={() => execCommand(btn.command)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs"
              title={btn.title}
              disabled={disabled}
            >
              {btn.icon}
            </button>
          ))}
        </div>

        {/* Link button */}
        <button
          type="button"
          onClick={insertLink}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          title="Insert Link"
          disabled={disabled}
        >
          🔗
        </button>

        {/* Clear formatting */}
        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs"
          title="Clear Formatting"
          disabled={disabled}
        >
          ✕
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
        className={`
          flex-1 p-4 text-sm text-white outline-none overflow-y-auto
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
          ${isActive ? 'ring-1 ring-[#8252e9]/20' : ''}
        `}
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          minHeight: '200px'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Character count */}
      <div className="px-4 py-2 border-t border-white/10 flex justify-between items-center text-xs text-slate-500 shrink-0">
        <span>Rich text formatting enabled</span>
        <span>{editorRef.current?.textContent?.length || 0} characters</span>
      </div>
    </div>
  );
};

export default RichTextEditor;