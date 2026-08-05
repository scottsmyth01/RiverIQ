import { describe, expect, test, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '../SettingsPage';
import { renderWithRouter } from '../../test/testUtils.jsx';

const updateSettings = vi.fn();
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
    cancelSubscription: vi.fn(),
    cancelSubscriptionLoading: false,
    forgotPassword: vi.fn(),
    forgotPasswordLoading: false,
  }),
}));

describe('SettingsPage', () => {
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
});
