import { Link } from 'react-router';
import './FaqPage.css';

const faqs = [
  {
    question: 'What is RiverIQ?',
    answer:
      'RiverIQ is a poker session tracking and analysis tool. It helps players upload hand histories, review stats, track results, build reports, and spot patterns in their game.',
  },
  {
    question: 'Which poker sites does RiverIQ support?',
    answer:
      'RiverIQ currently supports PokerStars and GGPoker hand history uploads. More formats can be added as the parser grows.',
  },
  {
    question: 'What happens when I upload hand histories?',
    answer:
      'RiverIQ parses your uploaded files, creates session data, and generates statistics such as VPIP, PFR, 3-bet, c-bet, profit, and position-based performance.',
  },
  {
    question: 'Do I need a Pro subscription?',
    answer:
      'You can start using RiverIQ for basic tracking. Pro unlocks the full analytics experience, including deeper reports, goals, and hand chart tools.',
  },
  {
    question: 'Is my poker data private?',
    answer:
      'Your uploaded hand histories are used to power your RiverIQ stats and reports. RiverIQ does not sell your personal poker data.',
  },
  {
    question: 'Can I cancel my subscription?',
    answer:
      'Yes. Subscriptions can be managed from account settings after you log in, and you can cancel before the next billing date.',
  },
];

const FaqPage = () => {
  return (
    <main className='faq-page'>
      <section className='faq-document' aria-labelledby='faq-page-title'>
        <Link className='faq-document__back' to='/features'>
          Back to features
        </Link>
        <header className='faq-document__header'>
          <h1 id='faq-page-title'>FAQ</h1>
          <p>Quick answers to common questions about RiverIQ uploads, stats, subscriptions, and data privacy.</p>
        </header>

        <div className='faq-list'>
          {faqs.map((faq) => (
            <article className='faq-item' key={faq.question}>
              <h2>{faq.question}</h2>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default FaqPage;
