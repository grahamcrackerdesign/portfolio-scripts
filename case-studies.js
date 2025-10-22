
// Calculate and adjust badge visibility based on available space
function calculateBadgeVisibility() {
  const workTypeCells = document.querySelectorAll('.file_explorer-cell.is-work_type');
  
  workTypeCells.forEach(cell => {
    const allBadges = Array.from(cell.querySelectorAll('.badge'));
    const plusBadge = cell.querySelector('.badge.is-hidden');
    
    if (!plusBadge) return;
    
    const badges = allBadges.filter(badge => badge !== plusBadge);
    if (badges.length === 0) return;
    
    // Reset: show all regular badges, hide plus badge
    badges.forEach(badge => badge.style.display = '');
    plusBadge.style.display = 'none';
    
    // Measure available space
    const availableWidth = cell.offsetWidth - parseFloat(getComputedStyle(cell).paddingLeft) - parseFloat(getComputedStyle(cell).paddingRight);
    
    // Measure plus badge width
    plusBadge.style.display = '';
    const plusWidth = plusBadge.offsetWidth + parseFloat(getComputedStyle(plusBadge).marginLeft) + parseFloat(getComputedStyle(plusBadge).marginRight);
    plusBadge.style.display = 'none';
    
    // Measure each badge width
    const badgeWidths = badges.map(b => b.offsetWidth + parseFloat(getComputedStyle(b).marginLeft) + parseFloat(getComputedStyle(b).marginRight));
    const totalWidth = badgeWidths.reduce((sum, w) => sum + w, 0);
    
    // If everything fits, done
    if (totalWidth <= availableWidth) return;
    
    // Find how many badges fit with the plus badge
    let currentWidth = plusWidth;
    let visibleCount = 0;
    
    for (let i = 0; i < badges.length; i++) {
      if (currentWidth + badgeWidths[i] <= availableWidth) {
        currentWidth += badgeWidths[i];
        visibleCount++;
      } else {
        break;
      }
    }
    
    // Apply visibility
    if (visibleCount < badges.length) {
      for (let i = visibleCount; i < badges.length; i++) {
        badges[i].style.display = 'none';
      }
      plusBadge.style.display = '';
      (plusBadge.querySelector('p') || plusBadge).textContent = `+${badges.length - visibleCount}`;
    }
  });
}

// Debounce function to limit how often resize calculations happen
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Update button styles based on active row
function updateRowButtons() {
  const rows = document.querySelectorAll('.file_explorer-row[data-preview]');
  
  rows.forEach(row => {
    const button = row.querySelector('.button');
    
    if (button) {
      if (row.classList.contains('is-active')) {
        button.classList.add('is-dark');
      } else {
        button.classList.remove('is-dark');
      }
    }
  });
}

// Toggle file explorer preview visibility
function toggleFileExplorer(triggerButton) {
  const preview = document.querySelector('.file_explorer-preview');
  
  if (!preview) {
    console.error('Element with class .file_explorer-preview not found');
    return;
  }
  
  // Toggle visibility of preview element
  const isCurrentlyVisible = preview.style.display !== 'none';
  preview.style.display = isCurrentlyVisible ? 'none' : 'flex';
  
  // Toggle both classes together on trigger button
  triggerButton.classList.toggle('is-ghost');
  triggerButton.classList.toggle('is-dark');
  
  // Update button text
  const textDiv = triggerButton.querySelector('div:last-child');
  if (textDiv) {
    textDiv.textContent = isCurrentlyVisible ? 'Show Details' : 'Hide Details';
  }
  
  // Recalculate badge visibility after toggle
  setTimeout(calculateBadgeVisibility, 1);
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialize toggle button
  const triggerButton = document.getElementById('toggle-details');
  
  if (triggerButton) {
    triggerButton.addEventListener('click', () => {
      toggleFileExplorer(triggerButton);
    });
  }

  // Remove transform from animated card
  setTimeout(() => {
    const card = document.querySelector('.file_explorer-card');
    if (card) {
      card.style.transform = '';
      card.style.transformStyle = '';
    }
  }, 1000);

  // Get all rows and preview items
  const rows = document.querySelectorAll('.file_explorer-row[data-preview]');
  const previewItems = document.querySelectorAll('.file_explorer-preview_item');

  // Add hover listeners to all rows
  rows.forEach(row => {
    row.addEventListener('mouseenter', function() {
      const targetValue = this.getAttribute('data-preview');
      
      if (targetValue) {
        // Remove active state from all rows
        rows.forEach(r => {
          r.classList.remove('is-active');
        });
        
        // Add active state to current row
        this.classList.add('is-active');
        
        // Update button styles
        updateRowButtons();
        
        // Hide all preview items
        previewItems.forEach(item => {
          item.style.display = 'none';
        });
        
        // Show the matching preview item
        const matchingPreview = document.querySelector(`.file_explorer-preview_item[data-preview="${targetValue}"]`);
        if (matchingPreview) {
          matchingPreview.style.display = 'block';
        }
      }
    });
  });
  
  // Initialize: Set workmax as default
  const workmaxRow = document.querySelector('.file_explorer-row[data-preview="workmax"]');
  const workmaxPreview = document.querySelector('.file_explorer-preview_item[data-preview="workmax"]');
  
  if (workmaxRow && workmaxPreview) {
    // Remove is-active from all rows first
    rows.forEach(r => r.classList.remove('is-active'));
    // Add to workmax row
    workmaxRow.classList.add('is-active');
    
    // Update button styles
    updateRowButtons();
    
    // Hide all previews
    previewItems.forEach(item => item.style.display = 'none');
    // Show workmax preview
    workmaxPreview.style.display = 'block';
  }

  // Initialize folder visibility based on .is-open class on the FOLDER WRAPPER
  const allFolders = document.querySelectorAll('.file_explorer-folder');
  
  allFolders.forEach(folder => {
    const folderFiles = folder.querySelector('.file_explorer-folder_files');
    const folderRow = folder.querySelector('.file_explorer-row.is-folder');
    const toggle = folder.querySelector('.file_explorer-cell.is-clickable.is-icon');
    
    if (folderFiles && folderRow) {
      if (folder.classList.contains('is-open')) {
        // Show folder files if wrapper has is-open
        folderFiles.style.display = 'block';
        // Add is-open to the folder row
        folderRow.classList.add('is-open');
        // Set icon states
        if (toggle) {
          const openIcon = toggle.querySelector('.file_explorer-folder_icon.is-open');
          const closedIcon = toggle.querySelector('.file_explorer-folder_icon.is-closed');
          if (openIcon) openIcon.style.display = 'block';
          if (closedIcon) closedIcon.style.display = 'none';
        }
      } else {
        // Hide folder files if wrapper doesn't have is-open
        folderFiles.style.display = 'none';
        // Remove is-open from the folder row
        folderRow.classList.remove('is-open');
        // Set icon states
        if (toggle) {
          const openIcon = toggle.querySelector('.file_explorer-folder_icon.is-open');
          const closedIcon = toggle.querySelector('.file_explorer-folder_icon.is-closed');
          if (openIcon) openIcon.style.display = 'none';
          if (closedIcon) closedIcon.style.display = 'block';
        }
      }
    }
  });

  // Folder toggle functionality
  const folderToggles = document.querySelectorAll('.file_explorer-row.is-folder');
  
  folderToggles.forEach(folderRow => {
    folderRow.addEventListener('click', function(e) {
      // Prevent row click from propagating
      e.stopPropagation();
      
      // Find the corresponding folder_files within the same parent folder
      const folder = folderRow.parentElement;
      const folderFiles = folder.querySelector('.file_explorer-folder_files');
      const toggle = folderRow.querySelector('.file_explorer-cell.is-clickable.is-icon');
      
      // Toggle the display
      if (folderFiles) {
        if (folderFiles.style.display === 'none') {
          folderFiles.style.display = 'block';
          folder.classList.add('is-open');
          // Add is-open to the folder row
          folderRow.classList.add('is-open');
          // Toggle folder icons
          if (toggle) {
            const openIcon = toggle.querySelector('.file_explorer-folder_icon.is-open');
            const closedIcon = toggle.querySelector('.file_explorer-folder_icon.is-closed');
            if (openIcon) openIcon.style.display = 'block';
            if (closedIcon) closedIcon.style.display = 'none';
          }
        } else {
          folderFiles.style.display = 'none';
          folder.classList.remove('is-open');
          // Remove is-open from the folder row
          folderRow.classList.remove('is-open');
          // Toggle folder icons
          if (toggle) {
            const openIcon = toggle.querySelector('.file_explorer-folder_icon.is-open');
            const closedIcon = toggle.querySelector('.file_explorer-folder_icon.is-closed');
            if (openIcon) openIcon.style.display = 'none';
            if (closedIcon) closedIcon.style.display = 'block';
          }
        }
        
        // Recalculate badges after folder animation
        setTimeout(calculateBadgeVisibility, 1);
      }
    });
  });
  
  // Initial badge visibility calculation - use ResizeObserver to detect when cells are stable
  const workTypeCells = document.querySelectorAll('.file_explorer-cell.is-work_type');
  
  if (workTypeCells.length > 0) {
    let resizeTimeout;
    const resizeObserver = new ResizeObserver(() => {
      // Debounce the callback to avoid too many calculations during animation
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        calculateBadgeVisibility();
      }, 1);
    });
    
    // Observe the first work type cell - when it stabilizes, all should be ready
    resizeObserver.observe(workTypeCells[0]);
    
    // After first calculation, we can disconnect
    setTimeout(() => {
      resizeObserver.disconnect();
    }, 1);
  }
  
  // Also run once with fallback
  setTimeout(calculateBadgeVisibility, 1);
  
  // Recalculate on window resize with debouncing
  window.addEventListener('resize', debounce(calculateBadgeVisibility, 1));
});
