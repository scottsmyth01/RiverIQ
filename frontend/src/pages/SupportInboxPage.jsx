import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Mail, MessageSquareReply, RefreshCcw, Send, Trash2 } from 'lucide-react';
import { Navigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import {
  useDeleteSupportConversation,
  useSendSupportReply,
  useSupportConversation,
  useSupportConversations,
  useUpdateSupportConversationStatus,
} from '../hooks/useSupport';
import './SupportInboxPage.css';

function formatDate(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function getPreview(conversation) {
  const lastMessage = conversation?.messages?.[conversation.messages.length - 1];
  return lastMessage?.body || 'No messages yet';
}

export default function SupportInboxPage() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState('open');
  const [selectedConversationId, setSelectedConversationId] = useState(searchParams.get('conversation') || '');
  const [reply, setReply] = useState('');
  const canUseInbox = user?.role === 'admin' || user?.role === 'support';
  const { data: conversations = [], isLoading: conversationsLoading } = useSupportConversations(statusFilter);
  const activeConversationId = selectedConversationId || conversations[0]?.id || '';
  const { data: activeConversation } = useSupportConversation(activeConversationId);
  const { mutateAsync: sendReply, isPending: isSendingReply } = useSendSupportReply();
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } = useUpdateSupportConversationStatus();
  const { mutateAsync: deleteConversation, isPending: isDeletingConversation } = useDeleteSupportConversation();

  const activeMessages = useMemo(() => activeConversation?.messages || [], [activeConversation]);

  if (!loading && !canUseInbox) {
    return <Navigate to='/dashboard' replace />;
  }

  async function handleSendReply(event) {
    event.preventDefault();

    const body = reply.trim();

    if (!body || !activeConversationId || isSendingReply) return;

    try {
      await sendReply({ id: activeConversationId, body });
      setReply('');
    } catch (error) {
      toast.error(error.message || 'Could not send reply');
    }
  }

  async function handleStatusChange(status) {
    if (!activeConversationId || isUpdatingStatus) return;

    try {
      await updateStatus({ id: activeConversationId, status });
      setStatusFilter(status === 'resolved' ? 'resolved' : 'open');
    } catch (error) {
      toast.error(error.message || 'Could not update conversation');
    }
  }

  async function handleDeleteConversation() {
    if (!activeConversationId || isDeletingConversation) return;

    const customerName = activeConversation?.user?.username || activeConversation?.user?.email || 'this customer';
    const shouldDelete = window.confirm(
      `Permanently delete the support conversation with ${customerName}? This cannot be undone.`,
    );

    if (!shouldDelete) return;

    try {
      await deleteConversation(activeConversationId);
      setSelectedConversationId('');
      setReply('');
      toast.success('Conversation permanently deleted');
    } catch (error) {
      toast.error(error.message || 'Could not delete conversation');
    }
  }

  return (
    <section className='dashboard-content support-inbox-page'>
      <header className='support-inbox-header'>
        <div>
          <h1>Support Inbox</h1>
          <p>Reply to RiverIQ customer chat messages from one place.</p>
        </div>
        <div className='support-inbox-tabs' role='tablist' aria-label='Support conversation status'>
          <button
            className={statusFilter === 'open' ? 'support-inbox-tab support-inbox-tab--active' : 'support-inbox-tab'}
            type='button'
            onClick={() => {
              setStatusFilter('open');
              setSelectedConversationId('');
            }}
          >
            Open
          </button>
          <button
            className={statusFilter === 'resolved' ? 'support-inbox-tab support-inbox-tab--active' : 'support-inbox-tab'}
            type='button'
            onClick={() => {
              setStatusFilter('resolved');
              setSelectedConversationId('');
            }}
          >
            Resolved
          </button>
        </div>
      </header>

      <div className='support-inbox-layout'>
        <aside className='support-inbox-list' aria-label='Support conversations'>
          {conversationsLoading && <div className='support-inbox-empty'>Loading conversations...</div>}
          {!conversationsLoading && !conversations.length && (
            <div className='support-inbox-empty'>No {statusFilter} conversations.</div>
          )}
          {conversations.map((conversation) => (
            <button
              className={`support-inbox-list-item${activeConversationId === conversation.id ? ' support-inbox-list-item--active' : ''}`}
              type='button'
              key={conversation.id}
              onClick={() => setSelectedConversationId(conversation.id)}
            >
              <span className='support-inbox-list-item__topline'>
                <strong>{conversation.user?.username || conversation.user?.email || 'Customer'}</strong>
                <small>{formatDate(conversation.lastMessageAt)}</small>
              </span>
              <span>{getPreview(conversation)}</span>
            </button>
          ))}
        </aside>

        <section
          className={`support-inbox-thread${activeConversation ? '' : ' support-inbox-thread--empty'}`}
          aria-label='Selected support conversation'
        >
          {activeConversation ? (
            <>
              <header className='support-inbox-thread-header'>
                <div>
                  <h2>{activeConversation.user?.username || 'Customer'}</h2>
                  <a href={`mailto:${activeConversation.user?.email || ''}`}>
                    <Mail aria-hidden='true' />
                    {activeConversation.user?.email || 'No email'}
                  </a>
                </div>
                <div className='support-inbox-thread-actions'>
                  <span className={`support-inbox-status support-inbox-status--${activeConversation.status}`}>
                    {activeConversation.status === 'resolved' ? <CheckCircle2 aria-hidden='true' /> : <Circle aria-hidden='true' />}
                    {activeConversation.status}
                  </span>
                  <button
                    type='button'
                    disabled={isUpdatingStatus || isDeletingConversation}
                    onClick={() =>
                      handleStatusChange(activeConversation.status === 'resolved' ? 'open' : 'resolved')
                    }
                  >
                    <RefreshCcw aria-hidden='true' />
                    {activeConversation.status === 'resolved' ? 'Reopen' : 'Resolve'}
                  </button>
                  <button
                    className='support-inbox-delete-button'
                    type='button'
                    disabled={isDeletingConversation}
                    onClick={handleDeleteConversation}
                  >
                    <Trash2 aria-hidden='true' />
                    Delete
                  </button>
                </div>
              </header>

              <div className='support-inbox-meta'>
                <span>Topic: {activeConversation.topic || 'General'}</span>
                <span>Page: {activeConversation.page || 'Unknown'}</span>
              </div>

              <div className='support-inbox-messages'>
                {activeMessages.map((message) => (
                  <article
                    className={`support-inbox-message support-inbox-message--${message.sender}`}
                    key={message.id || message._id}
                  >
                    <div>{message.body}</div>
                    <time>{formatDate(message.createdAt)}</time>
                  </article>
                ))}
              </div>

              <form className='support-inbox-reply' onSubmit={handleSendReply}>
                <label htmlFor='support-reply'>Reply</label>
                <textarea
                  id='support-reply'
                  value={reply}
                  rows={4}
                  placeholder='Write a reply...'
                  disabled={isSendingReply}
                  onChange={(event) => setReply(event.target.value)}
                />
                <button type='submit' disabled={!reply.trim() || isSendingReply}>
                  <Send aria-hidden='true' />
                  Send Reply
                </button>
              </form>
            </>
          ) : (
            <div className='support-inbox-thread-empty'>
              <MessageSquareReply aria-hidden='true' />
              <strong>Select a conversation</strong>
              <p>New customer messages will appear here automatically.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
