import React, { useState, useEffect } from 'react';
import { api } from '../lib/env';
import { useAuth } from '../auth/AuthContext';

interface GameReminder {
  id: string;
  type: 'EMAIL' | 'PUSH_NOTIFICATION' | 'BOTH';
  reminderTime: string;
  isSent: boolean;
  sentAt?: string;
  calendarEventId?: string;
  isEnabled: boolean;
}

interface ScheduledGame {
  id: string;
  player1Id: string;
  player2Id: string;
  missionId: string;
  scheduledDate: string;
  location: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reminders: GameReminder[];
}

interface GameRemindersProps {
  game: ScheduledGame;
  onUpdate: () => void;
}

const GameReminders: React.FC<GameRemindersProps> = ({ game, onUpdate }) => {
  const { user } = useAuth();
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    type: 'EMAIL' as const,
    reminderTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addReminder = async () => {
    if (!newReminder.reminderTime) {
      setError('Reminder time is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(api(`/api/v2/scheduled-games/${game.id}/reminders`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReminder)
      });

      if (response.ok) {
        setNewReminder({ type: 'EMAIL', reminderTime: '' });
        setShowAddReminder(false);
        onUpdate();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add reminder');
      }
    } catch (err) {
      setError('Failed to add reminder');
    } finally {
      setLoading(false);
    }
  };

  const removeReminder = async (reminderId: string) => {
    try {
      const response = await fetch(api(`/api/v2/scheduled-games/${game.id}/reminders/${reminderId}`), {
        method: 'DELETE'
      });

      if (response.ok) {
        onUpdate();
      } else {
        setError('Failed to remove reminder');
      }
    } catch (err) {
      setError('Failed to remove reminder');
    }
  };

  const toggleReminder = async (reminderId: string, isEnabled: boolean) => {
    try {
      const response = await fetch(api(`/api/v2/scheduled-games/${game.id}/reminders/${reminderId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled })
      });

      if (response.ok) {
        onUpdate();
      } else {
        setError('Failed to update reminder');
      }
    } catch (err) {
      setError('Failed to update reminder');
    }
  };

  const generateCalendarEvent = async (format: 'ics' | 'google' | 'outlook') => {
    try {
      const response = await fetch(api(`/api/v2/scheduled-games/${game.id}/calendar?format=${format}`));
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `game-${game.id}.${format === 'ics' ? 'ics' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to generate calendar event');
      }
    } catch (err) {
      setError('Failed to generate calendar event');
    }
  };

  const formatReminderType = (type: string) => {
    switch (type) {
      case 'EMAIL': return '📧 Email';
      case 'PUSH_NOTIFICATION': return '🔔 Push';
      case 'BOTH': return '📧🔔 Both';
      default: return type;
    }
  };

  return (
    <div style={{ marginTop: '15px' }}>
      <h4 style={{ color: '#f9fafb', margin: '0 0 10px 0' }}>Reminders</h4>
      
      {error && (
        <div style={{ 
          backgroundColor: '#dc2626', 
          color: 'white', 
          padding: '8px', 
          borderRadius: '4px', 
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={() => setShowAddReminder(true)}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Add Reminder
        </button>
      </div>

      {showAddReminder && (
        <div style={{
          backgroundColor: '#334155',
          border: '1px solid #475569',
          borderRadius: '6px',
          padding: '15px',
          marginBottom: '10px'
        }}>
          <h5 style={{ color: '#f9fafb', margin: '0 0 10px 0' }}>Add Reminder</h5>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#e2e8f0', fontSize: '14px' }}>
              Type:
            </label>
            <select
              value={newReminder.type}
              onChange={(e) => setNewReminder({...newReminder, type: e.target.value as any})}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: '#e2e8f0',
                fontSize: '14px'
              }}
            >
              <option value="EMAIL">📧 Email</option>
              <option value="PUSH_NOTIFICATION">🔔 Push Notification</option>
              <option value="BOTH">📧🔔 Both</option>
            </select>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#e2e8f0', fontSize: '14px' }}>
              Reminder Time:
            </label>
            <input
              type="datetime-local"
              value={newReminder.reminderTime}
              onChange={(e) => setNewReminder({...newReminder, reminderTime: e.target.value})}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: '#e2e8f0',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={addReminder}
              disabled={loading}
              style={{
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => setShowAddReminder(false)}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {game.reminders.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          {game.reminders.map(reminder => (
            <div key={reminder.id} style={{
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '6px',
              padding: '10px',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <span style={{ color: '#f9fafb', fontSize: '14px' }}>
                    {formatReminderType(reminder.type)}
                  </span>
                  <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                    {new Date(reminder.reminderTime).toLocaleString()}
                  </span>
                  {reminder.isSent && (
                    <span style={{ color: '#16a34a', fontSize: '12px' }}>
                      ✓ Sent
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#e2e8f0' }}>
                    <input
                      type="checkbox"
                      checked={reminder.isEnabled}
                      onChange={(e) => toggleReminder(reminder.id, e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    Enabled
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={() => removeReminder(reminder.id)}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => generateCalendarEvent('ics')}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📅 Download ICS
        </button>
        <button
          onClick={() => generateCalendarEvent('google')}
          style={{
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📅 Google Calendar
        </button>
        <button
          onClick={() => generateCalendarEvent('outlook')}
          style={{
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📅 Outlook
        </button>
      </div>
    </div>
  );
};

export default GameReminders;
