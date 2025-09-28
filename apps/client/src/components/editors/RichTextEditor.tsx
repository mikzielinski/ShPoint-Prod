import React, { useRef, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  availableFactions?: string[];
  gameSymbols?: Array<{ symbol: string; name: string; unicode: string; description: string }>;
  onInsertSymbol?: (symbol: string, name: string, unicode: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter description...",
  availableFactions = [],
  gameSymbols = [],
  onInsertSymbol
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showFactions, setShowFactions] = useState(false);
  const [showSymbols, setShowSymbols] = useState(false);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
      
      onChange(newText);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
      }, 0);
    }
  };

  const insertFaction = (faction: string) => {
    insertText(`<faction>${faction}</faction>`);
    setShowFactions(false);
  };

  const insertSymbol = (symbol: string, name: string, unicode: string) => {
    if (onInsertSymbol) {
      onInsertSymbol(symbol, name, unicode);
    } else {
      insertText(`[[${name.toLowerCase().replace(/\s+/g, '-')}]]`);
    }
    setShowSymbols(false);
  };

  const formatBold = () => insertText('<b>', '</b>');
  const formatItalic = () => insertText('<i>', '</i>');
  const formatUnderline = () => insertText('<u>', '</u>');

  return (
    <div style={{ width: '100%' }}>
      {/* Formatting Toolbar */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '8px',
        padding: '8px',
        background: '#374151',
        border: '1px solid #4b5563',
        borderRadius: '6px 6px 0 0',
        flexWrap: 'wrap'
      }}>
        {/* Text Formatting */}
        <button
          type="button"
          onClick={formatBold}
          style={{
            padding: '4px 8px',
            background: '#4b5563',
            color: '#f9fafb',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
          title="Bold"
        >
          B
        </button>
        
        <button
          type="button"
          onClick={formatItalic}
          style={{
            padding: '4px 8px',
            background: '#4b5563',
            color: '#f9fafb',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontStyle: 'italic'
          }}
          title="Italic"
        >
          I
        </button>
        
        <button
          type="button"
          onClick={formatUnderline}
          style={{
            padding: '4px 8px',
            background: '#4b5563',
            color: '#f9fafb',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            textDecoration: 'underline'
          }}
          title="Underline"
        >
          U
        </button>

        {/* Separator */}
        <div style={{ width: '1px', background: '#6b7280', margin: '0 4px' }} />

        {/* Factions */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowFactions(!showFactions)}
            style={{
              padding: '4px 8px',
              background: showFactions ? '#3b82f6' : '#4b5563',
              color: '#f9fafb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title="Insert Faction"
          >
            🏛️ Factions
          </button>
          
          {showFactions && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              background: '#1f2937',
              border: '1px solid #4b5563',
              borderRadius: '6px',
              padding: '8px',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto',
              minWidth: '200px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{
                fontSize: '11px',
                color: '#9ca3af',
                marginBottom: '6px'
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
                    padding: '4px 8px',
                    background: 'transparent',
                    color: '#f9fafb',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textAlign: 'left',
                    marginBottom: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#374151';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {faction}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Game Symbols */}
        {gameSymbols.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowSymbols(!showSymbols)}
              style={{
                padding: '4px 8px',
                background: showSymbols ? '#7c3aed' : '#4b5563',
                color: '#f9fafb',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Insert Game Symbol"
            >
              ⚡ Symbols
            </button>
            
            {showSymbols && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                background: '#1f2937',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                padding: '8px',
                zIndex: 1000,
                maxHeight: '300px',
                overflowY: 'auto',
                minWidth: '300px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  marginBottom: '6px'
                }}>
                  Click to insert symbol:
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: '4px'
                }}>
                  {gameSymbols.map(symbol => (
                    <button
                      key={symbol.symbol}
                      type="button"
                      onClick={() => insertSymbol(symbol.symbol, symbol.name, symbol.unicode)}
                      style={{
                        padding: '6px',
                        background: '#374151',
                        color: '#f9fafb',
                        border: '1px solid #4b5563',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#4b5563';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#374151';
                      }}
                      title={symbol.description}
                    >
                      <span 
                        style={{
                          fontFamily: 'ShatterpointIcons, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
                          fontSize: '16px',
                          color: '#fbbf24'
                        }}
                      >
                        {symbol.unicode}
                      </span>
                      <span style={{ fontSize: '10px' }}>{symbol.name}</span>
                    </button>
                  ))}
                </div>
              </div>
          )}
        </div>
      </div>

      {/* Textarea */}
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
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.4'
        }}
        rows={3}
      />

      {/* Preview */}
      {value && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          background: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#d1d5db'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#9ca3af',
            marginBottom: '4px'
          }}>
            Preview:
          </div>
          <div style={{ 
            whiteSpace: 'pre-wrap',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {renderPreview(value)}
          </div>
        </div>
      )}
    </div>
  );
};

// Function to render preview with formatting
const renderPreview = (text: string): React.ReactNode => {
  if (!text) return '';
  
  // Split by HTML tags and process each part
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
    if (part === '</b>') return <></>;
    if (part === '<i>') return <em key={index}></em>;
    if (part === '</i>') return <></>;
    if (part === '<u>') return <u key={index}></u>;
    if (part === '</u>') return <></>;
    
    // Handle symbol tags
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const symbolName = part.slice(2, -2);
      // This would need the actual symbol mapping, but for now just show the tag
      return (
        <span
          key={index}
          style={{
            background: 'rgba(251, 191, 36, 0.2)',
            color: '#fbbf24',
            padding: '2px 4px',
            borderRadius: '3px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}
        >
          {part}
        </span>
      );
    }
    
    return part;
  });
};
