// Fix Google Places Autocomplete dropdown - CONSOLIDATED APPROACH
// Single capture-phase event handler to prevent dialog closing

// Global flag to track if the global handler is installed
let globalHandlerInstalled = false;

// Install global capture-phase handler ONCE at app startup
const installGlobalHandler = () => {
  if (globalHandlerInstalled) return;
  
  // Capture phase runs BEFORE any other handlers
  // This ensures we catch the event before Dialog's onInteractOutside
  const handler = (e) => {
    const target = e.target;
    
    // Check if click is on Google Places dropdown
    if (target && (
      target.closest('.pac-container') ||
      target.closest('.pac-item') ||
      target.classList?.contains('pac-container') ||
      target.classList?.contains('pac-item') ||
      target.classList?.contains('pac-item-query') ||
      target.classList?.contains('pac-matched') ||
      target.classList?.contains('pac-icon')
    )) {
      // Stop the event from reaching Dialog's onInteractOutside
      e.stopPropagation();
      // Don't prevent default - let the selection happen
    }
  };
  
  // Use capture: true to run BEFORE bubble phase handlers
  document.addEventListener('mousedown', handler, true);
  document.addEventListener('pointerdown', handler, true);
  document.addEventListener('touchstart', handler, true);
  
  globalHandlerInstalled = true;
  console.log('✅ Google Places global click handler installed');
};

// Auto-install on module load
if (typeof window !== 'undefined') {
  // Install immediately if DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    installGlobalHandler();
  } else {
    document.addEventListener('DOMContentLoaded', installGlobalHandler);
  }
}

export const initAutocompleteWithFix = (inputElement, options = {}) => {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error('Google Maps API not loaded');
    return null;
  }

  // Ensure global handler is installed
  installGlobalHandler();

  const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
    componentRestrictions: { country: 'nz' },
    ...options
  });

  // Simple repositioning function
  const repositionDropdown = () => {
    requestAnimationFrame(() => {
      const pacContainers = document.querySelectorAll('.pac-container');
      const inputRect = inputElement.getBoundingClientRect();
      
      pacContainers.forEach(container => {
        if (container.style.display !== 'none') {
          container.style.position = 'fixed';
          container.style.left = `${inputRect.left}px`;
          container.style.top = `${inputRect.bottom + 2}px`;
          container.style.width = `${inputRect.width}px`;
          container.style.zIndex = '999999';
        }
      });
    });
  };

  // Attach listeners
  inputElement.addEventListener('focus', repositionDropdown);
  inputElement.addEventListener('input', repositionDropdown);
  
  // Reposition on scroll/resize
  const scrollHandler = () => repositionDropdown();
  window.addEventListener('scroll', scrollHandler, { passive: true });
  window.addEventListener('resize', scrollHandler, { passive: true });

  return {
    autocomplete,
    cleanup: () => {
      inputElement.removeEventListener('focus', repositionDropdown);
      inputElement.removeEventListener('input', repositionDropdown);
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('resize', scrollHandler);
    }
  };
};

export default initAutocompleteWithFix;
