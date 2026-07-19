export const translations = {
    es: {
        no_routines: "No hay rutinas guardadas.",
        edit: "Editar",
        delete: "Borrar",
        confirm_delete: "¿Eliminar esta rutina?",
        alert_name: "Introduce un nombre para la rutina.",
        alert_steps: "Añade al menos un paso válido."
    },
    en: {
        no_routines: "No routines saved.",
        edit: "Edit",
        delete: "Delete",
        confirm_delete: "Delete this routine?",
        alert_name: "Enter a name for the routine.",
        alert_steps: "Add at least one valid step."
    }
};

export function getLang() {
    return localStorage.getItem("lang") || "es";
}

export function t(key) {
    const lang = getLang();
    return translations[lang][key] || key;
}
