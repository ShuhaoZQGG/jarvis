import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BotConfiguration from './BotConfiguration'

const mockBot = {
  id: '1',
  name: 'Test Bot',
  url: 'https://example.com',
  status: 'active' as const,
  conversations: 100,
  created_at: '2024-01-01T00:00:00Z',
  settings: {
    greeting: 'Hello! How can I help you?',
    primaryColor: '#0066CC',
    position: 'bottom-right' as const,
    widgetType: 'bubble' as const,
    autoOpen: false,
    responseDelay: 500,
  }
}

const mockOnSave = jest.fn()
const mockOnDelete = jest.fn()

describe('BotConfiguration Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('should display bot basic information', () => {
    render(<BotConfiguration bot={mockBot} onSave={mockOnSave} onDelete={mockOnDelete} />)
    
    expect(screen.getByDisplayValue('Test Bot')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument()
  })
  
  it('should display bot settings', () => {
    render(<BotConfiguration bot={mockBot} onSave={mockOnSave} onDelete={mockOnDelete} />)
    
    expect(screen.getByDisplayValue('Hello! How can I help you?')).toBeInTheDocument()
    expect(screen.getByDisplayValue('#0066CC')).toBeInTheDocument()
    expect(screen.getByText('Bottom Right')).toBeInTheDocument()
    expect(screen.getByText('Bubble')).toBeInTheDocument()
  })
  
  it('should allow editing bot name', async () => {
    const user = userEvent.setup()
    render(<BotConfiguration bot={mockBot} onSave={mockOnSave} onDelete={mockOnDelete} />)
    
    const nameInput = screen.getByDisplayValue('Test Bot')
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Bot Name')
    
    expect(nameInput).toHaveValue('Updated Bot Name')
  })
  
  it('should call onSave when save button is clicked', async () => {
    const user = userEvent.setup()
    render(<BotConfiguration bot={mockBot} onSave={mockOnSave} onDelete={mockOnDelete} />)
    
    const nameInput = screen.getByDisplayValue('Test Bot')
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Bot')
    
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        ...mockBot,
        name: 'Updated Bot'
      }))
    })
  })
  
  it('should show widget preview', () => {
    render(<BotConfiguration bot={mockBot} onSave={mockOnSave} onDelete={mockOnDelete} />)
    
    expect(screen.getByText('Widget Preview')).toBeInTheDocument()
    expect(screen.getByTestId('widget-preview')).toBeInTheDocument()
  })
  
  it('should toggle auto-open setting', async () => {
    const user = userEvent.setup()
    render(<BotConfiguration bot={mockBot} onSave={mockOnSave} onDelete={mockOnDelete} />)
    
    const autoOpenToggle = screen.getByRole('switch', { name: /auto-open chat/i })
    await user.click(autoOpenToggle)
    
    expect(autoOpenToggle).toBeChecked()
  })
  
  it('should update widget position', async () => {
    const user = userEvent.setup()
    render(<BotConfiguration bot={mockBot} onSave={mockOnSave} onDelete={mockOnDelete} />)
    
    const positionSelect = screen.getByLabelText(/widget position/i)
    await user.selectOptions(positionSelect, 'bottom-left')
    
    expect(positionSelect).toHaveValue('bottom-left')
  })
  
  it('should show embed code', () => {
    render(<BotConfiguration bot={mockBot} onSave={mockOnSave} onDelete={mockOnDelete} />)
    
    const embedButton = screen.getByRole('button', { name: /get embed code/i })
    fireEvent.click(embedButton)
    
    expect(screen.getByText(/script src/)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(mockBot.id))).toBeInTheDocument()
  })
  
  it('should confirm before deleting', async () => {
    const user = userEvent.setup()
    window.confirm = jest.fn(() => true)
    
    render(<BotConfiguration bot={mockBot} onSave={mockOnSave} onDelete={mockOnDelete} />)
    
    const deleteButton = screen.getByRole('button', { name: /delete bot/i })
    await user.click(deleteButton)
    
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('delete this bot')
    )
    expect(mockOnDelete).toHaveBeenCalledWith(mockBot.id)
  })
})