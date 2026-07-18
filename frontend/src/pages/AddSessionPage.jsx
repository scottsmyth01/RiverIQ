import { useState } from 'react';
import { ArrowLeft, ChevronRight, CloudUpload } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAddSession } from '../hooks/useSessions';
import './AddSessionPage.css';

const pokerSites = [
  { label: 'PokerStars', value: 'pokerstars' },
  { label: 'GGPoker', value: 'ggpoker' },
];

const AddSessionPage = () => {
  const [selectedPokerSite, setSelectedPokerSite] = useState('pokerstars');
  const navigate = useNavigate();
  const { mutateAsync: addSession, isPending } = useAddSession();

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    formData.set('pokerSite', selectedPokerSite);

    try {
      await addSession(formData);
      toast.success('Session uploaded');
      navigate('/dashboard/sessions');
    } catch (error) {
      toast.error(error.message || 'Could not upload session');
    }
  }

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
        <p>Upload your hand history and we’ll do the rest.</p>
      </header>

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
                    onChange={() => setSelectedPokerSite(site.value)}
                  />
                  <span>{site.label}</span>
                </label>
              ))}
            </div>
          </section>
          <section className='add-session-card upload-card'>
            <label className='upload-dropzone' htmlFor='hand-history-file'>
              <CloudUpload aria-hidden='true' />
              <h2>Upload Hand History File</h2>
              <p>Drag and drop your file here, or click to browse</p>

              <span className='choose-file-button'>Choose File</span>
              <input id='hand-history-file' name='handHistory' type='file' accept='.txt,.hhh' />

              <small>
                Supports .txt and .hhh files
                <br />
                Max file size: 50MB
              </small>
            </label>
          </section>

          <section className='add-session-card session-details-card'>
            <h2>Session Details</h2>

            <div className='session-fields'>
              <label>
                <span>Notes</span>
                <textarea name='notes' rows='5' placeholder='Add any notes about this session...' />
              </label>

              <label>
                <span>Tags</span>
                <input name='tags' type='text' placeholder='e.g. evening, 50NL, review' />
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
