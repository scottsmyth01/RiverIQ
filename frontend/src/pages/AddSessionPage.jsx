import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ChevronRight, CircleHelp, CloudUpload, FileText, X } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAddSession, useSessions } from '../hooks/useSessions';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from '../components/LoadingScreen/LoadingScreen';
import './AddSessionPage.css';

const FREE_SESSION_LIMIT = 20;
const HAND_HISTORY_FILE_EXTENSION = '.txt';
const PARSE_SAFETY_ERROR_PATTERN = /could not safely parse/i;
const UPLOAD_LOADING_DURATION_MS = 6000;
const uploadLoadingSteps = ['Uploading file', 'Analyzing/parsing data', 'Deriving statistics', 'Posting session'];

const pokerSites = [
  { label: 'PokerStars', value: 'pokerstars' },
  { label: 'GGPoker', value: 'ggpoker' },
  { label: 'CoinPoker', value: 'coinpoker' },
  { label: 'FanDuel', value: 'fanduel' },
  { label: '888poker', value: '888poker' },
  { label: 'partypoker', value: 'partypoker' },
];

function showUploadErrorToast(error) {
  const message = error?.message || 'Could not upload session';

  if (error?.code === 'HAND_HISTORY_PARSE_FAILED' || PARSE_SAFETY_ERROR_PATTERN.test(message)) {
    const details = Array.isArray(error?.details) ? error.details.filter(Boolean).slice(0, 3) : [];

    toast.error('Hand history could not be parsed', {
      description: details.length ? details.join(' ') : message,
      duration: 9000,
    });
    return;
  }

  toast.error(message);
}

function isParseError(error) {
  const message = error?.message || '';

  return error?.code === 'HAND_HISTORY_PARSE_FAILED' || PARSE_SAFETY_ERROR_PATTERN.test(message);
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function UploadLoadingScreen({ visible }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      return undefined;
    }

    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setProgress(Math.min(100, Math.round((elapsed / UPLOAD_LOADING_DURATION_MS) * 100)));
    }, 60);

    return () => window.clearInterval(intervalId);
  }, [visible]);

  const activeStepIndex = Math.min(
    uploadLoadingSteps.length - 1,
    Math.floor((progress / 100) * uploadLoadingSteps.length),
  );

  const loadingScreen = (
    <LoadingScreen visible={visible} label='Uploading hand history'>
      <div className='upload-loading-panel'>
        <div className='upload-loading-steps'>
          {uploadLoadingSteps.map((step, index) => (
            <span
              className={[
                'upload-loading-step',
                index < activeStepIndex ? 'upload-loading-step--complete' : '',
                index === activeStepIndex ? 'upload-loading-step--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={step}
            >
              {step}
            </span>
          ))}
        </div>
        <div className='upload-loading-progress' aria-hidden='true'>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </LoadingScreen>
  );

  if (typeof document === 'undefined') return loadingScreen;

  return createPortal(loadingScreen, document.body);
}

const AddSessionPage = () => {
  const [selectedPokerSite, setSelectedPokerSite] = useState('pokerstars');
  const [sessionDetails, setSessionDetails] = useState({
    sessionName: '',
    notes: '',
    tags: '',
  });
  const [handHistoryFiles, setHandHistoryFiles] = useState([]);
  const [isUploadLoadingVisible, setIsUploadLoadingVisible] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: sessions = [] } = useSessions();
  const { mutateAsync: addSession, isPending } = useAddSession();
  const hasReachedFreeSessionLimit = user?.subscription !== 'pro' && sessions.length >= FREE_SESSION_LIMIT;

  function openUploadSupportEmail(error) {
    const subject = encodeURIComponent('RiverIQ hand history upload support');
    const body = encodeURIComponent(
      [
        `Account email: ${user?.email || ''}`,
        `Poker site: ${selectedPokerSite}`,
        `Selected file count: ${handHistoryFiles.length}`,
        `Selected file types: ${handHistoryFiles.map((file) => file.name.split('.').pop()?.toLowerCase()).join(', ')}`,
        `Error code: ${error?.code || ''}`,
        `Error message: ${error?.message || ''}`,
        '',
        'What happened:',
      ].join('\n'),
    );

    window.location.href = `mailto:support@riveriq.com?subject=${subject}&body=${body}`;
  }

  function handleDetailsChange(event) {
    const { name, value } = event.target;

    setSessionDetails((details) => ({
      ...details,
      [name]: value,
    }));
  }

  function getHandHistoryFiles(files) {
    const selectedFiles = Array.from(files || []);
    const invalidFiles = selectedFiles.filter((file) => !file.name.toLowerCase().endsWith(HAND_HISTORY_FILE_EXTENSION));

    if (invalidFiles.length) {
      toast.error('Please upload a hand history .txt file');
    }

    return selectedFiles.filter((file) => file.name.toLowerCase().endsWith(HAND_HISTORY_FILE_EXTENSION));
  }

  function handleFileChange(event) {
    const validFiles = getHandHistoryFiles(event.target.files);
    setHandHistoryFiles(validFiles);

    if (!validFiles.length && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function clearSelectedFiles() {
    setHandHistoryFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function removeSelectedFile(fileIndex) {
    setHandHistoryFiles((files) => files.filter((_, index) => index !== fileIndex));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleDrop(event) {
    event.preventDefault();

    if (isPending) return;

    const validFiles = getHandHistoryFiles(event.dataTransfer.files);
    setHandHistoryFiles(validFiles);

    if (!validFiles.length && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (hasReachedFreeSessionLimit) {
      navigate('/subscription/payment');
      return;
    }

    if (!handHistoryFiles.length) {
      toast.error('Please choose at least one hand history .txt file');
      return;
    }

    const formData = new FormData();
    formData.set('pokerSite', selectedPokerSite);
    formData.set('sessionName', sessionDetails.sessionName.trim());
    formData.set('notes', sessionDetails.notes.trim());
    formData.set('tags', sessionDetails.tags.trim());
    handHistoryFiles.forEach((file) => {
      formData.append('handHistory', file);
    });

    setIsUploadLoadingVisible(true);
    const uploadStartedAt = Date.now();

    try {
      const result = await addSession(formData);
      const elapsed = Date.now() - uploadStartedAt;

      if (elapsed < UPLOAD_LOADING_DURATION_MS) {
        await wait(UPLOAD_LOADING_DURATION_MS - elapsed);
      }

      const createdSessions = Number(result.createdSessions) || 1;
      toast.success(createdSessions > 1 ? `${createdSessions} sessions uploaded` : 'Session uploaded');
      navigate('/dashboard/sessions');
    } catch (error) {
      const elapsed = Date.now() - uploadStartedAt;

      if (elapsed < UPLOAD_LOADING_DURATION_MS) {
        await wait(UPLOAD_LOADING_DURATION_MS - elapsed);
      }

      showUploadErrorToast(error);

      if (isParseError(error)) {
        toast('Want to send this to support?', {
          description: 'Email RiverIQ support and we will tell you what to include.',
          action: {
            label: 'Report issue',
            onClick: () => openUploadSupportEmail(error),
          },
          duration: 12000,
        });
      }
    } finally {
      setIsUploadLoadingVisible(false);
    }
  }

  if (hasReachedFreeSessionLimit) {
    return <Navigate to='/subscription/payment' replace />;
  }

  return (
    <section className='add-session-page'>
      <UploadLoadingScreen visible={isUploadLoadingVisible} />
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
        <div>
          <h1>Add New Session</h1>
          <p>Upload one or more hand history files. RiverIQ will create each detected session.</p>
        </div>
        <div className='add-session-heading-actions'>
          <Link
            className='add-session-help-link'
            to='/dashboard/help#hand-history-uploads'
          >
            <CircleHelp aria-hidden='true' />
            Need help?
          </Link>
        </div>
      </header>

      <div className='add-session-beta-notice' role='note'>
        RiverIQ Beta: hand-history parsing is actively improving. If a file fails, you can send an anonymized report so
        we can add support.
      </div>

      <div className='add-session-layout'>
        <form className='add-session-primary' onSubmit={handleSubmit}>
          <section className='add-session-card compatible-sites-card' aria-labelledby='compatible-sites-heading'>
            <h2 id='compatible-sites-heading'>Supported Sites</h2>
            <div className='compatible-sites-list' role='radiogroup' aria-labelledby='compatible-sites-heading'>
              {pokerSites.map((site) => (
                <label
                  className={`compatible-site-option${selectedPokerSite === site.value ? ' compatible-site-option--active' : ''}`}
                  key={site.value}
                >
                  <input
                    type='radio'
                    name='pokerSite'
                    value={site.value}
                    checked={selectedPokerSite === site.value}
                    disabled={isPending}
                    onChange={() => setSelectedPokerSite(site.value)}
                  />
                  <span>{site.label}</span>
                </label>
              ))}
            </div>
          </section>
          <section className='add-session-card upload-card'>
            <label
              className='upload-dropzone'
              htmlFor='hand-history-file'
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <CloudUpload aria-hidden='true' />
              <h2>Upload Hand History File</h2>
              <p>Drag and drop your files here, or click to browse</p>

              <span className='choose-file-button'>Choose Files</span>
              <input
                ref={fileInputRef}
                id='hand-history-file'
                name='handHistory'
                type='file'
                accept='.txt'
                multiple
                disabled={isPending}
                onChange={handleFileChange}
              />

              <small>
                Supports .txt files
                <br />
                Max file size: 50MB
              </small>
            </label>

            {handHistoryFiles.length > 0 && (
              <div className='selected-files'>
                <div className='selected-files__header'>
                  <span>
                    {handHistoryFiles.length} file{handHistoryFiles.length === 1 ? '' : 's'} selected
                  </span>
                  <button type='button' disabled={isPending} onClick={clearSelectedFiles}>
                    Clear all
                  </button>
                </div>
                {handHistoryFiles.map((file, index) => (
                  <div className='selected-file' key={`${file.name}-${file.lastModified}-${index}`}>
                    <FileText aria-hidden='true' />
                    <span>{file.name}</span>
                    <button
                      type='button'
                      aria-label={`Remove ${file.name}`}
                      disabled={isPending}
                      onClick={() => removeSelectedFile(index)}
                    >
                      <X aria-hidden='true' />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className='add-session-card session-details-card'>
            <h2>Session Details</h2>

            <div className='session-fields'>
              <label>
                <span>Session Title</span>
                <input
                  name='sessionName'
                  type='text'
                  placeholder='e.g. Friday night 50NL'
                  value={sessionDetails.sessionName}
                  disabled={isPending}
                  onChange={handleDetailsChange}
                />
              </label>

              <label>
                <span>Notes</span>
                <textarea
                  name='notes'
                  rows='5'
                  placeholder='Add any notes about this session...'
                  value={sessionDetails.notes}
                  disabled={isPending}
                  onChange={handleDetailsChange}
                />
              </label>

              <label>
                <span>Tags</span>
                <input
                  name='tags'
                  type='text'
                  placeholder='e.g. evening, 50NL, review'
                  value={sessionDetails.tags}
                  disabled={isPending}
                  onChange={handleDetailsChange}
                />
              </label>
            </div>

            <div className='session-form-actions'>
              <Link className='session-cancel-button' to='/dashboard/sessions'>
                Cancel
              </Link>
              <button className='session-save-button' type='submit' disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Session'}
              </button>
            </div>
          </section>
        </form>
      </div>
    </section>
  );
};

export default AddSessionPage;
