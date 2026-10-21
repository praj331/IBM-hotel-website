(() => {
  'use strict';

  // ============================================
  // 1. BOOTSTRAP FORM VALIDATION
  // ============================================
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      'submit',
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      },
      false
    );
  });

  // ============================================
  // 2. DARK MODE TOGGLE
  // ============================================
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');

  function updateThemeUI(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('wanderlust_theme', theme);
    if (themeIcon) {
      if (theme === 'dark') {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun', 'text-warning');
      } else {
        themeIcon.classList.remove('fa-sun', 'text-warning');
        themeIcon.classList.add('fa-moon');
      }
    }
  }

  // Initial sync
  const currentTheme = localStorage.getItem('wanderlust_theme') || 'light';
  updateThemeUI(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      updateThemeUI(newTheme);
    });
  }

  // ============================================
  // 3. TAX SWITCH (Display total after taxes)
  // ============================================
  const taxSwitch = document.getElementById('taxSwitch');
  if (taxSwitch) {
    taxSwitch.addEventListener('change', () => {
      const taxInfos = document.querySelectorAll('.tax-info');
      taxInfos.forEach((info) => {
        if (taxSwitch.checked) {
          info.classList.remove('d-none');
        } else {
          info.classList.add('d-none');
        }
      });
    });
  }

  // ============================================
  // 4. WISHLIST HEART TOGGLE
  // ============================================
  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem('wanderlust_wishlist') || '[]');
    } catch (e) {
      return [];
    }
  }

  function setWishlist(items) {
    localStorage.setItem('wanderlust_wishlist', JSON.stringify(items));
  }

  // Sync wishlist hearts on load
  const localWishlist = getWishlist();
  const wishlistBtns = document.querySelectorAll('.wishlist-btn');

  wishlistBtns.forEach((btn) => {
    const listingId = btn.getAttribute('data-id');
    const icon = btn.querySelector('i');
    if (listingId && localWishlist.includes(listingId)) {
      btn.classList.add('active');
      if (icon) {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid', 'text-danger');
      }
    }

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const id = btn.getAttribute('data-id');
      if (!id) return;

      let list = getWishlist();
      const isAlreadyIn = list.includes(id);

      if (isAlreadyIn) {
        list = list.filter((itemId) => itemId !== id);
        btn.classList.remove('active');
        if (icon) {
          icon.classList.remove('fa-solid', 'text-danger');
          icon.classList.add('fa-regular');
        }
      } else {
        list.push(id);
        btn.classList.add('active');
        if (icon) {
          icon.classList.remove('fa-regular');
          icon.classList.add('fa-solid', 'text-danger');
        }
      }
      setWishlist(list);

      // Also sync with server if logged in
      try {
        await fetch(`/listings/${id}/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        // Silently continue (offline/client-side storage continues to work)
      }
    });
  });

  // ============================================
  // 5. STAR RATING UI (Show page)
  // ============================================
  const starInputs = document.querySelectorAll('.star-rating input[type="radio"]');
  const starLabels = document.querySelectorAll('.star-rating .star-label');
  const ratingDisplay = document.getElementById('ratingDisplay');

  function updateStarDisplay(val) {
    starLabels.forEach((label, idx) => {
      const starIndex = idx + 1;
      const icon = label.querySelector('i');
      if (icon) {
        if (starIndex <= val) {
          label.classList.add('selected');
          icon.classList.remove('fa-regular');
          icon.classList.add('fa-solid');
        } else {
          label.classList.remove('selected');
          icon.classList.remove('fa-solid');
          icon.classList.add('fa-regular');
        }
      }
    });
    if (ratingDisplay) {
      ratingDisplay.textContent = `${val} / 5 stars`;
    }
  }

  starInputs.forEach((input) => {
    input.addEventListener('change', () => {
      updateStarDisplay(parseInt(input.value));
    });
  });

  // Hover effect on stars
  starLabels.forEach((label, idx) => {
    label.addEventListener('mouseenter', () => {
      const hoverVal = idx + 1;
      starLabels.forEach((l, i) => {
        const starIcon = l.querySelector('i');
        if (starIcon) {
          if (i < hoverVal) {
            starIcon.classList.remove('fa-regular');
            starIcon.classList.add('fa-solid');
            l.classList.add('hovered');
          } else {
            starIcon.classList.remove('fa-solid');
            starIcon.classList.add('fa-regular');
            l.classList.remove('hovered');
          }
        }
      });
    });

    label.addEventListener('mouseleave', () => {
      starLabels.forEach((l) => l.classList.remove('hovered'));
      const checkedInput = document.querySelector('.star-rating input[type="radio"]:checked');
      if (checkedInput) {
        updateStarDisplay(parseInt(checkedInput.value));
      }
    });
  });

  // ============================================
  // 6. LEAFLET MAP INITIALIZATION (Show page)
  // ============================================
  const mapElement = document.getElementById('map');
  if (mapElement && typeof L !== 'undefined') {
    const lat = parseFloat(mapElement.getAttribute('data-lat')) || 28.6139;
    const lng = parseFloat(mapElement.getAttribute('data-lng')) || 77.209;
    const title = mapElement.getAttribute('data-title') || 'Listing Location';
    const locationName = mapElement.getAttribute('data-location') || '';

    try {
      const map = L.map('map').setView([lat, lng], 10);

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Custom WanderLust Icon
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background-color: #fe424d; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2.5px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3);"><i class="fa-solid fa-house" style="font-size: 14px;"></i></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -17],
      });

      // Marker & Popup
      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      marker
        .bindPopup(
          `<div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
            <strong style="font-size: 14px; color: #fe424d;">${title}</strong><br>
            <span>${locationName}</span><br>
            <span style="display:inline-block; margin-top: 4px; padding: 2px 6px; background: #fee2e2; color: #dc2626; border-radius: 4px; font-size: 11px; font-weight: 600;">Exact location provided after booking</span>
          </div>`
        )
        .openPopup();

      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    } catch (e) {
      console.error('Error initializing map:', e);
    }
  }
})();
