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
    router.go('menu');
},
