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

    await waitFor(() => expect(saveButton).toBeEnabled());

    await userEvent.click(saveButton);

    expect(updateSettings).toHaveBeenCalledWith({
      preferences: {
        theme: 'light',
        currency: 'USD',
        defaultTimeFilter: '30d',
        defaultTableSize: '6max',
      },
    });
  });
});
