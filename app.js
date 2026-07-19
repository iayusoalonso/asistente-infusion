// app.js — módulo ES6
import { t, getLang } from './i18n.js';

const STORAGE_KEY = 'infusion_routines';

const App = {
  state: {
    routines: [],
    currentRoutine: null,
    currentView: 'menu'
  },

  init() {
    this.cacheDOM();
    this.loadRoutines();
    this.bindEvents();
    this.renderMenu();
    this.updateOnlineStatus();

    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
  },

  cacheDOM() {
    this.views = {
      menu: document.querySelector('[data-view="menu"]'),
      editor: document.querySelector('[data-view="editor"]'),
      runner: document.querySelector('[data-view="runner"]')
    };

    this.onlineIcon = document.getElementById('onlineIcon');
    this.newRoutineBtn = document.getElementById('newRoutineBtn');
    this.routineList = document.getElementById('routineList');
    this.routineNameInput = document.getElementById('routineName');
    this.stepsContainer = document.getElementById('stepsContainer');
    this.saveRoutineBtn = document.getElementById('saveRoutineBtn');
    this.runnerContent = document.getElementById('runnerContent');
  },

  bindEvents() {
    this.newRoutineBtn.addEventListener('click', () => {
      this.startNewRoutine();
    });

    this.saveRoutineBtn.addEventListener('click', () => {
      this.saveRoutine();
    });
  },

  go(view) {
    this.state.currentView = view;
    Object.keys(this.views).forEach(v => {
      this.views[v].style.display = v === view ? 'block' : 'none';
    });

    if (view === 'menu') this.renderMenu();
    if (view === 'editor') this.renderEditor();
    if (view === 'runner') this.renderRunner();
  },

  updateOnlineStatus() {
    if (!this.onlineIcon) return;
    const online = navigator.onLine;
    this.onlineIcon.classList.toggle('online', online);
    this.onlineIcon.classList.toggle('offline', !online);
  },

  loadRoutines() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.state.routines = raw ? JSON.parse(raw) : [];
    } catch {
      this.state.routines = [];
    }
  },

  saveRoutines() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.routines));
  },

  renderMenu() {
    this.routineList.innerHTML = '';

    if (!this.state.routines.length) {
      const li = document.createElement('li');
      li.textContent = t('no_routines');
      this.routineList.appendChild(li);
      return;
    }

    this.state.routines.forEach((routine, index) => {
      const li = document.createElement('li');
      li.textContent = routine.name;

      const editBtn = document.createElement('button');
      editBtn.textContent = t('edit');
      editBtn.addEventListener('click', () => {
        this.editRoutine(index);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = t('delete');
      deleteBtn.addEventListener('click', () => {
        this.deleteRoutine(index);
      });

      const runBtn = document.createElement('button');
      runBtn.textContent = 'Ejecutar';
      runBtn.addEventListener('click', () => {
        this.runRoutine(index);
      });

      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      li.appendChild(runBtn);
      this.routineList.appendChild(li);
    });
  },

  startNewRoutine() {
    this.state.currentRoutine = {
      name: '',
      steps: []
    };
    this.go('editor');
  },

  editRoutine(index) {
    this.state.currentRoutine = { ...this.state.routines[index], index };
    this.go('editor');
  },

  deleteRoutine(index) {
    if (!confirm(t('confirm_delete'))) return;
    this.state.routines.splice(index, 1);
    this.saveRoutines();
    this.renderMenu();
  },

  renderEditor() {
    const routine = this.state.currentRoutine;
    this.routineNameInput.value = routine?.name || '';
    this.stepsContainer.innerHTML = '';

    const steps = routine?.steps?.length ? routine.steps : [{ text: '', duration: 0 }];

    steps.forEach((step, i) => {
      const row = document.createElement('div');
      row.className = 'step-row';

      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.placeholder = `Paso ${i + 1}`;
      textInput.value = step.text || '';

      const durationInput = document.createElement('input');
      durationInput.type = 'number';
      durationInput.min = '0';
      durationInput.placeholder = 'Segundos';
      durationInput.value = step.duration || 0;

      row.appendChild(textInput);
      row.appendChild(durationInput);
      this.stepsContainer.appendChild(row);
    });

    const addStepBtn = document.createElement('button');
    addStepBtn.textContent = 'Añadir paso';
    addStepBtn.addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'step-row';

      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.placeholder = `Paso ${this.stepsContainer.children.length + 1}`;

      const durationInput = document.createElement('input');
      durationInput.type = 'number';
      durationInput.min = '0';
      durationInput.placeholder = 'Segundos';

      row.appendChild(textInput);
      row.appendChild(durationInput);
      this.stepsContainer.appendChild(row);
    });

    this.stepsContainer.appendChild(addStepBtn);
  },

  saveRoutine() {
    const name = this.routineNameInput.value.trim();
    if (!name) {
      alert(t('alert_name'));
      return;
    }

    const steps = [];
    const rows = this.stepsContainer.querySelectorAll('.step-row');

    rows.forEach(row => {
      const [textInput, durationInput] = row.querySelectorAll('input');
      const text = textInput.value.trim();
      const duration = parseInt(durationInput.value, 10) || 0;
      if (text && duration > 0) {
        steps.push({ text, duration });
      }
    });

    if (!steps.length) {
      alert(t('alert_steps'));
      return;
    }

    const routine = { name, steps };

    if (typeof this.state.currentRoutine?.index === 'number') {
      this.state.routines[this.state.currentRoutine.index] = routine;
    } else {
      this.state.routines.push(routine);
    }

    this.saveRoutines();
    this.state.currentRoutine = null;
    this.go('menu');
  },

  runRoutine(index) {
    this.state.currentRoutine = this.state.routines[index];
    this.go('runner');
  },

  renderRunner() {
    const routine = this.state.currentRoutine;
    if (!routine) {
      this.go('menu');
      return;
    }

    this.runnerContent.innerHTML = '';

    const title = document.createElement('h3');
    title.textContent = routine.name;
    this.runnerContent.appendChild(title);

    const stepsList = document.createElement('ol');
    routine.steps.forEach(step => {
      const li = document.createElement('li');
      li.textContent = `${step.text} (${step.duration}s)`;
      stepsList.appendChild(li);
    });
    this.runnerContent.appendChild(stepsList);

    const startBtn = document.createElement('button');
    startBtn.textContent = 'Comenzar';
    startBtn.addEventListener('click', () => {
      this.startRunnerTimer(routine);
    });

    this.runnerContent.appendChild(startBtn);
  },

  startRunnerTimer(routine) {
    this.runnerContent.innerHTML = '';

    const noSleep = new window.NoSleep();
    noSleep.enable();

    let currentIndex = 0;
    let remaining = routine.steps[0]?.duration || 0;

    const stepTitle = document.createElement('h3');
    const countdown = document.createElement('div');

    this.runnerContent.appendChild(stepTitle);
    this.runnerContent.appendChild(countdown);

    const updateUI = () => {
      const step = routine.steps[currentIndex];
      stepTitle.textContent = step.text;
      countdown.textContent = `${remaining}s`;
    };

    updateUI();

    const interval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        currentIndex++;
        if (currentIndex >= routine.steps.length) {
          clearInterval(interval);
          noSleep.disable();
          this.runnerContent.innerHTML = '<p>Rutina completada.</p>';
          return;
        }
        remaining = routine.steps[currentIndex].duration;
      }
      updateUI();
    }, 1000);
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
