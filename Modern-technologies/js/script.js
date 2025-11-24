(function () {
  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => Array.from(root.querySelectorAll(s));

  // Mobile menu toggle
  const menuToggle = qs('.menu-toggle');
  const menu = qs('.menu');
  if (menuToggle && menu) {
    menuToggle.addEventListener('click', () => {
      menu.classList.toggle('open');
    });
    // Close menu on link click (mobile)
    qsa('.menu__link').forEach((link) => link.addEventListener('click', () => menu.classList.remove('open')));
  }

  // Enhanced slider on gallery page
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

  // Contact form: save to localStorage
  const form = qs('#contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = qs('#name')?.value?.trim();
      const email = qs('#email')?.value?.trim();
      const message = qs('#message')?.value?.trim();
      
      if (!name || !email || !message) return;
      
      const submittedAt = new Date().toISOString();
      const id = Date.now().toString(); // Unique ID for each contact

      const existing = JSON.parse(localStorage.getItem('contacts') || '[]');
      existing.push({ id, name, email, message, submittedAt });
      localStorage.setItem('contacts', JSON.stringify(existing));

      const ok = qs('#contact-success');
      if (ok) {
        ok.style.display = 'block';
        setTimeout(() => {
          ok.style.display = 'none';
        }, 5000);
      }
      
      form.reset();
      loadSavedContacts(); // Refresh the contacts list
    });
  }

  // Load and display saved contacts
  function loadSavedContacts() {
    const contactsList = qs('#contacts-list');
    const clearBtn = qs('#clear-contacts-btn');
    if (!contactsList) return;

    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    
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
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        if (confirm('Ви впевнені, що хочете видалити цей контакт?')) {
          deleteContact(id);
        }
      });
    });
  }

  // Delete a contact
  function deleteContact(id) {
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    const filtered = contacts.filter(c => c.id !== id);
    localStorage.setItem('contacts', JSON.stringify(filtered));
    loadSavedContacts();
  }

  // Clear all contacts
  const clearBtn = qs('#clear-contacts-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
      if (contacts.length === 0) {
        alert('Немає контактів для видалення');
        return;
      }
      if (confirm(`Ви впевнені, що хочете видалити всі ${contacts.length} контактів?`)) {
        localStorage.removeItem('contacts');
        loadSavedContacts();
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
})();


