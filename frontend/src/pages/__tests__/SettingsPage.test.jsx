import { beforeEach, describe, expect, test, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '../SettingsPage';
import { renderWithRouter } from '../../test/testUtils.jsx';

const updateSettings = vi.fn();
const cancelSubscription = vi.fn();
const createBillingPortalSession = vi.fn();
const mockUser = {
  username: 'hero',
  email: 'hero@riveriq.test',
  subscription: 'free',
  preferences: {
    theme: 'light',
    currency: 'USD',
    defaultTimeFilter: '30d',
    defaultTableSize: '9max',
  },
};

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    updateSettings,
    updateSettingsLoading: false,
    uploadAvatar: vi.fn(),
    uploadAvatarLoading: false,
    deleteAvatar: vi.fn(),
    deleteAvatarLoading: false,
    cancelSubscription,
    cancelSubscriptionLoading: false,
    createBillingPortalSession,
    billingPortalLoading: false,
    forgotPassword: vi.fn(),
    forgotPasswordLoading: false,
  }),
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    mockUser.subscription = 'free';
    mockUser.stripeCancelAtPeriodEnd = false;
    mockUser.stripeCurrentPeriodEnd = undefined;
    mockUser.stripeSubscriptionStatus = undefined;
    updateSettings.mockReset();
    cancelSubscription.mockReset();
    createBillingPortalSession.mockReset();
  });

  test('keeps save disabled until settings change, then saves preferences', async () => {
    updateSettings.mockResolvedValue({});

    renderWithRouter(<SettingsPage />);

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    expect(saveButton).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /9max/i }));
    await userEvent.click(screen.getByRole('option', { name: '6max' }));
    await userEvent.click(screen.getByRole('button', { name: 'USD' }));
    await userEvent.click(screen.getByRole('option', { name: 'CNY (Yuan)' }));

    await waitFor(() => expect(saveButton).toBeEnabled());

    await userEvent.click(saveButton);

    expect(updateSettings).toHaveBeenCalledWith({
      preferences: {
        theme: 'light',
        currency: 'CNY',
        defaultTimeFilter: '30d',
        defaultTableSize: '6max',
      },
    });
  });

  test('closes an open settings dropdown when clicking outside of it', async () => {
    renderWithRouter(<SettingsPage />);

    await userEvent.click(screen.getByRole('button', { name: /past 30 days/i }));
    expect(screen.getByRole('listbox', { name: /default date range/i })).toBeInTheDocument();

    await userEvent.click(screen.getByText(/manage your account and preferences/i));

    expect(screen.queryByRole('listbox', { name: /default date range/i })).not.toBeInTheDocument();
  });

  test('schedules Pro cancellation from the billing dropdown and shows the period-end notice', async () => {
    mockUser.subscription = 'pro';
    cancelSubscription.mockResolvedValue({ currentPeriodEnd: 1785974400 });

    renderWithRouter(<SettingsPage />);

    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Manage Subscription')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /billing actions/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /cancel subscription/i }));

    const dialog = screen.getByRole('dialog', { name: /cancel your riveriq pro subscription/i });
    expect(within(dialog).getByText(/keep pro access until the end of your current billing period/i)).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: /cancel subscription/i }));

    expect(cancelSubscription).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/subscription cancellation scheduled\. you will keep pro access until/i)).toBeInTheDocument();
  });

  test('shows scheduled cancellation details from the saved user subscription metadata', () => {
    mockUser.subscription = 'pro';
    mockUser.stripeCancelAtPeriodEnd = true;
    mockUser.stripeCurrentPeriodEnd = 1785974400;

    renderWithRouter(<SettingsPage />);

    expect(screen.getByText(/cancellation scheduled\. pro access continues until/i)).toBeInTheDocument();
    expect(screen.getByText('Cancels on')).toBeInTheDocument();
  });
});
