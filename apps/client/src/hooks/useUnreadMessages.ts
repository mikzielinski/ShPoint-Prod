import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/env';

export function useUnreadMessages() {
  const { auth } = useAuth();
  const me = auth.status === 'authenticated' ? auth.user : null;
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const checkUnreadMessages = async () => {
    if (!me) {
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(api('/api/v2/inbox?unreadOnly=true'), {
        credentials: 'include'
      });
      
      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (data.ok) {
            setUnreadCount(data.messages?.length || 0);
          }
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError, 'Response text:', text);
          setUnreadCount(0);
        }
      } else {
        console.log('Inbox API not available, status:', response.status);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error checking unread messages:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUnreadMessages();
    
    // Check for new messages every 30 seconds
    const interval = setInterval(checkUnreadMessages, 30000);
    
    return () => clearInterval(interval);
  }, [me]);

  return { unreadCount, loading, refresh: checkUnreadMessages };
}
