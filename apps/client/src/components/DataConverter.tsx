import React, { useState } from 'react';
import { api } from '../lib/env';

interface ConversionResult {
  success: boolean;
  message: string;
  convertedCount?: number;
  errors?: string[];
}

export const DataConverter: React.FC = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<string>('');

  const operations = [
    {
      id: 'convert-legacy-abilities',
      name: 'Convert Legacy Abilities to Structured Format',
      description: 'Converts old ability format (title/text) to new structured format (id/type/symbol/name/description)',
      endpoint: '/api/admin/convert-legacy-abilities'
    },
    {
      id: 'fix-missing-factions',
      name: 'Fix Missing Factions',
      description: 'Adds missing faction data to characters based on their abilities and context',
      endpoint: '/api/admin/fix-missing-factions'
    },
    {
      id: 'fix-missing-set-codes',
      name: 'Fix Missing Set Codes',
      description: 'Adds missing set_code data to characters based on their names and context',
      endpoint: '/api/admin/fix-missing-set-codes'
    },
    {
      id: 'normalize-unit-types',
      name: 'Normalize Unit Types',
      description: 'Converts unit_type from string to array format and ensures consistency',
      endpoint: '/api/admin/normalize-unit-types'
    },
    {
      id: 'add-missing-stance-files',
      name: 'Add Missing Stance Files',
      description: 'Creates basic stance.json files for characters that don\'t have them',
      endpoint: '/api/admin/add-missing-stance-files'
    }
  ];

  const handleConversion = async (operation: typeof operations[0]) => {
    setIsConverting(true);
    setResult(null);

    try {
      const response = await fetch(api(operation.endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Conversion completed successfully',
          convertedCount: data.convertedCount,
          errors: data.errors
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Conversion failed',
          errors: data.errors
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `Conversion failed: ${error.message}`,
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      background: '#1f2937',
      borderRadius: '8px',
      color: '#f9fafb'
    }}>
      <h2 style={{ 
        color: '#f9fafb', 
        marginBottom: '20px',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        🔧 Data Conversion Tools
      </h2>
      
      <p style={{ 
        color: '#d1d5db', 
        marginBottom: '30px',
        lineHeight: '1.6'
      }}>
        These tools help convert old data formats to new formats and fix missing data. 
        Use them to ensure all character data is properly formatted and complete.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {operations.map((operation) => (
          <div
            key={operation.id}
            style={{
              background: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '8px',
              padding: '20px',
              transition: 'border-color 0.2s ease'
            }}
          >
            <h3 style={{ 
              color: '#f9fafb', 
              marginBottom: '8px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              {operation.name}
            </h3>
            
            <p style={{ 
              color: '#d1d5db', 
              marginBottom: '16px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              {operation.description}
            </p>
            
            <button
              onClick={() => handleConversion(operation)}
              disabled={isConverting}
              style={{
                padding: '10px 20px',
                background: isConverting ? '#6b7280' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isConverting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isConverting) {
                  e.currentTarget.style.background = '#047857';
                }
              }}
              onMouseLeave={(e) => {
                if (!isConverting) {
                  e.currentTarget.style.background = '#059669';
                }
              }}
            >
              {isConverting ? 'Converting...' : 'Run Conversion'}
            </button>
          </div>
        ))}
      </div>

      {result && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: result.success ? '#064e3b' : '#7f1d1d',
          border: `1px solid ${result.success ? '#10b981' : '#ef4444'}`,
          borderRadius: '8px'
        }}>
          <h4 style={{ 
            color: '#f9fafb', 
            marginBottom: '12px',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {result.success ? '✅ Conversion Successful' : '❌ Conversion Failed'}
          </h4>
          
          <p style={{ 
            color: '#d1d5db', 
            marginBottom: result.convertedCount ? '8px' : '0',
            fontSize: '14px'
          }}>
            {result.message}
          </p>
          
          {result.convertedCount && (
            <p style={{ 
              color: '#10b981', 
              marginBottom: '0',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Converted {result.convertedCount} items
            </p>
          )}
          
          {result.errors && result.errors.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <h5 style={{ 
                color: '#fca5a5', 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Errors:
              </h5>
              <ul style={{ 
                color: '#fca5a5', 
                fontSize: '12px',
                margin: '0',
                paddingLeft: '20px'
              }}>
                {result.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataConverter;
