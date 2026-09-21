/**
 * My Green Notes - Interactive Notebook Application Script
 * Features: LocalStorage Persistence, CRUD operations, Live Search, Category Filtering, Pinning.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    const STORAGE_KEY = 'green_notes_app_clean_v2';
    let notes = [];
    let currentCategory = 'all';
    let searchQuery = '';
    let selectedNoteId = null;

    // Bootstrap Modal Instances
    const noteModalEl = document.getElementById('noteModal');
    const noteModal = new bootstrap.Modal(noteModalEl);
    
    const viewModalEl = document.getElementById('viewNoteModal');
    const viewModal = new bootstrap.Modal(viewModalEl);

    // DOM Element References
    const notesGrid = document.getElementById('notesGrid');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const categoryChips = document.getElementById('categoryChips');
    const noteForm = document.getElementById('noteForm');
    const noteModalLabel = document.getElementById('noteModalLabel');
    const fabAddBtn = document.getElementById('fabAddBtn');

    // View Modal Elements
    const viewNoteTitle = document.getElementById('viewNoteTitle');
    const viewNoteCategory = document.getElementById('viewNoteCategory');
    const viewNoteDate = document.getElementById('viewNoteDate');
    const viewNoteContent = document.getElementById('viewNoteContent');
    const viewDeleteBtn = document.getElementById('viewDeleteBtn');
    const viewEditBtn = document.getElementById('viewEditBtn');

    // --- Core Functions ---

    /**
     * Load notes from LocalStorage
     */
    function initNotes() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                notes = JSON.parse(stored);
            } else {
                notes = [];
                saveNotesToStorage();
            }
        } catch (e) {
            console.error('Failed to load notes from LocalStorage:', e);
            notes = [];
        }
        renderNotes();
    }

    /**
     * Save notes to LocalStorage
     */
    function saveNotesToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        } catch (e) {
            console.error('Failed to save notes to LocalStorage:', e);
        }
    }

    /**
     * Format ISO date string into human readable format
     */
    function formatDate(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    /**
     * Filter notes based on current search query and category
     */
    function getFilteredNotes() {
        return notes.filter(note => {
            const matchesCategory = currentCategory === 'all' || note.category === currentCategory;
            const matchesSearch = searchQuery === '' || 
                note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.category.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    /**
     * Render note cards into grid container with optional transition animation
     */
    function renderNotes(animate = true) {
        const filtered = getFilteredNotes();

        notesGrid.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.classList.remove('d-none');
            return;
        } else {
            emptyState.classList.add('d-none');
        }

        filtered.forEach((note, index) => {
            const col = document.createElement('div');
            col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
            
            if (animate) {
                col.classList.add('note-col-animate');
                col.style.animationDelay = `${index * 45}ms`;
            }

            const isActiveCard = (index === 0 && searchQuery === '' && currentCategory === 'all');

            col.innerHTML = `
                <div class="note-card ${isActiveCard ? 'active-card' : ''}" data-id="${note.id}" tabindex="0">
                    <div class="card-header-area">
                        <h5 class="note-title text-truncate me-2">${escapeHTML(note.title)}</h5>
                    </div>
                    <div class="note-preview">${escapeHTML(note.content)}</div>
                    <div class="card-footer-area">
                        <span class="category-badge">${escapeHTML(note.category)}</span>
                        <span class="note-date">${formatDate(note.createdAt)}</span>
                    </div>
                </div>
            `;

            // Card Click Event Handler
            const cardEl = col.querySelector('.note-card');
            cardEl.addEventListener('click', () => openViewModal(note.id));

            // Keyboard navigation (Enter / Space)
            cardEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openViewModal(note.id);
                }
            });

            notesGrid.appendChild(col);
        });
    }

    /**
     * Escape HTML string for security
     */
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    /**
     * Open View Modal to inspect note details
     */
    function openViewModal(id) {
        const note = notes.find(n => n.id === id);
        if (!note) return;

        selectedNoteId = id;
        viewNoteTitle.textContent = note.title;
        viewNoteCategory.textContent = note.category;
        viewNoteDate.textContent = `Created ${formatDate(note.createdAt)}`;
        viewNoteContent.textContent = note.content;

        viewModal.show();
    }

    /**
     * Open Modal for creating or editing note
     */
    function openNoteFormModal(noteToEdit = null) {
        noteForm.reset();

        if (noteToEdit) {
            noteModalLabel.textContent = 'Edit Note';
            document.getElementById('noteId').value = noteToEdit.id;
            document.getElementById('noteTitle').value = noteToEdit.title;
            document.getElementById('noteCategory').value = noteToEdit.category;
            document.getElementById('noteContent').value = noteToEdit.content;
        } else {
            noteModalLabel.textContent = 'Create New Note';
            document.getElementById('noteId').value = '';
        }

        noteModal.show();
    }

    /**
     * Form Submission (Create or Edit Note)
     */
    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = document.getElementById('noteId').value;
        const title = document.getElementById('noteTitle').value.trim();
        const category = document.getElementById('noteCategory').value;
        const content = document.getElementById('noteContent').value.trim();

        if (!title || !content) return;

        if (id) {
            // Edit existing note
            const index = notes.findIndex(n => n.id === id);
            if (index !== -1) {
                notes[index].title = title;
                notes[index].category = category;
                notes[index].content = content;
                notes[index].updatedAt = new Date().toISOString();
            }
        } else {
            // Create new note
            const newNote = {
                id: 'note-' + Date.now(),
                title,
                category,
                content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            notes.unshift(newNote);
        }

        saveNotesToStorage();
        renderNotes();
        noteModal.hide();
    });

    // --- Action Button Listeners ---

    // Edit button in View Modal
    viewEditBtn.addEventListener('click', () => {
        const note = notes.find(n => n.id === selectedNoteId);
        viewModal.hide();
        if (note) {
            setTimeout(() => openNoteFormModal(note), 300);
        }
    });

    // Delete button in View Modal (Direct reliable deletion)
    viewDeleteBtn.addEventListener('click', () => {
        if (!selectedNoteId) return;
        notes = notes.filter(n => n.id !== selectedNoteId);
        saveNotesToStorage();
        viewModal.hide();
        setTimeout(() => {
            renderNotes(true);
        }, 150);
    });

    // FAB Button (New Note)
    fabAddBtn.addEventListener('click', () => openNoteFormModal());

    // Search Input Listener
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        if (searchQuery.length > 0) {
            clearSearchBtn.classList.remove('d-none');
        } else {
            clearSearchBtn.classList.add('d-none');
        }
        renderNotes();
    });

    // Clear Search Input
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('d-none');
        renderNotes();
    });

    // Category Chip Filters
    categoryChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip || chip.classList.contains('active')) return;

        categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        currentCategory = chip.dataset.category;

        // Trigger smooth transition out & staggered entrance
        notesGrid.classList.add('notes-grid-exiting');
        setTimeout(() => {
            notesGrid.classList.remove('notes-grid-exiting');
            renderNotes(true);
        }, 150);
    });

    // --- Initialize App ---
    initNotes();
});
