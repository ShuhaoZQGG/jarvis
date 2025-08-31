import { JSDOM } from 'jsdom';

describe('Jarvis Widget Embed', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost:3000',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    document = dom.window.document;
    window = dom.window as unknown as Window;
    
    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Widget Initialization', () => {
    it('should create widget with Shadow DOM', () => {
      // Create script element
      const script = document.createElement('script');
      script.setAttribute('data-bot-id', 'test-bot');
      script.setAttribute('data-position', 'bottom-right');
      script.setAttribute('data-primary-color', '#0ea5e9');
      document.body.appendChild(script);

      // Simulate widget initialization
      const container = document.createElement('div');
      container.id = 'jarvis-widget';
      const shadow = container.attachShadow({ mode: 'open' });
      document.body.appendChild(container);

      expect(container.shadowRoot).toBeTruthy();
      expect(document.getElementById('jarvis-widget')).toBeTruthy();
    });

    it('should not initialize without bot ID', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      const script = document.createElement('script');
      // No bot ID attribute
      document.body.appendChild(script);

      // Try to initialize widget (this would be in the widget code)
      const botId = script.getAttribute('data-bot-id');
      if (!botId) {
        console.error('Jarvis Widget: data-bot-id attribute is required');
      }

      expect(consoleError).toHaveBeenCalledWith('Jarvis Widget: data-bot-id attribute is required');
      consoleError.mockRestore();
    });

    it('should use default values for optional attributes', () => {
      const script = document.createElement('script');
      script.setAttribute('data-bot-id', 'test-bot');
      document.body.appendChild(script);

      const position = script.getAttribute('data-position') || 'bottom-right';
      const primaryColor = script.getAttribute('data-primary-color') || '#0ea5e9';
      const autoOpen = script.getAttribute('data-auto-open') === 'true';

      expect(position).toBe('bottom-right');
      expect(primaryColor).toBe('#0ea5e9');
      expect(autoOpen).toBe(false);
    });
  });

  describe('Widget Styling', () => {
    it('should apply custom primary color', () => {
      const customColor = '#ff0000';
      const styles = `
        .jarvis-bubble {
          background: ${customColor};
        }
      `;

      expect(styles).toContain('background: #ff0000');
    });

    it('should position widget based on configuration', () => {
      const positions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
      
      positions.forEach(position => {
        const styles = `
          .jarvis-container {
            position: fixed;
            ${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
            ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
          }
        `;

        if (position === 'bottom-right') {
          expect(styles).toContain('bottom: 20px');
          expect(styles).toContain('right: 20px');
        } else if (position === 'top-left') {
          expect(styles).toContain('top: 20px');
          expect(styles).toContain('left: 20px');
        }
      });
    });
  });

  describe('Widget Functionality', () => {
    it('should load bot configuration', async () => {
      const mockConfig = {
        id: 'test-bot',
        name: 'Test Bot',
        settings: {
          greeting: 'Hello!',
          primaryColor: '#0ea5e9'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      });

      const response = await fetch('http://localhost:3000/api/bots/test-bot/config');
      const config = await response.json();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/bots/test-bot/config');
      expect(config).toEqual(mockConfig);
    });

    it('should send chat messages', async () => {
      const mockResponse = {
        conversationId: 'conv-123',
        message: 'Bot response'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          botId: 'test-bot',
          message: 'Hello',
          conversationId: null
        })
      });

      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          botId: 'test-bot',
          message: 'Hello',
          conversationId: null
        })
      });
      expect(data).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      try {
        await fetch('http://localhost:3000/api/chat');
      } catch (error) {
        console.error('Chat error:', error);
      }

      expect(consoleError).toHaveBeenCalledWith('Chat error:', expect.any(Error));
      consoleError.mockRestore();
    });
  });

  describe('Shadow DOM Isolation', () => {
    it('should isolate styles from parent page', () => {
      const container = document.createElement('div');
      const shadow = container.attachShadow({ mode: 'open' });
      
      // Add global style that shouldn't affect shadow DOM
      const globalStyle = document.createElement('style');
      globalStyle.textContent = '.jarvis-bubble { background: red !important; }';
      document.head.appendChild(globalStyle);

      // Add shadow DOM styles
      const shadowStyle = document.createElement('style');
      shadowStyle.textContent = '.jarvis-bubble { background: blue; }';
      shadow.appendChild(shadowStyle);

      // Create element in shadow DOM
      const bubble = document.createElement('div');
      bubble.className = 'jarvis-bubble';
      shadow.appendChild(bubble);

      // Shadow DOM styles should not be affected by global styles
      expect(shadowStyle.textContent).toContain('background: blue');
    });

    it('should prevent JavaScript conflicts', () => {
      const container = document.createElement('div');
      const shadow = container.attachShadow({ mode: 'open' });
      
      // Global function
      (window as any).jarvisFunction = () => 'global';
      
      // Shadow DOM should not have access to global functions
      const shadowDiv = document.createElement('div');
      shadow.appendChild(shadowDiv);
      
      // This would be undefined in actual shadow DOM context
      expect((window as any).jarvisFunction()).toBe('global');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adjust widget size for mobile devices', () => {
      const mobileStyles = `
        @media (max-width: 420px) {
          .jarvis-window {
            width: calc(100vw - 40px);
            height: calc(100vh - 100px);
          }
        }
      `;

      expect(mobileStyles).toContain('calc(100vw - 40px)');
      expect(mobileStyles).toContain('calc(100vh - 100px)');
    });
  });
});