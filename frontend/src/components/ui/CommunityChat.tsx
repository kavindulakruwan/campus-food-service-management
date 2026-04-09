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
      <div className="h-155 rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm animate-pulse">
        <div className="h-5 w-40 rounded bg-emerald-100" />
        <div className="mt-3 h-3 w-64 rounded bg-slate-100" />
        <div className="mt-8 space-y-3">
          <div className="h-14 rounded-2xl bg-slate-100" />
          <div className="h-14 rounded-2xl bg-slate-100" />
          <div className="h-14 rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-155 flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-[0_20px_55px_-30px_rgba(3,105,96,0.55)]">
      <div className="border-b border-emerald-100 bg-linear-to-r from-emerald-50 via-cyan-50 to-lime-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Community Chat</h3>
            <p className="text-sm text-slate-600">Share meal ideas, ask questions, and help each other.</p>
          </div>
          <button
            type="button"
            onClick={() => void fetchMessages(false)}
            className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 transition hover:bg-emerald-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Messages</p>
            <p className="text-base font-bold text-slate-800">{messages.length}</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Participants</p>
            <p className="text-base font-bold text-slate-800">{participantsCount}</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Last Activity</p>
            <p className="text-base font-bold text-slate-800">{latestMessageTime}</p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="border-b border-rose-100 bg-rose-50 px-5 py-2 text-xs font-semibold text-rose-700">
          {errorMessage}
        </div>
      )}

      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_100%)] p-5"
      >
        {messages.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm font-medium text-slate-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user._id === currentUserId;
            const isEditableNow = isMe && isWithinEditWindow(msg.createdAt);
            const isEditing = editingMessageId === msg._id;
            const secondsLeft = getRemainingSeconds(msg.createdAt);

            return (
              <div key={msg._id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                    {getInitials(msg.user.name)}
                  </div>
                )}

                <div className={`max-w-[82%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">{msg.user.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {msg.user.role}
                    </span>
                    {msg.editedAt ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">edited</span>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <div className="w-full rounded-2xl border border-emerald-200 bg-white p-3 shadow-sm">
                      <textarea
                        value={editText}
                        maxLength={280}
                        onChange={(event) => setEditText(event.target.value)}
                        className="min-h-20 w-full rounded-xl border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <p>{editText.length}/280</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => void submitEdit(msg._id)}
                            disabled={isUpdating}
                            className="rounded-full bg-emerald-600 px-3 py-1 font-semibold text-white disabled:opacity-60"
                          >
                            {isUpdating ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                        isMe
                          ? 'rounded-tr-md bg-emerald-600 text-white'
                          : 'rounded-tl-md border border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}

                  {isMe && !isEditing && (
                    <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold">
                      {isEditableNow ? (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditing(msg)}
                            className="text-emerald-700 hover:text-emerald-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(msg._id)}
                            disabled={isDeletingId === msg._id}
                            className="text-rose-600 hover:text-rose-700 disabled:opacity-60"
                          >
                            {isDeletingId === msg._id ? 'Deleting...' : 'Delete'}
                          </button>
                          <span className="text-slate-400">{secondsLeft}s left</span>
                        </>
                      ) : (
                        <span className="text-slate-400">Edit window expired</span>
                      )}
                    </div>
                  )}
                </div>

                {isMe && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                    {getInitials(msg.user.name)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-emerald-100 bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Share your meal tip, question, or recipe idea..."
            maxLength={280}
            className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
        <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-slate-500">
          <p>English bad words are restricted. Keep messages respectful.</p>
          <p>{newMessage.length}/280</p>
        </div>
      </div>
    </div>
  );
};

export default CommunityChat;
