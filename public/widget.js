(function() {
  const script = document.currentScript;
  const botId = script.getAttribute('data-bot-id');
  const primaryColor = script.getAttribute('data-primary-color') || '#0ea5e9';
  const position = script.getAttribute('data-position') || 'bottom-right';
  const greeting = script.getAttribute('data-greeting') || 'Hi! How can I help you today?';

  if (!botId) {
    console.error('Jarvis Widget: bot-id is required');
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    position: fixed;
    bottom: 0;
    ${position === 'bottom-right' ? 'right: 0' : 'left: 0'};
    width: 100%;
    height: 100%;
    border: none;
    z-index: 999999;
    pointer-events: none;
  `;
  
  const params = new URLSearchParams({
    botId,
    primaryColor,
    position,
    greeting,
  });
  
  iframe.src = `${window.location.protocol}//${window.location.host}/widget?${params}`;
  
  iframe.onload = function() {
    iframe.contentWindow.postMessage({ type: 'JARVIS_INIT', botId, primaryColor, position, greeting }, '*');
  };
  
  document.body.appendChild(iframe);

  window.addEventListener('message', function(event) {
    if (event.data.type === 'JARVIS_TOGGLE') {
      iframe.style.pointerEvents = event.data.isOpen ? 'auto' : 'none';
    }
  });
})();