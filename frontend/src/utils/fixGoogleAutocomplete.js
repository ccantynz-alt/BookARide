// Fix Google Places Autocomplete dropdown positioning and click handling
// This utility ensures dropdowns appear directly under input fields
// and prevents focus loss when clicking dropdown items

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

  // CRITICAL FIX: Prevent mousedown on pac-container from causing input blur
  // This fixes the issue where clicking the dropdown causes the form to "disappear"
  const preventBlurOnDropdownClick = (e) => {
    // Check if the click target is inside a pac-container (Google's dropdown)
    if (e.target.closest('.pac-container')) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Add mousedown listener to document to catch dropdown clicks before blur
  document.addEventListener('mousedown', preventBlurOnDropdownClick, true);

  // Also add touchstart for mobile devices
  document.addEventListener('touchstart', preventBlurOnDropdownClick, true);

  // Attach listeners to input
  inputElement.addEventListener('focus', repositionDropdown);
  inputElement.addEventListener('input', repositionDropdown);
  inputElement.addEventListener('keydown', repositionDropdown);
  
  // Reposition on scroll
  window.addEventListener('scroll', repositionDropdown, { passive: true });
  window.addEventListener('resize', repositionDropdown, { passive: true });

  // Watch for dropdown creation and add click prevention to new pac-containers
  const observer = new MutationObserver((mutations) => {
    repositionDropdown();
    
    // Ensure pac-containers have proper event handling
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.classList && node.classList.contains('pac-container')) {
          // Prevent mousedown from blurring the input
          node.addEventListener('mousedown', (e) => {
            e.preventDefault();
          });
          node.addEventListener('touchstart', (e) => {
            e.preventDefault();
          }, { passive: false });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: false
  });

  // Also attach to any existing pac-containers
  document.querySelectorAll('.pac-container').forEach(container => {
    container.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
  });

  return {
    autocomplete,
    cleanup: () => {
      inputElement.removeEventListener('focus', repositionDropdown);
      inputElement.removeEventListener('input', repositionDropdown);
      inputElement.removeEventListener('keydown', repositionDropdown);
      window.removeEventListener('scroll', repositionDropdown);
      window.removeEventListener('resize', repositionDropdown);
      document.removeEventListener('mousedown', preventBlurOnDropdownClick, true);
      document.removeEventListener('touchstart', preventBlurOnDropdownClick, true);
      observer.disconnect();
    }
  };
};
