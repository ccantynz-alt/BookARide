// Fix Google Places Autocomplete dropdown positioning
// This utility ensures dropdowns appear directly under input fields

export const initAutocompleteWithFix = (inputElement, options = {}) => {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error('Google Maps API not loaded');
    return null;
  }

  const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
    componentRestrictions: { country: 'nz' },
    ...options
  });

  // Force repositioning of dropdown
  const repositionDropdown = () => {
    // Small delay to ensure pac-container is in DOM
    setTimeout(() => {
      const pacContainers = document.querySelectorAll('.pac-container');
      const inputRect = inputElement.getBoundingClientRect();
      
      pacContainers.forEach(container => {
        // Only reposition if dropdown is visible
        if (container.style.display !== 'none' && container.offsetParent !== null) {
          container.style.position = 'fixed';
          container.style.left = `${inputRect.left}px`;
          container.style.top = `${inputRect.bottom}px`;
          container.style.width = `${inputRect.width}px`;
          container.style.zIndex = '99999';
        }
      });
    }, 50);
  };

  // Attach listeners to input
  inputElement.addEventListener('focus', repositionDropdown);
  inputElement.addEventListener('input', repositionDropdown);
  inputElement.addEventListener('keydown', repositionDropdown);
  
  // Reposition on scroll
  window.addEventListener('scroll', repositionDropdown, { passive: true });
  window.addEventListener('resize', repositionDropdown, { passive: true });

  // Watch for dropdown creation
  const observer = new MutationObserver(repositionDropdown);
  observer.observe(document.body, {
    childList: true,
    subtree: false
  });

  return {
    autocomplete,
    cleanup: () => {
      inputElement.removeEventListener('focus', repositionDropdown);
      inputElement.removeEventListener('input', repositionDropdown);
      inputElement.removeEventListener('keydown', repositionDropdown);
      window.removeEventListener('scroll', repositionDropdown);
      window.removeEventListener('resize', repositionDropdown);
      observer.disconnect();
    }
  };
};
