// ===============================
// 🧠 Estado principal de la app
// ===============================
const App = {
    routines: [],
    editingId: null,
    storageKey: 'infusion-routines-v1',

    init() {
        this.load();
        this.cacheDom();
        this.bindEvents();
        this.renderMenu();
        this.updateOnlineStatus();
    },

    cacheDom() {
        this.views = document.querySelectorAll('[data-view]');
        this.menuView = document.querySelector('[data-view="menu"]');
        this.editorView = document.querySelector('[data-view="editor"]');
        this.runnerView = document.querySelector('[data-view="runner"]');

        this.routineNameInput = document.getElementById('routineName');
        this.stepsContainer = document.getElementById('stepsContainer');
        this.menuList = document.getElementById('routineList');
        this.onlineIcon = document.getElementById('onlineIcon');
        this.newRoutineBtn = document.getElementById('newRoutineBtn');
        this.saveRoutineBtn = document.getElementById('saveRoutineBtn');
    },

    bindEvents() {
        if (this.newRoutineBtn) {
            this.newRoutineBtn.addEventListener('click', () => {
                this.editingId = null;
                this.openEditor();
            });
        }

        if (this.saveRoutineBtn) {
            this.saveRoutineBtn.addEventListener('click', () => this.save());
        }

        window.addEventListener('online', () => this.updateOnlineStatus());
        window.addEventListener('offline', () => this.updateOnlineStatus());
    },

    updateOnlineStatus() {
        if (!this.onlineIcon) return;
        if (navigator.onLine) {
            this.onlineIcon.classList.add('online');
            this.onlineIcon.classList.remove('offline');
        } else {
            this.onlineIcon.classList.add('offline');
            this.onlineIcon.classList.remove('online');
        }
    },

    // ===============================
    // 📦 Persistencia
    // ===============================
    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                this.routines = JSON.parse(raw);
            } else {
                this.routines = [];
            }
        } catch (e) {
            console.error('Error loading routines', e);
            this.routines = [];
        }
    },

    persist() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.routines));
        } catch (e) {
            console.error('Error saving routines', e);
        }
    },

    // ===============================
    // 🧭 Router simple
    // ===============================
    go(viewName) {
        this.views.forEach(v => {
            v.style.display = v.getAttribute('data-view') === viewName ? 'block' : 'none';
        });
    },

    // ===============================
    // 📋 Menú de rutinas
    // ===============================
    renderMenu() {
        if (!this.menuList) return;
        this.menuList.innerHTML = '';

        if (this.routines.length === 0) {
            const li = document.createElement('li');
            li.textContent = t ? t('no_routines') : 'No hay rutinas guardadas.';
            this.menuList.appendChild(li);
            return;
        }

        this.routines.forEach(r => {
            const li = document.createElement('li');
            li.className = 'routine-item';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = r.name;
            li.appendChild(nameSpan);

            const editBtn = document.createElement('button');
            editBtn.textContent = t ? t('edit') : 'Editar';
            editBtn.addEventListener('click', () => {
                this.editingId = r.id;
                this.loadRoutineIntoEditor(r);
                this.go('editor');
            });
            li.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = t ? t('delete') : 'Borrar';
            deleteBtn.addEventListener('click', () => {
                if (confirm(t ? t('confirm_delete') : '¿Eliminar esta rutina?')) {
                    this.routines = this.routines.filter(x => x.id !== r.id);
                    this.persist();
                    this.renderMenu();
                }
            });
            li.appendChild(deleteBtn);

            this.menuList.appendChild(li);
        });

        this.go('menu');
    },

    // ===============================
    // ✏️ Editor de rutina
    // ===============================
    openEditor() {
        if (this.routineNameInput) this.routineNameInput.value = '';
        if (this.stepsContainer) this.stepsContainer.innerHTML = '';
        this.addStepRow();
        this.go('editor');
    },

    addStepRow(step = null) {
        if (!this.stepsContainer) return;

        const row = document.createElement('div');
        row.className = 'step-row';

        // Texto rico
        const textDiv = document.createElement('div');
        textDiv.className = 'step-text-rich';
        textDiv.contentEditable = 'true';
        textDiv.innerHTML = step ? step.text : '';
        row.appendChild(textDiv);

        // Tiempo
        const timeInput = document.createElement('input');
        timeInput.type = 'number';
        timeInput.className = 'step-time';
        timeInput.min = '1';
        timeInput.value = step ? step.time : '';
        row.appendChild(timeInput);

        // Volumen
        const volInput = document.createElement('input');
        volInput.type = 'number';
        volInput.className = 'step-volume';
        volInput.min = '0';
        volInput.value = step ? step.volume || 0 : '';
        row.appendChild(volInput);

        // Intervalo
        const intervalInput = document.createElement('input');
        intervalInput.type = 'number';
        intervalInput.className = 'step-interval';
        intervalInput.min = '1';
        intervalInput.value = step ? step.interval || 15 : 15;
        row.appendChild(intervalInput);

        // Estéril
        const sterileInput = document.createElement('input');
        sterileInput.type = 'checkbox';
        sterileInput.className = 'step-sterile';
        sterileInput.checked = step ? !!step.sterile : false;
        row.appendChild(sterileInput);

        this.stepsContainer.appendChild(row);
    },

    loadRoutineIntoEditor(routine) {
        if (!this.routineNameInput || !this.stepsContainer) return;
        this.routineNameInput.value = routine.name;
        this.stepsContainer.innerHTML = '';
        routine.steps.forEach(s => this.addStepRow(s));
    },

    // ===============================
    // 💾 Tu función save() tal cual
    // ===============================
    save() {
        const name = document.getElementById('routineName').value.trim();
        if (!name) return alert(t('alert_name'));
        const steps = [];
        let tiempoInvalidoDetectado = false;

        document.querySelectorAll('.step-row').forEach((row, index) => {
            const txt = sanitizeStepHTML(row.querySelector('.step-text-rich').innerHTML.trim());
            
            const tm = parseInt(row.querySelector('.step-time').value) || 0;
            const vol = parseInt(row.querySelector('.step-volume').value) || 0;
            const interval = parseInt(row.querySelector('.step-interval').value) || 15;
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
        
        if (this.editingId) {
            const idx = this.routines.findIndex(r => r.id === this.editingId);
            if (idx !== -1) this.routines[idx] = { id: this.editingId, name: name, steps: steps };
            this.editingId = null;
        } else {
            this.routines.push({ id: 'routine-' + Date.now(), name: name, steps: steps });
        }
        this.persist();
        this.renderMenu();
        this.go('menu');
    }
};

// ===============================
// 🚀 Inicialización
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// ===============================
// 🔄 ACTUALIZACIÓN AUTOMÁTICA SEGURA DEL SW
// ===============================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/asistente-infusion/sw.js').then((reg) => {

        reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    showUpdateBanner(newWorker);
                }
            });
        });
    });
}

function showUpdateBanner(worker) {
    const banner = document.createElement('div');
    banner.innerHTML = `
        <div style="
            background:#007bff;
            color:white;
            padding:12px;
            text-align:center;
            font-size:16px;
            position:fixed;
            bottom:0;
            left:0;
            right:0;
            z-index:9999;
            box-shadow:0 -2px 6px rgba(0,0,0,0.3);
        ">
            Nueva versión disponible
            <button id="update-btn" style="
                margin-left:10px;
                padding:6px 12px;
                background:white;
                color:#007bff;
                border:none;
                border-radius:4px;
                font-weight:bold;
            ">Actualizar</button>
        </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('update-btn').onclick = () => {
        worker.postMessage('SKIP_WAITING');
        window.location.reload();
    };
       }
