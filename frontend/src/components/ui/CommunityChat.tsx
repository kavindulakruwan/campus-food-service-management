import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import useAuth from '../../hooks/useAuth';
import {
  deleteMessage,
  getMessages,
  postMessage,
  updateMessage,
  type ChatMessage,
} from '../../api/chat.api';

const EDIT_WINDOW_MS = 30 * 1000;

type ScrollMode = 'preserve' | 'bottom';

const BLOCKED_PATTERNS = [
  // -------------------
  // ENGLISH (STRONG)
  // -------------------
  /\bf+u+c+k+\b/i,
  /\bs+h+i+t+\b/i,
  /\bb+i+t+c+h+\b/i,
  /\bb+a+s+t+a+r+d+\b/i,
  /\ba+s+s+h+o+l+e+\b/i,
  /\bm+o+t+h+e+r+f+u+c+k+e+r+\b/i,
  /\bd+i+c+k+\b/i,
  /\bp+u+s+s+y+\b/i,
  /\bc+u+n+t+\b/i,
  /\bs+l+u+t+\b/i,
  /\bw+h+o+r+e+\b/i,
  /\bd+a+m+n+\b/i,
  /\bf+u+c+k+e+r+\b/i,
  /\bn+i+g+g+a+\b/i,
  /\bn+i+g+g+e+r+\b/i,
  /\br+e+t+a+r+d+\b/i,

  // Obfuscated English (f*ck, sh!t, etc.)
  /f[\W_]*u[\W_]*c[\W_]*k/i,
  /s[\W_]*h[\W_]*i[\W_]*t/i,
  /b[\W_]*i[\W_]*t[\W_]*c[\W_]*h/i,

  // -------------------
  // SINHALA (UNICODE)
  // -------------------
  /හුත්ති/i,
  /හුකා/i,
  /පකයා/i,
  /වේසාව/i,
  /ගෑණු හුත්ති/i,
  /මෝඩයා/i,
  /පට්ට හුක/i,

  // -------------------
  // SINGLISH
  // -------------------
  /huththi/i,
  /hukanna/i,
  /huka/i,
  /pakaya/i,
  /wesawa/i,
  /modaya/i,
  /ponnaya/i,
  /balla/i,

  // Mixed Sinhala + English abusive patterns
  /huthth[iy]a/i,
  /huk[a@]nna/i,
];

const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\sአ-ፚ]/gi, '');
};

const hasBlockedWord = (text: string) => {
  const normalized = normalizeText(text);
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(normalized));
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
};

const CommunityChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clockTick, setClockTick] = useState(Date.now());

  const listRef = useRef<HTMLDivElement>(null);
  const scrollStateRef = useRef({ top: 0, height: 0, mode: 'bottom' as ScrollMode });

  const currentUserId = (user as { id?: string; _id?: string } | null)?.id
    ?? (user as { id?: string; _id?: string } | null)?._id;

  const participantsCount = useMemo(() => new Set(messages.map((msg) => msg.user._id)).size, [messages]);

  const latestMessageTime = useMemo(() => {
    if (messages.length === 0) return 'No messages yet';
    return new Date(messages[messages.length - 1].createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [messages]);

  const primeScrollState = (forceBottom = false) => {
    const list = listRef.current;
    if (!list) return;

    const distanceFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
    const isNearBottom = distanceFromBottom < 80;

    scrollStateRef.current = {
      top: list.scrollTop,
      height: list.scrollHeight,
      mode: forceBottom || isNearBottom ? 'bottom' : 'preserve',
    };
  };

  const isWithinEditWindow = (createdAt: string) => {
    return Date.now() - new Date(createdAt).getTime() <= EDIT_WINDOW_MS;
  };

  const getRemainingSeconds = (createdAt: string) => {
    const remaining = EDIT_WINDOW_MS - (clockTick - new Date(createdAt).getTime());
    return Math.max(0, Math.ceil(remaining / 1000));
  };

  const fetchMessages = async (forceBottom = false) => {
    primeScrollState(forceBottom);
    try {
      const data = await getMessages();
      setMessages(data);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setErrorMessage(getErrorMessage(error, 'Failed to refresh messages.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMessages(true);

    const fetchInterval = setInterval(() => {
      void fetchMessages(false);
    }, 5000);

    const tickInterval = setInterval(() => {
      setClockTick(Date.now());
    }, 1000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(tickInterval);
    };
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    if (scrollStateRef.current.mode === 'bottom') {
      list.scrollTop = list.scrollHeight;
      return;
    }

    const delta = list.scrollHeight - scrollStateRef.current.height;
    list.scrollTop = scrollStateRef.current.top + Math.max(0, delta);
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedText = newMessage.trim();
    if (!cleanedText || isSending) return;

    if (hasBlockedWord(cleanedText)) {
      setErrorMessage('Message contains restricted language. Please rewrite your message.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    try {
      const savedMessage = await postMessage(cleanedText);
      scrollStateRef.current.mode = 'bottom';
      setMessages((prev) => [...prev, savedMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      setErrorMessage(getErrorMessage(error, 'Failed to send message.'));
    } finally {
      setIsSending(false);
    }
  };

  const startEditing = (message: ChatMessage) => {
    setEditingMessageId(message._id);
    setEditText(message.text);
    setErrorMessage(null);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const submitEdit = async (messageId: string) => {
    const cleaned = editText.trim();
    if (!cleaned) {
      setErrorMessage('Message text is required.');
      return;
    }

    if (hasBlockedWord(cleaned)) {
      setErrorMessage('Message contains restricted language. Please rewrite your message.');
      return;
    }

    setIsUpdating(true);
    setErrorMessage(null);
    try {
      const updated = await updateMessage(messageId, cleaned);
      primeScrollState(false);
      setMessages((prev) => prev.map((msg) => (msg._id === messageId ? updated : msg)));
      cancelEditing();
    } catch (error) {
      console.error('Failed to update message:', error);
      setErrorMessage(getErrorMessage(error, 'Failed to update message.'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    setIsDeletingId(messageId);
    setErrorMessage(null);
    try {
      await deleteMessage(messageId);
      primeScrollState(false);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      if (editingMessageId === messageId) cancelEditing();
    } catch (error) {
      console.error('Failed to delete message:', error);
      setErrorMessage(getErrorMessage(error, 'Failed to delete message.'));
    } finally {
      setIsDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[600px] flex-col rounded-3xl border border-slate-200 bg-white/50 p-6 shadow-sm animate-pulse">
        <div className="h-6 w-48 rounded-md bg-slate-200" />
        <div className="mt-4 h-4 w-64 rounded-md bg-slate-100" />
        <div className="mt-10 space-y-6">
          <div className="flex gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
            <div className="h-16 flex-1 rounded-2xl rounded-tl-sm bg-slate-100" />
          </div>
          <div className="flex flex-row-reverse gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
            <div className="h-16 w-3/4 rounded-2xl rounded-tr-sm bg-indigo-100/50" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[650px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 p-5 backdrop-blur-md">
        <div className="flex flex-col">
          <h3 className="text-xl font-bold tracking-tight text-slate-800">Community Chat</h3>
          <p className="text-sm font-medium text-slate-500">
            {participantsCount} participants • Last active {latestMessageTime}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchMessages(false)}
          className="rounded-full bg-slate-100 p-2.5 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          title="Refresh Messages"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-600 border-b border-rose-100">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {errorMessage}
        </div>
      )}

      {/* Message List */}
      <div
        ref={listRef}
        className="flex-1 space-y-6 overflow-y-auto p-5 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3 text-center opacity-70">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
              <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-base font-medium text-slate-600">No messages yet</p>
            <p className="text-sm text-slate-500">Be the first to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.user._id === currentUserId;
            const isEditableNow = isMe && isWithinEditWindow(msg.createdAt);
            const isEditing = editingMessageId === msg._id;
            const secondsLeft = getRemainingSeconds(msg.createdAt);
            
            // Check if previous message is from same user to group them
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isConsecutive = prevMsg?.user._id === msg.user._id;

            return (
              <div key={msg._id} className={`flex w-full gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isConsecutive ? '-mt-4' : ''}`}>
                {/* Avatar */}
                {!isMe && (
                  <div className={`mt-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 ring-2 ring-white ${isConsecutive ? 'invisible' : ''}`}>
                    {getInitials(msg.user.name)}
                  </div>
                )}

                {/* Message Content */}
                <div className={`flex max-w-[75%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isConsecutive && (
                    <div className={`mb-1.5 flex items-baseline gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-xs font-semibold text-slate-700">{msg.user.name}</span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {isEditing ? (
                    <div className="w-full min-w-[300px] rounded-3xl rounded-tr-sm border border-slate-200 bg-white p-4 shadow-sm">
                      <textarea
                        value={editText}
                        maxLength={280}
                        onChange={(event) => setEditText(event.target.value)}
                        className="min-h-[80px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">{editText.length}/280</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="rounded-full px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => void submitEdit(msg._id)}
                            disabled={isUpdating}
                            className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {isUpdating ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative">
                      <div
                        className={`relative px-5 py-3 text-[15px] leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-3xl rounded-tr-sm'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-3xl rounded-tl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* Edit/Delete Actions overlay for user's own messages */}
                      {isMe && isEditableNow && (
                        <div className="absolute -top-3 -right-2 hidden group-hover:flex items-center gap-1 rounded-full bg-white px-2 py-1 shadow-md border border-slate-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => startEditing(msg)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            title={`Edit (${secondsLeft}s left)`}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(msg._id)}
                            disabled={isDeletingId === msg._id}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Edited indicator */}
                  {msg.editedAt && !isEditing && (
                    <span className={`mt-1 text-[10px] font-medium text-slate-400 ${isMe ? 'mr-1' : 'ml-1'}`}>
                      (edited)
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 border-t border-slate-200 bg-white/90 p-4 backdrop-blur-xl">
        <form onSubmit={handleSendMessage} className="relative flex items-end gap-3 max-w-5xl mx-auto">
          <div className="relative flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message Community..."
              maxLength={280}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3.5 pl-5 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {newMessage.length > 0 && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                {280 - newMessage.length}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="group flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-all hover:bg-indigo-700 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            <svg 
              className={`h-5 w-5 -ml-0.5 ${isSending ? 'animate-pulse' : 'transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommunityChat;
