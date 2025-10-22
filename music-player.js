const playlist = [
  { 
    title: "House Nation - Silva Bumpa", 
    src: "https://cdn.prod.website-files.com/65c13305715ccb218843d33c/68d2ac0705d7b0adb02a9bdf_House%20Nation.mp3", 
    thumbnail: "https://cdn.prod.website-files.com/65c13305715ccb218843d33c/68d181fed125b226c4f761b5_Screenshot%202025-09-22%20130523.png",
    youtubeId: "TSnc3lXrFpE"
  },
  { 
    title: "Believe Me Boy - Sam Deeley", 
    src: "https://cdn.prod.website-files.com/65c13305715ccb218843d33c/68d2aebaeb356c08736b0317_Believe%20Me%20Boy.mp3", 
    thumbnail: "https://cdn.prod.website-files.com/65c13305715ccb218843d33c/68d181fed125b226c4f761b5_Screenshot%202025-09-22%20130523.png",
    youtubeId: "l7hT5X0_Chs"
  },
  { 
    title: "IMMACULATE SKUNK - bullet tooth", 
    src: "https://cdn.prod.website-files.com/65c13305715ccb218843d33c/68d2a99433abb52864229584_IMMACULATE%20SKANK.mp3", 
    thumbnail: "https://cdn.prod.website-files.com/65c13305715ccb218843d33c/68d181fed125b226c4f761b5_Screenshot%202025-09-22%20130523.png",
    youtubeId: "ftKpi6qU_sg"
  },
  { 
    title: "Deckard's Dream - KING BOOO!", 
    src: "https://cdn.prod.website-files.com/65c13305715ccb218843d33c/68d2aaa47353303b6c0e52bf_Deckard%27s%20Dream.mp3", 
    thumbnail: "https://cdn.prod.website-files.com/65c13305715ccb218843d33c/68d181fed125b226c4f761b5_Screenshot%202025-09-22%20130523.png",
    youtubeId: "E_MRjb_mGs4"
  }
];

let currentTrack = 0;
let audioPlayer;
let isPlaying = false;

// Function to update which track appears active in the list
function updateActiveTrack() {
  const trackItems = document.querySelectorAll('.track-item');
  
  // Remove .is-playing from all tracks
  trackItems.forEach(track => track.classList.remove('is-playing'));
  
  // Add .is-playing to the current track
  if (trackItems[currentTrack]) {
    trackItems[currentTrack].classList.add('is-playing');
  }
}

// Function to make track items clickable
function setupTrackClickHandlers() {
  const trackItems = document.querySelectorAll('.track-item');
  
  trackItems.forEach((item, index) => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      
      if (index < playlist.length) {
        // Load the track
        loadTrack(index);
        
        // ONLY play if music is already playing
        if (isPlaying) {
          audioPlayer.play().catch(error => {
            console.log('Playback failed:', error);
          });
        }
        
        // Update active track in list
        updateActiveTrack();
      }
    });
  });
}


document.addEventListener('DOMContentLoaded', function() {
  audioPlayer = document.getElementById('audio-player');
  updateTrackTitles();
  updateTrackDurations();

  if (audioPlayer) {
    audioPlayer.volume = 0.25;
    const volumeSlider = document.querySelector('.volume_slider');
    if (volumeSlider) {
      volumeSlider.value = 25;
    }
    
    loadTrack(0);
    setupTrackClickHandlers();
  }
  
  const playButtons = document.querySelectorAll('.play-btn-control');
  const progressContainer = document.getElementById('progress-container');
  const volumeSlider = document.querySelector('.volume_slider');
  const nextButton = document.getElementById('next-button');
  const prevButton = document.getElementById('prev-button');
  
  playButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
        document.getElementById('beat-viz').classList.remove('playing');
        updatePlayButtonIcons('play');
      } else {
        audioPlayer.play().catch(error => {
          console.log('Playback failed:', error);
        });
        isPlaying = true;
        document.getElementById('beat-viz').classList.add('playing');
        updatePlayButtonIcons('pause');
        updateActiveTrack(); // Add this to highlight current track when playing
      }
    });
  });

  function updatePlayButtonIcons(state) {
    const playIcons = document.querySelectorAll('#play-icon');
    const pauseIcons = document.querySelectorAll('#pause-icon');

    if (state === 'play') {
      playIcons.forEach(icon => icon.style.display = 'block');
      pauseIcons.forEach(icon => icon.style.display = 'none');
    } else {
      playIcons.forEach(icon => icon.style.display = 'none');
      pauseIcons.forEach(icon => icon.style.display = 'block');
    }
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', function(e) {
      e.preventDefault();
      nextTrack();
    });
  }
  
  if (prevButton) {
    prevButton.addEventListener('click', function(e) {
      e.preventDefault();
      prevTrack();
    });
  }
  
  if (volumeSlider) {
    volumeSlider.addEventListener('input', function(e) {
      const volume = e.target.value / 100;
      audioPlayer.volume = volume;
    });
  }
  
  if (progressContainer) {
    progressContainer.addEventListener('click', function(e) {
      const rect = progressContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percent = clickX / width;
      const duration = audioPlayer.duration;
      
      if (duration > 0) {
        audioPlayer.currentTime = duration * percent;
      }
    });
  }
  
  audioPlayer.addEventListener('timeupdate', updateProgress);
  audioPlayer.addEventListener('ended', nextTrack);
  audioPlayer.addEventListener('loadedmetadata', updateProgress);
});

function loadTrack(index) {
  if (index >= playlist.length) index = 0;
  if (index < 0) index = playlist.length - 1;
  
  const track = playlist[index];
  const audioSource = document.getElementById('audio-source');
  const titleElement = document.querySelector('.music_player_title');
  const thumbnailElement = document.getElementById('video-thumbnail');
  const linkElement = document.getElementById('video-link');
  
  if (audioSource) audioSource.src = track.src;
  if (titleElement) titleElement.textContent = track.title;
  if (thumbnailElement) thumbnailElement.src = track.thumbnail;
  
  if (linkElement && track.youtubeId) {
    linkElement.href = `https://www.youtube.com/watch?v=${track.youtubeId}`;
  }
  
  audioPlayer.load();
  currentTrack = index;
  updateActiveTrack(); // Add this to update track list highlighting
}

function nextTrack() {
  currentTrack = (currentTrack + 1) % playlist.length;
  loadTrack(currentTrack);
  if (isPlaying) {
    audioPlayer.play().catch(error => {
      console.log('Auto-play failed:', error);
    });
  }
}

function prevTrack() {
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
  loadTrack(currentTrack);
  if (isPlaying) {
    audioPlayer.play().catch(error => {
      console.log('Auto-play failed:', error);
    });
  }
}

function updateProgress() {
  const current = audioPlayer.currentTime || 0;
  const duration = audioPlayer.duration || 0;
  
  if (duration > 0) {
    const percent = (current / duration) * 100;
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
      progressBar.style.width = percent + '%';
    }
    
    const currentTime = document.getElementById('current-time');
    const totalTime = document.getElementById('total-time');
    if (currentTime) currentTime.textContent = formatTime(current);
    if (totalTime) totalTime.textContent = formatTime(duration);
  }
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Function to update track titles with real song names
function updateTrackTitles() {
  const trackItems = document.querySelectorAll('.track-item');
  
  trackItems.forEach((item, index) => {
    if (index < playlist.length) {
      const titleElement = item.querySelector('.music_player_title');
      if (titleElement) {
        titleElement.textContent = playlist[index].title;
      }
    }
  });
}



// Function to preload and update track durations
function updateTrackDurations() {
  const trackItems = document.querySelectorAll('.track-item');
  
  playlist.forEach((track, index) => {
    if (trackItems[index]) {
      const tempAudio = new Audio();
      tempAudio.src = track.src;
      
      tempAudio.addEventListener('loadedmetadata', function() {
        const durationElement = trackItems[index].querySelector('.music_player_time-text');
        if (durationElement) {
          durationElement.textContent = formatTime(tempAudio.duration);
        }
      });
    }
  });
}

