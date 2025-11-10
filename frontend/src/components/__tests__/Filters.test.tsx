import { render, screen, fireEvent } from '@testing-library/react';
import { Filters } from '../Filters';
import { TokenQueryParams } from '../../types';

describe('Filters Component', () => {
  const mockParams: TokenQueryParams = {
    sortBy: 'volume',
    sortOrder: 'desc',
    timePeriod: '1h',
  };

  const mockOnParamsChange = jest.fn();

  beforeEach(() => {
    mockOnParamsChange.mockClear();
  });

  test('renders all filter controls', () => {
    render(<Filters params={mockParams} onParamsChange={mockOnParamsChange} />);
    
    expect(screen.getByText('Sort By:')).toBeInTheDocument();
    expect(screen.getByText('Order:')).toBeInTheDocument();
    expect(screen.getByText('Time Period:')).toBeInTheDocument();
    expect(screen.getByText('Min Volume (SOL):')).toBeInTheDocument();
    expect(screen.getByText('Min Market Cap (SOL):')).toBeInTheDocument();
  });

  test('calls onParamsChange when sort by changes', () => {
    render(<Filters params={mockParams} onParamsChange={mockOnParamsChange} />);
    
    const sortBySelect = screen.getByLabelText('Sort By:') as HTMLSelectElement;
    fireEvent.change(sortBySelect, { target: { value: 'market_cap' } });
    
    expect(mockOnParamsChange).toHaveBeenCalledWith({
      ...mockParams,
      sortBy: 'market_cap',
    });
  });

  test('calls onParamsChange when time period button is clicked', () => {
    render(<Filters params={mockParams} onParamsChange={mockOnParamsChange} />);
    
    const button24h = screen.getByText('24h');
    fireEvent.click(button24h);
    
    expect(mockOnParamsChange).toHaveBeenCalledWith({
      ...mockParams,
      timePeriod: '24h',
    });
  });

  test('highlights active time period button', () => {
    render(<Filters params={{ ...mockParams, timePeriod: '24h' }} onParamsChange={mockOnParamsChange} />);
    
    const button24h = screen.getByText('24h');
    expect(button24h).toHaveClass('active');
  });

  test('calls onParamsChange when min volume changes', () => {
    render(<Filters params={mockParams} onParamsChange={mockOnParamsChange} />);
    
    const minVolumeInput = screen.getByPlaceholderText('e.g. 1000') as HTMLInputElement;
    fireEvent.change(minVolumeInput, { target: { value: '1500' } });
    
    expect(mockOnParamsChange).toHaveBeenCalledWith({
      ...mockParams,
      minVolume: 1500,
    });
  });
});
