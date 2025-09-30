import React, { useState, useEffect } from 'react';
import { api } from '../lib/env';
import { useAuth } from '../auth/AuthContext';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name?: string;
    username?: string;
    avatarUrl?: string;
  };
  likes: Array<{
    id: string;
    user: {
      id: string;
      name?: string;
      username?: string;
    };
  }>;
  replies: Comment[];
  _count: {
    likes: number;
    replies: number;
  };
}

interface CommentsSectionProps {
  type: 'CHARACTER' | 'STRIKE_TEAM' | 'SET' | 'MISSION';
  entityId: string;
}

export default function CommentsSection({ type, entityId }: CommentsSectionProps) {
  const { auth } = useAuth();
  const me = auth.status === 'authenticated' ? auth.user : null;
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadComments = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await fetch(`${api}/api/v2/comments?type=${type}&entityId=${entityId}&page=${pageNum}&limit=10`);
      const data = await response.json();
      
      if (data.ok) {
        if (append) {
          setComments(prev => [...prev, ...data.comments]);
        } else {
          setComments(data.comments);
        }
        setHasMore(data.pagination.page < data.pagination.totalPages);
      } else {
        setError(data.error || 'Failed to load comments');
      }
    } catch (err) {
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [type, entityId]);

  const handleSubmitComment = async (content: string, parentId?: string) => {
    if (!me || !content.trim()) return;

    try {
      const response = await fetch(`${api}/api/v2/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${me.token}`
        },
        body: JSON.stringify({
          type,
          entityId,
          content: content.trim(),
          parentId
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        if (parentId) {
          // Add reply to parent comment
          setComments(prev => prev.map(comment => 
            comment.id === parentId 
              ? { ...comment, replies: [...comment.replies, data.comment] }
              : comment
          ));
          setReplyContent('');
          setReplyingTo(null);
        } else {
          // Add new top-level comment
          setComments(prev => [data.comment, ...prev]);
          setNewComment('');
        }
      } else {
        setError(data.error || 'Failed to post comment');
      }
    } catch (err) {
      setError('Failed to post comment');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!me) return;

    try {
      const response = await fetch(`${api}/api/v2/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${me.token}`
        }
      });

      const data = await response.json();
      
      if (data.ok) {
        // Update comment likes
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            const isLiked = comment.likes.some(like => like.user.id === me.id);
            return {
              ...comment,
              likes: isLiked 
                ? comment.likes.filter(like => like.user.id !== me.id)
                : [...comment.likes, { id: '', user: { id: me.id, name: me.name, username: me.username } }],
              _count: {
                ...comment._count,
                likes: isLiked ? comment._count.likes - 1 : comment._count.likes + 1
              }
            };
          }
          return comment;
        }));
      }
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isLiked = me && comment.likes.some(like => like.user.id === me.id);
    const canReply = me && !isReply;

    return (
      <div key={comment.id} style={{ 
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: isReply ? '#f8f9fa' : '#ffffff',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        marginLeft: isReply ? '24px' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#6c757d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            marginRight: '8px'
          }}>
            {comment.author.name?.[0] || comment.author.username?.[0] || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {comment.author.name || comment.author.username || 'Anonymous'}
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>
              {formatDate(comment.createdAt)}
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '8px', lineHeight: '1.5' }}>
          {comment.content}
        </div>
        
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
          <button
            onClick={() => handleLikeComment(comment.id)}
            style={{
              background: 'none',
              border: 'none',
              color: isLiked ? '#dc3545' : '#6c757d',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ♥ {comment._count.likes}
          </button>
          
          {canReply && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6c757d',
                cursor: 'pointer'
              }}
            >
              Reply
            </button>
          )}
        </div>

        {/* Reply form */}
        {replyingTo === comment.id && (
          <div style={{ marginTop: '12px' }}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                resize: 'vertical',
                fontSize: '14px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => handleSubmitComment(replyContent, comment.id)}
                disabled={!replyContent.trim()}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: replyContent.trim() ? 'pointer' : 'not-allowed',
                  opacity: replyContent.trim() ? 1 : 0.6
                }}
              >
                Reply
              </button>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Render replies */}
        {comment.replies.map(reply => renderComment(reply, true))}
      </div>
    );
  };

  if (loading && comments.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading comments...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>Comments</h3>
      
      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* New comment form */}
      {me && (
        <div style={{ marginBottom: '24px' }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              border: '1px solid #ced4da',
              borderRadius: '8px',
              resize: 'vertical',
              fontSize: '14px',
              marginBottom: '12px'
            }}
          />
          <button
            onClick={() => handleSubmitComment(newComment)}
            disabled={!newComment.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: newComment.trim() ? 'pointer' : 'not-allowed',
              opacity: newComment.trim() ? 1 : 0.6
            }}
          >
            Post Comment
          </button>
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6c757d', padding: '40px' }}>
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <>
          {comments.map(comment => renderComment(comment))}
          
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  loadComments(nextPage, true);
                }}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
