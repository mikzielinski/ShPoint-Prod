import React, { useState, useEffect } from 'react';
import { api } from '../lib/env';
import { useAuth } from '../auth/AuthContext';

interface InboxMessage {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  sender?: {
    id: string;
    name?: string;
    username?: string;
    avatarUrl?: string;
  };
  data?: any;
}

interface InboxProps {
  onClose?: () => void;
}

export default function Inbox({ onClose }: InboxProps) {
  const { auth } = useAuth();
  const me = auth.status === 'authenticated' ? auth.user : null;
  
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadMessages = async () => {
    if (!me) return;

    try {
      setLoading(true);
      const response = await fetch(api(`/api/v2/inbox?unreadOnly=${filter === 'unread'}`), {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.ok) {
        setMessages(data.messages);
        setUnreadCount(data.unreadCount);
      } else {
        setError(data.error || 'Failed to load messages');
      }
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [me, filter]);

  const markAsRead = async (messageId: string) => {
    if (!me) return;

    try {
      const response = await fetch(api(`/api/v2/inbox/messages/${messageId}/read`), {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!me) return;

    try {
      const response = await fetch(api('/api/v2/inbox/messages/read-all'), {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => ({ ...msg, isRead: true, readAt: new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all messages as read:', err);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!me) return;

    try {
      const response = await fetch(api(`/api/v2/inbox/messages/${messageId}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'challenge':
        return '⚔️';
      case 'challenge_response':
        return '✅';
      case 'challenge_cancelled':
        return '❌';
      case 'game_scheduled':
        return '📅';
      case 'game_updated':
        return '🔄';
      case 'system':
        return '🔔';
      default:
        return '📧';
    }
  };

  const handleMessageClick = (message: InboxMessage) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      markAsRead(message.id);
    }
  };

  if (!me) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Please log in to view your inbox.
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      height: '600px', 
      border: '1px solid #374151', 
      borderRadius: '8px',
      overflow: 'hidden',
      background: '#1f2937'
    }}>
      {/* Messages list */}
      <div style={{ 
        width: '300px', 
        borderRight: '1px solid #374151',
        display: 'flex',
        flexDirection: 'column',
        background: '#1f2937'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '16px', 
          borderBottom: '1px solid #374151',
          backgroundColor: '#111827',
          color: '#f9fafb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Inbox</h3>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '4px 8px',
                backgroundColor: filter === 'all' ? '#007bff' : '#374151',
                color: filter === 'all' ? 'white' : '#495057',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              style={{
                padding: '4px 8px',
                backgroundColor: filter === 'unread' ? '#007bff' : '#374151',
                color: filter === 'unread' ? 'white' : '#495057',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                padding: '4px 8px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Mark All Read
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
          ) : error ? (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              margin: '12px',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
              No messages
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                onClick={() => handleMessageClick(message)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #374151',
                  cursor: 'pointer',
                  backgroundColor: selectedMessage?.id === message.id ? '#e3f2fd' : 
                                 !message.isRead ? '#fff3cd' : 'white',
                  borderLeft: !message.isRead ? '3px solid #ffc107' : '3px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ marginRight: '8px', fontSize: '16px' }}>
                    {getMessageIcon(message.type)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: !message.isRead ? 'bold' : 'normal',
                      fontSize: '14px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {message.title}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6c757d',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {message.sender ? 
                        `${message.sender.name || message.sender.username || 'Unknown'}` : 
                        'System'
                      }
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6c757d' }}>
                    {formatDate(message.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1f2937', color: '#f9fafb' }}>
        {selectedMessage ? (
          <>
            <div style={{ 
              padding: '16px', 
              borderBottom: '1px solid #374151',
              backgroundColor: '#111827'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>{selectedMessage.title}</h4>
                <button
                  onClick={() => deleteMessage(selectedMessage.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc3545',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Delete
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                {selectedMessage.sender ? 
                  `From: ${selectedMessage.sender.name || selectedMessage.sender.username || 'Unknown'}` : 
                  'System Message'
                } • {new Date(selectedMessage.createdAt).toLocaleString()}
              </div>
            </div>
            
            <div style={{ 
              flex: 1, 
              padding: '16px', 
              overflow: 'auto',
              lineHeight: '1.6'
            }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {selectedMessage.content}
              </div>
              
              {selectedMessage.data && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  backgroundColor: '#111827', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  <strong>Additional Data:</strong>
                  <pre style={{ 
                    margin: '8px 0 0 0', 
                    fontSize: '12px', 
                    color: '#6c757d',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {JSON.stringify(selectedMessage.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#6c757d'
          }}>
            Select a message to view
          </div>
        )}
      </div>
    </div>
  );
}
