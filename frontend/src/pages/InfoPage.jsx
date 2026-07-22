import { useState } from 'react';
import { CreditCard, FileUp, LifeBuoy, Lock, Settings, TrendingUp } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import './InfoPage.css';

const helpTopics = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    icon: LifeBuoy,
    title: 'Getting Started',
    description: 'Set up your account, understand the dashboard, and learn where each RiverIQ tool lives.',
    sections: [
      {
        heading: 'Create and verify your account',
        items: [
          'Use a real email address so account verification, password resets, and billing notices can reach you.',
          'After registering, check your inbox for the verification email before trying to use the dashboard.',
          'If the verification email is missing, check spam or junk folders before requesting another link.',
        ],
      },
      {
        heading: 'Learn the main dashboard',
        items: [
          'Dashboard gives you a quick performance snapshot once you have enough uploaded sessions.',
          'Sessions is where you upload, review, and inspect individual poker sessions.',
          'Analytics, Reports, Goals, and Hand Charts are built from your uploaded hand histories.',
        ],
      },
      {
        heading: 'Best first steps',
        items: [
          'Upload a small batch of recent hands first so you can confirm everything parses correctly.',
          'Review the Sessions table after uploading to make sure dates, stakes, and results look right.',
          'Once your data looks correct, use Analytics and Reports to start finding trends.',
        ],
      },
    ],
  },
  {
    id: 'hand-history-uploads',
    label: 'Hand History Uploads',
    icon: FileUp,
    title: 'Hand History Uploads',
    description: 'Help for importing PokerStars, GGPoker, 888poker, or partypoker hand histories and resolving upload issues.',
    subtopics: [
      { id: 'pokerstars', label: 'PokerStars', title: 'PokerStars Hand History Uploads' },
      { id: 'ggpoker', label: 'GGPoker', title: 'GGPoker Hand History Uploads' },
      { id: '888poker', label: '888poker', title: '888poker Hand History Uploads' },
      { id: 'partypoker', label: 'partypoker', title: 'partypoker Hand History Uploads' },
    ],
    sections: [
      {
        id: 'supported-uploads',
        heading: 'Supported uploads',
        items: [
          'RiverIQ currently supports PokerStars, GGPoker, 888poker, and partypoker hand history files.',
          'Upload original hand history text files when possible instead of edited or reformatted copies.',
          'Files should contain complete hand histories, including table details, actions, showdown, and summary lines.',
        ],
      },
      {
        id: 'before-upload',
        heading: 'Before you upload',
        items: [
          'Make sure the file is from the correct poker site and game format.',
          'Avoid combining unrelated formats into the same file.',
          'If a file fails, try uploading a smaller sample from the same session to narrow down the issue.',
        ],
      },
      {
        id: 'pokerstars',
        heading: 'PokerStars',
        items: [
          <>
            From the PokerStars lobby, click on <strong>Options</strong> -&gt;{' '}
            <strong>Instant Hand history Options</strong>.
          </>,
          <>
            Check <strong>Save My Hands History</strong>.
          </>,
          <>
            Please note the default location where PokerStars is saving your hand histories under{' '}
            <strong>Where To Save</strong>.
          </>,
          <>
            Click <strong>OK</strong> to save the settings.
          </>,
        ],
      },
      {
        id: 'ggpoker',
        heading: 'GGPoker',
        items: [
          <>
            Select <strong>Pokercraft</strong> in the bottom right corner.
          </>,
          'Select the type of game whose hands you’re trying to export.',
          <>
            Select the <strong>HH date ranges</strong>.
          </>,
          <>
            Select <strong>ALL</strong> and click on <strong>Download</strong>.
          </>,
        ],
      },
      {
        id: '888poker',
        heading: '888poker',
        items: [
          <>
            Go to the <strong>User Settings</strong> screen and choose the <strong>Game settings</strong> tab, and the{' '}
            <strong>Hand History</strong> option.
          </>,
          <>
            To save all of your hand history, check the <strong>Save My Hand History</strong> box.
          </>,
          'Once this option is enabled, every hand you play will be saved in the destination folder.',
        ],
      },
      {
        id: 'partypoker',
        heading: 'partypoker',
        items: [
          <>
            Go to <strong>MyGame</strong> in the partypoker client.
          </>,
          'Download the hand history file for the sessions or date range you want to import.',
          'Upload the original exported hand history file to RiverIQ.',
        ],
      },
      {
        id: 'after-upload',
        heading: 'After upload',
        items: [
          'Check the imported session in the Sessions page to confirm the result and hand count.',
          'Review any parsing warnings or failed upload messages before uploading a larger batch.',
          'If a session looks wrong, keep the original hand history file so support can investigate it.',
        ],
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: TrendingUp,
    title: 'Analytics and Reports',
    description: 'Questions about stats, reports, hand charts, goals, and how RiverIQ calculates your poker data.',
    sections: [
      {
        heading: 'Core stats',
        items: [
          'VPIP shows how often you voluntarily put money in the pot preflop.',
          'PFR shows how often you raise preflop.',
          '3-bet, 4-bet, c-bet, fold-to-c-bet, WTSD, WMSD, and aggression stats help describe specific parts of your strategy.',
        ],
      },
      {
        heading: 'Using date filters',
        items: [
          'Use shorter time ranges to inspect recent performance changes.',
          'Use all-time views when you want the broadest sample and more stable trends.',
          'Small samples can swing heavily, so treat short-term results as signals rather than final answers.',
        ],
      },
      {
        heading: 'Reports and goals',
        items: [
          'Reports help turn raw stats into a more readable performance summary.',
          'Saved reports let you return to important analysis later.',
          'Goals give you a way to track specific improvement targets over time.',
        ],
      },
      {
        heading: 'Hand charts',
        items: [
          'Hand charts are intended to help you review positional tendencies and preflop patterns.',
          'Chart availability may depend on your subscription level and the amount of uploaded data.',
          'Use charts alongside session review instead of treating them as automatic strategy instructions.',
        ],
      },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCard,
    title: 'Billing and Subscriptions',
    description: 'Manage Pro subscriptions, payment details, renewals, cancellations, and plan access.',
    sections: [
      {
        heading: 'RiverIQ Pro',
        items: [
          'Pro unlocks the full RiverIQ experience, including deeper analytics, reports, goals, and hand chart tools.',
          'Subscription access is tied to the account that purchased Pro.',
          'If Pro features do not unlock after payment, refresh the app or sign out and back in.',
        ],
      },
      {
        heading: 'Payments',
        items: [
          'Payments are processed securely through Stripe.',
          'RiverIQ does not store your full card number, CVV, or payment credentials.',
          'If a payment fails, confirm your card details, billing postal code, available funds, and bank approval status.',
        ],
      },
      {
        heading: 'Cancellations',
        items: [
          'You can manage or cancel your subscription from Settings after logging in.',
          'Cancel before the next billing date if you do not want the subscription to renew.',
          'Subscription fees are generally non-refundable except where required by applicable law.',
        ],
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: Settings,
    title: 'Account Settings',
    description: 'Update profile details, account preferences, password settings, and notification options.',
    sections: [
      {
        heading: 'Preferences',
        items: [
          'Settings lets you choose your preferred theme, default date range, default table size, and currency.',
          'Your preferences help RiverIQ open the dashboard in the view you use most often.',
          'Some preferences may affect how sessions and analytics are displayed, but they do not change the raw uploaded hand data.',
        ],
      },
      {
        heading: 'Password and access',
        items: [
          'Use the forgot password flow from the login screen if you cannot access your account.',
          'Password reset links are sent to the email address attached to your account.',
          'Keep your login credentials private and avoid reusing passwords from other sites.',
        ],
      },
      {
        heading: 'Account troubleshooting',
        items: [
          'If you are redirected unexpectedly, confirm your email is verified.',
          'If dashboard data looks stale, refresh the page and confirm uploads finished processing.',
          'If you contact support, include your account email and the page where the issue happened.',
        ],
      },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    icon: Lock,
    title: 'Privacy and Security',
    description: 'Learn how account data, uploaded hand histories, and payment information are protected.',
    sections: [
      {
        heading: 'Your uploaded poker data',
        items: [
          'Uploaded hand histories are processed to generate your sessions, stats, reports, and analytics.',
          'You retain ownership of your uploaded files.',
          'RiverIQ uses your poker data to provide the Service, not to sell your personal poker information.',
        ],
      },
      {
        heading: 'Storage and providers',
        items: [
          'Uploaded hand history files may be stored using secure cloud storage.',
          'Transactional emails, such as verification and password reset messages, may be sent through a trusted email provider.',
          'Payment processing is handled by Stripe, so full card credentials are not stored by RiverIQ.',
        ],
      },
      {
        heading: 'Keeping your account safe',
        items: [
          'Use a strong password and keep your email account secure.',
          'Report suspicious account activity as soon as you notice it.',
          'Do not upload files unless you have the right to use and analyze them.',
        ],
      },
    ],
  },
];

const InfoPage = () => {
  const { hash } = useLocation();
  const initialTopicId = hash.replace('#', '');
  const [activeTopicId, setActiveTopicId] = useState(
    helpTopics.some((topic) => topic.id === initialTopicId) ? initialTopicId : helpTopics[0].id,
  );
  const [activeSubtopicId, setActiveSubtopicId] = useState('');
  const activeTopic = helpTopics.find((topic) => topic.id === activeTopicId) || helpTopics[0];
  const activeSubtopic = activeTopic.subtopics?.find((subtopic) => subtopic.id === activeSubtopicId);
  const subtopicIds = activeTopic.subtopics?.map((subtopic) => subtopic.id) || [];
  const visibleSections = activeSubtopic
    ? activeTopic.sections.filter((section) => section.id === activeSubtopic.id)
    : activeTopic.sections.filter((section) => !subtopicIds.includes(section.id));
  const ActiveIcon = activeTopic.icon;

  function handleTopicSelect(topicId) {
    setActiveTopicId(topicId);
    setActiveSubtopicId('');
  }

  function handleSubtopicSelect(topicId, subtopicId) {
    setActiveTopicId(topicId);
    setActiveSubtopicId(subtopicId);
  }

  return (
    <main className='info-page'>
      <section className='help-shell' aria-labelledby='help-page-title'>
        <Link className='help-shell__back' to='/dashboard'>
          Back to dashboard
        </Link>
        <header className='help-shell__header'>
          <h1 id='help-page-title'>Help Center</h1>
          <p>Find support for anything related to RiverIQ, from uploads and reports to billing and account security.</p>
        </header>

        <div className='help-shell__layout'>
          <aside className='help-sidebar' aria-label='Help topics'>
            {helpTopics.map((topic) => {
              const TopicIcon = topic.icon;
              const isActiveTopic = topic.id === activeTopic.id;

              return (
                <div className='help-sidebar__item' key={topic.id}>
                  <button
                    className={`help-sidebar__button${isActiveTopic && !activeSubtopicId ? ' help-sidebar__button--active' : ''}${
                      isActiveTopic && activeSubtopicId ? ' help-sidebar__button--parent-active' : ''
                    }`}
                    type='button'
                    onClick={() => handleTopicSelect(topic.id)}
                  >
                    <TopicIcon aria-hidden='true' />
                    <span>{topic.label}</span>
                  </button>

                  {topic.subtopics && isActiveTopic ? (
                    <div className='help-sidebar__submenu' aria-label={`${topic.label} options`}>
                      {topic.subtopics.map((subtopic) => (
                        <button
                          className={`help-sidebar__submenu-button${
                            activeSubtopicId === subtopic.id ? ' help-sidebar__submenu-button--active' : ''
                          }`}
                          key={subtopic.id}
                          type='button'
                          onClick={() => handleSubtopicSelect(topic.id, subtopic.id)}
                        >
                          {subtopic.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </aside>

          <section className='help-content' id={activeTopic.id} aria-live='polite'>
            <div className='help-content__eyebrow'>
              <ActiveIcon aria-hidden='true' />
              <span>{activeTopic.label}</span>
            </div>
            <h2>{activeSubtopic?.title || activeTopic.title}</h2>
            <p>{activeTopic.description}</p>
            <div className='help-content__sections'>
              {visibleSections.map((section) => (
                <article className='help-content__section' id={section.id} key={section.heading}>
                  <h3>{section.heading}</h3>
                  <ul>
                    {section.items.map((item, itemIndex) => (
                      <li key={`${section.heading}-${itemIndex}`}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className='help-content__contact'>
              <strong>Still need help?</strong>
              <p>Contact support and include your account email, browser, and a short description of what happened.</p>
              <a href='mailto:support@riveriq.com'>support@riveriq.com</a>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

export default InfoPage;
