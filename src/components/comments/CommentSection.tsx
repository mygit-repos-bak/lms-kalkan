import React, { useState, useEffect } from 'react';
import { Send, AtSign, Paperclip, MessageSquare } from 'lucide-react';
import { db } from '../../lib/database';
import { toast } from 'react-hot-toast';
import { Comment, User } from '../../types/database';
import { useAuth } from '../../hooks/useAuth';

interface CommentSectionProps {
  parentType: 'item' | 'task';
  parentId: string;
}

export function CommentSection({ parentType, parentId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
    fetchUsers();
  }, [parentType, parentId]);

  const fetchComments = async () => {
    try {
      const comments = await db.getComments(parentType, parentId);
      setComments(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const users = await db.getUsers();
      setUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);

    try {
      // Extract mentions
      const mentionRegex = /@(\w+)/g;
      const mentions: string[] = [];
      let match;
      
      while ((match = mentionRegex.exec(newComment)) !== null) {
        const mentionName = match[1].toLowerCase();
        const mentionedUser = users.find(u => 
          u.name.toLowerCase().includes(mentionName) || 
          u.email.toLowerCase().includes(mentionName)
        );
        
        if (mentionedUser) {
          mentions.push(mentionedUser.id);
        }
      }

      await db.createComment({
        parent_type: parentType,
        parent_id: parentId,
        body: newComment.trim(),
        mentions
      });

      setNewComment('');
      fetchComments();
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMention = (userName: string) => {
    setNewComment(prev => prev + `@${userName} `);
    setShowMentions(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Comments</h2>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === '@') {
                setShowMentions(true);
              }
            }}
            placeholder="Add a comment... Use @username to mention someone"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
          />
          
          {showMentions && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 shadow-lg z-10 max-h-40 overflow-y-auto">
              {users
                .filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                .map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleMention(u.name)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <AtSign className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map(comment => (
          <div key={comment.id} className="flex space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {comment.author?.name.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{comment.author?.name || 'Anonymous'}</span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</div>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}