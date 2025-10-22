<script>
document.addEventListener('DOMContentLoaded', function() {
  // Configuration - easily change these class names
  const LIGHTBOX_IMAGE_CLASS = 'lightbox-image';
  const LIGHTBOX_BUTTON_CLASS = 'lightbox-document'; // For buttons that open documents
  const LIGHTBOX_CONTENT_CLASS = 'lightbox-content-trigger'; // For buttons that open custom content
  const LIGHTBOX_CONTAINER_CLASS = 'lightbox-item'; // Optional: container class for grouped visibility
  const LIGHTBOX_CLOSE_ATTRIBUTE = 'data-lightbox-close'; // Attribute for custom close buttons
  
  // Get all images with the lightbox class that are visible
  const allLightboxImages = Array.from(document.querySelectorAll(`.${LIGHTBOX_IMAGE_CLASS}`));
  const images = allLightboxImages.filter(img => {
    // Check if there's a specific container class to use for visibility
    const container = img.closest(`.${LIGHTBOX_CONTAINER_CLASS}`);
    
    const isVisible = container ? 
      container.offsetParent !== null : 
      img.offsetParent !== null;
    
    // Debug logging for each image
    console.log('Image:', img.src || img.getAttribute('src') || 'no src', 'Visible:', isVisible, img);
    
    return isVisible;
  });
  
  // Get all document buttons
  const documentButtons = Array.from(document.querySelectorAll(`.${LIGHTBOX_BUTTON_CLASS}`)).filter(btn => {
    const container = btn.closest(`.${LIGHTBOX_CONTAINER_CLASS}`);
    if (container) {
      return container.offsetParent !== null;
    } else {
      // For mobile menus, check if element exists in DOM rather than strict visibility
      return btn.closest('body') !== null;
    }
  });
  
  // Get all custom content triggers
  const contentTriggers = Array.from(document.querySelectorAll(`.${LIGHTBOX_CONTENT_CLASS}`)).filter(btn => {
    const container = btn.closest(`.${LIGHTBOX_CONTAINER_CLASS}`);
    if (container) {
      return container.offsetParent !== null;
    } else {
      // For mobile menus, check if element exists in DOM rather than strict visibility
      return btn.closest('body') !== null;
    }
  });
  
  // Only use images for the navigable gallery
  const allItems = [...images];
  
  // Debug logging - remove this later
  console.log('Debug - Image gallery items:', allItems.length);
  console.log('Images:', images.length, images);
  console.log('Document buttons (standalone):', documentButtons.length, documentButtons);
  console.log('Content triggers (standalone):', contentTriggers.length, contentTriggers);
  
  // Exit early if no lightbox items found
  if (allItems.length === 0 && documentButtons.length === 0 && contentTriggers.length === 0) return;
  
  let currentIndex = 0;
  let currentContentType = 'image'; // 'image', 'document', or 'content'
  
  // Zoom functionality variables
  let isZoomed = false;
  let zoomLevel = 1;
  let isDragging = false;
  let hasMoved = false; // Track if mouse has actually moved
  let startX, startY, currentX = 0, currentY = 0;
  
  // Create lightbox overlay
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.75);
    display: none;
    z-index: 9999;
    padding: 20px;
    box-sizing: border-box;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  const content = document.createElement('div');
  content.className = 'lightbox-content';
  content.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  `;
  
  const lightboxImg = document.createElement('img');
  lightboxImg.className = 'lightbox-main-image';
  lightboxImg.style.cssText = `
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    display: block;
    opacity: 0;
    transform: scale(0.9);
    transition: all 0.3s ease;
    cursor: zoom-in;
  `;
  
  // Create iframe for documents
  const lightboxIframe = document.createElement('iframe');
  lightboxIframe.className = 'lightbox-document-frame';
  lightboxIframe.style.cssText = `
    width: 90%;
    height: 90%;
    border: none;
    display: none;
    opacity: 0;
    transform: scale(0.9);
    transition: all 0.3s ease;
    background: white;
    border-radius: 8px;
  `;
  
  // Create container for custom content
  const lightboxContentContainer = document.createElement('div');
  lightboxContentContainer.className = 'lightbox-custom-content';
  lightboxContentContainer.style.cssText = `
    max-width: 90%;
    max-height: 90%;
    overflow-y: auto;
    display: none;
    opacity: 0;
    transform: scale(0.9);
    transition: all 0.3s ease;
    background: white;
    border-radius: 0px;
    padding: 0;
    position: relative;
  `;
  
  // Add zoom functionality (only for images)
  lightboxImg.addEventListener('click', function(e) {
    e.stopPropagation();
    if (currentContentType === 'image' && !hasMoved) {
      toggleZoom();
    }
    hasMoved = false;
  });
  
  lightboxImg.addEventListener('dblclick', function(e) {
    e.stopPropagation();
    if (currentContentType === 'image' && !isZoomed) toggleZoom();
  });
  
  // Mouse events for panning when zoomed (only for images)
  lightboxImg.addEventListener('mousedown', function(e) {
    if (currentContentType === 'image' && isZoomed) {
      isDragging = true;
      hasMoved = false;
      startX = e.clientX - currentX;
      startY = e.clientY - currentY;
      lightboxImg.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });
  
  document.addEventListener('mousemove', function(e) {
    if (isDragging && isZoomed && currentContentType === 'image') {
      hasMoved = true;
      currentX = e.clientX - startX;
      currentY = e.clientY - startY;
      lightboxImg.style.transition = 'none'; // Remove transition during panning
      updateImageTransform();
    }
  });
  
  document.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      if (currentContentType === 'image') {
        lightboxImg.style.cursor = isZoomed ? 'zoom-out' : 'zoom-in';
      }
    }
  });
  
  // Touch events for mobile panning (only for images)
  lightboxImg.addEventListener('touchstart', function(e) {
    if (currentContentType === 'image' && isZoomed && e.touches.length === 1) {
      isDragging = true;
      hasMoved = false;
      startX = e.touches[0].clientX - currentX;
      startY = e.touches[0].clientY - currentY;
      e.preventDefault();
    }
  });
  
  lightboxImg.addEventListener('touchmove', function(e) {
    if (isDragging && isZoomed && currentContentType === 'image' && e.touches.length === 1) {
      hasMoved = true;
      currentX = e.touches[0].clientX - startX;
      currentY = e.touches[0].clientY - startY;
      lightboxImg.style.transition = 'none'; // Remove transition during panning
      updateImageTransform();
      e.preventDefault();
    }
  });
  
  lightboxImg.addEventListener('touchend', function() {
    if (isDragging) {
      isDragging = false;
    }
  });
  
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close-btn button is-icon_only';
  closeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" style="width: 16px; height: 16px;">
      <rect width="256" height="256" fill="none"></rect>
      <line x1="200" y1="56" x2="56" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"></line>
      <line x1="200" y1="200" x2="56" y2="56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"></line>
    </svg>
  `;
  // Only set positioning and animation styles
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '20px';
  closeBtn.style.right = '20px';
  closeBtn.style.zIndex = '9998';
  closeBtn.style.opacity = '0';
  closeBtn.style.transform = 'translateY(-10px)';
  closeBtn.style.transition = 'all 0.3s ease';
  
  // Previous arrow
  const prevBtn = document.createElement('button');
  prevBtn.className = 'lightbox-prev-btn button is-icon_only ';
  prevBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" style="width: 16px; height: 16px;">
      <rect width="256" height="256" fill="none"/>
      <line x1="216" y1="128" x2="40" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/>
      <polyline points="112 56 40 128 112 200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/>
    </svg>
  `;
  
  // Next arrow
  const nextBtn = document.createElement('button');
  nextBtn.className = 'lightbox-next-btn button is-icon_only ';
  nextBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" style="width: 16px; height: 16px;">
      <rect width="256" height="256" fill="none"/>
      <line x1="40" y1="128" x2="216" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/>
      <polyline points="144 56 216 128 144 200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/>
    </svg>
  `;
  
  // Function to set responsive button positioning
  function setButtonPositions() {
    const isMobile = window.innerWidth <= 768;
    
    // Only set positioning styles, let CSS classes handle everything else
    if (isMobile) {
      prevBtn.style.position = 'absolute';
      prevBtn.style.left = '20px';
      prevBtn.style.bottom = '60px';
      prevBtn.style.top = 'auto';
      prevBtn.style.transform = 'translateY(10px)';
      prevBtn.style.zIndex = '9998';
      prevBtn.style.opacity = '0';
      prevBtn.style.transition = 'all 0.3s ease';
      
      nextBtn.style.position = 'absolute';
      nextBtn.style.right = '20px';
      nextBtn.style.bottom = '60px';
      nextBtn.style.top = 'auto';
      nextBtn.style.transform = 'translateY(10px)';
      nextBtn.style.zIndex = '9998';
      nextBtn.style.opacity = '0';
      nextBtn.style.transition = 'all 0.3s ease';
    } else {
      prevBtn.style.position = 'absolute';
      prevBtn.style.left = '20px';
      prevBtn.style.top = '50%';
      prevBtn.style.bottom = 'auto';
      prevBtn.style.transform = 'translateY(-50%) translateX(-20px)';
      prevBtn.style.zIndex = '9998';
      prevBtn.style.opacity = '0';
      prevBtn.style.transition = 'all 0.3s ease';
      
      nextBtn.style.position = 'absolute';
      nextBtn.style.right = '20px';
      nextBtn.style.top = '50%';
      nextBtn.style.bottom = 'auto';
      nextBtn.style.transform = 'translateY(-50%) translateX(20px)';
      nextBtn.style.zIndex = '9998';
      nextBtn.style.opacity = '0';
      nextBtn.style.transition = 'all 0.3s ease';
    }
  }
  
  // Image counter
  const counter = document.createElement('div');
  counter.className = 'lightbox-counter';
  counter.style.cssText = `
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-10px);
    background: var(--surface--secondary-button);
    color: var(--surface--secondary-button-text);
    padding: 6px 12px;
    border-radius: 16px;
    border: 1px solid var(--surface--secondary-button-border);
    font-size: 12px;
    z-index: 9998;
    font-weight: 500;
    opacity: 0;
    transition: all 0.3s ease;
  `;
  
  setButtonPositions();
  window.addEventListener('resize', setButtonPositions);
  
  // Assemble lightbox
  content.appendChild(lightboxImg);
  content.appendChild(lightboxIframe);
  content.appendChild(lightboxContentContainer);
  content.appendChild(closeBtn);
  content.appendChild(prevBtn);
  content.appendChild(nextBtn);
  content.appendChild(counter);
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  
  // Zoom functions
  function toggleZoom() {
    if (!isZoomed) {
      // Calculate actual zoom needed to show full size
      const imgRect = lightboxImg.getBoundingClientRect();
      const naturalWidth = lightboxImg.naturalWidth;
      const naturalHeight = lightboxImg.naturalHeight;
      const displayWidth = imgRect.width;
      const displayHeight = imgRect.height;
      
      // Calculate zoom level needed for actual size
      const widthRatio = naturalWidth / displayWidth;
      const heightRatio = naturalHeight / displayHeight;
      zoomLevel = Math.max(widthRatio, heightRatio);
      
      // Limit maximum zoom to prevent excessive scaling
      zoomLevel = Math.min(zoomLevel, 5); // Max 5x zoom
      
      isZoomed = true;
      lightboxImg.style.cursor = 'zoom-out';
      lightboxImg.style.transition = 'transform 0.3s ease';
    } else {
      // Zoom out
      zoomLevel = 1;
      currentX = 0;
      currentY = 0;
      isZoomed = false;
      lightboxImg.style.cursor = 'zoom-in';
      lightboxImg.style.transition = 'transform 0.3s ease';
    }
    updateImageTransform();
  }
  
  function updateImageTransform() {
    lightboxImg.style.transform = `scale(${zoomLevel}) translate(${currentX/zoomLevel}px, ${currentY/zoomLevel}px)`;
  }
  
  function resetZoom() {
    isZoomed = false;
    zoomLevel = 1;
    currentX = 0;
    currentY = 0;
    hasMoved = false;
    lightboxImg.style.cursor = 'zoom-in';
    lightboxImg.style.transition = 'all 0.3s ease';
    lightboxImg.style.transform = 'scale(1)';
  }
  
  // Animation functions
  function showLightbox() {
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      
      setTimeout(() => {
        if (currentContentType === 'image') {
          lightboxImg.style.opacity = '1';
          lightboxImg.style.transform = 'scale(1)';
        } else if (currentContentType === 'document') {
          lightboxIframe.style.opacity = '1';
          lightboxIframe.style.transform = 'scale(1)';
        } else if (currentContentType === 'content') {
          lightboxContentContainer.style.opacity = '1';
          lightboxContentContainer.style.transform = 'scale(1)';
        }
        
        closeBtn.style.opacity = '1';
        closeBtn.style.transform = 'translateY(0)';
        
        counter.style.opacity = '1';
        counter.style.transform = 'translateX(-50%) translateY(0)';
        
        const isMobile = window.innerWidth <= 768;
        prevBtn.style.opacity = '1';
        nextBtn.style.opacity = '1';
        
        if (isMobile) {
          prevBtn.style.transform = 'translateY(0)';
          nextBtn.style.transform = 'translateY(0)';
        } else {
          prevBtn.style.transform = 'translateY(-50%) translateX(0)';
          nextBtn.style.transform = 'translateY(-50%) translateX(0)';
        }
      }, 50);
    });
  }
  
  function hideLightbox() {
  resetZoom();
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  
  // Clear iframe source and custom content
  lightboxIframe.src = '';
  lightboxContentContainer.innerHTML = '';
  
  // Reverse animations
  lightboxImg.style.opacity = '0';
  lightboxImg.style.transform = 'scale(0.9)';
  lightboxIframe.style.opacity = '0';
  lightboxIframe.style.transform = 'scale(0.9)';
  lightboxContentContainer.style.opacity = '0';
  lightboxContentContainer.style.transform = 'scale(0.9)';
  
  closeBtn.style.opacity = '0';
  closeBtn.style.transform = 'translateY(-10px)';
  
  counter.style.opacity = '0';
  counter.style.transform = 'translateX(-50%) translateY(-10px)';
  
  const isMobile = window.innerWidth <= 768;
  prevBtn.style.opacity = '0';
  nextBtn.style.opacity = '0';
  
  if (isMobile) {
    prevBtn.style.transform = 'translateY(10px)';
    nextBtn.style.transform = 'translateY(10px)';
  } else {
    prevBtn.style.transform = 'translateY(-50%) translateX(-20px)';
    nextBtn.style.transform = 'translateY(-50%) translateX(20px)';
  }
  
  overlay.style.opacity = '0';
  setTimeout(() => {
    overlay.style.display = 'none';
    closeBtn.style.display = 'flex'; // ← Reset AFTER animation completes
  }, 300);
}

  
  // Update lightbox content
  function updateLightbox() {
    const currentItem = allItems[currentIndex];
    
    resetZoom();
    
    // Hide all content types first
    lightboxImg.style.display = 'none';
    lightboxIframe.style.display = 'none';
    lightboxContentContainer.style.display = 'none';
    
    // Show the appropriate content type
    if (currentItem.classList.contains(LIGHTBOX_IMAGE_CLASS)) {
      currentContentType = 'image';
      const src = currentItem.getAttribute('data-lightbox-image') || currentItem.src;
      lightboxImg.src = src;
      lightboxImg.alt = currentItem.alt || '';
      lightboxImg.style.display = 'block';
      
    } else if (currentItem.classList.contains(LIGHTBOX_BUTTON_CLASS)) {
      currentContentType = 'document';
      const docUrl = currentItem.getAttribute('data-document-url');
      if (docUrl) {
        lightboxIframe.src = docUrl;
        lightboxIframe.style.display = 'block';
      }
      
    } else if (currentItem.classList.contains(LIGHTBOX_CONTENT_CLASS)) {
      currentContentType = 'content';
      const contentId = currentItem.getAttribute('data-lightbox-content');
      const sourceContent = document.querySelector(`[data-lightbox-target="${contentId}"]`);
      if (sourceContent) {
        const clonedContent = sourceContent.cloneNode(true);
        clonedContent.style.display = 'block'; // Make sure cloned content is visible
        lightboxContentContainer.innerHTML = '';
        lightboxContentContainer.appendChild(clonedContent);
        lightboxContentContainer.style.display = 'block';
      }
    }
    
    counter.textContent = `${currentIndex + 1} / ${allItems.length}`;
    
    prevBtn.style.display = allItems.length <= 1 ? 'none' : 'flex';
    nextBtn.style.display = allItems.length <= 1 ? 'none' : 'flex';
    counter.style.display = allItems.length <= 1 ? 'none' : 'block';
  }
  
  function goToPrevious() {
    currentIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    updateLightbox();
  }
  
  function goToNext() {
    currentIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    updateLightbox();
  }
  
  // Click handlers for images
  images.forEach(function(img, index) {
    img.style.cursor = 'pointer';
    img.addEventListener('click', function(e) {
      e.preventDefault();
      currentIndex = allItems.indexOf(img);
      currentContentType = 'image';
      const src = this.getAttribute('data-lightbox-image') || this.src;
      
      // Hide other content types
      lightboxIframe.style.display = 'none';
      lightboxContentContainer.style.display = 'none';
      
      // Set up image
      lightboxImg.src = src;
      lightboxImg.alt = this.alt || '';
      lightboxImg.style.display = 'block';
      counter.textContent = `${currentIndex + 1} / ${allItems.length}`;
      
      prevBtn.style.display = allItems.length <= 1 ? 'none' : 'flex';
      nextBtn.style.display = allItems.length <= 1 ? 'none' : 'flex';
      counter.style.display = allItems.length <= 1 ? 'none' : 'block';
      
      showLightbox();
    });
  });
  
  // Click handlers for document buttons
  documentButtons.forEach(function(btn) {
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      currentIndex = allItems.indexOf(btn);
      const docUrl = this.getAttribute('data-document-url');
      
      if (docUrl) {
        currentContentType = 'document';
        
        // Hide other content types
        lightboxImg.style.display = 'none';
        lightboxContentContainer.style.display = 'none';
        
        // Set up iframe
        lightboxIframe.src = docUrl;
        lightboxIframe.style.display = 'block';
        
        // Hide navigation for standalone documents
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        counter.style.display = 'none';
        
        showLightbox();
      }
    });
  });
  
  // Click handlers for custom content triggers
  contentTriggers.forEach(function(btn) {
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      currentIndex = allItems.indexOf(btn);
      const contentId = this.getAttribute('data-lightbox-content');
      const sourceContent = document.querySelector(`[data-lightbox-target="${contentId}"]`);
      
      if (sourceContent) {
        currentContentType = 'content';
        
        // Hide other content types
        lightboxImg.style.display = 'none';
        lightboxIframe.style.display = 'none';
        
        // Set up custom content
        const clonedContent = sourceContent.cloneNode(true);
        clonedContent.style.display = 'block';
        lightboxContentContainer.innerHTML = '';
        lightboxContentContainer.appendChild(clonedContent);
        lightboxContentContainer.style.display = 'block';
        
        // Hide the default X button for custom content
        closeBtn.style.display = 'none';
        
        // Attach click handlers to custom close buttons within the content
        const customCloseButtons = lightboxContentContainer.querySelectorAll(`[${LIGHTBOX_CLOSE_ATTRIBUTE}]`);
        customCloseButtons.forEach(function(customBtn) {
          customBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hideLightbox();
          });
        });
        
        // Hide navigation for standalone custom content
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        counter.style.display = 'none';
        
        showLightbox();
      }
    });
  });
  
  prevBtn.addEventListener('click', goToPrevious);
  nextBtn.addEventListener('click', goToNext);
  closeBtn.addEventListener('click', hideLightbox);
  
  overlay.addEventListener('click', function(e) {
    // Only close if we're not dragging and didn't just finish dragging
    if (!isDragging && !hasMoved) {
      if (e.target === overlay || e.target === content) {
        hideLightbox();
      }
    }
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (overlay.style.display === 'block') {
      switch(e.key) {
        case 'Escape':
          hideLightbox();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
      }
    }
  });
});
</script>
