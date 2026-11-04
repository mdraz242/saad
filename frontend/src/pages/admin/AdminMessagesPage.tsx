import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Filter,
  Send,
  CheckCheck,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  User,
} from 'lucide-react';
import { api } from '../../services/api';
import { CaseMessage } from '../../types';

export const AdminMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Quick reply modal / drawer
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedCaseNum, setSelectedCaseNum] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchInbox();
  }, [unreadOnly]);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (unreadOnly) params.unreadOnly = 'true';
      if (search) params.search = search;
      const res = await api.getMessagesInbox(params);
      if (res.messages) setMessages(res.messages);
      if (typeof res.unreadCount === 'number') setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error('Failed to fetch messages inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInbox();
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await api.markMessageRead(messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !replyText.trim()) return;
    setSending(true);
    try {
      await api.sendStaffMessage(selectedCaseId, replyText);
      setReplyText('');
      setSelectedCaseId(null);
      fetchInbox();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Messages Inbox</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Unified customer communication stream across all active inquiries and orders.
          </p>
        </div>
      </div>

      {/* Search & Unread Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search messages by case number, customer, or message content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Unread Only</span>
          </label>
        </div>
      </div>

      {/* Messages Feed / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No messages match filter</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {messages.map((m) => {
              const isInbound = m.senderType === 'CUSTOMER';
              return (
                <div
                  key={m.id}
                  className={`p-4 transition flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                    !m.isRead && isInbound ? 'bg-emerald-50/40 font-medium' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        isInbound
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isInbound ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>

                    <div className="min-w-0 flex-1 text-xs">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">{m.senderName}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            isInbound
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isInbound ? 'Customer Inbound' : 'Staff Outbound'}
                        </span>
                        {m.case && (
                          <Link
                            to={`/admin/cases/${m.case.id}`}
                            className="font-mono text-xs font-semibold text-emerald-700 hover:underline"
                          >
                            {m.case.caseNumber}
                          </Link>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {new Date(m.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{m.message}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:self-center flex-shrink-0">
                    {!m.isRead && isInbound && (
                      <button
                        onClick={() => handleMarkAsRead(m.id)}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                      >
                        Mark Read
                      </button>
                    )}
                    {m.case && (
                      <button
                        onClick={() => {
                          setSelectedCaseId(m.caseId);
                          setSelectedCaseNum(m.case?.caseNumber || null);
                        }}
                        className="px-3 py-1 rounded text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition flex items-center gap-1"
                      >
                        <Send className="h-3 w-3" />
                        <span>Reply</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Reply Modal */}
      {selectedCaseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Direct Reply • Case {selectedCaseNum}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Your response will be delivered instantly to the customer's secure case room and dispatched via email notification.
            </p>
            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                rows={4}
                required
                placeholder="Write your response to the customer..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCaseId(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 text-xs bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-800 transition disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessagesPage;

