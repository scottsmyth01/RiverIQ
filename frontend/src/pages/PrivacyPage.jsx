import { Link } from 'react-router';
import './PrivacyPage.css';

const sections = [
  {
    title: '1. Information We Collect',
    groups: [
      {
        heading: 'Account Information',
        paragraphs: ['When you create an account, we may collect:'],
        items: ['Name', 'Email address', 'Encrypted password', 'Account preferences'],
      },
      {
        heading: 'Payment Information',
        paragraphs: [
          'If you purchase a subscription, payment information is processed securely by Stripe, our third-party payment processor.',
          'RiverIQ does not collect or store your full credit card number, CVV, or other payment credentials. Payment information is handled directly by Stripe in accordance with its own privacy policy and security standards.',
        ],
      },
      {
        heading: 'Poker Data',
        paragraphs: ['When you upload poker hand history files, we may collect:'],
        items: [
          'Uploaded hand history files',
          'Session information',
          'Poker statistics generated from uploaded files',
          'Reports and analytics created from your uploaded data',
        ],
      },
      {
        heading: 'Technical Information',
        paragraphs: ['We may automatically collect certain technical information, including:'],
        items: ['IP address', 'Browser type', 'Device type', 'Operating system', 'Log data', 'Usage information', 'Cookies and similar technologies'],
      },
    ],
  },
  {
    title: '2. How We Use Your Information',
    paragraphs: ['We use your information to:'],
    items: [
      'Create and manage your account.',
      'Authenticate users and maintain account security.',
      'Provide poker statistics, reports, and analytics.',
      'Process subscription payments.',
      'Store uploaded hand history files.',
      'Improve the performance and functionality of RiverIQ.',
      'Develop new features and services.',
      'Detect fraud, abuse, and unauthorized access.',
      'Respond to customer support requests.',
      'Send important service-related communications.',
      'Comply with legal obligations.',
    ],
  },
  {
    title: '3. Cookies and Similar Technologies',
    paragraphs: ['RiverIQ uses cookies and similar technologies to:'],
    items: ['Keep you signed in.', 'Remember your preferences.', 'Improve website performance.', 'Analyze how the Service is used.', 'Enhance security.'],
    closing: [
      'You may disable cookies through your browser settings. However, some features of the Service may not function properly if cookies are disabled.',
    ],
  },
  {
    title: '4. How We Share Information',
    paragraphs: [
      'We do not sell your personal information.',
      'We may share information only when necessary with trusted third-party service providers that help us operate the Service, including:',
    ],
    items: [
      'Stripe for secure payment processing.',
      'Cloudflare R2 for secure storage of uploaded poker hand history files.',
      'Resend for transactional emails, including account verification and password reset emails.',
      'Cloud hosting providers.',
      'Analytics providers.',
      'Customer support providers, if used.',
    ],
    closing: [
      'These providers are authorized to process your information only as necessary to perform services on our behalf.',
      'We may also disclose information when required by law or when reasonably necessary to:',
    ],
    closingItems: ['Comply with legal obligations.', 'Protect our rights or property.', 'Prevent fraud or security threats.', 'Protect the safety of our users or others.'],
  },
  {
    title: '5. Data Storage and Security',
    paragraphs: [
      'We take reasonable administrative, technical, and organizational measures to protect your information against unauthorized access, disclosure, alteration, or destruction.',
      'Uploaded poker hand history files are securely stored using Cloudflare R2.',
      'While we strive to protect your information, no method of electronic transmission or storage is completely secure. Therefore, we cannot guarantee absolute security.',
    ],
  },
  {
    title: '6. Data Retention',
    paragraphs: ['We retain your personal information for as long as necessary to:'],
    items: ['Provide the Service.', 'Maintain your account.', 'Comply with legal obligations.', 'Resolve disputes.', 'Enforce our agreements.'],
    closing: [
      'If you delete your account, we will delete or anonymize your personal information within a reasonable period, unless we are legally required or permitted to retain certain information.',
    ],
  },
  {
    title: '7. Your Privacy Rights',
    paragraphs: ['Depending on your location, you may have the right to:'],
    items: [
      'Access your personal information.',
      'Correct inaccurate information.',
      'Request deletion of your personal information.',
      'Request a copy of your personal information.',
      'Withdraw consent where applicable.',
      'Object to certain processing activities.',
    ],
    closing: ['To exercise any of these rights, please contact us using the contact information provided below.'],
  },
  {
    title: "8. Children's Privacy",
    paragraphs: [
      'RiverIQ is intended only for individuals who are at least 18 years of age or the age of majority in their jurisdiction.',
      'We do not knowingly collect personal information from children.',
      'If we learn that personal information has been collected from a child without appropriate authorization, we will take reasonable steps to delete that information.',
    ],
  },
  {
    title: '9. International Data Transfers',
    paragraphs: [
      'Your information may be processed or stored in countries other than your own through our trusted service providers.',
      'Where required by applicable law, we take appropriate safeguards to protect personal information transferred internationally.',
    ],
  },
  {
    title: '10. Third-Party Services',
    paragraphs: ['RiverIQ uses trusted third-party providers to deliver portions of the Service.', 'These currently include:'],
    items: [
      'Stripe for subscription billing and payment processing.',
      'Cloudflare R2 for secure cloud storage of uploaded poker hand history files.',
      'Resend for transactional emails, including account verification and password reset emails.',
    ],
    closing: [
      'Your use of RiverIQ may also involve these providers processing information on our behalf in accordance with their own privacy policies.',
    ],
  },
  {
    title: '11. Changes to This Privacy Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time.',
      'When material changes are made, we will update the "Last Updated" date at the top of this page and, where appropriate, notify users through the Service or by email.',
      'Your continued use of RiverIQ after changes become effective constitutes acceptance of the updated Privacy Policy.',
    ],
  },
  {
    title: '12. Contact Us',
    paragraphs: [
      'If you have any questions about this Privacy Policy or our privacy practices, please contact us through the contact information provided on the RiverIQ website.',
    ],
  },
];

const renderList = (items) => (
  <ul>
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

const PrivacyPage = () => {
  return (
    <main className='privacy-page'>
      <article className='privacy-document'>
        <Link className='privacy-document__back' to='/features'>
          Back to features
        </Link>
        <header className='privacy-document__header'>
          <h1>Privacy Policy</h1>
          <p>Last Updated: July 20, 2026</p>
        </header>

        <section className='privacy-document__intro' aria-label='Privacy policy introduction'>
          <p>
            RiverIQ ("RiverIQ", "we", "our", or "us") respects your privacy and is committed to protecting your
            personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use the RiverIQ website, applications, and related services (collectively, the
            "Service").
          </p>
          <p>By creating an account or using RiverIQ, you acknowledge that you have read and understood this Privacy Policy.</p>
        </section>

        {sections.map((section) => (
          <section className='privacy-document__section' key={section.title}>
            <h2>{section.title}</h2>
            {section.groups?.map((group) => (
              <div className='privacy-document__group' key={group.heading}>
                <h3>{group.heading}</h3>
                {group.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {group.items && renderList(group.items)}
              </div>
            ))}
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items && renderList(section.items)}
            {section.closing?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.closingItems && renderList(section.closingItems)}
          </section>
        ))}
      </article>
    </main>
  );
};

export default PrivacyPage;
