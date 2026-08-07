import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Mail, Send, X } from 'lucide-react';
import { useLocation } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useMySupportConversation, useSendSupportMessage } from '../../hooks/useSupport';
import logo from '../Navbar_dashboard/logo.png';
import './SupportChat.css';

const quickPrompts = [
  { label: 'Upload help', text: 'I need help uploading a hand history file.' },
  { label: 'Parser error', text: 'A hand history file failed to parse.' },
  { label: 'Billing', text: 'I need help with billing or my subscription.' },
  { label: 'Stats', text: 'I have a question about stats, reports, or analytics.' },
];

function getInitialMessages(user) {
  const name = user?.username || user?.name;

  return [
    {
      id: 'welcome',
      from: 'bot',
      text: `Hey${name ? ` ${name}` : ''}, I am RiverIQ support. Ask me about uploads, parser errors, stats, billing, or account settings.`,
    },
  ];
}

export default function SupportChat() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState(() => getInitialMessages(user));
  const { data: conversation } = useMySupportConversation({
    enabled: Boolean(user),
    refetchInterval: isOpen ? 3000 : false,
  });
  const { mutateAsync: sendSavedMessage, isPending: isSending } = useSendSupportMessage();

  const mailHref = useMemo(() => {
    const subject = encodeURIComponent('RiverIQ support request');
    const body = encodeURIComponent(
      [`Account email: ${user?.email || ''}`, `Page: ${location.pathname}`, '', 'What happened:'].join('\n'),
    );

    return `mailto:support@riveriq.com?subject=${subject}&body=${body}`;
  }, [location.pathname, user?.email]);

  useEffect(() => {
    setMessages((currentMessages) => {
      if (conversation?.messages?.length) return currentMessages;
      if (currentMessages.length > 1) return currentMessages;
      return getInitialMessages(user);
    });
  }, [conversation?.messages?.length, user]);

  useEffect(() => {
    if (!conversation?.messages?.length) return;
    setMessages(
      conversation.messages.map((message) => ({
        id: message.id || message._id,
        from: message.sender === 'support' ? 'support' : 'user',
        text: message.body,
      })),
    );
  }, [conversation]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isOpen, messages]);

  useEffect(() => {
    if (isOpen) {
      setIsPanelVisible(true);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsPanelVisible(false);
    }, 240);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    function handleOpen(event) {
      const detail = event.detail || {};
      const prompt = detail.message || detail.topic;
      setIsOpen(true);

      if (prompt && detail.sendOnOpen) {
        sendMessage(prompt, detail);
      } else if (prompt) {
        setDraft((currentDraft) => currentDraft || prompt);
      }
    }

    window.addEventListener('riveriq:support-chat:open', handleOpen);

    return () => window.removeEventListener('riveriq:support-chat:open', handleOpen);
  }, [conversation?.id, location.pathname, sendSavedMessage]);

  async function sendMessage(text = draft, context = {}) {
    const trimmed = text.trim();

    if (!trimmed || !user || isSending) return;

    const optimisticMessage = {
      id: `pending-${Date.now()}`,
      from: 'user',
      text: trimmed,
    };

    setMessages((currentMessages) => [...currentMessages, optimisticMessage]);
    setDraft('');

    try {
      await sendSavedMessage({
        conversationId: conversation?.id,
        body: trimmed,
        topic: context.topic || '',
        page: location.pathname,
        metadata: context.metadata || {},
      });
    } catch (error) {
      setMessages((currentMessages) => currentMessages.filter((message) => message.id !== optimisticMessage.id));
      toast.error(error.message || 'Could not send support message');
    }
  }

  function closeChat() {
    setIsOpen(false);
  }

  function toggleChat() {
    setIsOpen((open) => !open);
  }

  return (
    <div className={`support-chat${isOpen ? ' support-chat--open' : ''}`}>
      {isPanelVisible && (
        <section className='support-chat-panel' aria-label='RiverIQ support chat'>
          <header className='support-chat-header'>
            <div className='support-chat-title'>
              <span className='support-chat-mark'>
                <img src={logo} alt='' />
              </span>
              <div>
                <strong>RiverIQ Support</strong>
                <small>{conversation?.status === 'resolved' ? 'Resolved conversation' : 'Live inbox beta'}</small>
              </div>
            </div>
            <button className='support-chat-icon-button' type='button' aria-label='Close support chat' onClick={closeChat}>
              <X aria-hidden='true' />
            </button>
          </header>

          <div className='support-chat-messages'>
            {messages.map((message) => (
              <div className={`support-chat-message support-chat-message--${message.from}`} key={message.id}>
                {message.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className='support-chat-prompts' aria-label='Suggested support questions'>
            {quickPrompts.map((prompt) => (
              <button type='button' key={prompt.label} onClick={() => sendMessage(prompt.text)}>
                {prompt.label}
              </button>
            ))}
          </div>

          <form
            className='support-chat-compose'
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              type='text'
              value={draft}
              placeholder={user ? 'Message RiverIQ support...' : 'Log in to message support'}
              aria-label='Ask RiverIQ support'
              disabled={!user || isSending}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type='submit' aria-label='Send message' disabled={!user || isSending}>
              <Send aria-hidden='true' />
            </button>
          </form>

          <a className='support-chat-email' href={mailHref}>
            <Mail aria-hidden='true' />
            Email support
          </a>
        </section>
      )}

      {!loading && user && (
        <button
          className='support-chat-launcher'
          type='button'
          aria-label={isOpen ? 'Collapse RiverIQ support chat' : 'Open RiverIQ support chat'}
          onClick={toggleChat}
        >
          {isOpen ? <ChevronDown aria-hidden='true' /> : <img src={logo} alt='' />}
        </button>
      )}
    </div>
  );
}
