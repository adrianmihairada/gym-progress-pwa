const STORAGE_KEY = 'gymprogress_sets';

const form = document.querySelector('#workout-form');
const historyList = document.querySelector('#history-list');
const emptyState = document.querySelector('#empty-state');
const clearHistoryButton = document.querySelector('#clear-history');

let sets = loadSets();

renderHistory();
registerServiceWorker();

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const exercise = formData.get('exercise').trim();
  const weight = Number(formData.get('weight'));
  const reps = Number(formData.get('reps'));
  const notes = formData.get('notes').trim();

  if (!exercise || weight < 0 || reps < 1) {
    return;
  }

  const newSet = {
    id: crypto.randomUUID(),
    exercise,
    weight,
    reps,
    notes,
    createdAt: new Date().toISOString()
  };

  sets.unshift(newSet);
  saveSets();
  renderHistory();
  form.reset();
  document.querySelector('#exercise').focus();
});

historyList.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-delete-id]');

  if (!deleteButton) {
    return;
  }

  const id = deleteButton.dataset.deleteId;
  sets = sets.filter((set) => set.id !== id);
  saveSets();
  renderHistory();
});

clearHistoryButton.addEventListener('click', () => {
  if (sets.length === 0) {
    return;
  }

  const confirmed = confirm('¿Quieres borrar todo el historial?');

  if (!confirmed) {
    return;
  }

  sets = [];
  saveSets();
  renderHistory();
});

function loadSets() {
  const savedSets = localStorage.getItem(STORAGE_KEY);

  if (!savedSets) {
    return [];
  }

  try {
    return JSON.parse(savedSets);
  } catch {
    return [];
  }
}

function saveSets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

function renderHistory() {
  historyList.innerHTML = '';
  emptyState.hidden = sets.length > 0;
  clearHistoryButton.disabled = sets.length === 0;

  sets.forEach((set) => {
    const item = document.createElement('li');
    item.className = 'history-item';

    const date = new Date(set.createdAt).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    item.innerHTML = `
      <div class="history-item-header">
        <div>
          <p class="exercise-name"></p>
          <p class="set-data"></p>
          <p class="set-date"></p>
        </div>
        <button class="danger-button" type="button" data-delete-id="${set.id}">Borrar</button>
      </div>
    `;

    item.querySelector('.exercise-name').textContent = set.exercise;
    item.querySelector('.set-data').textContent = `${set.weight} kg x ${set.reps} repeticiones`;
    item.querySelector('.set-date').textContent = date;

    if (set.notes) {
      const notes = document.createElement('p');
      notes.className = 'set-notes';
      notes.textContent = set.notes;
      item.appendChild(notes);
    }

    historyList.appendChild(item);
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
}
