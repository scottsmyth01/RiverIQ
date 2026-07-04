import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  CircleCheck,
  CloudUpload,
} from 'lucide-react';
import { Link } from 'react-router';
import './AddSessionPage.css';

const howItWorks = [
  {
    icon: CloudUpload,
    title: 'Upload your hand history file',
    text: 'Export your hand history from your poker site and upload the file.',
  },
  {
    icon: ChartNoAxesCombined,
    title: "We'll parse the data",
    text: 'Your session stats will be calculated from the hands in your file.',
  },
  {
    icon: Check,
    title: 'View your results',
    text: 'Your session will be added to your history and included in your analytics.',
  },
];

const supportedSites = [
  { badge: '♠', className: 'pokerstars', name: 'PokerStars' },
  { badge: 'GG', className: 'gg', name: 'GG Poker' },
  { badge: '◆', className: 'party', name: 'PartyPoker' },
  { badge: '888', className: 'eight', name: '888 Poker' },
];

const AddSessionPage = () => {
  return (
    <section className='add-session-page'>
      <div className='add-session-toolbar'>
        <nav className='add-session-breadcrumbs' aria-label='Breadcrumb'>
          <Link to='/dashboard/sessions'>Sessions</Link>
          <ChevronRight aria-hidden='true' />
          <span>Add New Session</span>
        </nav>

        <Link className='add-session-back' to='/dashboard/sessions'>
          <ArrowLeft aria-hidden='true' />
          Back to Sessions
        </Link>
      </div>

      <header className='add-session-heading'>
        <h1>Add New Session</h1>
        <p>Upload your hand history file and add details about your session.</p>
      </header>

      <div className='add-session-layout'>
        <div className='add-session-primary'>
          <section className='add-session-card upload-card'>
            <div className='upload-dropzone'>
              <CloudUpload aria-hidden='true' />
              <h2>Upload Hand History File</h2>
              <p>Drag and drop your file here, or click to browse</p>

              <label className='choose-file-button' htmlFor='hand-history-file'>
                Choose File
              </label>
              <input id='hand-history-file' type='file' accept='.txt,.hhh' />

              <small>
                Supports .txt and .hhh files
                <br />
                Max file size: 50MB
              </small>
            </div>
          </section>

          <section className='add-session-card session-details-card'>
            <h2>Session Details</h2>

            <div className='session-fields'>
              <label>
                <span>Date</span>
                <div className='date-field'>
                  <CalendarDays aria-hidden='true' />
                  <input type='date' />
                </div>
              </label>

              <label>
                <span>Poker Site</span>
                <select defaultValue='PokerStars'>
                  <option>PokerStars</option>
                  <option>GG Poker</option>
                  <option>PartyPoker</option>
                  <option>888 Poker</option>
                </select>
              </label>

              <label>
                <span>Game</span>
                <select defaultValue="NL Hold'em">
                  <option>NL Hold'em</option>
                  <option>PL Omaha</option>
                  <option>Limit Hold'em</option>
                </select>
              </label>

              <label>
                <span>Session Name (Optional)</span>
                <input type='text' placeholder='e.g. Sunday Evening Session' />
              </label>

              <label>
                <span>Stakes</span>
                <select defaultValue='50NL'>
                  <option>2NL</option>
                  <option>5NL</option>
                  <option>10NL</option>
                  <option>25NL</option>
                  <option>50NL</option>
                  <option>100NL</option>
                  <option>200NL</option>
                  <option>400NL</option>
                  <option>500NL</option>
                  <option>800NL</option>
                  <option>1000NL</option>
                </select>
              </label>

              <label>
                <span>Currency</span>
                <select defaultValue='USD'>
                  <option>USD</option>
                  <option>CAD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                </select>
              </label>

              <label>
                <span>Buy-in (Optional)</span>
                <input type='text' placeholder='e.g. $50' />
              </label>

              <label>
                <span>Notes (Optional)</span>
                <textarea rows='4' placeholder='Add any notes about this session...' />
              </label>
            </div>

            <div className='session-form-actions'>
              <Link className='session-cancel-button' to='/dashboard/sessions'>
                Cancel
              </Link>
              <button className='session-save-button' type='button'>
                Save Session
              </button>
            </div>
          </section>
        </div>

        <aside className='add-session-aside'>
          <section className='add-session-card info-card'>
            <h2>How it works</h2>
            <div className='how-it-works-list'>
              {howItWorks.map(({ icon: Icon, title, text }) => (
                <div className='how-it-works-item' key={title}>
                  <span className='info-icon'>
                    <Icon aria-hidden='true' />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className='add-session-card supported-sites-card'>
            <h2>Supported Sites</h2>
            <ul>
              {supportedSites.map((site) => (
                <li key={site.name}>
                  <span className={`site-badge site-badge--${site.className}`}>{site.badge}</span>
                  <span>{site.name}</span>
                  <CircleCheck aria-hidden='true' />
                </li>
              ))}
            </ul>
          </section>

          <section className='add-session-card help-card'>
            <h2>Need help?</h2>
            <p>Make sure your hand history file is exported in text format.</p>
            <a href='#help-guide'>
              View our help guide
              <ArrowRight aria-hidden='true' />
            </a>
          </section>
        </aside>
      </div>
    </section>
  );
};

export default AddSessionPage;
