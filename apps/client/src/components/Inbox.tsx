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
        console.log('🔍 Loaded messages:', data.messages);
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
      case 'GAME_REGISTRATION':
        return '🎮';
      case 'GAME_REGISTRATION_APPROVED':
        return '✅';
      case 'GAME_REGISTRATION_REJECTED':
        return '❌';
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

  // Helper functions for calendar integration
  const formatDateForCalendar = (date: string | Date): string => {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const generateICS = (eventData: any): string => {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ShPoint//Shatterpoint Game//EN
BEGIN:VEVENT
UID:${eventData.startDate.getTime()}@shpoint.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(eventData.startDate)}
DTEND:${formatDate(eventData.endDate)}
SUMMARY:${eventData.title}
DESCRIPTION:${eventData.description}
LOCATION:${eventData.location}
END:VEVENT
END:VCALENDAR`;
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
                  borderLeft: !message.isRead ? '3px solid #ffc107' : '3px solid transparent',
                  // Special styling for game registration messages
                  ...(message.type === 'GAME_REGISTRATION' && {
                    backgroundColor: selectedMessage?.id === message.id ? '#1e3a8a' : 
                                   !message.isRead ? '#1e40af' : '#1e3a8a',
                    color: '#f9fafb',
                    borderLeft: '3px solid #3b82f6'
                  })
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
              
              {/* Special handling for game registration messages */}
              {selectedMessage.type === 'GAME_REGISTRATION' && selectedMessage.data && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '16px', 
                  backgroundColor: '#1e3a8a', 
                  borderRadius: '8px',
                  border: '2px solid #3b82f6',
                  fontSize: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px', marginRight: '8px' }}>🎮</span>
                    <strong style={{ color: '#fbbf24' }}>Game Registration Request</strong>
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ margin: '0 0 12px 0', color: '#e5e7eb' }}>
                      A player wants to join your public game!
                    </p>
                    
                    {selectedMessage.data.gameDetails && (
                      <div style={{ 
                        background: '#1f2937', 
                        padding: '12px', 
                        borderRadius: '6px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#fbbf24' }}>📅 When:</strong>
                          <span style={{ color: '#d1d5db', marginLeft: '8px' }}>
                            {selectedMessage.data.gameDetails.scheduledDate ? 
                              new Date(selectedMessage.data.gameDetails.scheduledDate).toLocaleString('pl-PL', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'TBD'
                            }
                          </span>
                        </div>
                        
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#fbbf24' }}>📍 Where:</strong>
                          <span style={{ color: '#d1d5db', marginLeft: '8px' }}>
                            {selectedMessage.data.gameDetails.location || selectedMessage.data.gameDetails.address || 
                             `${selectedMessage.data.gameDetails.city || ''}, ${selectedMessage.data.gameDetails.country || ''}`.replace(/^,\s*|,\s*$/g, '') || 'TBD'}
                          </span>
                        </div>
                        
                        {selectedMessage.data.gameDetails.mission && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#fbbf24' }}>🎯 Mission:</strong>
                            <span style={{ color: '#d1d5db', marginLeft: '8px' }}>
                              {selectedMessage.data.gameDetails.mission.name}
                            </span>
                          </div>
                        )}
                        
                        {selectedMessage.data.gameDetails.skillLevel && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#fbbf24' }}>🎮 Skill Level:</strong>
                            <span style={{ color: '#d1d5db', marginLeft: '8px' }}>
                              {selectedMessage.data.gameDetails.skillLevel}
                            </span>
                          </div>
                        )}
                        
                        {selectedMessage.data.gameDetails.isPaid && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#fbbf24' }}>💰 Cost:</strong>
                            <span style={{ color: '#d1d5db', marginLeft: '8px' }}>
                              {selectedMessage.data.gameDetails.totalCost} {selectedMessage.data.gameDetails.currency}
                            </span>
                          </div>
                        )}
                        
                        {selectedMessage.data.gameDetails.notes && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#fbbf24' }}>📝 Notes:</strong>
                            <span style={{ color: '#d1d5db', marginLeft: '8px' }}>
                              {selectedMessage.data.gameDetails.notes}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      <p style={{ margin: '0 0 4px 0' }}>
                        Game ID: <code style={{ background: '#374151', padding: '2px 6px', borderRadius: '4px' }}>{selectedMessage.data.gameId}</code>
                      </p>
                      <p style={{ margin: '0' }}>
                        Registration ID: <code style={{ background: '#374151', padding: '2px 6px', borderRadius: '4px' }}>{selectedMessage.data.registrationId}</code>
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                      onClick={async () => {
                        try {
                          console.log('🔍 Approve registration data:', selectedMessage.data);
                          
                          const requestData = {
                            gameId: selectedMessage.data.gameId,
                            registrationId: selectedMessage.data.registrationId || selectedMessage.data.userId
                          };
                          
                          console.log('🔍 Request data:', requestData);
                          
                          const response = await fetch('https://shpoint-prod.onrender.com/api/v2/public-games/approve-registration', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify(requestData)
                          });

                          if (response.ok) {
                            alert('✅ Registration approved successfully!');
                            // Refresh messages
                            loadMessages();
                          } else {
                            const error = await response.json();
                            alert('❌ Failed to approve registration: ' + (error.error || 'Unknown error'));
                          }
                        } catch (error) {
                          alert('❌ Error approving registration: ' + error.message);
                        }
                      }}
                    >
                      ✅ Approve
                    </button>
                    <button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                      onClick={async () => {
                        try {
                          console.log('🔍 Reject registration data:', selectedMessage.data);
                          
                          const requestData = {
                            gameId: selectedMessage.data.gameId,
                            registrationId: selectedMessage.data.registrationId || selectedMessage.data.userId
                          };
                          
                          console.log('🔍 Request data:', requestData);
                          
                          const response = await fetch('https://shpoint-prod.onrender.com/api/v2/public-games/reject-registration', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify(requestData)
                          });

                          if (response.ok) {
                            alert('❌ Registration rejected successfully!');
                            // Refresh messages
                            loadMessages();
                          } else {
                            const error = await response.json();
                            alert('❌ Failed to reject registration: ' + (error.error || 'Unknown error'));
                          }
                        } catch (error) {
                          alert('❌ Error rejecting registration: ' + error.message);
                        }
                      }}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              )}
              
              {/* Special handling for game registration approved messages */}
              {selectedMessage.type === 'GAME_REGISTRATION_APPROVED' && selectedMessage.data?.gameDetails && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '16px', 
                  backgroundColor: '#065f46', 
                  borderRadius: '8px',
                  border: '2px solid #10b981',
                  fontSize: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px', marginRight: '8px' }}>✅</span>
                    <strong style={{ color: '#fbbf24' }}>Game Details</strong>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#e5e7eb' }}>📅 When:</strong>
                      <span style={{ color: '#d1d5db', marginLeft: '8px' }}>
                        {selectedMessage.data.gameDetails.scheduledDate ? 
                          new Date(selectedMessage.data.gameDetails.scheduledDate).toLocaleString('pl-PL', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'TBD'
                        }
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#e5e7eb' }}>📍 Where:</strong>
                      <span style={{ color: '#d1d5db', marginLeft: '8px' }}>
                        {selectedMessage.data.gameDetails.location || selectedMessage.data.gameDetails.address || 
                         `${selectedMessage.data.gameDetails.city || ''}, ${selectedMessage.data.gameDetails.country || ''}`.replace(/^,\s*|,\s*$/g, '') || 'TBD'}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#e5e7eb' }}>👤 Host:</strong>
                      <span style={{ color: '#d1d5db', marginLeft: '8px' }}>
                        {selectedMessage.data.gameDetails.host?.name || selectedMessage.data.gameDetails.host?.username || 'Unknown'}
                      </span>
                    </div>
                    
                    {selectedMessage.data.gameDetails.mission && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#e5e7eb' }}>🎯 Mission:</strong>
                        <span style={{ color: '#d1d5db', marginLeft: '8px' }}>
                          {selectedMessage.data.gameDetails.mission.name}
                        </span>
                      </div>
                    )}
                    
                    {selectedMessage.data.gameDetails.notes && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#e5e7eb' }}>📝 Notes:</strong>
                        <span style={{ color: '#d1d5db', marginLeft: '8px' }}>
                          {selectedMessage.data.gameDetails.notes}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ borderTop: '1px solid #10b981', paddingTop: '12px' }}>
                    <div style={{ marginBottom: '8px', color: '#fbbf24', fontWeight: 'bold' }}>
                      📅 Add to Calendar:
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#1e40af',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                        onClick={() => {
                          const eventData = {
                            title: `Shatterpoint Game - ${selectedMessage.data.gameDetails.mission?.name || 'Mission'}`,
                            description: `Game with ${selectedMessage.data.gameDetails.host?.name || selectedMessage.data.gameDetails.host?.username}`,
                            startDate: selectedMessage.data.gameDetails.scheduledDate,
                            endDate: new Date(new Date(selectedMessage.data.gameDetails.scheduledDate).getTime() + 3 * 60 * 60 * 1000),
                            location: selectedMessage.data.gameDetails.location || selectedMessage.data.gameDetails.address || 
                                     `${selectedMessage.data.gameDetails.city || ''}, ${selectedMessage.data.gameDetails.country || ''}`.replace(/^,\s*|,\s*$/g, '')
                          };
                          
                          // Google Calendar
                          const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventData.title)}&dates=${formatDateForCalendar(eventData.startDate)}/${formatDateForCalendar(eventData.endDate)}&details=${encodeURIComponent(eventData.description)}&location=${encodeURIComponent(eventData.location)}`;
                          window.open(googleUrl, '_blank');
                        }}
                      >
                        📅 Google
                      </button>
                      
                      <button
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#0078d4',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                        onClick={() => {
                          const eventData = {
                            title: `Shatterpoint Game - ${selectedMessage.data.gameDetails.mission?.name || 'Mission'}`,
                            description: `Game with ${selectedMessage.data.gameDetails.host?.name || selectedMessage.data.gameDetails.host?.username}`,
                            startDate: selectedMessage.data.gameDetails.scheduledDate,
                            endDate: new Date(new Date(selectedMessage.data.gameDetails.scheduledDate).getTime() + 3 * 60 * 60 * 1000),
                            location: selectedMessage.data.gameDetails.location || selectedMessage.data.gameDetails.address || 
                                     `${selectedMessage.data.gameDetails.city || ''}, ${selectedMessage.data.gameDetails.country || ''}`.replace(/^,\s*|,\s*$/g, '')
                          };
                          
                          // Outlook Calendar
                          const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(eventData.title)}&startdt=${eventData.startDate}&enddt=${eventData.endDate}&body=${encodeURIComponent(eventData.description)}&location=${encodeURIComponent(eventData.location)}`;
                          window.open(outlookUrl, '_blank');
                        }}
                      >
                        📅 Outlook
                      </button>
                      
                      <button
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#007aff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                        onClick={() => {
                          const eventData = {
                            title: `Shatterpoint Game - ${selectedMessage.data.gameDetails.mission?.name || 'Mission'}`,
                            description: `Game with ${selectedMessage.data.gameDetails.host?.name || selectedMessage.data.gameDetails.host?.username}`,
                            startDate: selectedMessage.data.gameDetails.scheduledDate,
                            endDate: new Date(new Date(selectedMessage.data.gameDetails.scheduledDate).getTime() + 3 * 60 * 60 * 1000),
                            location: selectedMessage.data.gameDetails.location || selectedMessage.data.gameDetails.address || 
                                     `${selectedMessage.data.gameDetails.city || ''}, ${selectedMessage.data.gameDetails.country || ''}`.replace(/^,\s*|,\s*$/g, '')
                          };
                          
                          // iOS Calendar (ICS file)
                          const icsContent = generateICS(eventData);
                          const blob = new Blob([icsContent], { type: 'text/calendar' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `shatterpoint-game-${selectedMessage.data.gameId}.ics`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                      >
                        📱 iOS
                      </button>
                      
                      <button
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#34a853',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                        onClick={() => {
                          const eventData = {
                            title: `Shatterpoint Game - ${selectedMessage.data.gameDetails.mission?.name || 'Mission'}`,
                            description: `Game with ${selectedMessage.data.gameDetails.host?.name || selectedMessage.data.gameDetails.host?.username}`,
                            startDate: selectedMessage.data.gameDetails.scheduledDate,
                            endDate: new Date(new Date(selectedMessage.data.gameDetails.scheduledDate).getTime() + 3 * 60 * 60 * 1000),
                            location: selectedMessage.data.gameDetails.location || selectedMessage.data.gameDetails.address || 
                                     `${selectedMessage.data.gameDetails.city || ''}, ${selectedMessage.data.gameDetails.country || ''}`.replace(/^,\s*|,\s*$/g, '')
                          };
                          
                          // Android Calendar (ICS file)
                          const icsContent = generateICS(eventData);
                          const blob = new Blob([icsContent], { type: 'text/calendar' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `shatterpoint-game-${selectedMessage.data.gameId}.ics`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                      >
                        🤖 Android
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedMessage.data && selectedMessage.type !== 'GAME_REGISTRATION' && selectedMessage.type !== 'GAME_REGISTRATION_APPROVED' && (
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
