import { render, screen } from '@testing-library/react';
import { TokenCard } from '../TokenCard';
import { Token } from '../../types';

describe('TokenCard Component', () => {
  const mockToken: Token = {
    token_address: 'test123',
    token_name: 'Test Token',
    token_ticker: 'TEST',
    price_sol: 0.0000001,
    market_cap_sol: 1000,
    volume_sol: 500,
    liquidity_sol: 200,
    transaction_count: 100,
    price_1hr_change: 5.5,
    price_24hr_change: -2.3,
    protocol: 'Raydium',
  };

  test('renders token information correctly', () => {
    render(<TokenCard token={mockToken} />);
    
    expect(screen.getByText('TEST')).toBeInTheDocument();
    expect(screen.getByText('Test Token')).toBeInTheDocument();
    expect(screen.getByText('Raydium')).toBeInTheDocument();
    expect(screen.getByText('100 tx')).toBeInTheDocument();
  });

  test('displays positive price change in green', () => {
    render(<TokenCard token={mockToken} />);
    
    const priceChange = screen.getByText(/\+5\.50%/);
    expect(priceChange).toHaveClass('positive');
  });

  test('displays negative price change in red', () => {
    render(<TokenCard token={mockToken} />);
    
    const priceChange = screen.getByText(/-2\.30%/);
    expect(priceChange).toHaveClass('negative');
  });

  test('applies highlighted class when highlighted prop is true', () => {
    const { container } = render(<TokenCard token={mockToken} highlighted={true} />);
    
    const card = container.querySelector('.token-card');
    expect(card).toHaveClass('highlighted');
  });

  test('formats small numbers in scientific notation', () => {
    render(<TokenCard token={mockToken} />);
    
    // Price is 0.0000001 which should be displayed in scientific notation
    expect(screen.getByText(/1\.00e-7 SOL/)).toBeInTheDocument();
  });
});
