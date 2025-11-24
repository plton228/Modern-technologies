(function () {
  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => Array.from(root.querySelectorAll(s));

  const menuToggle = qs('.menu-toggle');
  const menu = qs('.menu');
  if (menuToggle && menu) {
    menuToggle.addEventListener('click', () => {
      menu.classList.toggle('open');
    });
    qsa('.menu__link').forEach((link) => link.addEventListener('click', () => menu.classList.remove('open')));
  }

  const track = qs('#slider-track');
  const sliderItems = qsa('.slider__item-wrapper', track);
  const prevBtn = qs('.slider__btn--prev');
  const nextBtn = qs('.slider__btn--next');
  const currentSlideEl = qs('#current-slide');
  const totalSlidesEl = qs('#total-slides');
  const galleryItems = qsa('.gallery-item');
  let index = 0;
  let autoPlayInterval = null;

  function updateSliderCounter() {
    if (currentSlideEl) {
      currentSlideEl.textContent = index + 1;
    }
    if (totalSlidesEl && sliderItems.length > 0) {
      totalSlidesEl.textContent = sliderItems.length;
    }
    
    // Update active gallery item
    galleryItems.forEach((item, i) => {
      if (i === index) {
        item.classList.add('is-active');
      } else {
        item.classList.remove('is-active');
      }
    });
  }

  function goTo(i) {
    if (!track || sliderItems.length === 0) return;
    index = (i + sliderItems.length) % sliderItems.length;
    const offset = -index * 100;
    track.style.transform = `translateX(${offset}%)`;
    updateSliderCounter();
    
    // Reset autoplay
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = setInterval(() => goTo(index + 1), 4000);
    }
  }

  function startAutoPlay() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(() => {
      goTo(index + 1);
    }, 4000);
  }

  if (prevBtn && nextBtn && track && sliderItems.length > 0) {
    prevBtn.addEventListener('click', () => {
      goTo(index - 1);
      startAutoPlay();
    });
    nextBtn.addEventListener('click', () => {
      goTo(index + 1);
      startAutoPlay();
    });

    // Gallery item clicks
    galleryItems.forEach((item, i) => {
      item.addEventListener('click', () => {
        goTo(i);
        startAutoPlay();
      });
    });

    // Initialize counter
    updateSliderCounter();
    
    // Start auto-play
    startAutoPlay();
  }

  // Contact storage configuration
  // For cloud storage on GitHub Pages, you have two options:
  // 1. JSONBin.io (recommended - free tier available)
  // 2. GitHub Gist API (requires GitHub token)
  // Leave empty to use localStorage only (works locally but not synced across devices)
  const STORAGE_CONFIG = {
    useCloudStorage: true, // Set to true to enable cloud storage
    jsonBinId: '6924d93b43b1c97be9c2e97d', // Your JSONBin.io bin ID (get it from https://jsonbin.io)
    jsonBinApiKey: '', // Optional: JSONBin.io API key for private bins
    githubToken: '', // Optional: GitHub token for Gist API
    gistId: '', // Optional: GitHub Gist ID for storing contacts
    fallbackToLocal: true // Always fall back to localStorage if cloud storage fails
  };

  // Storage helper functions
  async function saveToCloud(contacts) {
    if (!STORAGE_CONFIG.useCloudStorage) {
      return false;
    }

    // Try JSONBin.io first
    if (STORAGE_CONFIG.jsonBinId) {
      try {
        const url = `https://api.jsonbin.io/v3/b/${STORAGE_CONFIG.jsonBinId}`;
        const headers = {
          'Content-Type': 'application/json',
        };
        
        if (STORAGE_CONFIG.jsonBinApiKey) {
          headers['X-Master-Key'] = STORAGE_CONFIG.jsonBinApiKey;
        }

        const response = await fetch(url, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify({ contacts })
        });

        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.error('Error saving to JSONBin:', error);
      }
    }

    // Try GitHub Gist as alternative
    if (STORAGE_CONFIG.githubToken && STORAGE_CONFIG.gistId) {
      try {
        const url = `https://api.github.com/gists/${STORAGE_CONFIG.gistId}`;
        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Authorization': `token ${STORAGE_CONFIG.githubToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: {
              'contacts.json': {
                content: JSON.stringify({ contacts }, null, 2)
              }
            }
          })
        });

        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.error('Error saving to GitHub Gist:', error);
      }
    }

    return false;
  }

  async function loadFromCloud() {
    if (!STORAGE_CONFIG.useCloudStorage) {
      return null;
    }

    // Try JSONBin.io first
    if (STORAGE_CONFIG.jsonBinId) {
      try {
        const url = `https://api.jsonbin.io/v3/b/${STORAGE_CONFIG.jsonBinId}/latest`;
        const headers = {};
        
        if (STORAGE_CONFIG.jsonBinApiKey) {
          headers['X-Master-Key'] = STORAGE_CONFIG.jsonBinApiKey;
        }

        const response = await fetch(url, { headers });
        
        if (response.ok) {
          const data = await response.json();
          return data.record?.contacts || [];
        }
      } catch (error) {
        console.error('Error loading from JSONBin:', error);
      }
    }

    // Try GitHub Gist as alternative
    if (STORAGE_CONFIG.githubToken && STORAGE_CONFIG.gistId) {
      try {
        const url = `https://api.github.com/gists/${STORAGE_CONFIG.gistId}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `token ${STORAGE_CONFIG.githubToken}`,
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const content = data.files['contacts.json']?.content;
          if (content) {
            const parsed = JSON.parse(content);
            return parsed.contacts || [];
          }
        }
      } catch (error) {
        console.error('Error loading from GitHub Gist:', error);
      }
    }

    return null;
  }

  // Save contacts to both localStorage and cloud
  async function saveContacts(contacts) {
    // Always save to localStorage as backup
    localStorage.setItem('contacts', JSON.stringify(contacts));
    
    // Try to save to cloud
    if (STORAGE_CONFIG.useCloudStorage && STORAGE_CONFIG.jsonBinId) {
      await saveToCloud(contacts);
    }
  }

  // Load contacts from cloud (if available) or localStorage
  async function loadContacts() {
    let contacts = [];
    
    // Try to load from cloud first
    if (STORAGE_CONFIG.useCloudStorage && STORAGE_CONFIG.jsonBinId) {
      const cloudContacts = await loadFromCloud();
      if (cloudContacts && Array.isArray(cloudContacts)) {
        contacts = cloudContacts;
        // Sync to localStorage
        localStorage.setItem('contacts', JSON.stringify(contacts));
      }
    }
    
    // If no cloud data, try localStorage
    if (contacts.length === 0) {
      const localContacts = localStorage.getItem('contacts');
      if (localContacts) {
        try {
          contacts = JSON.parse(localContacts);
        } catch (e) {
          contacts = [];
        }
      }
    }
    
    return contacts;
  }

  // Contact form: save to localStorage and cloud
  const form = qs('#contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = qs('#name')?.value?.trim();
      const email = qs('#email')?.value?.trim();
      const message = qs('#message')?.value?.trim();
      
      if (!name || !email || !message) return;
      
      const submittedAt = new Date().toISOString();
      const id = Date.now().toString(); // Unique ID for each contact

      // Get existing contacts
      const existing = await loadContacts();
      existing.push({ id, name, email, message, submittedAt });
      
      // Save to both storage locations
      await saveContacts(existing);

      const ok = qs('#contact-success');
      if (ok) {
        ok.style.display = 'block';
        setTimeout(() => {
          ok.style.display = 'none';
        }, 5000);
      }
      
      form.reset();
      await loadSavedContacts(); // Refresh the contacts list
    });
  }

  // Load and display saved contacts
  async function loadSavedContacts() {
    const contactsList = qs('#contacts-list');
    const clearBtn = qs('#clear-contacts-btn');
    if (!contactsList) return;

    // Show loading state
    contactsList.innerHTML = '<div class="loading-state">Завантаження контактів...</div>';

    // Load contacts from cloud or localStorage
    const contacts = await loadContacts();
    
    // Show/hide clear button based on contacts count
    if (clearBtn) {
      clearBtn.style.display = contacts.length > 0 ? 'inline-block' : 'none';
    }
    
    // Clear the list first
    contactsList.innerHTML = '';
    
    if (contacts.length === 0) {
      // Show empty state
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.id = 'empty-state';
      emptyState.innerHTML = `
        <div class="empty-state-icon"></div>
        <p>Поки що немає збережених контактів</p>
      `;
      contactsList.appendChild(emptyState);
      return;
    }
    
    // Sort by date (newest first)
    contacts.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    contacts.forEach(contact => {
      const contactItem = document.createElement('div');
      contactItem.className = 'contact-item';
      contactItem.dataset.id = contact.id;
      
      const date = new Date(contact.submittedAt);
      const formattedDate = date.toLocaleString('uk-UA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      contactItem.innerHTML = `
        <div class="contact-item__header">
          <div>
            <div class="contact-item__name">${escapeHtml(contact.name)}</div>
            <a href="mailto:${escapeHtml(contact.email)}" class="contact-item__email">${escapeHtml(contact.email)}</a>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
            <button class="delete-btn" data-id="${contact.id}" aria-label="Видалити">Видалити</button>
            <div class="contact-item__date">${formattedDate}</div>
          </div>
        </div>
        <div class="contact-item__message">${escapeHtml(contact.message)}</div>
      `;
      
      contactsList.appendChild(contactItem);
    });

    // Add delete handlers
    qsa('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.dataset.id;
        if (confirm('Ви впевнені, що хочете видалити цей контакт?')) {
          await deleteContact(id);
        }
      });
    });
  }

  // Delete a contact
  async function deleteContact(id) {
    const contacts = await loadContacts();
    const filtered = contacts.filter(c => c.id !== id);
    await saveContacts(filtered);
    await loadSavedContacts();
  }

  // Clear all contacts
  const clearBtn = qs('#clear-contacts-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      const contacts = await loadContacts();
      if (contacts.length === 0) {
        alert('Немає контактів для видалення');
        return;
      }
      if (confirm(`Ви впевнені, що хочете видалити всі ${contacts.length} контактів?`)) {
        await saveContacts([]);
        localStorage.removeItem('contacts');
        await loadSavedContacts();
      }
    });
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Load contacts on page load (if on contact page)
  if (form || qs('#contacts-list')) {
    loadSavedContacts();
  }

  // Show instructions if cloud storage is not configured
  if (STORAGE_CONFIG.useCloudStorage && !STORAGE_CONFIG.jsonBinId && !STORAGE_CONFIG.gistId) {
    console.log('%c💡 Налаштування хмарного зберігання контактів:', 'color: #5b8def; font-weight: bold; font-size: 14px;');
    console.log('%cДля зберігання контактів на GitHub Pages відкрийте файл SETUP_CONTACTS.md', 'color: #9ca3af;');
    console.log('Поки що контакти зберігаються тільки локально в браузері користувача.');
    console.log('Це означає, що контакти будуть доступні тільки на тому пристрої, де вони були створені.');
  }
})();


