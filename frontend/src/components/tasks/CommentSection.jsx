import React, { useState, useEffect } from 'react';
import { commentApi } from '../../services/commentApi';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function CommentSection({ taskId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const res = await commentApi.getTaskComments(taskId);
      setComments(res.data?.comments || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!newContent.trim() || submitting) return;

    try {
      setSubmitting(true);
      const res = await commentApi.addComment(taskId, newContent.trim());
      if (res.data?.comment) {
        setComments((prev) => [...prev, res.data.comment]);
      }
      setNewContent('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="comment-section">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <MessageSquare size={16} color="var(--primary-500)" />
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Activity & Comments ({comments.length})
        </h4>
      </div>

      {/* Comments List */}
      <div className="comment-list">
        {comments.map((comment) => {
          const isAuthor = user && comment.author && user._id === comment.author._id;
          return (
            <div key={comment._id} className="comment-bubble">
              <div className="comment-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--primary-600)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(comment.author?.name)}
                  </div>
                  <div>
                    <span className="comment-author">{comment.author?.name || 'User'}</span>
                    {comment.author?.jobTitle && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                        • {comment.author.jobTitle}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="comment-time">
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isAuthor && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => handleDelete(comment._id)}
                      style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                      title="Delete comment"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="comment-body">{comment.content}</div>
            </div>
          );
        })}

        {comments.length === 0 && !loading && (
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
            No comments yet. Start the conversation!
          </div>
        )}
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <textarea
          className="input-control"
          rows={2}
          placeholder="Add a comment... (Ctrl+Enter to post)"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ resize: 'vertical' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!newContent.trim() || submitting}
            style={{ padding: '0.4rem 0.875rem', fontSize: '0.8125rem' }}
          >
            <Send size={13} />
            <span>{submitting ? 'Posting...' : 'Comment'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
