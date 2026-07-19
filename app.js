import { t, translateUI, getLang, setLang } from './i18n.js';

const noSleepInstance = new NoSleep();
let wakeLockActive = false;

function setWakeLock(enable) {
    if (enable && !wakeLockActive) {
        noSleepInstance.enable();
        wakeLockActive = true;
    } else if (!enable && wakeLockActive) {
        noSleepInstance.disable();
        wakeLockActive = false;
    }
}

function updateOnlineStatus() {
    const dot = document.getElementById('netStatusDot');
    const textEx = document.getElementById('netStatusText');
    if (navigator.onLine) {
        dot.style.backgroundColor = "var(--success)";
        textEx.textContent = t('net_online');
    } else {
        dot.style.backgroundColor = "var(--danger)";
        textEx.textContent = t('net_offline');
    }
}

// Reconocimiento de Voz (Escucha activa)
const voiceRecognizer = {
    recognition: null,
    isListening: false,

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.log("El reconocimiento de voz no es soportado por este navegador.");
            return;
        }
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;

        this.recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            console.log("Texto escuchado:", result);
            
            // Comandos aceptados según idioma
            const isEs = getLang() === 'es';
            const triggerNext = isEs 
                ? (result.includes('siguiente') || result.includes('pasar') || result.includes('continuar'))
                : (result.includes('next') || result.includes('continue'));

            if (triggerNext && engine.state === 'RUNNING') {
                engine.handleElbowClick();
            }
        };

        // Auto-reiniciar si se corta mientras la ejecución esté activa
        this.recognition.onend = () => {
            if (this.isListening) {
                try { this.recognition.start(); } catch(e) {}
            }
        };
    },
    start() {
        if (!this.recognition) return;
        this.recognition.lang = getLang() === 'es' ? 'es-ES' : 'en-US';
        this.isListening = true;
        try { this.recognition.start(); } catch(e) {}
    },
    stop() {
        this.isListening = false;
        if (this.recognition) {
            try { this.recognition.stop(); } catch(e) {}
        }
    }
};

// Enrutador de vistas
const router = {
    current: 'menu',
    go(viewId) {
        this.current = viewId;
        document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
        document.getElementById(`view-${viewId}`).classList.remove('hidden');
        
        const navBtn = document.getElementById('headerNavBtn');
        if (viewId === 'menu') {
            navBtn.classList.add('hidden');
            engine.stop();
            voiceRecognizer.stop();
            setWakeLock(false);
            routineManager.isReorderMode = false;
            document.getElementById('reorderMenuBtn').classList.remove('btn-active-reorder');
            routineManager.renderMenu();
        } else {
            navBtn.classList.remove('hidden');
        }
    }
};

// Gestor de Procedimientos
const routineManager = {
    storageKey: 'infusion_routines_modular_v1',
    routines: [],
    isReorderMode: false,
    editingId: null,

    init() {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            this.routines = JSON.parse(data);
        } else {
            this.routines = [{
                id: 'demo-infusion',
                name: 'Procedimiento de Muestra / Sample Procedure',
                steps: [
                    { text: 'Apertura de <b>campo</b> y preparación', time: 20, sterile: true, volume: 0 },
                    { text: '<font size="5" color="#ef4444">Purgado</font> del sistema', time: 15, sterile: false, volume: 0 },
                    { text: 'Infusión guiada activa', time: 60, sterile: false, volume: 250 }
                ]
            }];
            this.persist();
        }
        this.renderMenu();
    },
    persist() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.routines));
    },
    toggleReorderMode() {
        this.isReorderMode = !this.isReorderMode;
        const btn = document.getElementById('reorderMenuBtn');
        btn.classList.toggle('btn-active-reorder', this.isReorderMode);
        this.renderMenu();
    },
    moveRoutine(index, direction) {
        const targetIndex = index + direction;
        if (targetIndex >= 0 && targetIndex < this.routines.length) {
            const temp = this.routines[index];
            this.routines[index] = this.routines[targetIndex];
            this.routines[targetIndex] = temp;
            this.persist();
            this.renderMenu();
        }
    },
    openCreatorForNew() {
        this.editingId = null;
        document.getElementById('creatorTitle').textContent = t('creator_title_new');
        document.getElementById('routineName').value = '';
        document.getElementById('stepsBuilderContainer').innerHTML = '';
        this.addStepRow();
        router.go('creator');
    },
    edit(id) {
        const routine = this.routines.find(r => r.id === id);
        if (!routine) return;
        this.editingId = id;
        document.getElementById('creatorTitle').textContent = t('creator_title_edit');
        document.getElementById('routineName').value = routine.name;
        const container = document.getElementById('stepsBuilderContainer');
        container.innerHTML = '';
        routine.steps.forEach(s => this.addStepRow(s.text, s.time, s.sterile, s.volume));
        router.go('creator');
    },
    renderMenu() {
        const container = document.getElementById('menu-routines-container');
        container.innerHTML = '';
        this.routines.forEach((r, idx) => {
            const item = document.createElement('div');
            item.className = 'routine-item';
            let controlSection = `
                <div style="display:flex; gap:4px;">
                    <button class="btn-action btn-secondary" style="padding:6px 12px; font-size:0.9rem;">${t('edit')}</button>
                    <button class="btn-action btn-danger-ui" style="padding:6px 12px; font-size:0.9rem;">${t('delete')}</button>
                </div>
            `;
            if (this.isReorderMode) {
                controlSection = `
                    <div style="display:flex; gap:4px;">
                        <button class="btn-action btn-secondary" style="padding:6px 10px;" ${idx === 0 ? 'disabled' : ''}>↑</button>
                        <button class="btn-action btn-secondary" style="padding:6px 10px;" ${idx === this.routines.length - 1 ? 'disabled' : ''}>↓</button>
                    </div>
                `;
            }
            item.innerHTML = `
                <div class="routine-info">
                    <div class="routine-name">${r.name}</div>
                    <div class="routine-meta">${r.steps.length} ${t('step_meta_prefix')} · ${t('sterile_meta')}: ${r.steps.some(s=>s.sterile)?'SÍ':'NO'}</div>
                </div>
                ${controlSection}
            `;
            
            item.querySelector('.routine-info').onclick = () => { if(!this.isReorderMode) engine.setup(r.id); };
            if(!this.isReorderMode) {
                item.querySelectorAll('.btn-action')[0].onclick = () => this.edit(r.id);
                item.querySelectorAll('.btn-action')[1].onclick = () => this.delete(r.id);
            } else {
                item.querySelectorAll('.btn-action')[0].onclick = () => this.moveRoutine(idx, -1);
                item.querySelectorAll('.btn-action')[1].onclick = () => this.moveRoutine(idx, 1);
            }
            container.appendChild(item);
        });
    },
    addStepRow(text = '', time = '', sterile = false, volume = '') {
        const container = document.getElementById('stepsBuilderContainer');
        const row = document.createElement('div');
        row.className = 'step-row';
        const rowId = 'step-' + Date.now() + Math.random().toString(36).substr(2, 5);
        row.setAttribute('data-id', rowId);

        row.innerHTML = `
            <div class="step-text-container">
                <div class="editor-toolbar">
                    <button type="button" class="btn-bold">B</button>
                    <button type="button" class="btn-red" style="color:#ef4444;">Rojo</button>
                    <button type="button" class="btn-black" style="color:#1e293b;">Negro</button>
                    <button type="button" class="btn-size5">A+</button>
                    <button type="button" class="btn-size3">A-</button>
                </div>
                <div contenteditable="true" class="step-text-rich" placeholder="...">${text}</div>
            </div>
            <div class="step-row-inputs-bottom">
                <input type="number" class="form-control step-time" placeholder="Seg." value="${time}" style="width: 80px;">
                <input type="number" class="form-control step-volume" placeholder="ml" value="${volume}" style="width: 80px;">
                <div style="display:flex; gap:4px; margin-left:auto;">
                    <button type="button" class="btn-action btn-secondary btn-up" style="padding:6px 10px;">↑</button>
                    <button type="button" class="btn-action btn-secondary btn-down" style="padding:6px 10px;">↓</button>
                </div>
            </div>
            <div class="step-row-modifiers">
                <label style="display:flex; align-items:center; gap:6px; color:var(--sterile-text); cursor:pointer; user-select:none;">
                    <input type="checkbox" class="step-sterile" ${sterile ? 'checked' : ''}> ⚠️ Paso Estéril
                </label>
                <button type="button" class="btn-action btn-danger-ui btn-del" style="padding:4px 8px; margin-left:auto;">Eliminar</button>
            </div>
        `;

        const richInput = row.querySelector('.step-text-rich');
        const binds = [
            { c: '.btn-bold', cmd: 'bold', val: null },
            { c: '.btn-red', cmd: 'foreColor', val: '#ef4444' },
            { c: '.btn-black', cmd: 'foreColor', val: '#1e293b' },
            { c: '.btn-size5', cmd: 'fontSize', val: '5' },
            { c: '.btn-size3', cmd: 'fontSize', val: '3' }
        ];
        binds.forEach(b => {
            row.querySelector(b.c).onmousedown = (e) => {
                e.preventDefault();
                document.execCommand(b.cmd, false, b.val);
                this.checkEditorState(rowId);
            };
        });

        richInput.onkeyup = richInput.onmouseup = () => this.checkEditorState(rowId);
        row.querySelector('.btn-up').onclick = () => this.moveStepDOM(row, -1);
        row.querySelector('.btn-down').onclick = () => this.moveStepDOM(row, 1);
        row.querySelector('.btn-del').onclick = () => row.remove();

        container.appendChild(row);
    },
    moveStepDOM(row, direction) {
        if (direction === -1 && row.previousElementSibling) {
            row.parentNode.insertBefore(row, row.previousElementSibling);
        } else if (direction === 1 && row.nextElementSibling) {
            row.parentNode.insertBefore(row.nextElementSibling, row.nextElementSibling.nextElementSibling);
        }
    },
    checkEditorState(rowId) {
        const row = document.querySelector(`[data-id="${rowId}"]`);
        if (!row) return;
        row.querySelector('.btn-bold').classList.toggle('active', document.queryCommandState('bold'));
        const color = document.queryCommandValue('foreColor');
        const isRed = (color === 'rgb(239, 68, 68)' || color === '#ef4444');
        row.querySelector('.btn-red').classList.toggle('active', isRed);
        row.querySelector('.btn-black').classList.toggle('active', !isRed && (color === 'rgb(30, 41, 59)' || color === '#1e293b' || color === ''));
        const size = document.queryCommandValue('fontSize');
        row.querySelector('.btn-size5').classList.toggle('active', size === '5');
        row.querySelector('.btn-size3').classList.toggle('active', size === '3' || size === '');
    },
    save() {
        const name = document.getElementById('routineName').value.trim();
        if (!name) return alert(t('alert_name'));
        const steps = [];
        document.querySelectorAll('.step-row').forEach(row => {
            const txt = row.querySelector('.step-text-rich').innerHTML.trim();
            const tm = parseInt(row.querySelector('.step-time').value);
            const vol = parseInt(row.querySelector('.step-volume').value) || 0;
            const isSterile = row.querySelector('.step-sterile').checked;
            if (txt && txt !== '<br>' && tm > 0) {
                steps.push({ text: txt, time: tm, sterile: isSterile, volume: vol });
            }
        });
        if (steps.length === 0) return alert(t('alert_steps'));
        if (this.editingId) {
            const idx = this.routines.findIndex(r => r.id === this.editingId);
            if (idx !== -1) this.routines[idx] = { id: this.editingId, name: name, steps: steps };
            this.editingId = null;
        } else {
            this.routines.push({ id: 'routine-' + Date.now(), name: name, steps: steps });
        }
        this.persist();
        router.go('menu');
    },
    delete(id) {
        if (confirm(t('confirm_delete'))) {
            this.routines = this.routines.filter(r => r.id !== id);
            this.persist();
            this.renderMenu();
        }
    }
};

// Motor de Ejecución
const engine = {
    activeRoutine: null,
    currentStepIndex: 0,
    timeLeft: 0,
    totalStepTime: 0,
    timerInterval: null,
    state: 'STOPPED',

    setup(routineId) {
        const routine = routineManager.routines.find(r => r.id === routineId);
        if (!routine) return;
        this.activeRoutine = routine;
        this.currentStepIndex = 0;
        this.state = 'STOPPED';
        router.go('execution');
        voiceRecognizer.start(); // Activamos el micrófono al empezar
        this.loadStep();
    },
    loadStep() {
        const step = this.activeRoutine.steps[this.currentStepIndex];
        this.timeLeft = step.time;
        this.totalStepTime = step.time;
        
        document.getElementById('currentStep').textContent = `${t('edit')} ${this.currentStepIndex + 1} / ${this.activeRoutine.steps.length}`;
        document.getElementById('instruction').innerHTML = step.text;
        
        let voicePrompt = "";
        if (step.sterile) {
            document.getElementById('sterileBanner').classList.remove('hidden');
            voicePrompt += t('voice_sterile') + " ";
        } else {
            document.getElementById('sterileBanner').classList.add('hidden');
        }

        const volContainer = document.getElementById('volumeContainer');
        if (step.volume > 0) {
            volContainer.classList.remove('hidden');
            document.getElementById('volTotal').textContent = step.volume;
            document.getElementById('volCurrent').textContent = "0.0";
            voicePrompt += t('voice_volume', { vol: step.volume }) + " ";
        } else {
            volContainer.classList.add('hidden');
        }

        this.updateDisplay();
        const btn = document.getElementById('actionBtn');
        btn.textContent = t('btn_start');
        btn.className = "elbow-btn";
        
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const cleanText = step.text.replace(/<\/?[^>]+(>|$)/g, "");
            const utterance = new SpeechSynthesisUtterance(voicePrompt + cleanText);
            utterance.lang = getLang() === 'es' ? 'es-ES' : 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    },
    updateDisplay() {
        const mins = String(Math.floor(this.timeLeft / 60)).padStart(2, '0');
        const secs = String(this.timeLeft % 60).padStart(2, '0');
        document.getElementById('timer').textContent = `${mins}:${secs}`;
        const step = this.activeRoutine.steps[this.currentStepIndex];
        if (step.volume > 0) {
            const elapsed = this.totalStepTime - this.timeLeft;
            document.getElementById('volCurrent').textContent = ((elapsed / this.totalStepTime) * step.volume).toFixed(1);
        }
    },
    handleElbowClick() {
        const btn = document.getElementById('actionBtn');
        if (this.state === 'STOPPED') {
            this.state = 'RUNNING';
            btn.textContent = t('btn_running');
            btn.className = "elbow-btn btn-success";
            this.timerInterval = setInterval(() => {
                this.timeLeft--;
                this.updateDisplay();
                if (this.timeLeft <= 0) {
                    clearInterval(this.timerInterval);
                    // CORRECCIÓN: No pasamos de paso automáticamente. Frenamos en 00:00 y avisamos.
                    if ('speechSynthesis' in window) {
                        const msg = getLang() === 'es' ? 'Tiempo concluido.' : 'Time up.';
                        window.speechSynthesis.speak(new SpeechSynthesisUtterance(msg));
                    }
                }
            }, 1000);
        } else if (this.state === 'RUNNING') {
            clearInterval(this.timerInterval);
            this.nextStep();
        }
    },
    nextStep() {
        this.currentStepIndex++;
        if (this.currentStepIndex < this.activeRoutine.steps.length) {
            this.state = 'STOPPED';
            this.loadStep();
        } else {
            this.state = 'STOPPED';
            voiceRecognizer.stop(); // Fin del procedimiento, apagamos micro
            setWakeLock(false);
            document.getElementById('sterileBanner').classList.add('hidden');
            document.getElementById('volumeContainer').classList.add('hidden');
            document.getElementById('instruction').textContent = "✓ Complete";
            document.getElementById('timer').textContent = "00:00";
            const btn = document.getElementById('actionBtn');
            btn.textContent = t('btn_menu');
            btn.className = "elbow-btn";
            btn.onclick = () => router.go('menu');
        }
    },
    stop() {
        clearInterval(this.timerInterval);
        this.state = 'STOPPED';
        voiceRecognizer.stop();
        setWakeLock(false);
    }
};

// Inicialización general
window.addEventListener('DOMContentLoaded', () => {
    translateUI();
    routineManager.init();
    voiceRecognizer.init(); // Inicializar el micrófono
    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    document.getElementById('langSelector').value = getLang();
    document.getElementById('langSelector').onchange = (e) => {
        setLang(e.target.value);
        routineManager.renderMenu();
    };

    document.getElementById('headerNavBtn').onclick = () => router.go('menu');
    document.getElementById('btnNewRoutine').onclick = () => routineManager.openCreatorForNew();
    document.getElementById('btnAddStepRow').onclick = () => routineManager.addStepRow();
    document.getElementById('btnSaveRoutine').onclick = () => routineManager.save();
    document.getElementById('btnCancelCreator').onclick = () => router.go('menu');
    document.getElementById('reorderMenuBtn').onclick = () => routineManager.toggleReorderMode();
    document.getElementById('netStatusDot').onclick = () => document.getElementById('netStatusText').classList.toggle('hidden');
    document.getElementById('actionBtn').onclick = () => { setWakeLock(true); engine.handleElbowClick(); };

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker Activo'))
            .catch(err => console.error('Error al registrar SW:', err));
    }
});
