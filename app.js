// app.js — módulo ES6
import { t, getLang } from './i18n.js';

const STORAGE_KEY = 'infusion_routines';

function sanitizeStepHTML(html) {
  if (!html) return '';
  return html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
}

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

  createStepRow(step = {}, index = 0) {
    const row = document.createElement('div');
    row.className = 'step-row';

    // Barra de formato rápido
    const formatBar = document.createElement('div');
    formatBar.className = 'format-bar';

    const btnB = document.createElement('button');
    btnB.textContent = 'B';
    btnB.type = 'button';
    btnB.addEventListener('click', () => document.execCommand('bold', false, null));

    const btnRed = document.createElement('button');
    btnRed.textContent = 'Rojo';
    btnRed.type = 'button';
    btnRed.addEventListener('click', () => document.execCommand('foreColor', false, 'red'));

    const btnBlack = document.createElement('button');
    btnBlack.textContent = 'Negro';
    btnBlack.type = 'button';
    btnBlack.addEventListener('click', () => document.execCommand('foreColor', false, 'black'));

    formatBar.appendChild(btnB);
    formatBar.appendChild(btnRed);
    formatBar.appendChild(btnBlack);

    // Editor de texto enriquecido
    const textDiv = document.createElement('div');
    textDiv.className = 'step-text-rich';
    textDiv.contentEditable = 'true';
    textDiv.innerHTML = step.text || '';
    if (!step.text) {
      textDiv.setAttribute('placeholder', `Paso ${index + 1}`);
    }

    // Input de Tiempo
    const timeInput = document.createElement('input');
    timeInput.type = 'number';
    timeInput.className = 'step-time';
    timeInput.placeholder = 'Segundos';
    timeInput.min = '0';
    timeInput.value = step.time || '';

    // Input de Volumen
    const volInput = document.createElement('input');
    volInput.type = 'number';
    volInput.className = 'step-volume';
    volInput.placeholder = 'ml';
    volInput.min = '0';
    volInput.value = step.volume || '';

    // Input de Intervalo de Recordatorio
    const intervalInput = document.createElement('input');
    intervalInput.type = 'number';
    intervalInput.className = 'step-interval';
    intervalInput.placeholder = 'Recordatorio (s)';
    intervalInput.min = '1';
    intervalInput.value = step.interval || 15;

    // Checkbox Aséptico
    const sterileLabel = document.createElement('label');
    const sterileCheck = document.createElement('input');
    sterileCheck.type = 'checkbox';
    sterileCheck.className = 'step-sterile';
    sterileCheck.checked = !!step.sterile;
    sterileLabel.appendChild(sterileCheck);
    sterileLabel.appendChild(document.createTextNode(' ' + (getLang() === 'es' ? 'Aséptico' : 'Sterile')));

    row.appendChild(formatBar);
    row.appendChild(textDiv);
    row.appendChild(timeInput);
    row.appendChild(volInput);
    row.appendChild(intervalInput);
    row.appendChild(sterileLabel);

    return row;
  },

  renderEditor() {
    const routine = this.state.currentRoutine;
    this.routineNameInput.value = routine?.name || '';
    this.stepsContainer.innerHTML = '';

    const stepsWrapper = document.createElement('div');
    stepsWrapper.className = 'steps-wrapper';
    this.stepsContainer.appendChild(stepsWrapper);

    const steps = routine?.steps?.length ? routine.steps : [{ text: '', time: '', volume: '', interval: 15, sterile: false }];

    steps.forEach((step, i) => {
      stepsWrapper.appendChild(this.createStepRow(step, i));
    });

    const addStepBtn = document.createElement('button');
    addStepBtn.textContent = 'Añadir paso';
    addStepBtn.type = 'button';
    addStepBtn.className = 'add-step-btn';
    addStepBtn.addEventListener('click', () => {
      const currentCount = stepsWrapper.children.length;
      stepsWrapper.appendChild(this.createStepRow({ interval: 15 }, currentCount));
    });

    this.stepsContainer.appendChild(addStepBtn);
  },

  saveRoutine() {
    const name = this.routineNameInput.value.trim();
    if (!name) return alert(t('alert_name'));

    const steps = [];
    let tiempoInvalidoDetectado = false;

    document.querySelectorAll('.step-row').forEach((row) => {
      const richTextEl = row.querySelector('.step-text-rich');
      if (!richTextEl) return;

      const txt = sanitizeStepHTML(richTextEl.innerHTML.trim());
      const tm = parseInt(row.querySelector('.step-time').value, 10) || 0;
      const vol = parseInt(row.querySelector('.step-volume').value, 10) || 0;
      const interval = parseInt(row.querySelector('.step-interval').value, 10) || 15;
      const isSterile = row.querySelector('.step-sterile').checked;

      if (txt && txt !== '<br>') {
        if (tm <= 0) {
          tiempoInvalidoDetectado = true;
        } else {
          steps.push({ text: txt, time: tm, sterile: isSterile, volume: vol, interval: interval });
        }
      }
    });

    if (tiempoInvalidoDetectado) {
      return alert(getLang() === 'es' 
        ? 'Por favor, introduce un tiempo válido (mayor a 0 segundos) en todos los pasos con texto.' 
        : 'Please enter a valid time (greater than 0 seconds) for all steps with text.');
    }

    if (steps.length === 0) return alert(t('alert_steps'));

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
      let details = `${step.time}s`;
      if (step.volume) details += `, ${step.volume}ml`;
      if (step.interval) details += `, Rec: ${step.interval}s`;
      if (step.sterile) details += ` [Aséptico]`;
      li.innerHTML = `${step.text} <span style="font-size:0.9em; color:#666;">(${details})</span>`;
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
    let remaining = routine.steps[0]?.time || 0;
    let stepElapsed = 0;

    const stepTitle = document.createElement('h3');
    const countdown = document.createElement('div');

    this.runnerContent.appendChild(stepTitle);
    this.runnerContent.appendChild(countdown);

    const speak = (text) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/<[^>]*>/g, '');
        const msg = new SpeechSynthesisUtterance(cleanText);
        msg.lang = getLang() === 'es' ? 'es-ES' : 'en-US';
        window.speechSynthesis.speak(msg);
      }
    };

    const updateUI = () => {
      const step = routine.steps[currentIndex];
      stepTitle.innerHTML = step.text;

      let info = `<div style="font-size:2.5rem; font-weight:bold; margin:10px 0;">${remaining}s</div>`;
      if (step.volume) info += `<div>Volumen: ${step.volume} ml</div>`;
      if (step.interval) info += `<div>Recordatorio cada ${step.interval}s</div>`;
      if (step.sterile) info += `<div style="color:#00c853; font-weight:bold;">✓ MANTENER ASÉPTICO</div>`;

      countdown.innerHTML = info;
    };

    // Hablar el primer paso al comenzar
    if (routine.steps[currentIndex]) {
      speak(routine.steps[currentIndex].text);
    }
    updateUI();

    const interval = setInterval(() => {
      remaining--;
      stepElapsed++;
      const step = routine.steps[currentIndex];

      // Recordatorio periódico por voz según el intervalo guardado
      if (step.interval && stepElapsed % step.interval === 0 && remaining > 0) {
        speak(getLang() === 'es' ? `Recordatorio: ${step.text}` : `Reminder: ${step.text}`);
      }

      if (remaining <= 0) {
        currentIndex++;
        if (currentIndex >= routine.steps.length) {
          clearInterval(interval);
          noSleep.disable();
          this.runnerContent.innerHTML = '<p>Rutina completada.</p>';
          speak(getLang() === 'es' ? 'Rutina completada' : 'Routine completed');
          return;
        }
        remaining = routine.steps[currentIndex].time;
        stepElapsed = 0;
        speak(routine.steps[currentIndex].text);
      }
      updateUI();
    }, 1000);
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
