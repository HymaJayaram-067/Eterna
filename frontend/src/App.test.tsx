import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the services
jest.mock('./services/api');
jest.mock('./services/websocket');

test('renders Eterna app title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Eterna/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders loading state initially', () => {
  render(<App />);
  const loadingElement = screen.getByText(/Loading tokens/i);
  expect(loadingElement).toBeInTheDocument();
});
