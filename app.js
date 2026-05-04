const STORAGE_KEY = 'gymprogress_sets';

const form = document.querySelector('#workout-form');
const viewButtons = document.querySelectorAll('[data-view-button]');
const views = document.querySelectorAll('[data-view]');
const historyList = document.querySelector('#history-list');
const emptyState = document.querySelector('#empty-state');
const clearHistoryButton = document.querySelector('#clear-history');
const exerciseList = document.querySelector('#exercise-list');
const exercisesEmptyState = document.querySelector('#exercises-empty-state');
const exerciseDetail = document.querySelector('#exercise-detail');
const exerciseDetailTitle = document.querySelector('#exercise-detail-title');
const exerciseDetailCount = document.querySelector('#exercise-detail-count');
const exerciseSetList = document.querySelector('#exercise-set-list');
const closeExerciseButton = document.querySelector('#close-exercise');

let sets = loadSets();
let selectedExercise = '';

renderAll();
registerServiceWorker();

viewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    showView(button.dataset.viewButton);
  });
});

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
  renderAll();
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
  renderAll();
});

clearHistoryButton.addEventListener('click', () => {
  if (sets.length === 0) {
    return;
  }

  const confirmed = confirm('Quieres borrar todo el historial?');

  if (!confirmed) {
    return;
  }

  sets = [];
  selectedExercise = '';
  saveSets();
  renderAll();
});

exerciseList.addEventListener('click', (event) => {
  const exerciseButton = event.target.closest('[data-exercise-name]');

  if (!exerciseButton) {
    return;
  }

  selectedExercise = exerciseButton.dataset.exerciseName;
  renderExercises();
});

closeExerciseButton.addEventListener('click', () => {
  selectedExercise = '';
  renderExercises();
});

function loadSets() {
  const savedSets = localStorage.getItem(STORAGE_KEY);

  if (!savedSets) {
    return [];
  }

  try {
    const parsedSets = JSON.parse(savedSets);

    if (!Array.isArray(parsedSets)) {
      return [];
    }

    return parsedSets
      .filter((set) => set && typeof set === 'object')
      .map((set) => ({
        ...set,
        id: set.id || crypto.randomUUID()
      }));
  } catch {
    return [];
  }
}

function saveSets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

function renderAll() {
  renderHistory();
  renderExercises();
}

function showView(viewName) {
  views.forEach((view) => {
    view.hidden = view.dataset.view !== viewName;
  });

  viewButtons.forEach((button) => {
    const isActive = button.dataset.viewButton === viewName;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });
}

function renderHistory() {
  historyList.innerHTML = '';
  emptyState.hidden = sets.length > 0;
  clearHistoryButton.disabled = sets.length === 0;

  getSetsByDate('desc').forEach((set) => {
    const item = document.createElement('li');
    item.className = 'history-item';

    const date = formatDate(set.createdAt);

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

    item.querySelector('.exercise-name').textContent = getExerciseName(set);
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

function renderExercises() {
  const groups = getExerciseGroups();

  exerciseList.innerHTML = '';
  exerciseList.hidden = groups.length === 0;
  exercisesEmptyState.hidden = groups.length > 0;

  groups.forEach((group) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    const name = document.createElement('span');
    const count = document.createElement('span');

    button.type = 'button';
    button.className = 'exercise-card';
    button.dataset.exerciseName = group.name;
    button.classList.toggle('active', getExerciseKey(group.name) === getExerciseKey(selectedExercise));

    name.className = 'exercise-name';
    name.textContent = group.name;

    count.className = 'exercise-count';
    count.textContent = getSeriesCountLabel(group.sets.length);

    button.append(name, count);
    item.appendChild(button);
    exerciseList.appendChild(item);
  });

  const selectedGroup = groups.find((group) => getExerciseKey(group.name) === getExerciseKey(selectedExercise));

  if (!selectedGroup) {
    selectedExercise = '';
    exerciseDetail.hidden = true;
    exerciseSetList.innerHTML = '';
    return;
  }

  renderExerciseDetail(selectedGroup);
}

function renderExerciseDetail(group) {
  exerciseDetail.hidden = false;
  exerciseDetailTitle.textContent = group.name;
  exerciseDetailCount.textContent = getSeriesCountLabel(group.sets.length);
  exerciseSetList.innerHTML = '';

  group.sets
    .slice()
    .sort((a, b) => getSetTime(a) - getSetTime(b))
    .forEach((set) => {
      const item = document.createElement('li');
      item.className = 'history-item';
      item.innerHTML = `
        <p class="set-date"></p>
        <p class="set-data"></p>
      `;

      item.querySelector('.set-date').textContent = formatDate(set.createdAt);
      item.querySelector('.set-data').textContent = `${set.weight} kg x ${set.reps} repeticiones`;

      if (set.notes) {
        const notes = document.createElement('p');
        notes.className = 'set-notes';
        notes.textContent = set.notes;
        item.appendChild(notes);
      }

      exerciseSetList.appendChild(item);
    });
}

function getExerciseGroups() {
  const groups = new Map();

  sets.forEach((set) => {
    const name = getExerciseName(set);
    const key = getExerciseKey(name);

    if (!groups.has(key)) {
      groups.set(key, {
        name,
        sets: []
      });
    }

    groups.get(key).sets.push(set);
  });

  return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name, 'es-ES'));
}

function getSetsByDate(order) {
  const direction = order === 'asc' ? 1 : -1;

  return sets
    .slice()
    .sort((a, b) => (getSetTime(a) - getSetTime(b)) * direction);
}

function getSetTime(set) {
  const time = new Date(set.createdAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getExerciseName(set) {
  return (set.exercise || 'Sin ejercicio').trim() || 'Sin ejercicio';
}

function getExerciseKey(name) {
  return name.toLocaleLowerCase('es-ES');
}

function getSeriesCountLabel(count) {
  return count === 1 ? '1 serie guardada' : `${count} series guardadas`;
}

function formatDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
}
