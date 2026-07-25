import { render } from '@testing-library/react';
import { MemoryRouter, Routes } from 'react-router';

export function renderWithRouter(ui, { initialEntries = ['/'], routes } = {}) {
  if (!routes) {
    return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
  }

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>{routes}</Routes>
    </MemoryRouter>,
  );
}
