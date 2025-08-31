(function() {
  'use strict';

  // Configuration from script tag attributes
  const script = document.currentScript;
  const BOT_ID = script?.getAttribute('data-bot-id');
  const API_URL = script?.getAttribute('data-api-url') || 'https://rthvdvfislxlpjeamqjn.supabase.co';
  const POSITION = script?.getAttribute('data-position') || 'bottom-right';
  const PRIMARY_COLOR = script?.getAttribute('data-primary-color') || '#0ea5e9';
  const AUTO_OPEN = script?.getAttribute('data-auto-open') === 'true';

  if (!BOT_ID) {
    console.error('Jarvis Widget: data-bot-id attribute is required');
    return;
  }

  // Widget styles (isolated with Shadow DOM)
  const styles = `
    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .jarvis-container {
      position: fixed;
      z-index: 2147483647;
      ${POSITION.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${POSITION.includes('right') ? 'right: 20px;' : 'left: 20px;'}
    }
    
    .jarvis-bubble {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${PRIMARY_COLOR};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }
    
    .jarvis-bubble:hover {
      transform: scale(1.1);
    }
    
    .jarvis-bubble svg {
      width: 30px;
      height: 30px;
      fill: white;
    }
    
    .jarvis-window {
      position: absolute;
      ${POSITION.includes('bottom') ? 'bottom: 0;' : 'top: 0;'}
      ${POSITION.includes('right') ? 'right: 0;' : 'left: 0;'}
      width: 380px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .jarvis-window.hidden {
      display: none;
    }
    
    .jarvis-header {
      background: ${PRIMARY_COLOR};
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .jarvis-title {
      font-size: 16px;
      font-weight: 600;
    }
    
    .jarvis-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
    }
    
    .jarvis-close svg {
      width: 20px;
      height: 20px;
      fill: white;
    }
    
    .jarvis-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .jarvis-message {
      max-width: 75%;
      padding: 10px 14px;
      border-radius: 12px;
      word-wrap: break-word;
    }
    
    .jarvis-message.user {
      align-self: flex-end;
      background: ${PRIMARY_COLOR};
      color: white;
    }
    
    .jarvis-message.bot {
      align-self: flex-start;
      background: #f3f4f6;
      color: #111827;
    }
    
    .jarvis-input-area {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    }
    
    .jarvis-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    
    .jarvis-input:focus {
      border-color: ${PRIMARY_COLOR};
    }
    
    .jarvis-send {
      padding: 10px 14px;
      background: ${PRIMARY_COLOR};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
    
    .jarvis-send:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    
    .jarvis-send svg {
      width: 20px;
      height: 20px;
      fill: white;
    }
    
    @media (max-width: 420px) {
      .jarvis-window {
        width: calc(100vw - 40px);
        height: calc(100vh - 100px);
      }
    }
  `;

  // Widget Class
  class JarvisWidget {
    constructor() {
      this.isOpen = false;
      this.messages = [];
      this.conversationId = null;
      this.init();
    }

    init() {
      // Create container
      this.container = document.createElement('div');
      this.container.id = 'jarvis-widget';
      
      // Create shadow root for isolation
      this.shadow = this.container.attachShadow({ mode: 'open' });
      
      // Add styles
      const styleEl = document.createElement('style');
      styleEl.textContent = styles;
      this.shadow.appendChild(styleEl);
      
      // Create HTML structure
      this.render();
      
      // Setup event listeners
      this.setupListeners();
      
      // Append to body
      document.body.appendChild(this.container);
      
      // Load bot config and show greeting
      this.loadBotConfig();
      
      // Auto-open if configured
      if (AUTO_OPEN) {
        this.open();
      }
    }

    render() {
      const container = document.createElement('div');
      container.className = 'jarvis-container';
      container.innerHTML = `
        <div class="jarvis-bubble" id="bubble">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.19 0 2.34-.21 3.41-.6l3.59.6-.6-3.59c.39-1.07.6-2.22.6-3.41 0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            <circle cx="8" cy="12" r="1"/>
            <circle cx="12" cy="12" r="1"/>
            <circle cx="16" cy="12" r="1"/>
          </svg>
        </div>
        
        <div class="jarvis-window hidden" id="window">
          <div class="jarvis-header">
            <div class="jarvis-title">Chat Assistant</div>
            <button class="jarvis-close" id="close">
              <svg viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          
          <div class="jarvis-messages" id="messages"></div>
          
          <div class="jarvis-input-area">
            <input 
              type="text" 
              class="jarvis-input" 
              id="input" 
              placeholder="Type your message..."
            />
            <button class="jarvis-send" id="send">
              <svg viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      `;
      
      this.shadow.appendChild(container);
    }

    setupListeners() {
      const bubble = this.shadow.getElementById('bubble');
      const close = this.shadow.getElementById('close');
      const input = this.shadow.getElementById('input');
      const send = this.shadow.getElementById('send');
      
      bubble.addEventListener('click', () => this.open());
      close.addEventListener('click', () => this.close());
      send.addEventListener('click', () => this.sendMessage());
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
    }

    async loadBotConfig() {
      try {
        // Skip bot config for now - will be implemented with Supabase REST API
        this.botConfig = {
          name: 'Jarvis Assistant',
          greeting: 'Hi! How can I help you today?'
        };
        // Update title if available
        const title = this.shadow.querySelector('.jarvis-title');
        if (title && this.botConfig.name) {
          title.textContent = this.botConfig.name;
        }
      } catch (error) {
        console.error('Failed to load bot config:', error);
      }
    }

    open() {
      this.isOpen = true;
      const window = this.shadow.getElementById('window');
      window.classList.remove('hidden');
      
      // Show greeting on first open
      if (this.messages.length === 0) {
        const greeting = this.botConfig?.settings?.greeting || 'Hello! How can I help you today?';
        this.addMessage(greeting, 'bot');
      }
      
      this.shadow.getElementById('input').focus();
    }

    close() {
      this.isOpen = false;
      const window = this.shadow.getElementById('window');
      window.classList.add('hidden');
    }

    addMessage(text, sender) {
      const messagesEl = this.shadow.getElementById('messages');
      const messageEl = document.createElement('div');
      messageEl.className = `jarvis-message ${sender}`;
      messageEl.textContent = text;
      messagesEl.appendChild(messageEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      
      this.messages.push({ text, sender, timestamp: new Date() });
    }

    async sendMessage() {
      const input = this.shadow.getElementById('input');
      const send = this.shadow.getElementById('send');
      const text = input.value.trim();
      
      if (!text) return;
      
      // Add user message
      this.addMessage(text, 'user');
      input.value = '';
      send.disabled = true;
      
      try {
        const response = await fetch(`${API_URL}/functions/v1/chat-completion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aHZkdmZpc2x4bHBqZWFtcWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1OTk2ODIsImV4cCI6MjA3MjE3NTY4Mn0.gNXjyO-gpmg2jIPVmX3lmmXAetmDHmGzJNohs_rFBmQ`
          },
          body: JSON.stringify({
            botId: BOT_ID,
            message: text,
            conversationId: this.conversationId
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          this.conversationId = data.conversationId;
          this.addMessage(data.message, 'bot');
        } else {
          throw new Error('Failed to get response');
        }
      } catch (error) {
        console.error('Chat error:', error);
        this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
      } finally {
        send.disabled = false;
      }
    }
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new JarvisWidget());
  } else {
    new JarvisWidget();
  }
})();