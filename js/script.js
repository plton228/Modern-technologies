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

    galleryItems.forEach((item, i) => {
      item.addEventListener('click', () => {
        goTo(i);
        startAutoPlay();
      });
    });

    updateSliderCounter();
    
    startAutoPlay();
  }

  const STORAGE_CONFIG = {
    useCloudStorage: true, 
    jsonBinId: '6924d93b43b1c97be9c2e97d',
    jsonBinApiKey: '$2a$10$LBvDQawSJXSdApOZCiKe6OVwbFqmkXjC9gOwL7P4hd7MUT8gQYbCW', 
    githubToken: '', 
    gistId: '', 
    fallbackToLocal: true 
  };

  async function saveToCloud(contacts) {
    if (!STORAGE_CONFIG.useCloudStorage) {
      return false;
    }

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

  async function saveContacts(contacts) {
    localStorage.setItem('contacts', JSON.stringify(contacts));
    
    if (STORAGE_CONFIG.useCloudStorage && STORAGE_CONFIG.jsonBinId) {
      await saveToCloud(contacts);
    }
  }

  async function loadContacts() {
    let contacts = [];
    
    if (STORAGE_CONFIG.useCloudStorage && STORAGE_CONFIG.jsonBinId) {
      const cloudContacts = await loadFromCloud();
      if (cloudContacts && Array.isArray(cloudContacts)) {
        contacts = cloudContacts;
        localStorage.setItem('contacts', JSON.stringify(contacts));
      }
    }
    
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

  const form = qs('#contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = qs('#name')?.value?.trim();
      const email = qs('#email')?.value?.trim();
      const message = qs('#message')?.value?.trim();
      
      if (!name || !email || !message) return;
      
      const submittedAt = new Date().toISOString();
      const id = Date.now().toString(); 

      const existing = await loadContacts();
      existing.push({ id, name, email, message, submittedAt });
      
      await saveContacts(existing);

      const ok = qs('#contact-success');
      if (ok) {
        ok.style.display = 'block';
        setTimeout(() => {
          ok.style.display = 'none';
        }, 5000);
      }
      
      form.reset();
      await loadSavedContacts(); 
    });
  }

  async function loadSavedContacts() {
    const contactsList = qs('#contacts-list');
    const clearBtn = qs('#clear-contacts-btn');
    if (!contactsList) return;

    contactsList.innerHTML = '<div class="loading-state">Завантаження контактів...</div>';

    const contacts = await loadContacts();
    
    if (clearBtn) {
      clearBtn.style.display = contacts.length > 0 ? 'inline-block' : 'none';
    }
    
    contactsList.innerHTML = '';
    
    if (contacts.length === 0) {
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

    qsa('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.dataset.id;
        if (confirm('Ви впевнені, що хочете видалити цей контакт?')) {
          await deleteContact(id);
        }
      });
    });
  }

  async function deleteContact(id) {
    const contacts = await loadContacts();
    const filtered = contacts.filter(c => c.id !== id);
    await saveContacts(filtered);
    await loadSavedContacts();
  }

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

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  if (form || qs('#contacts-list')) {
    loadSavedContacts();
  }

  if (STORAGE_CONFIG.useCloudStorage && !STORAGE_CONFIG.jsonBinId && !STORAGE_CONFIG.gistId) {
    console.log('%c💡 Налаштування хмарного зберігання контактів:', 'color: #5b8def; font-weight: bold; font-size: 14px;');
    console.log('%cДля зберігання контактів на GitHub Pages відкрийте файл SETUP_CONTACTS.md', 'color: #9ca3af;');
    console.log('Поки що контакти зберігаються тільки локально в браузері користувача.');
    console.log('Це означає, що контакти будуть доступні тільки на тому пристрої, де вони були створені.');
  }
})();




