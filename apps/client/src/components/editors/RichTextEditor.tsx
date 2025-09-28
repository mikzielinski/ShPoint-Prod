import React, { useRef, useState, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  gameSymbols?: Array<{ name: string; unicode: string }>;
  onInsertSymbol?: (symbol: string, name: string, unicode: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text...",
  gameSymbols = [],
  onInsertSymbol
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showFactions, setShowFactions] = useState(false);
  const [showSymbols, setShowSymbols] = useState(false);

  const availableFactions = [
    'Galactic Empire', 'Rebel Alliance', 'Separatist Alliance', 
    'Republic', 'Mandalorian', 'Crimson Dawn', 'Spy'
  ];

  const insertText = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restore selection and scroll position after state update
    setTimeout(() => {
      if (textarea) {
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = end + before.length;
        textarea.focus();
      }
    }, 0);
  }, [value, onChange]);

  const insertFaction = (faction: string) => {
    insertText(`<faction>${faction}</faction>`);
    setShowFactions(false);
  };

  const insertSymbol = (symbol: { name: string; unicode: string }) => {
    if (onInsertSymbol) {
      onInsertSymbol(symbol.unicode, symbol.name, symbol.unicode);
    } else {
      insertText(`[[${symbol.name.toLowerCase().replace(/\s+/g, '-')}]]`);
    }
    setShowSymbols(false);
  };

  const formatBold = () => insertText('<b>', '</b>');
  const formatItalic = () => insertText('<i>', '</i>');
  const formatUnderline = () => insertText('<u>', '</u>');

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '8px 12px',
        background: '#374151',
        border: '1px solid #4b5563',
        borderRadius: '6px 6px 0 0',
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={formatBold}
          style={{
            background: '#4b5563',
            border: '1px solid #6b7280',
            borderRadius: '4px',
            color: '#f9fafb',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          B
        </button>
        
        <button
          type="button"
          onClick={formatItalic}
          style={{
            background: '#4b5563',
            border: '1px solid #6b7280',
            borderRadius: '4px',
            color: '#f9fafb',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontStyle: 'italic'
          }}
        >
          I
        </button>
        
        <button
          type="button"
          onClick={formatUnderline}
          style={{
            background: '#4b5563',
            border: '1px solid #6b7280',
            borderRadius: '4px',
            color: '#f9fafb',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '14px',
            textDecoration: 'underline'
          }}
        >
          U
        </button>

        <div style={{ width: '1px', background: '#6b7280', margin: '0 4px' }} />

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowFactions(!showFactions)}
            style={{
              background: '#4b5563',
              border: '1px solid #6b7280',
              borderRadius: '4px',
              color: '#f9fafb',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Factions
          </button>
          
          {showFactions && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
              padding: '8px',
              zIndex: 1000,
              minWidth: '200px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '8px'
              }}>
                Click to insert faction:
              </div>
              {availableFactions.map(faction => (
                <button
                  key={faction}
                  type="button"
                  onClick={() => insertFaction(faction)}
                  style={{
                    display: 'block',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: '#f9fafb',
                    padding: '4px 8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  {faction}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: '#374151',
          border: '1px solid #4b5563',
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
          color: '#f9fafb',
          minHeight: '80px',
          resize: 'vertical',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
        rows={3}
      />

      {value && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          background: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '6px',
          color: '#f9fafb'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#9ca3af',
            marginBottom: '8px'
          }}>
            Preview:
          </div>
          <div style={{ 
            whiteSpace: 'pre-wrap',
            fontSize: '14px'
          }}>
            {renderPreview(value)}
          </div>
        </div>
      )}
    </div>
  );
};

const renderPreview = (text: string): React.ReactNode => {
  if (!text) return '';
  
  const parts = text.split(/(<[^>]+>)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('<faction>') && part.endsWith('</faction>')) {
      const faction = part.slice(9, -10);
      return (
        <span
          key={index}
          style={{
            background: 'rgba(59, 130, 246, 0.2)',
            color: '#60a5fa',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          {faction}
        </span>
      );
    }
    
    if (part === '<b>') return <strong key={index}></strong>;
    if (part === '</b>') return null;
    if (part === '<i>') return <em key={index}></em>;
    if (part === '</i>') return null;
    if (part === '<u>') return <u key={index}></u>;
    if (part === '</u>') return null;
    
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const token = part.slice(2, -2).trim().toLowerCase();
      // Map symbols to ShatterpointIcons font characters
      const GLYPH_MAP: Record<string, string> = {
        force: "\u0076",  // v - sp-force
        dash: "\u0068",   // h - sp-dash
        jump: "\u0074",   // t - sp-jump
        crit: "\u0062",   // b - sp-critical
        hit: "\u0061",    // a - sp-strike
        block: "\u0065",  // e - sp-block
        identify: "\u006D", // m - sp-identify
        strike: "\u0061", // a - sp-strike
        hunker: "\u0033", // 3 - sp-hunker
        ranged: "\u006E", // n - sp-ranged
        "attack-expertise": "\u0063", // c - sp-attack-expertise
        "defense-expertise": "\u0066", // f - sp-defense-expertise
        reposition: "\u0073", // s - sp-reposition
        heal: "\u0072", // r - sp-heal
        durability: "\u0077", // w - sp-durability
        critical: "\u0062", // b - sp-critical
        failure: "\u0064", // d - sp-failure
        melee: "\u006F", // o - sp-melee
        shove: "\u0070", // p - sp-shove
        damage: "\u0071", // q - sp-damage
        pinned: "\u0031", // 1 - sp-pinned
        exposed: "\u0034", // 4 - sp-exposed
        strained: "\u0035", // 5 - sp-strained
        disarm: "\u0039", // 9 - sp-disarm
        climb: "\u0075", // u - sp-climb
        tactic: "\u006B", // k - sp-tactic
        innate: "\u006C", // l - sp-innate
        reactive: "\u0069", // i - sp-reactive
        active: "\u006A", // j - sp-active
        advance: "\u0078", // x - advance
      };
      
      const glyph = GLYPH_MAP[token];
      
      return (
        <span
          key={index}
          style={{
            background: 'rgba(251, 191, 36, 0.2)',
            color: '#fbbf24',
            padding: '2px 4px',
            borderRadius: '3px',
            fontSize: '14px',
            fontFamily: 'ShatterpointIcons, monospace',
            margin: '0 2px'
          }}
          title={token}
        >
          {glyph || part}
        </span>
      );
    }
    
    return part;
  });
};

export default RichTextEditor;
