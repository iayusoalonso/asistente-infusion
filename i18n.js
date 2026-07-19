export const dictionary = {
    es: {
        menu_title: "Procedimientos",
        btn_organize: "↕️ Organizar",
        btn_new: "+ Nuevo",
        creator_title_new: "Configurar Rutina",
        creator_title_edit: "Editar Rutina",
        label_process_name: "Nombre del Proceso",
        label_technical_steps: "Pasos Técnicos",
        btn_add_step: "+ Añadir Paso",
        btn_save: "Guardar Cambios",
        btn_cancel: "Cancelar",
        sterile_warning: "⚠️ ATENCIÓN: PASO ESTÉRIL ⚠️",
        volume_infused: "Infundido:",
        btn_start: "Iniciar",
        btn_running: "PASAR DE PASO (Codo)",
        btn_menu: "VOLVER AL MENÚ",
        step_meta_prefix: "pasos",
        sterile_meta: "Pasos estériles",
        delete: "Borrar",
        edit: "Editar",
        voice_sterile: "Atención, paso estéril.",
        voice_volume: "Cantidad a infundir: {vol} mililitros.",
        alert_name: "Inserta un nombre válido.",
        alert_steps: "La rutina debe tener al menos un paso válido.",
        confirm_delete: "¿Deseas borrar esta rutina?",
        net_online: "Dispositivo Conectado (Online).",
        net_offline: "Sin red (Offline). Uso local garantizado."
    },
    en: {
        menu_title: "Procedures",
        btn_organize: "↕️ Organize",
        btn_new: "+ New",
        creator_title_new: "Configure Routine",
        creator_title_edit: "Edit Routine",
        label_process_name: "Procedure Name",
        label_technical_steps: "Technical Steps",
        btn_add_step: "+ Add Step",
        btn_save: "Save Changes",
        btn_cancel: "Cancel",
        sterile_warning: "⚠️ ATTENTION: STERILE STEP ⚠️",
        volume_infused: "Infused:",
        btn_start: "Start",
        btn_running: "NEXT STEP (Elbow)",
        btn_menu: "BACK TO MENU",
        step_meta_prefix: "steps",
        sterile_meta: "Sterile steps",
        delete: "Delete",
        edit: "Edit",
        voice_sterile: "Attention, sterile step.",
        voice_volume: "Volume to infuse: {vol} milliliters.",
        alert_name: "Please enter a valid name.",
        alert_steps: "The routine must contain at least one valid step.",
        confirm_delete: "Are you sure you want to delete this routine?",
        net_online: "Device Connected (Online).",
        net_offline: "No Network (Offline). Safe local use guaranteed."
    }
};

let currentLang = localStorage.getItem('app_lang') || 'es';

export function getLang() {
    return currentLang;
}

export function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('app_lang', lang);
    translateUI();
}

export function t(key, variables = {}) {
    let text = dictionary[currentLang]?.[key] || dictionary['es'][key] || key;
    Object.keys(variables).forEach(v => {
        text = text.replace(`{${v}}`, variables[v]);
    });
    return text;
}

export function translateUI() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });
}
