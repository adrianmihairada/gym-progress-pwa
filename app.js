const STORAGE_KEY = 'gymprogress_sets';
const WORKOUTS_STORAGE_KEY = 'gymprogress_workouts';
const APP_VERSION = '1.0';
const ROUTINE_TYPES = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Otro'];

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
const exerciseStatsGrid = document.querySelector('#exercise-stats-grid');
const exerciseStatsEmpty = document.querySelector('#exercise-stats-empty');
const exerciseSetList = document.querySelector('#exercise-set-list');
const closeExerciseButton = document.querySelector('#close-exercise');
const addExerciseSetButton = document.querySelector('#add-exercise-set-button');
const exerciseSetPanel = document.querySelector('#exercise-set-panel');
const exerciseSetForm = document.querySelector('#exercise-set-form');
const exerciseSetExerciseInput = document.querySelector('#exercise-set-exercise');
const exerciseSetWeightInput = document.querySelector('#exercise-set-weight');
const exerciseSetWorkoutSelect = document.querySelector('#exercise-set-workout');
const workoutsListScreen = document.querySelector('#workouts-list-screen');
const workoutsList = document.querySelector('#workouts-list');
const workoutsEmptyState = document.querySelector('#workouts-empty-state');
const newWorkoutButton = document.querySelector('#new-workout-button');
const newWorkoutPanel = document.querySelector('#new-workout-panel');
const newWorkoutForm = document.querySelector('#new-workout-form');
const cancelNewWorkoutButton = document.querySelector('#cancel-new-workout');
const workoutDateInput = document.querySelector('#workout-date');
const workoutRoutineSelect = document.querySelector('#workout-routine');
const customRoutineField = document.querySelector('#custom-routine-field');
const customRoutineInput = document.querySelector('#custom-routine');
const workoutDetail = document.querySelector('#workout-detail');
const workoutDetailTitle = document.querySelector('#workout-detail-title');
const workoutDetailMeta = document.querySelector('#workout-detail-meta');
const workoutDetailNotes = document.querySelector('#workout-detail-notes');
const closeWorkoutDetailButton = document.querySelector('#close-workout-detail');
const deleteWorkoutDetailButton = document.querySelector('#delete-workout-detail');
const workoutSetForm = document.querySelector('#workout-set-form');
const workoutSetExerciseInput = document.querySelector('#workout-set-exercise');
const workoutSetList = document.querySelector('#workout-set-list');
const workoutSetsEmptyState = document.querySelector('#workout-sets-empty-state');
const exportBackupButton = document.querySelector('#export-backup-button');
const importBackupInput = document.querySelector('#import-backup-input');
const clearAllDataButton = document.querySelector('#clear-all-data-button');
const dataMessage = document.querySelector('#data-message');

let sets = loadSets();
let workouts = loadWorkouts();
let selectedExercise = '';
let selectedWorkoutId = '';
let isNewWorkoutOpen = false;
let isExerciseSetFormOpen = false;

renderAll();
registerServiceWorker();

viewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    showView(button.dataset.viewButton);
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const setData = getSetDataFromForm(form);

  if (!setData) {
    return;
  }

  sets.unshift(createSet(setData));
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

  deleteSet(deleteButton.dataset.deleteId);
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
  isExerciseSetFormOpen = false;
  saveSets();
  renderAll();
});

exerciseList.addEventListener('click', (event) => {
  const exerciseButton = event.target.closest('[data-exercise-name]');

  if (!exerciseButton) {
    return;
  }

  if (getExerciseKey(selectedExercise) !== getExerciseKey(exerciseButton.dataset.exerciseName)) {
    isExerciseSetFormOpen = false;
  }

  selectedExercise = exerciseButton.dataset.exerciseName;
  renderExercises();
});

closeExerciseButton.addEventListener('click', () => {
  selectedExercise = '';
  isExerciseSetFormOpen = false;
  renderExercises();
});

addExerciseSetButton.addEventListener('click', () => {
  isExerciseSetFormOpen = true;
  renderExercises();
  exerciseSetWeightInput.focus();
});

exerciseSetForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const workoutId = exerciseSetWorkoutSelect.value;
  const workout = workoutId ? getWorkoutById(workoutId) : null;
  const setData = getSetDataFromForm(exerciseSetForm);

  if ((workoutId && !workout) || !setData) {
    return;
  }

  sets.unshift(createSet(setData, workout));
  saveSets();
  exerciseSetForm.reset();
  renderAll();
  exerciseSetWeightInput.focus();
});

newWorkoutButton.addEventListener('click', () => {
  openNewWorkoutForm();
});

cancelNewWorkoutButton.addEventListener('click', () => {
  closeNewWorkoutForm();
});

workoutRoutineSelect.addEventListener('change', () => {
  updateCustomRoutineVisibility();
});

newWorkoutForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(newWorkoutForm);
  const date = normalizeWorkoutDate(formData.get('workoutDate'));
  const routineType = formData.get('workoutRoutine');
  const customRoutine = String(formData.get('customRoutine') || '').trim();
  const routineName = routineType === 'Otro' ? customRoutine : routineType;
  const notes = String(formData.get('workoutNotes') || '').trim();

  if (!date || !ROUTINE_TYPES.includes(routineType) || !routineName) {
    return;
  }

  const existingWorkout = findWorkoutByDateAndRoutine(date, routineName);

  if (existingWorkout) {
    selectedWorkoutId = existingWorkout.id;
    isNewWorkoutOpen = false;
    renderWorkouts();
    return;
  }

  const newWorkout = {
    id: createId(),
    date,
    routineType,
    routineName,
    notes,
    createdAt: new Date().toISOString()
  };

  workouts.unshift(newWorkout);
  selectedWorkoutId = newWorkout.id;
  isNewWorkoutOpen = false;
  saveWorkouts();
  renderAll();
});

workoutsList.addEventListener('click', (event) => {
  const deleteWorkoutButton = event.target.closest('[data-delete-workout-id]');

  if (deleteWorkoutButton) {
    deleteWorkout(deleteWorkoutButton.dataset.deleteWorkoutId);
    return;
  }

  const workoutButton = event.target.closest('[data-workout-id]');

  if (!workoutButton) {
    return;
  }

  selectedWorkoutId = workoutButton.dataset.workoutId;
  isNewWorkoutOpen = false;
  renderWorkouts();
});

closeWorkoutDetailButton.addEventListener('click', () => {
  selectedWorkoutId = '';
  renderWorkouts();
});

deleteWorkoutDetailButton.addEventListener('click', () => {
  deleteWorkout(selectedWorkoutId);
});

workoutSetForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const workout = getSelectedWorkout();
  const setData = getSetDataFromForm(workoutSetForm);

  if (!workout || !setData) {
    return;
  }

  sets.unshift(createSet(setData, workout));
  saveSets();
  renderAll();
  workoutSetForm.reset();
  workoutSetExerciseInput.focus();
});

workoutSetList.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-delete-id]');

  if (!deleteButton) {
    return;
  }

  deleteSet(deleteButton.dataset.deleteId);
});

exportBackupButton.addEventListener('click', () => {
  exportBackup();
});

importBackupInput.addEventListener('change', () => {
  importBackup();
});

clearAllDataButton.addEventListener('click', () => {
  clearAllData();
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
        id: set.id || createId()
      }));
  } catch {
    return [];
  }
}

function loadWorkouts() {
  const savedWorkouts = localStorage.getItem(WORKOUTS_STORAGE_KEY);

  if (!savedWorkouts) {
    return [];
  }

  try {
    const parsedWorkouts = JSON.parse(savedWorkouts);

    if (!Array.isArray(parsedWorkouts)) {
      return [];
    }

    return parsedWorkouts
      .filter((workout) => workout && typeof workout === 'object')
      .map((workout) => normalizeWorkout(workout))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function normalizeWorkout(workout) {
  const date = normalizeWorkoutDate(workout.date || workout.workoutDate || workout.createdAt);
  const rawRoutineType = String(workout.routineType || workout.workoutType || '').trim();
  const routineType = ROUTINE_TYPES.includes(rawRoutineType) ? rawRoutineType : 'Otro';
  const rawRoutineName = String(workout.routineName || workout.workoutType || rawRoutineType).trim();
  const routineName = routineType === 'Otro' ? rawRoutineName || 'Otro' : routineType;

  if (!date || !routineName) {
    return null;
  }

  return {
    ...workout,
    id: workout.id || createId(),
    date,
    routineType,
    routineName,
    notes: String(workout.notes || '').trim(),
    createdAt: workout.createdAt || new Date().toISOString()
  };
}

function saveSets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

function saveWorkouts() {
  localStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(workouts));
}

function exportBackup() {
  const backup = {
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    sets,
    workouts
  };
  const backupJson = JSON.stringify(backup, null, 2);
  const fileName = `gymprogress-backup-${toDateInputValue(new Date())}.json`;
  const url = URL.createObjectURL(new Blob([backupJson], { type: 'application/json' }));
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  showDataMessage('Copia de seguridad exportada.');
}

async function importBackup() {
  const file = importBackupInput.files[0];

  if (!file) {
    return;
  }

  try {
    const parsedBackup = JSON.parse(await file.text());
    const validatedBackup = validateBackup(parsedBackup);

    if (!validatedBackup) {
      showDataMessage('El archivo no es una copia de seguridad v\u00e1lida.', true);
      return;
    }

    const confirmed = confirm('Esto reemplazar\u00e1 todos los datos actuales. \u00bfQuieres continuar?');

    if (!confirmed) {
      return;
    }

    replaceAppData(validatedBackup.sets, validatedBackup.workouts);
    showDataMessage('Copia de seguridad importada.');
  } catch {
    showDataMessage('No se pudo leer el archivo JSON.', true);
  } finally {
    importBackupInput.value = '';
  }
}

function validateBackup(backup) {
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
    return null;
  }

  const hasValidMetadata = typeof backup.exportedAt === 'string' &&
    !Number.isNaN(new Date(backup.exportedAt).getTime()) &&
    typeof backup.appVersion === 'string' &&
    backup.appVersion.trim();

  if (!hasValidMetadata) {
    return null;
  }

  if (!Array.isArray(backup.sets) || !Array.isArray(backup.workouts)) {
    return null;
  }

  const importedWorkouts = backup.workouts.map((workout) => normalizeImportedWorkout(workout));
  const importedSets = backup.sets.map((set) => normalizeImportedSet(set));

  if (importedWorkouts.some((workout) => !workout) || importedSets.some((set) => !set)) {
    return null;
  }

  return {
    sets: importedSets,
    workouts: importedWorkouts
  };
}

function normalizeImportedWorkout(workout) {
  if (!workout || typeof workout !== 'object' || Array.isArray(workout)) {
    return null;
  }

  const normalizedWorkout = normalizeWorkout(workout);

  if (!normalizedWorkout) {
    return null;
  }

  return {
    ...normalizedWorkout,
    id: String(normalizedWorkout.id)
  };
}

function normalizeImportedSet(set) {
  if (!set || typeof set !== 'object' || Array.isArray(set)) {
    return null;
  }

  const exercise = String(set.exercise || '').trim();
  const weight = Number(set.weight);
  const reps = Number(set.reps);
  const createdAt = normalizeImportedDate(set.createdAt);

  if (!exercise || !Number.isFinite(weight) || !Number.isFinite(reps) || weight < 0 || reps < 1 || !createdAt) {
    return null;
  }

  const normalizedSet = {
    ...set,
    id: String(set.id || createId()),
    exercise,
    weight,
    reps,
    notes: String(set.notes || '').trim(),
    createdAt
  };

  if (set.workoutId) {
    normalizedSet.workoutId = String(set.workoutId);
  }

  if (set.workoutDate) {
    normalizedSet.workoutDate = normalizeWorkoutDate(set.workoutDate);
  }

  if (set.workoutType) {
    normalizedSet.workoutType = String(set.workoutType).trim();
  }

  if (set.workoutRoutineName) {
    normalizedSet.workoutRoutineName = String(set.workoutRoutineName).trim();
  }

  return normalizedSet;
}

function normalizeImportedDate(dateValue) {
  if (!dateValue) {
    return new Date().toISOString();
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString();
}

function clearAllData() {
  const confirmationText = prompt(
    'Esto borrar\u00e1 todas las series y entrenamientos guardados.\n\n' +
    'Escribe BORRAR para confirmar:'
  );

  if (String(confirmationText || '').trim() !== 'BORRAR') {
    return;
  }

  sets = [];
  workouts = [];
  resetStateAfterDataChange();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(WORKOUTS_STORAGE_KEY);
  renderAll();
  showDataMessage('Todos los datos se han borrado.');
}

function replaceAppData(nextSets, nextWorkouts) {
  sets = nextSets;
  workouts = nextWorkouts;
  resetStateAfterDataChange();
  saveSets();
  saveWorkouts();
  renderAll();
}

function resetStateAfterDataChange() {
  selectedExercise = '';
  selectedWorkoutId = '';
  isNewWorkoutOpen = false;
  isExerciseSetFormOpen = false;
  form.reset();
  exerciseSetForm.reset();
  newWorkoutForm.reset();
  workoutSetForm.reset();
}

function showDataMessage(message, isError = false) {
  dataMessage.textContent = message;
  dataMessage.hidden = false;
  dataMessage.classList.toggle('error', isError);
}

function renderAll() {
  renderHistory();
  renderExercises();
  renderWorkouts();
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

  if (viewName === 'workouts') {
    renderWorkouts();
  }
}

function renderHistory() {
  historyList.innerHTML = '';
  emptyState.hidden = sets.length > 0;
  clearHistoryButton.disabled = sets.length === 0;

  getSetsByDate('desc').forEach((set) => {
    const item = document.createElement('li');
    item.className = 'history-item';

    item.innerHTML = `
      <div class="history-item-header">
        <div>
          <p class="exercise-name"></p>
          <p class="set-data"></p>
          <p class="set-date"></p>
          <p class="set-workout"></p>
        </div>
        <button class="danger-button" type="button" data-delete-id="${set.id}">Borrar</button>
      </div>
    `;

    item.querySelector('.exercise-name').textContent = getExerciseName(set);
    item.querySelector('.set-data').textContent = `${set.weight} kg x ${set.reps} repeticiones`;
    item.querySelector('.set-date').textContent = formatDate(set.createdAt);
    item.querySelector('.set-workout').textContent = getSetWorkoutLabel(set);

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
    isExerciseSetFormOpen = false;
    exerciseDetail.hidden = true;
    exerciseSetForm.reset();
    exerciseStatsGrid.innerHTML = '';
    exerciseStatsEmpty.hidden = true;
    exerciseSetList.innerHTML = '';
    return;
  }

  renderExerciseDetail(selectedGroup);
}

function renderExerciseDetail(group) {
  exerciseDetail.hidden = false;
  exerciseDetailTitle.textContent = group.name;
  exerciseDetailCount.textContent = getSeriesCountLabel(group.sets.length);
  addExerciseSetButton.textContent = `+ A\u00f1adir serie a ${group.name}`;
  exerciseSetPanel.hidden = !isExerciseSetFormOpen;
  exerciseSetExerciseInput.value = group.name;
  renderExerciseStats(group.sets);
  renderExerciseWorkoutOptions();
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
        <p class="set-workout"></p>
      `;

      item.querySelector('.set-date').textContent = formatDate(set.createdAt);
      item.querySelector('.set-data').textContent = `${set.weight} kg x ${set.reps} repeticiones`;
      item.querySelector('.set-workout').textContent = getSetWorkoutLabel(set);

      if (set.notes) {
        const notes = document.createElement('p');
        notes.className = 'set-notes';
        notes.textContent = set.notes;
        item.appendChild(notes);
      }

      exerciseSetList.appendChild(item);
    });
}

function renderExerciseStats(exerciseSets) {
  const stats = getExerciseStats(exerciseSets);

  exerciseStatsGrid.innerHTML = '';

  if (!stats) {
    exerciseStatsEmpty.textContent = exerciseSets.length === 0
      ? 'Aun no hay series para este ejercicio.'
      : 'No hay series v\u00e1lidas para calcular estad\u00edsticas.';
    exerciseStatsEmpty.hidden = false;
    exerciseStatsGrid.hidden = true;
    return;
  }

  exerciseStatsEmpty.hidden = true;
  exerciseStatsGrid.hidden = false;

  [
    {
      label: 'Series totales',
      value: formatNumber(stats.totalSets)
    },
    {
      label: 'Peso m\u00e1ximo usado',
      value: formatWeight(stats.maxWeight)
    },
    {
      label: 'Mejor serie por peso',
      value: formatStatsSet(stats.bestWeightSet)
    },
    {
      label: 'Mejor volumen en una serie',
      value: formatVolume(stats.bestVolumeSet.volume),
      detail: formatStatsSet(stats.bestVolumeSet)
    },
    {
      label: 'Volumen total acumulado',
      value: formatVolume(stats.totalVolume)
    },
    {
      label: 'Repeticiones totales',
      value: formatNumber(stats.totalReps)
    },
    {
      label: '\u00daltima serie registrada',
      value: formatStatsSet(stats.latestSet),
      detail: formatDate(stats.latestSet.set.createdAt)
    },
    {
      label: '1RM estimado aproximado',
      value: formatWeight(stats.bestOneRepMaxSet.oneRepMax),
      detail: formatStatsSet(stats.bestOneRepMaxSet)
    }
  ].forEach((stat) => {
    exerciseStatsGrid.appendChild(createStatCard(stat));
  });
}

function createStatCard(stat) {
  const card = document.createElement('article');
  const label = document.createElement('p');
  const value = document.createElement('p');

  card.className = 'stat-card';
  label.className = 'stat-label';
  value.className = 'stat-value';
  label.textContent = stat.label;
  value.textContent = stat.value;
  card.append(label, value);

  if (stat.detail) {
    const detail = document.createElement('p');

    detail.className = 'stat-detail';
    detail.textContent = stat.detail;
    card.appendChild(detail);
  }

  return card;
}

function renderExerciseWorkoutOptions() {
  const currentValue = exerciseSetWorkoutSelect.value;

  exerciseSetWorkoutSelect.innerHTML = '';

  const looseOption = document.createElement('option');
  looseOption.value = '';
  looseOption.textContent = 'Serie suelta';
  exerciseSetWorkoutSelect.appendChild(looseOption);

  getWorkoutsByDate('desc').forEach((workout) => {
    const option = document.createElement('option');

    option.value = workout.id;
    option.textContent = `${formatDateOnly(workout.date)} - ${getWorkoutRoutineLabel(workout)}`;
    exerciseSetWorkoutSelect.appendChild(option);
  });

  const hasCurrentValue = Array.from(exerciseSetWorkoutSelect.options)
    .some((option) => option.value === currentValue);

  exerciseSetWorkoutSelect.value = hasCurrentValue ? currentValue : '';
}

function renderWorkouts() {
  const selectedWorkout = getSelectedWorkout();

  if (selectedWorkoutId && !selectedWorkout) {
    selectedWorkoutId = '';
  }

  if (selectedWorkout) {
    workoutsListScreen.hidden = true;
    newWorkoutPanel.hidden = true;
    workoutDetail.hidden = false;
    renderWorkoutDetail(selectedWorkout);
    return;
  }

  workoutDetail.hidden = true;
  workoutsListScreen.hidden = isNewWorkoutOpen;
  newWorkoutPanel.hidden = !isNewWorkoutOpen;

  if (isNewWorkoutOpen) {
    return;
  }

  workoutsList.innerHTML = '';
  workoutsEmptyState.hidden = workouts.length > 0;

  getWorkoutsByDate('desc').forEach((workout) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    const deleteButton = document.createElement('button');
    const title = document.createElement('span');
    const date = document.createElement('span');
    const stats = document.createElement('span');
    const workoutStats = getWorkoutStats(workout.id);

    item.className = 'workout-list-item';

    button.type = 'button';
    button.className = 'workout-card';
    button.dataset.workoutId = workout.id;

    title.className = 'workout-routine';
    title.textContent = getWorkoutRoutineLabel(workout);

    date.className = 'workout-date';
    date.textContent = formatDateOnly(workout.date);

    stats.className = 'workout-stats';
    stats.textContent = `${getSeriesShortLabel(workoutStats.sets)} - ${getExercisesShortLabel(workoutStats.exercises)}`;

    deleteButton.type = 'button';
    deleteButton.className = 'workout-delete-button';
    deleteButton.dataset.deleteWorkoutId = workout.id;
    deleteButton.textContent = 'Borrar';

    button.append(date, title, stats);
    item.append(button, deleteButton);
    workoutsList.appendChild(item);
  });
}

function renderWorkoutDetail(workout) {
  const stats = getWorkoutStats(workout.id);
  const groups = getWorkoutExerciseGroups(workout.id);

  workoutDetailTitle.textContent = `${formatDateOnly(workout.date)} - ${getWorkoutRoutineLabel(workout)}`;
  workoutDetailMeta.textContent = `${getSeriesShortLabel(stats.sets)} - ${getExercisesShortLabel(stats.exercises)}`;
  workoutDetailNotes.textContent = workout.notes;
  workoutDetailNotes.hidden = !workout.notes;
  workoutSetList.innerHTML = '';
  workoutSetsEmptyState.hidden = groups.length > 0;

  groups.forEach((group) => {
    const groupItem = document.createElement('li');
    const title = document.createElement('h4');
    const count = document.createElement('p');
    const seriesList = document.createElement('ol');

    groupItem.className = 'workout-exercise-group';
    title.textContent = group.name;
    count.className = 'exercise-count';
    count.textContent = getSeriesCountLabel(group.sets.length);
    seriesList.className = 'history-list workout-group-list';

    group.sets.forEach((set, index) => {
      const setItem = document.createElement('li');

      setItem.className = 'history-item';
      setItem.innerHTML = `
        <div class="history-item-header">
          <div>
            <p class="exercise-name"></p>
            <p class="set-data"></p>
            <p class="set-date"></p>
          </div>
          <button class="danger-button" type="button" data-delete-id="${set.id}">Borrar</button>
        </div>
      `;

      setItem.querySelector('.exercise-name').textContent = `Serie ${index + 1}`;
      setItem.querySelector('.set-data').textContent = `${set.weight} kg x ${set.reps} repeticiones`;
      setItem.querySelector('.set-date').textContent = formatDate(set.createdAt);

      if (set.notes) {
        const notes = document.createElement('p');
        notes.className = 'set-notes';
        notes.textContent = set.notes;
        setItem.appendChild(notes);
      }

      seriesList.appendChild(setItem);
    });

    groupItem.append(title, count, seriesList);
    workoutSetList.appendChild(groupItem);
  });
}

function openNewWorkoutForm() {
  selectedWorkoutId = '';
  isNewWorkoutOpen = true;
  newWorkoutForm.reset();
  workoutDateInput.value = getTodayInputValue();
  workoutRoutineSelect.value = 'Push';
  updateCustomRoutineVisibility();
  renderWorkouts();
  workoutDateInput.focus();
}

function closeNewWorkoutForm() {
  isNewWorkoutOpen = false;
  newWorkoutForm.reset();
  updateCustomRoutineVisibility();
  renderWorkouts();
}

function updateCustomRoutineVisibility() {
  const isCustomRoutine = workoutRoutineSelect.value === 'Otro';

  customRoutineField.hidden = !isCustomRoutine;
  customRoutineInput.required = isCustomRoutine;

  if (!isCustomRoutine) {
    customRoutineInput.value = '';
  }
}

function getSetDataFromForm(targetForm) {
  const formData = new FormData(targetForm);
  const exercise = String(formData.get('exercise') || '').trim();
  const weight = Number(formData.get('weight'));
  const reps = Number(formData.get('reps'));
  const notes = String(formData.get('notes') || '').trim();

  if (!exercise || weight < 0 || reps < 1) {
    return null;
  }

  return {
    exercise,
    weight,
    reps,
    notes
  };
}

function createSet(setData, workout) {
  const newSet = {
    id: createId(),
    exercise: setData.exercise,
    weight: setData.weight,
    reps: setData.reps,
    notes: setData.notes,
    createdAt: new Date().toISOString()
  };

  if (workout) {
    newSet.workoutId = workout.id;
    newSet.workoutDate = workout.date;
    newSet.workoutType = workout.routineType;
    newSet.workoutRoutineName = getWorkoutRoutineLabel(workout);
  }

  return newSet;
}

function deleteSet(id) {
  sets = sets.filter((set) => set.id !== id);
  saveSets();
  renderAll();
}

function deleteWorkout(workoutId) {
  const workout = getWorkoutById(workoutId);

  if (!workout) {
    return;
  }

  const confirmed = confirm('\u00bfSeguro que quieres borrar este entrenamiento?');

  if (!confirmed) {
    return;
  }

  const choice = prompt(
    '\u00bfQu\u00e9 quieres hacer con las series asociadas?\n\n' +
    'A - Borrar entrenamiento y sus series\n' +
    'B - Borrar solo el entrenamiento y dejar las series como sueltas\n' +
    'C - Cancelar\n\n' +
    'Escribe A, B o C:'
  );
  const normalizedChoice = String(choice || '').trim().toLocaleUpperCase('es-ES');

  if (!normalizedChoice || normalizedChoice === 'C') {
    return;
  }

  if (normalizedChoice !== 'A' && normalizedChoice !== 'B') {
    alert('Opci\u00f3n no v\u00e1lida. No se ha borrado el entrenamiento.');
    return;
  }

  workouts = workouts.filter((item) => item.id !== workoutId);

  if (normalizedChoice === 'A') {
    sets = sets.filter((set) => set.workoutId !== workoutId);
  }

  if (normalizedChoice === 'B') {
    sets = sets.map((set) => {
      if (set.workoutId !== workoutId) {
        return set;
      }

      const looseSet = { ...set };

      delete looseSet.workoutId;
      delete looseSet.workoutDate;
      delete looseSet.workoutType;
      delete looseSet.workoutRoutineName;

      return looseSet;
    });
  }

  if (selectedWorkoutId === workoutId) {
    selectedWorkoutId = '';
    workoutSetForm.reset();
  }

  isNewWorkoutOpen = false;
  saveWorkouts();
  saveSets();
  renderAll();
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

function getWorkoutExerciseGroups(workoutId) {
  const groups = new Map();

  sets
    .filter((set) => set.workoutId === workoutId)
    .sort((a, b) => getSetTime(a) - getSetTime(b))
    .forEach((set) => {
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

  return Array.from(groups.values());
}

function getWorkoutStats(workoutId) {
  const workoutSets = sets.filter((set) => set.workoutId === workoutId);
  const exerciseKeys = new Set(workoutSets.map((set) => getExerciseKey(getExerciseName(set))));

  return {
    sets: workoutSets.length,
    exercises: exerciseKeys.size
  };
}

function getExerciseStats(exerciseSets) {
  const validSets = exerciseSets
    .map((set) => getValidStatsSet(set))
    .filter(Boolean);

  if (validSets.length === 0) {
    return null;
  }

  const stats = {
    totalSets: validSets.length,
    totalVolume: 0,
    totalReps: 0,
    maxWeight: validSets[0].weight,
    bestWeightSet: validSets[0],
    bestVolumeSet: validSets[0],
    latestSet: validSets[0],
    bestOneRepMaxSet: validSets[0]
  };

  validSets.forEach((statsSet) => {
    stats.totalVolume += statsSet.volume;
    stats.totalReps += statsSet.reps;
    stats.maxWeight = Math.max(stats.maxWeight, statsSet.weight);

    if (
      statsSet.weight > stats.bestWeightSet.weight ||
      (statsSet.weight === stats.bestWeightSet.weight && statsSet.reps > stats.bestWeightSet.reps)
    ) {
      stats.bestWeightSet = statsSet;
    }

    if (statsSet.volume > stats.bestVolumeSet.volume) {
      stats.bestVolumeSet = statsSet;
    }

    if (statsSet.time > stats.latestSet.time) {
      stats.latestSet = statsSet;
    }

    if (statsSet.oneRepMax > stats.bestOneRepMaxSet.oneRepMax) {
      stats.bestOneRepMaxSet = statsSet;
    }
  });

  return stats;
}

function getValidStatsSet(set) {
  if (isMissingStatsValue(set.weight) || isMissingStatsValue(set.reps)) {
    return null;
  }

  const weight = Number(set.weight);
  const reps = Number(set.reps);

  if (!Number.isFinite(weight) || !Number.isFinite(reps) || weight < 0 || reps <= 0) {
    return null;
  }

  return {
    set,
    weight,
    reps,
    volume: weight * reps,
    time: getSetTime(set),
    oneRepMax: weight * (1 + reps / 30)
  };
}

function isMissingStatsValue(value) {
  return value === null || typeof value === 'undefined' || typeof value === 'boolean' || String(value).trim() === '';
}

function getSetsByDate(order) {
  const direction = order === 'asc' ? 1 : -1;

  return sets
    .slice()
    .sort((a, b) => (getSetTime(a) - getSetTime(b)) * direction);
}

function getWorkoutsByDate(order) {
  const direction = order === 'asc' ? 1 : -1;

  return workouts
    .slice()
    .sort((a, b) => {
      const dateDifference = getWorkoutDateTime(a) - getWorkoutDateTime(b);

      if (dateDifference !== 0) {
        return dateDifference * direction;
      }

      return (getSetTime(a) - getSetTime(b)) * direction;
    });
}

function getSelectedWorkout() {
  return getWorkoutById(selectedWorkoutId);
}

function getWorkoutById(workoutId) {
  return workouts.find((workout) => workout.id === workoutId);
}

function findWorkoutByDateAndRoutine(date, routineName) {
  const key = getWorkoutKey(date, routineName);

  return workouts.find((workout) => getWorkoutKey(workout.date, getWorkoutRoutineLabel(workout)) === key);
}

function getWorkoutKey(date, routineName) {
  return `${date}::${routineName.trim().toLocaleLowerCase('es-ES')}`;
}

function getSetTime(set) {
  const time = new Date(set.createdAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getWorkoutDateTime(workout) {
  const date = getDateFromInputValue(workout.date);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getExerciseName(set) {
  return (set.exercise || 'Sin ejercicio').trim() || 'Sin ejercicio';
}

function getExerciseKey(name) {
  return name.toLocaleLowerCase('es-ES');
}

function getWorkoutRoutineLabel(workout) {
  return (workout.routineName || workout.routineType || workout.workoutType || 'Otro').trim() || 'Otro';
}

function getSetWorkoutLabel(set) {
  if (!set.workoutId) {
    return 'Serie suelta';
  }

  const workout = workouts.find((item) => item.id === set.workoutId);
  const workoutDate = set.workoutDate || (workout && workout.date);
  const workoutType = workout ? getWorkoutRoutineLabel(workout) : set.workoutRoutineName || set.workoutType || 'Entrenamiento';

  return `${formatDateOnly(workoutDate)} - ${workoutType}`;
}

function getSeriesCountLabel(count) {
  return count === 1 ? '1 serie guardada' : `${count} series guardadas`;
}

function getSeriesShortLabel(count) {
  return count === 1 ? '1 serie' : `${count} series`;
}

function getExercisesShortLabel(count) {
  return count === 1 ? '1 ejercicio' : `${count} ejercicios`;
}

function formatStatsSet(statsSet) {
  return `${formatWeight(statsSet.weight)} x ${formatNumber(statsSet.reps)} repeticiones`;
}

function formatWeight(weight) {
  return `${formatNumber(weight)} kg`;
}

function formatVolume(volume) {
  return `${formatNumber(volume)} kg de volumen`;
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 1
  }).format(value);
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

function formatDateOnly(dateValue) {
  const date = getDateFromInputValue(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function normalizeWorkoutDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  const stringValue = String(dateValue);

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  const date = new Date(stringValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return toDateInputValue(date);
}

function getDateFromInputValue(dateValue) {
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(dateValue);
}

function getTodayInputValue() {
  return toDateInputValue(new Date());
}

function toDateInputValue(date) {
  const localDate = new Date(date);

  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 10);
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
}
