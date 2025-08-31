/**
 * Jarvis Chat Widget - CDN Version
 * Production-ready standalone widget for external websites
 * @version 1.0.0
 */
(function() {
  'use strict';

  // Configuration
  const WIDGET_API_URL = 'https://jarvis-api.vercel.app'; // Replace with production URL
  const WIDGET_VERSION = '1.0.0';
  
  // Widget initialization
  function JarvisWidget() {
    let isOpen = false;
    let container = null;
    let chatFrame = null;
    let bubbleButton = null;
    let messageCount = 0;
    
    // Get configuration from script tag
    const script = document.currentScript || document.querySelector('script[data-jarvis-bot-id]');
    const config = {
      botId: script?.getAttribute('data-jarvis-bot-id') || script?.getAttribute('data-bot-id'),
      apiKey: script?.getAttribute('data-jarvis-api-key') || script?.getAttribute('data-api-key'),
      position: script?.getAttribute('data-position') || 'bottom-right',
      primaryColor: script?.getAttribute('data-primary-color') || '#0ea5e9',
      greeting: script?.getAttribute('data-greeting') || 'Hi! How can I help you today?',
      title: script?.getAttribute('data-title') || 'Chat with us',
      theme: script?.getAttribute('data-theme') || 'light',
      locale: script?.getAttribute('data-locale') || 'en',
      hideOnMobile: script?.getAttribute('data-hide-mobile') === 'true',
      autoOpen: script?.getAttribute('data-auto-open') === 'true',
      delay: parseInt(script?.getAttribute('data-delay') || '0', 10)
    };

    // Validate required config
    if (!config.botId) {
      console.error('[Jarvis Widget] Bot ID is required. Add data-jarvis-bot-id to the script tag.');
      return;
    }

    // Create styles
    function injectStyles() {
      const styleId = 'jarvis-widget-styles';
      if (document.getElementById(styleId)) return;

      const styles = document.createElement('style');
      styles.id = styleId;
      styles.innerHTML = `
        .jarvis-widget-container {
          position: fixed;
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        .jarvis-widget-container.bottom-right {
          bottom: 20px;
          right: 20px;
        }
        
        .jarvis-widget-container.bottom-left {
          bottom: 20px;
          left: 20px;
        }
        
        .jarvis-widget-bubble {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: ${config.primaryColor};
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .jarvis-widget-bubble:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }
        
        .jarvis-widget-bubble svg {
          width: 28px;
          height: 28px;
          fill: white;
        }
        
        .jarvis-widget-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
        }
        
        .jarvis-widget-frame {
          position: fixed;
          width: 400px;
          height: 600px;
          max-width: calc(100vw - 40px);
          max-height: calc(100vh - 100px);
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          display: none;
          flex-direction: column;
          overflow: hidden;
          animation: jarvis-slide-up 0.3s ease;
        }
        
        .jarvis-widget-frame.open {
          display: flex;
        }
        
        .jarvis-widget-frame.bottom-right {
          bottom: 90px;
          right: 20px;
        }
        
        .jarvis-widget-frame.bottom-left {
          bottom: 90px;
          left: 20px;
        }
        
        .jarvis-widget-header {
          background: ${config.primaryColor};
          color: white;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 16px 16px 0 0;
        }
        
        .jarvis-widget-title {
          font-size: 16px;
          font-weight: 600;
        }
        
        .jarvis-widget-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }
        
        .jarvis-widget-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .jarvis-widget-close svg {
          width: 16px;
          height: 16px;
          fill: white;
        }
        
        .jarvis-widget-content {
          flex: 1;
          overflow: hidden;
          background: #f9fafb;
        }
        
        .jarvis-widget-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        
        @keyframes jarvis-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 640px) {
          .jarvis-widget-frame {
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            border-radius: 0;
          }
          
          .jarvis-widget-header {
            border-radius: 0;
          }
          
          ${config.hideOnMobile ? '.jarvis-widget-container { display: none !important; }' : ''}
        }
      `;
      document.head.appendChild(styles);
    }

    // Create chat bubble
    function createBubble() {
      bubbleButton = document.createElement('button');
      bubbleButton.className = 'jarvis-widget-bubble';
      bubbleButton.setAttribute('aria-label', 'Open chat');
      bubbleButton.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L1 23l6.71-1.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.41 0-2.73-.36-3.88-.99l-.28-.15-2.91.85.85-2.91-.15-.28C4.36 14.73 4 13.41 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
          <circle cx="8" cy="12" r="1"/>
          <circle cx="12" cy="12" r="1"/>
          <circle cx="16" cy="12" r="1"/>
        </svg>
      `;
      
      bubbleButton.onclick = toggleWidget;
      return bubbleButton;
    }

    // Create chat frame
    function createChatFrame() {
      chatFrame = document.createElement('div');
      chatFrame.className = `jarvis-widget-frame ${config.position}`;
      
      chatFrame.innerHTML = `
        <div class="jarvis-widget-header">
          <div class="jarvis-widget-title">${config.title}</div>
          <button class="jarvis-widget-close" aria-label="Close chat">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="jarvis-widget-content">
          <iframe 
            class="jarvis-widget-iframe"
            src="${WIDGET_API_URL}/widget?botId=${config.botId}&apiKey=${config.apiKey || ''}&theme=${config.theme}&locale=${config.locale}&greeting=${encodeURIComponent(config.greeting)}"
            title="Jarvis Chat"
            allow="clipboard-write"
          ></iframe>
        </div>
      `;
      
      const closeButton = chatFrame.querySelector('.jarvis-widget-close');
      closeButton.onclick = closeWidget;
      
      return chatFrame;
    }

    // Toggle widget
    function toggleWidget() {
      if (isOpen) {
        closeWidget();
      } else {
        openWidget();
      }
    }

    // Open widget
    function openWidget() {
      if (!chatFrame) {
        chatFrame = createChatFrame();
        container.appendChild(chatFrame);
      }
      
      setTimeout(() => {
        chatFrame.classList.add('open');
        isOpen = true;
        
        // Send open event
        sendAnalytics('widget_opened');
        
        // Clear message badge
        const badge = bubbleButton.querySelector('.jarvis-widget-badge');
        if (badge) {
          badge.remove();
        }
        messageCount = 0;
      }, 10);
    }

    // Close widget
    function closeWidget() {
      if (chatFrame) {
        chatFrame.classList.remove('open');
        isOpen = false;
        
        // Send close event
        sendAnalytics('widget_closed');
      }
    }

    // Send analytics
    function sendAnalytics(event, data = {}) {
      if (!config.apiKey) return;
      
      fetch(`${WIDGET_API_URL}/api/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey
        },
        body: JSON.stringify({
          botId: config.botId,
          event,
          data,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer,
          userAgent: navigator.userAgent
        })
      }).catch(err => console.error('[Jarvis Widget] Analytics error:', err));
    }

    // Handle incoming messages
    function handleMessage(event) {
      if (event.origin !== WIDGET_API_URL) return;
      
      const { type, data } = event.data;
      
      switch (type) {
        case 'jarvis:new_message':
          if (!isOpen) {
            messageCount++;
            showMessageBadge();
          }
          break;
          
        case 'jarvis:resize':
          if (data.height && chatFrame) {
            chatFrame.style.height = `${Math.min(data.height, window.innerHeight - 100)}px`;
          }
          break;
          
        case 'jarvis:close':
          closeWidget();
          break;
          
        case 'jarvis:analytics':
          sendAnalytics(data.event, data.data);
          break;
      }
    }

    // Show message badge
    function showMessageBadge() {
      const existingBadge = bubbleButton.querySelector('.jarvis-widget-badge');
      if (existingBadge) {
        existingBadge.textContent = messageCount > 9 ? '9+' : messageCount;
      } else {
        const badge = document.createElement('span');
        badge.className = 'jarvis-widget-badge';
        badge.textContent = messageCount > 9 ? '9+' : messageCount;
        bubbleButton.appendChild(badge);
      }
    }

    // Initialize widget
    function init() {
      // Inject styles
      injectStyles();
      
      // Create container
      container = document.createElement('div');
      container.className = `jarvis-widget-container ${config.position}`;
      
      // Create bubble
      const bubble = createBubble();
      container.appendChild(bubble);
      
      // Add to page
      document.body.appendChild(container);
      
      // Listen for messages
      window.addEventListener('message', handleMessage);
      
      // Send init event
      sendAnalytics('widget_loaded', {
        version: WIDGET_VERSION,
        config: {
          position: config.position,
          theme: config.theme,
          locale: config.locale
        }
      });
      
      // Auto open if configured
      if (config.autoOpen && config.delay > 0) {
        setTimeout(openWidget, config.delay);
      } else if (config.autoOpen) {
        openWidget();
      }
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    
    // Public API
    window.JarvisWidget = {
      open: openWidget,
      close: closeWidget,
      toggle: toggleWidget,
      version: WIDGET_VERSION
    };
  }

  // Initialize widget
  new JarvisWidget();
})();