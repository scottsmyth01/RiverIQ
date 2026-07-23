import './SessionDetailPage.css';

import { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, FileText } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { useSessions, useUpdateSession } from '../hooks/useSessions';
import ggPokerLogo from '../assets/gg-poker-logo.svg';
import pokerStarsLogo from '../assets/pokerstars-logo.svg';

const pokerSiteDetails = {
  ggpoker: {
    label: 'GGPoker',
    logo: ggPokerLogo,
  },
  pokerstars: {
    label: 'PokerStars',
    logo: pokerStarsLogo,
  },
};

function formatDate(date) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Unknown date';
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(duration) {
  const minutesTotal = Number(duration);

  if (!Number.isFinite(minutesTotal)) {
    return 'N/A';
  }

  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;

  return `${hours}h ${minutes}m`;
}

function getSessionTags(tags) {
  if (Array.isArray(tags)) {
    return tags.filter(Boolean);
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function getPokerSiteDetail(session) {
  const siteKey = String(session.pokerSite || session.game || '').toLowerCase();

  if (siteKey.includes('pokerstars')) {
    return pokerSiteDetails.pokerstars;
  }

  if (siteKey.includes('ggpoker') || siteKey.includes('gg poker')) {
    return pokerSiteDetails.ggpoker;
  }

  return {
    label: session.pokerSite || session.game || 'Unknown site',
    logo: null,
  };
}

const SessionDetailPage = () => {
  const { id } = useParams();
  const { data: sessions = [], isLoading, error } = useSessions();
  const { mutateAsync: updateSession, isPending: isUpdatingSession } = useUpdateSession();
  const [sessionTitle, setSessionTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const session = sessions.find((item) => item._id === id || item.id === id);

  useEffect(() => {
    if (!session) {
      return;
    }

    setSessionTitle(session.sessionName || '');
    setNotes(session.notes || '');
    setTagsInput(getSessionTags(session.tags).join(', '));
  }, [session]);

  if (isLoading) {
    return (
      <main className='session-detail-page'>
        <div className='session-detail-empty'>Loading session...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className='session-detail-page'>
        <div className='session-detail-empty'>{error.message}</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className='session-detail-page'>
        <div className='session-detail-empty'>
          <h1>Session not found</h1>
          <Link to='/dashboard/sessions'>Back to Sessions</Link>
        </div>
      </main>
    );
  }

  const profit = Number(session.profit) || 0;
  const winRate = Number(session.bb100 ?? session.winRate ?? 0);
  const hands = Number(session.hands) || 0;
  const profitIsPositive = profit >= 0;
  const winRateIsPositive = winRate >= 0;
  const pokerSite = getPokerSiteDetail(session);
  const metadata = [
    { label: 'Date', value: formatDate(session.date) },
    { label: 'Profit', value: `${profitIsPositive ? '+' : '-'}$${Math.abs(profit).toFixed(2)}`, tone: profitIsPositive ? 'positive' : 'negative' },
    { label: 'Hands', value: hands.toLocaleString() },
    { label: 'Win Rate', value: `${winRate.toFixed(2)} BB/100`, tone: winRateIsPositive ? 'positive' : 'negative' },
    { label: 'Duration', value: formatDuration(session.duration) },
    { label: 'Game', value: session.gameType || session.game || 'Unknown' },
    { label: 'Stakes', value: session.stakes || 'N/A' },
    { label: 'Table Size', value: session.tableSize ? `${session.tableSize} max` : 'N/A' },
  ];

  async function handleSaveSession(event) {
    event.preventDefault();
    const fallbackTitle = session.sessionName || session.handHistory?.originalFileName || 'Poker Session';
    const nextSessionTitle = sessionTitle.trim() || fallbackTitle;

    try {
      await updateSession({
        id,
        sessionData: {
          sessionName: nextSessionTitle,
          notes,
          tags: tagsInput,
        },
      });
      setSessionTitle(nextSessionTitle);
      toast.success('Session updated');
    } catch (updateError) {
      toast.error(updateError.message || 'Could not update session');
    }
  }

  return (
    <main className='session-detail-page'>
      <nav className='session-detail-toolbar' aria-label='Session navigation'>
        <Link to='/dashboard/sessions'>
          <ArrowLeft aria-hidden='true' />
          Back to Sessions
        </Link>
      </nav>

      <header className='session-detail-header'>
        <div>
          <h1>{session.sessionName || 'Poker Session'}</h1>
          <p>{session.pokerSite || session.game || 'Session'} session notes, tags, and metadata.</p>
        </div>
        <Link to={`/dashboard/sessions/${id}/stats`}>
          <BarChart3 aria-hidden='true' />
          Stats
        </Link>
      </header>

      <section className='session-detail-layout'>
        <form className='session-detail-form' onSubmit={handleSaveSession}>
          <section className='session-site-card' aria-label='Poker site'>
            <div className='session-site-card__logo'>
              {pokerSite.logo ? <img src={pokerSite.logo} alt='' /> : <FileText aria-hidden='true' />}
            </div>
            <div>
              <span>Poker Site</span>
              <strong>{pokerSite.label}</strong>
            </div>
          </section>

          <label className='session-detail-field'>
            <span>Session Title</span>
            <input
              value={sessionTitle}
              type='text'
              placeholder='Session title'
              onChange={(event) => setSessionTitle(event.target.value)}
            />
          </label>

          <label className='session-detail-field'>
            <span>Notes</span>
            <textarea
              value={notes}
              rows='10'
              placeholder='Add notes about this session...'
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          <label className='session-detail-field'>
            <span>Tags</span>
            <input
              value={tagsInput}
              type='text'
              placeholder='evening, 50NL, review'
              onChange={(event) => setTagsInput(event.target.value)}
            />
          </label>

          <div className='session-detail-actions'>
            <button type='submit' disabled={isUpdatingSession}>
              {isUpdatingSession ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <aside className='session-detail-meta' aria-label='Session metadata'>
          <h2>Session Metadata</h2>
          <dl>
            {metadata.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd className={item.tone || ''}>{item.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>
    </main>
  );
};

export default SessionDetailPage;
