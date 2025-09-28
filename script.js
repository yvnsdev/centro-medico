import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuración de Supabase
const SUPABASE_URL = 'https://jyaqeollvqwnpplqrxax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YXFlb2xsdnF3bnBwbHFyeGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMjQwOTIsImV4cCI6MjA3NDYwMDA5Mn0.7NulO_2WLyXi91sEsx90WgQmtO5Ml7fAO_jVgGFmkxQ';

// Inicializar Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado de la aplicación
let currentUser = null;
let userRole = 'paciente';
let selectedDate = null;
let selectedTimeSlot = null;
let selectedProfessional = null;

// Elementos DOM
const elements = {
    // Header y navegación
    header: document.querySelector('header'),
    mobileMenuToggle: document.querySelector('.mobile-menu-toggle'),
    navMenu: document.querySelector('.nav-menu'),
    
    // Autenticación
    authSection: document.getElementById('auth-section'),
    authenticatedContent: document.getElementById('authenticated-content'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    resetForm: document.getElementById('reset-form'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    userInfo: document.getElementById('user-info'),
    adminNav: document.getElementById('admin-nav'),
    adminSection: document.getElementById('admin'),
    
    // Formularios de autenticación
    loginFormEl: document.getElementById('login-form-el'),
    registerFormEl: document.getElementById('register-form-el'),
    resetFormEl: document.getElementById('reset-form-el'),
    
    // Navegación entre formularios
    showRegister: document.getElementById('show-register'),
    showLogin: document.getElementById('show-login'),
    showReset: document.getElementById('show-reset'),
    showLoginFromReset: document.getElementById('show-login-from-reset'),
    
    // Hero section
    heroReserveBtn: document.getElementById('hero-reserve-btn'),
    heroLoginBtn: document.getElementById('hero-login-btn'),
    
    // Wizard de reserva
    appointmentDate: document.getElementById('appointment-date'),
    timeSlots: document.getElementById('time-slots'),
    appointmentSummary: document.getElementById('appointment-summary'),
    
    // Botones de navegación del wizard
    nextToStep2: document.getElementById('next-to-step2'),
    backToStep1: document.getElementById('back-to-step1'),
    backToStep2: document.getElementById('back-to-step2'),
    confirmAppointment: document.getElementById('confirm-appointment'),
    
    // Mis reservas
    myAppointmentsList: document.getElementById('my-appointments-list'),
    
    // Administración
    availabilityRulesList: document.getElementById('availability-rules-list'),
    availabilityExceptionsList: document.getElementById('availability-exceptions-list'),
    addAvailabilityRule: document.getElementById('add-availability-rule'),
    addAvailabilityException: document.getElementById('add-availability-exception'),
    agendaDate: document.getElementById('agenda-date'),
    loadAgenda: document.getElementById('load-agenda'),
    agendaList: document.getElementById('agenda-list'),
    appointmentForDocument: document.getElementById('appointment-for-document'),
    documentFile: document.getElementById('document-file'),
    uploadDocument: document.getElementById('upload-document'),
    
    // Navegación y pestañas
    navLinks: document.querySelectorAll('.nav-link'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    
    // Notificaciones y modal
    toastContainer: document.getElementById('toast-container'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modal-title'),
    modalMessage: document.getElementById('modal-message'),
    modalCancel: document.getElementById('modal-cancel'),
    modalConfirm: document.getElementById('modal-confirm'),
    modalClose: document.querySelector('.modal-close')
};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Función de inicialización
async function initializeApp() {
    // Configurar fecha mínima para reservas (hoy)
    const today = new Date().toISOString().split('T')[0];
    elements.appointmentDate.min = today;
    elements.agendaDate.value = today;
    
    // Cargar profesional por defecto (nutricionista)
    await loadProfessional();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Verificar estado de autenticación
    checkAuthState();
    
    // Cargar navegación por secciones
    setupNavigation();
    
    // Configurar file upload display
    setupFileUpload();
}

// Configurar event listeners
function setupEventListeners() {
    // Header y navegación móvil
    elements.mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    
    // Botones del hero
    elements.heroReserveBtn.addEventListener('click', scrollToReserve);
    elements.heroLoginBtn.addEventListener('click', scrollToLogin);
    
    // Autenticación
    elements.loginFormEl.addEventListener('submit', handleLogin);
    elements.registerFormEl.addEventListener('submit', handleRegister);
    elements.resetFormEl.addEventListener('submit', handlePasswordReset);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Navegación entre formularios de auth
    elements.showRegister.addEventListener('click', () => showAuthForm('register'));
    elements.showLogin.addEventListener('click', () => showAuthForm('login'));
    elements.showReset.addEventListener('click', () => showAuthForm('reset'));
    elements.showLoginFromReset.addEventListener('click', () => showAuthForm('login'));
    
    // Wizard de reserva
    elements.nextToStep2.addEventListener('click', goToStep2);
    elements.backToStep1.addEventListener('click', goToStep1);
    elements.backToStep2.addEventListener('click', goToStep2);
    elements.confirmAppointment.addEventListener('click', confirmAppointment);
    
    // Administración
    elements.addAvailabilityRule.addEventListener('click', showAddAvailabilityRuleModal);
    elements.addAvailabilityException.addEventListener('click', showAddAvailabilityExceptionModal);
    elements.loadAgenda.addEventListener('click', loadDayAgenda);
    elements.uploadDocument.addEventListener('click', uploadAppointmentDocument);
    
    // Pestañas de administración
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchAdminTab(tabName);
        });
    });
    
    // Modal
    elements.modalCancel.addEventListener('click', hideModal);
    elements.modalClose.addEventListener('click', hideModal);
    
    // Cerrar modal al hacer clic fuera
    elements.modal.addEventListener('click', function(e) {
        if (e.target === elements.modal) {
            hideModal();
        }
    });
}

// Configurar visualización de nombre de archivo
function setupFileUpload() {
    elements.documentFile.addEventListener('change', function() {
        const fileName = this.files[0] ? this.files[0].name : 'Ningún archivo seleccionado';
        document.getElementById('file-name').textContent = fileName;
    });
}

// Alternar menú móvil
function toggleMobileMenu() {
    elements.navMenu.classList.toggle('active');
}

// Desplazarse a la sección de reserva
function scrollToReserve() {
    if (currentUser) {
        document.getElementById('reservar').scrollIntoView({ behavior: 'smooth' });
    } else {
        scrollToLogin();
    }
}

// Desplazarse a la sección de autenticación
function scrollToLogin() {
    elements.authSection.scrollIntoView({ behavior: 'smooth' });
}

// Verificar estado de autenticación
async function checkAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        await handleUserSignedIn(session.user);
    } else {
        handleUserSignedOut();
    }
    
    // Escuchar cambios en la autenticación
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            await handleUserSignedIn(session.user);
        } else if (event === 'SIGNED_OUT') {
            handleUserSignedOut();
        }
    });
}

// Manejar usuario autenticado
async function handleUserSignedIn(user) {
    currentUser = user;
    
    // Esperar un momento para que el trigger cree el perfil
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Obtener perfil del usuario con reintentos
    let profile = null;
    let retries = 3;
    
    while (retries > 0) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (!error) {
            profile = data;
            break;
        }
        
        if (error.code === 'PGRST116') {
            // Perfil no encontrado, esperar y reintentar
            console.log(`Perfil no encontrado, reintentando... (${retries} intentos restantes)`);
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
        }
        
        // Otro tipo de error
        console.error('Error al cargar perfil:', error);
        break;
    }
    
    if (!profile) {
        showToast('Error al cargar perfil de usuario', 'error');
        return;
    }
    
    userRole = profile.role;
    elements.userInfo.textContent = `Hola, ${profile.full_name}`;
    elements.userInfo.style.display = 'inline';
    
    // Mostrar/ocultar elementos según el rol
    if (userRole === 'admin') {
        elements.adminNav.style.display = 'block';
        elements.adminSection.style.display = 'block';
        await loadAdminData();
    } else {
        elements.adminNav.style.display = 'none';
        elements.adminSection.style.display = 'none';
    }
    
    // Cargar datos del usuario
    await loadUserData();
    
    // Actualizar UI
    elements.authSection.style.display = 'none';
    elements.authenticatedContent.style.display = 'block';
    elements.loginBtn.style.display = 'none';
    elements.logoutBtn.style.display = 'inline-block';
    
    // Actualizar navegación
    document.querySelector('.nav-link[href="#home"]').classList.remove('active');
    document.querySelector('.nav-link[href="#reservar"]').classList.add('active');
    
    // Registrar login en auditoría
    await logAction('login', 'user', user.id);
    
    // Mostrar mensaje de bienvenida
    showToast(`Bienvenido/a, ${profile.full_name}`, 'success');
}

// Manejar usuario no autenticado
function handleUserSignedOut() {
    currentUser = null;
    userRole = 'paciente';
    
    // Actualizar UI
    elements.authSection.style.display = 'block';
    elements.authenticatedContent.style.display = 'none';
    elements.loginBtn.style.display = 'inline-block';
    elements.logoutBtn.style.display = 'none';
    elements.userInfo.style.display = 'none';
    elements.adminNav.style.display = 'none';
    elements.adminSection.style.display = 'none';
    
    // Actualizar navegación
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector('.nav-link[href="#home"]').classList.add('active');
    
    showAuthForm('login');
}

// Mostrar formulario de autenticación específico
function showAuthForm(formName) {
    // Ocultar todos los formularios
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Mostrar el formulario solicitado
    document.getElementById(`${formName}-form`).classList.add('active');
}

// Manejar inicio de sesión
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Mostrar indicador de carga
    const submitBtn = elements.loginFormEl.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';
    submitBtn.disabled = true;
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    // Restaurar botón
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    
    if (error) {
        showToast('Error al iniciar sesión: ' + error.message, 'error');
    } else {
        showToast('Sesión iniciada correctamente', 'success');
        elements.loginFormEl.reset();
    }
}

// Manejar registro
async function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('register-fullname').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    
    // Mostrar indicador de carga
    const submitBtn = elements.registerFormEl.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    submitBtn.disabled = true;
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    phone: phone || null
                }
            }
        });
        
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        if (error) {
            showToast('Error al registrarse: ' + error.message, 'error');
            return;
        }
        
        if (data.user) {
            showToast('Registro exitoso. Por favor verifica tu email.', 'success');
            elements.registerFormEl.reset();
            showAuthForm('login');
            
            // Registrar en auditoría
            await logAction('register', 'user', data.user.id, { full_name: fullName });
        }
    } catch (error) {
        // Restaurar botón en caso de error
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        showToast('Error al registrarse: ' + error.message, 'error');
    }
}

// Manejar recuperación de contraseña
async function handlePasswordReset(e) {
    e.preventDefault();
    
    const email = document.getElementById('reset-email').value;
    
    // Mostrar indicador de carga
    const submitBtn = elements.resetFormEl.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    // Restaurar botón
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    
    if (error) {
        showToast('Error al enviar enlace: ' + error.message, 'error');
    } else {
        showToast('Enlace de recuperación enviado a tu email', 'success');
        elements.resetFormEl.reset();
        showAuthForm('login');
    }
}

// Manejar cierre de sesión
async function handleLogout() {
    // Registrar logout en auditoría
    if (currentUser) {
        await logAction('logout', 'user', currentUser.id);
    }
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        showToast('Error al cerrar sesión: ' + error.message, 'error');
    } else {
        showToast('Sesión cerrada correctamente', 'success');
    }
}

// Cargar profesional por defecto
async function loadProfessional() {
    try {
        const { data, error } = await supabase
            .from('professionals')
            .select('*')
            .limit(1)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                // No hay profesionales en la base de datos
                console.warn('No se encontraron profesionales. Creando uno por defecto...');
                await createDefaultProfessional();
                return;
            }
            throw error;
        }
        
        selectedProfessional = data;
        console.log('Profesional cargado:', data);
    } catch (error) {
        console.error('Error al cargar profesional:', error);
        showToast('Error al cargar información del profesional', 'error');
    }
}

// Crear profesional por defecto si no existe
async function createDefaultProfessional() {
    try {
        const { data, error } = await supabase
            .from('professionals')
            .insert([
                {
                    full_name: 'Lic. María Pérez',
                    specialty: 'Nutrición'
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        selectedProfessional = data;
        console.log('Profesional creado por defecto:', data);
    } catch (error) {
        console.error('Error al crear profesional por defecto:', error);
    }
}

// Cargar datos del usuario
async function loadUserData() {
    if (userRole === 'paciente') {
        await loadMyAppointments();
    }
}

// Cargar datos de administración
async function loadAdminData() {
    await loadAvailabilityRules();
    await loadAvailabilityExceptions();
    await loadAppointmentsForDocuments();
}

// Navegación por secciones
function setupNavigation() {
    elements.navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Actualizar navegación activa
            elements.navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Ocultar menú móvil si está abierto
            elements.navMenu.classList.remove('active');
            
            // Mostrar sección correspondiente
            const targetId = this.getAttribute('href').substring(1);
            document.querySelectorAll('.section').forEach(section => {
                section.style.display = 'none';
            });
            
            document.getElementById(targetId).style.display = 'block';
            
            // Desplazarse a la sección
            document.getElementById(targetId).scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// Wizard de reserva - Paso 1 a 2
async function goToStep2() {
    selectedDate = elements.appointmentDate.value;
    
    if (!selectedDate) {
        showToast('Por favor selecciona una fecha', 'error');
        return;
    }
    
    // Mostrar indicador de carga
    elements.nextToStep2.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
    elements.nextToStep2.disabled = true;
    
    // Cargar slots disponibles para la fecha seleccionada
    const availableSlots = await getAvailableSlots(selectedDate);
    
    // Restaurar botón
    elements.nextToStep2.innerHTML = 'Siguiente <i class="fas fa-arrow-right"></i>';
    elements.nextToStep2.disabled = false;
    
    if (availableSlots.length === 0) {
        showToast('No hay horarios disponibles para esta fecha', 'info');
        return;
    }
    
    // Mostrar slots disponibles
    renderTimeSlots(availableSlots);
    
    // Avanzar al paso 2
    switchWizardStep(2);
}

// Wizard de reserva - Paso 2 a 1
function goToStep1() {
    selectedTimeSlot = null;
    switchWizardStep(1);
}

// Wizard de reserva - Paso 2 a 3
function goToStep3() {
    if (!selectedTimeSlot) {
        showToast('Por favor selecciona un horario', 'error');
        return;
    }
    
    // Mostrar resumen de la reserva
    renderAppointmentSummary();
    
    // Avanzar al paso 3
    switchWizardStep(3);
}

// Cambiar paso del wizard
function switchWizardStep(step) {
    // Actualizar indicadores de pasos
    document.querySelectorAll('.step').forEach(stepEl => {
        stepEl.classList.remove('active');
    });
    document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
    
    // Mostrar contenido del paso correspondiente
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`step-${step}`).classList.add('active');
}

// Obtener slots disponibles para una fecha
async function getAvailableSlots(date) {
    if (!selectedProfessional) return [];
    
    // Obtener día de la semana (0=domingo, 6=sábado)
    const dateObj = new Date(date + 'T00:00:00');
    const weekday = dateObj.getDay();
    
    // Obtener reglas de disponibilidad para este día
    const { data: rules, error: rulesError } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('professional_id', selectedProfessional.id)
        .eq('weekday', weekday)
        .eq('active', true);
    
    if (rulesError) {
        console.error('Error al cargar reglas:', rulesError);
        return [];
    }
    
    // Obtener excepciones para esta fecha
    const { data: exceptions, error: exceptionsError } = await supabase
        .from('availability_exceptions')
        .select('*')
        .eq('professional_id', selectedProfessional.id)
        .eq('date', date);
    
    if (exceptionsError) {
        console.error('Error al cargar excepciones:', exceptionsError);
        return [];
    }
    
    // Obtener citas ya reservadas para esta fecha
    const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('time_slot')
        .eq('professional_id', selectedProfessional.id)
        .eq('date', date)
        .eq('status', 'reserved');
    
    if (appointmentsError) {
        console.error('Error al cargar citas:', appointmentsError);
        return [];
    }
    
    const reservedSlots = appointments.map(a => a.time_slot);
    
    // Generar slots disponibles
    let availableSlots = [];
    
    rules.forEach(rule => {
        const startTime = new Date(`1970-01-01T${rule.start_time}`);
        const endTime = new Date(`1970-01-01T${rule.end_time}`);
        const slotDuration = rule.slot_minutes * 60 * 1000; // en milisegundos
        
        let currentTime = startTime;
        
        while (currentTime < endTime) {
            const timeString = currentTime.toTimeString().substring(0, 5);
            
            // Verificar si el slot está bloqueado por una excepción
            const isBlocked = exceptions.some(exception => {
                const exceptionStart = new Date(`1970-01-01T${exception.start_time}`);
                const exceptionEnd = new Date(`1970-01-01T${exception.end_time}`);
                return currentTime >= exceptionStart && currentTime < exceptionEnd;
            });
            
            // Verificar si el slot ya está reservado
            const isReserved = reservedSlots.includes(timeString);
            
            if (!isBlocked && !isReserved) {
                availableSlots.push(timeString);
            }
            
            currentTime = new Date(currentTime.getTime() + slotDuration);
        }
    });
    
    return availableSlots;
}

// Renderizar slots de tiempo disponibles
function renderTimeSlots(slots) {
    elements.timeSlots.innerHTML = '';
    
    if (slots.length === 0) {
        elements.timeSlots.innerHTML = '<p class="no-slots">No hay horarios disponibles para esta fecha.</p>';
        return;
    }
    
    slots.forEach(slot => {
        const slotElement = document.createElement('div');
        slotElement.className = 'time-slot';
        slotElement.innerHTML = `
            <i class="fas fa-clock"></i>
            <span>${slot}</span>
        `;
        slotElement.addEventListener('click', function() {
            // Deseleccionar todos los slots
            document.querySelectorAll('.time-slot').forEach(s => {
                s.classList.remove('selected');
            });
            
            // Seleccionar este slot
            this.classList.add('selected');
            selectedTimeSlot = slot;
            
            // Habilitar continuación al paso 3
            setTimeout(() => goToStep3(), 300);
        });
        
        elements.timeSlots.appendChild(slotElement);
    });
}

// Renderizar resumen de la reserva
function renderAppointmentSummary() {
    const dateObj = new Date(selectedDate);
    const formattedDate = dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    elements.appointmentSummary.innerHTML = `
        <div class="summary-header">
            <i class="fas fa-calendar-check"></i>
            <h3>Resumen de tu reserva</h3>
        </div>
        <div class="summary-details">
            <div class="detail-item">
                <span class="detail-label">Profesional:</span>
                <span class="detail-value">${selectedProfessional.full_name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Especialidad:</span>
                <span class="detail-value">${selectedProfessional.specialty}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Fecha:</span>
                <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Hora:</span>
                <span class="detail-value">${selectedTimeSlot}</span>
            </div>
        </div>
    `;
}

// Confirmar reserva
async function confirmAppointment() {
    if (!currentUser || !selectedDate || !selectedTimeSlot || !selectedProfessional) {
        showToast('Error al confirmar la reserva', 'error');
        return;
    }
    
    // Mostrar indicador de carga
    elements.confirmAppointment.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Confirmando...';
    elements.confirmAppointment.disabled = true;
    
    try {
        const { data, error } = await supabase
            .from('appointments')
            .insert([
                {
                    professional_id: selectedProfessional.id,
                    patient_id: currentUser.id,
                    date: selectedDate,
                    time_slot: selectedTimeSlot,
                    status: 'reserved'
                }
            ])
            .select()
            .single();
        
        // Restaurar botón
        elements.confirmAppointment.innerHTML = '<i class="fas fa-check"></i> Confirmar Reserva';
        elements.confirmAppointment.disabled = false;
        
        if (error) {
            if (error.code === '23505') { // Violación de constraint único
                showToast('Este horario ya ha sido reservado. Por favor selecciona otro.', 'error');
            } else {
                throw error;
            }
        } else {
            showToast('¡Reserva confirmada correctamente!', 'success');
            
            // Registrar en auditoría
            await logAction('create_appointment', 'appointment', data.id, {
                professional_id: selectedProfessional.id,
                date: selectedDate,
                time_slot: selectedTimeSlot
            });
            
            // Reiniciar wizard
            selectedDate = null;
            selectedTimeSlot = null;
            elements.appointmentDate.value = '';
            switchWizardStep(1);
            
            // Actualizar lista de reservas
            await loadMyAppointments();
        }
    } catch (error) {
        // Restaurar botón en caso de error
        elements.confirmAppointment.innerHTML = '<i class="fas fa-check"></i> Confirmar Reserva';
        elements.confirmAppointment.disabled = false;
        showToast('Error al confirmar la reserva: ' + error.message, 'error');
    }
}

// Cargar mis reservas
async function loadMyAppointments() {
    if (!currentUser) return;
    
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            professionals(full_name, specialty)
        `)
        .eq('patient_id', currentUser.id)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });
    
    if (error) {
        console.error('Error al cargar reservas:', error);
        showToast('Error al cargar tus reservas', 'error');
        return;
    }
    
    renderMyAppointments(data);
}

// Renderizar mis reservas
function renderMyAppointments(appointments) {
    elements.myAppointmentsList.innerHTML = '';
    
    if (appointments.length === 0) {
        elements.myAppointmentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No tienes reservas programadas</h3>
                <p>¡Programa tu primera cita con nuestra nutricionista!</p>
                <button class="btn btn-primary" onclick="document.querySelector('.nav-link[href=\\'#reservar\\']').click()">
                    <i class="fas fa-calendar-plus"></i> Reservar Ahora
                </button>
            </div>
        `;
        return;
    }
    
    appointments.forEach(appointment => {
        const appointmentCard = document.createElement('div');
        appointmentCard.className = 'appointment-card';
        
        const dateObj = new Date(appointment.date);
        const formattedDate = dateObj.toLocaleDateString('es-ES');
        
        // Verificar si la cita es pasada
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPast = dateObj < today;
        
        let statusText = '';
        let statusClass = '';
        if (appointment.status === 'cancelled') {
            statusText = 'Cancelada';
            statusClass = 'status-cancelled';
        } else if (appointment.status === 'completed') {
            statusText = 'Completada';
            statusClass = 'status-completed';
        } else if (isPast) {
            statusText = 'Pasada';
            statusClass = 'status-past';
        } else {
            statusText = 'Confirmada';
            statusClass = 'status-confirmed';
        }
        
        appointmentCard.innerHTML = `
            <div class="appointment-info">
                <h3>${appointment.professionals.full_name} - ${appointment.professionals.specialty}</h3>
                <div class="appointment-details">
                    <div class="detail">
                        <i class="fas fa-calendar"></i>
                        <span>${formattedDate} a las ${appointment.time_slot}</span>
                    </div>
                    <div class="detail">
                        <i class="fas fa-info-circle"></i>
                        <span class="status ${statusClass}">${statusText}</span>
                    </div>
                    ${appointment.notes ? `
                        <div class="detail">
                            <i class="fas fa-sticky-note"></i>
                            <span>${appointment.notes}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="appointment-actions">
                ${appointment.status === 'reserved' && !isPast ? 
                    `<button class="btn btn-outline cancel-appointment" data-id="${appointment.id}">
                        <i class="fas fa-times"></i> Cancelar
                    </button>` : 
                    ''
                }
                <button class="btn btn-primary view-appointment-files" data-id="${appointment.id}">
                    <i class="fas fa-file-medical"></i> Documentos
                </button>
            </div>
        `;
        
        elements.myAppointmentsList.appendChild(appointmentCard);
    });
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.cancel-appointment').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = this.getAttribute('data-id');
            showCancelAppointmentModal(appointmentId);
        });
    });
    
    document.querySelectorAll('.view-appointment-files').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = this.getAttribute('data-id');
            viewAppointmentFiles(appointmentId);
        });
    });
}

// Mostrar modal de cancelación de reserva
function showCancelAppointmentModal(appointmentId) {
    showModal(
        'Cancelar Reserva',
        '¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer.',
        async () => {
            await cancelAppointment(appointmentId);
        }
    );
}

// Cancelar reserva
async function cancelAppointment(appointmentId) {
    try {
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'cancelled' })
            .eq('id', appointmentId);
        
        if (error) throw error;
        
        showToast('Reserva cancelada correctamente', 'success');
        
        // Registrar en auditoría
        await logAction('cancel_appointment', 'appointment', appointmentId);
        
        // Actualizar lista de reservas
        await loadMyAppointments();
    } catch (error) {
        showToast('Error al cancelar la reserva: ' + error.message, 'error');
    }
}

// Ver documentos de una cita
async function viewAppointmentFiles(appointmentId) {
    const { data: files, error } = await supabase
        .from('appointment_files')
        .select('*')
        .eq('appointment_id', appointmentId);
    
    if (error) {
        showToast('Error al cargar documentos: ' + error.message, 'error');
        return;
    }
    
    if (files.length === 0) {
        showToast('No hay documentos asociados a esta cita', 'info');
        return;
    }
    
    // Mostrar modal con lista de documentos
    let filesHTML = '<div class="files-list">';
    files.forEach(file => {
        const fileName = file.storage_path.split('/').pop();
        filesHTML += `
            <div class="file-item">
                <i class="fas fa-file-pdf"></i>
                <span>${fileName}</span>
                <button class="btn btn-primary download-file" data-id="${file.id}">
                    <i class="fas fa-download"></i> Descargar
                </button>
            </div>
        `;
    });
    filesHTML += '</div>';
    
    showModal(
        'Documentos de la Cita',
        filesHTML,
        null,
        'Cerrar'
    );
    
    // Agregar event listeners para descarga
    document.querySelectorAll('.download-file').forEach(link => {
        link.addEventListener('click', async function(e) {
            e.preventDefault();
            const fileId = this.getAttribute('data-id');
            await downloadAppointmentFile(fileId);
        });
    });
}

// Descargar archivo de una cita
async function downloadAppointmentFile(fileId) {
    try {
        // Obtener información del archivo
        const { data: file, error: fileError } = await supabase
            .from('appointment_files')
            .select('*')
            .eq('id', fileId)
            .single();
        
        if (fileError) throw fileError;
        
        // Obtener URL firmada para descarga
        const { data, error } = await supabase.storage
            .from('documentos')
            .createSignedUrl(file.storage_path, 600); // 10 minutos de validez
        
        if (error) throw error;
        
        // Descargar archivo
        window.open(data.signedUrl, '_blank');
        
        // Registrar en auditoría
        await logAction('download_file', 'appointment_file', fileId);
    } catch (error) {
        showToast('Error al descargar el archivo: ' + error.message, 'error');
    }
}

// ADMIN: Cambiar pestaña
function switchAdminTab(tabName) {
    // Actualizar botones de pestañas
    elements.tabBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
    
    // Mostrar contenido de la pestaña
    elements.tabPanes.forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// ADMIN: Cargar reglas de disponibilidad
async function loadAvailabilityRules() {
    if (!selectedProfessional) return;
    
    const { data, error } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('professional_id', selectedProfessional.id)
        .order('weekday', { ascending: true })
        .order('start_time', { ascending: true });
    
    if (error) {
        console.error('Error al cargar reglas:', error);
        return;
    }
    
    renderAvailabilityRules(data);
}

// ADMIN: Renderizar reglas de disponibilidad
function renderAvailabilityRules(rules) {
    elements.availabilityRulesList.innerHTML = '';
    
    if (rules.length === 0) {
        elements.availabilityRulesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clock"></i>
                <h3>No hay reglas de disponibilidad</h3>
                <p>Configura los horarios disponibles para cada día de la semana</p>
            </div>
        `;
        return;
    }
    
    const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    rules.forEach(rule => {
        const ruleElement = document.createElement('div');
        ruleElement.className = 'availability-rule';
        ruleElement.innerHTML = `
            <div class="rule-info">
                <div class="rule-day">${weekdays[rule.weekday]}</div>
                <div class="rule-time">${rule.start_time} - ${rule.end_time}</div>
                <div class="rule-duration">${rule.slot_minutes} min por cita</div>
                ${rule.active ? '' : '<div class="rule-status inactive">Inactiva</div>'}
            </div>
            <div class="rule-actions">
                <button class="btn btn-outline edit-rule" data-id="${rule.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-danger delete-rule" data-id="${rule.id}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        
        elements.availabilityRulesList.appendChild(ruleElement);
    });
    
    // Agregar event listeners
    document.querySelectorAll('.edit-rule').forEach(btn => {
        btn.addEventListener('click', function() {
            const ruleId = this.getAttribute('data-id');
            editAvailabilityRule(ruleId);
        });
    });
    
    document.querySelectorAll('.delete-rule').forEach(btn => {
        btn.addEventListener('click', function() {
            const ruleId = this.getAttribute('data-id');
            showDeleteRuleModal(ruleId);
        });
    });
}

// ADMIN: Mostrar modal para agregar regla de disponibilidad
function showAddAvailabilityRuleModal() {
    const modalHTML = `
        <form id="add-rule-form">
            <div class="form-group">
                <label for="rule-weekday">Día de la semana:</label>
                <select id="rule-weekday" required>
                    <option value="0">Domingo</option>
                    <option value="1">Lunes</option>
                    <option value="2">Martes</option>
                    <option value="3">Miércoles</option>
                    <option value="4">Jueves</option>
                    <option value="5">Viernes</option>
                    <option value="6">Sábado</option>
                </select>
            </div>
            <div class="form-group">
                <label for="rule-start-time">Hora de inicio:</label>
                <input type="time" id="rule-start-time" required>
            </div>
            <div class="form-group">
                <label for="rule-end-time">Hora de fin:</label>
                <input type="time" id="rule-end-time" required>
            </div>
            <div class="form-group">
                <label for="rule-slot-minutes">Duración de cada cita (minutos):</label>
                <input type="number" id="rule-slot-minutes" value="30" min="15" step="15" required>
            </div>
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="rule-active" checked> 
                    <span class="checkmark"></span>
                    Regla activa
                </label>
            </div>
        </form>
    `;
    
    showModal(
        'Agregar Regla de Disponibilidad',
        modalHTML,
        async () => {
            await addAvailabilityRule();
        },
        'Cancelar',
        'Agregar'
    );
}

// ADMIN: Agregar regla de disponibilidad
async function addAvailabilityRule() {
    const weekday = document.getElementById('rule-weekday').value;
    const startTime = document.getElementById('rule-start-time').value;
    const endTime = document.getElementById('rule-end-time').value;
    const slotMinutes = document.getElementById('rule-slot-minutes').value;
    const active = document.getElementById('rule-active').checked;
    
    if (!selectedProfessional) return;
    
    try {
        const { error } = await supabase
            .from('availability_rules')
            .insert([
                {
                    professional_id: selectedProfessional.id,
                    weekday: parseInt(weekday),
                    start_time: startTime,
                    end_time: endTime,
                    slot_minutes: parseInt(slotMinutes),
                    active: active
                }
            ]);
        
        if (error) throw error;
        
        showToast('Regla agregada correctamente', 'success');
        
        // Registrar en auditoría
        await logAction('add_availability_rule', 'availability_rule', null, {
            weekday: weekday,
            start_time: startTime,
            end_time: endTime,
            slot_minutes: slotMinutes
        });
        
        // Recargar reglas
        await loadAvailabilityRules();
        hideModal();
    } catch (error) {
        showToast('Error al agregar regla: ' + error.message, 'error');
    }
}

// ADMIN: Editar regla de disponibilidad
async function editAvailabilityRule(ruleId) {
    // Implementar según necesidad (similar a agregar pero con datos existentes)
    showToast('Funcionalidad de edición en desarrollo', 'info');
}

// ADMIN: Mostrar modal para eliminar regla
function showDeleteRuleModal(ruleId) {
    showModal(
        'Eliminar Regla',
        '¿Estás seguro de que deseas eliminar esta regla de disponibilidad?',
        async () => {
            await deleteAvailabilityRule(ruleId);
        }
    );
}

// ADMIN: Eliminar regla de disponibilidad
async function deleteAvailabilityRule(ruleId) {
    try {
        const { error } = await supabase
            .from('availability_rules')
            .delete()
            .eq('id', ruleId);
        
        if (error) throw error;
        
        showToast('Regla eliminada correctamente', 'success');
        
        // Registrar en auditoría
        await logAction('delete_availability_rule', 'availability_rule', ruleId);
        
        // Recargar reglas
        await loadAvailabilityRules();
        hideModal();
    } catch (error) {
        showToast('Error al eliminar regla: ' + error.message, 'error');
    }
}

// ADMIN: Cargar excepciones de disponibilidad
async function loadAvailabilityExceptions() {
    if (!selectedProfessional) return;
    
    const { data, error } = await supabase
        .from('availability_exceptions')
        .select('*')
        .eq('professional_id', selectedProfessional.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
    
    if (error) {
        console.error('Error al cargar excepciones:', error);
        return;
    }
    
    renderAvailabilityExceptions(data);
}

// ADMIN: Renderizar excepciones de disponibilidad
function renderAvailabilityExceptions(exceptions) {
    elements.availabilityExceptionsList.innerHTML = '';
    
    if (exceptions.length === 0) {
        elements.availabilityExceptionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No hay excepciones configuradas</h3>
                <p>Agrega fechas específicas con horarios especiales o días no laborables</p>
            </div>
        `;
        return;
    }
    
    exceptions.forEach(exception => {
        const exceptionElement = document.createElement('div');
        exceptionElement.className = 'availability-exception';
        exceptionElement.innerHTML = `
            <div class="exception-info">
                <div class="exception-date">${exception.date}</div>
                <div class="exception-time">${exception.start_time} - ${exception.end_time}</div>
                ${exception.reason ? `<div class="exception-reason">${exception.reason}</div>` : ''}
            </div>
            <div class="exception-actions">
                <button class="btn btn-danger delete-exception" data-id="${exception.id}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        
        elements.availabilityExceptionsList.appendChild(exceptionElement);
    });
    
    // Agregar event listeners
    document.querySelectorAll('.delete-exception').forEach(btn => {
        btn.addEventListener('click', function() {
            const exceptionId = this.getAttribute('data-id');
            showDeleteExceptionModal(exceptionId);
        });
    });
}

// ADMIN: Mostrar modal para agregar excepción
function showAddAvailabilityExceptionModal() {
    const modalHTML = `
        <form id="add-exception-form">
            <div class="form-group">
                <label for="exception-date">Fecha:</label>
                <input type="date" id="exception-date" required>
            </div>
            <div class="form-group">
                <label for="exception-start-time">Hora de inicio:</label>
                <input type="time" id="exception-start-time" required>
            </div>
            <div class="form-group">
                <label for="exception-end-time">Hora de fin:</label>
                <input type="time" id="exception-end-time" required>
            </div>
            <div class="form-group">
                <label for="exception-reason">Motivo (opcional):</label>
                <input type="text" id="exception-reason" placeholder="Ej: Vacaciones, Feriado, etc.">
            </div>
        </form>
    `;
    
    showModal(
        'Agregar Excepción/Bloqueo',
        modalHTML,
        async () => {
            await addAvailabilityException();
        },
        'Cancelar',
        'Agregar'
    );
}

// ADMIN: Agregar excepción de disponibilidad
async function addAvailabilityException() {
    const date = document.getElementById('exception-date').value;
    const startTime = document.getElementById('exception-start-time').value;
    const endTime = document.getElementById('exception-end-time').value;
    const reason = document.getElementById('exception-reason').value;
    
    if (!selectedProfessional) return;
    
    try {
        const { error } = await supabase
            .from('availability_exceptions')
            .insert([
                {
                    professional_id: selectedProfessional.id,
                    date: date,
                    start_time: startTime,
                    end_time: endTime,
                    reason: reason || null
                }
            ]);
        
        if (error) throw error;
        
        showToast('Excepción agregada correctamente', 'success');
        
        // Registrar en auditoría
        await logAction('add_availability_exception', 'availability_exception', null, {
            date: date,
            start_time: startTime,
            end_time: endTime,
            reason: reason
        });
        
        // Recargar excepciones
        await loadAvailabilityExceptions();
        hideModal();
    } catch (error) {
        showToast('Error al agregar excepción: ' + error.message, 'error');
    }
}

// ADMIN: Mostrar modal para eliminar excepción
function showDeleteExceptionModal(exceptionId) {
    showModal(
        'Eliminar Excepción',
        '¿Estás seguro de que deseas eliminar esta excepción?',
        async () => {
            await deleteAvailabilityException(exceptionId);
        }
    );
}

// ADMIN: Eliminar excepción de disponibilidad
async function deleteAvailabilityException(exceptionId) {
    try {
        const { error } = await supabase
            .from('availability_exceptions')
            .delete()
            .eq('id', exceptionId);
        
        if (error) throw error;
        
        showToast('Excepción eliminada correctamente', 'success');
        
        // Registrar en auditoría
        await logAction('delete_availability_exception', 'availability_exception', exceptionId);
        
        // Recargar excepciones
        await loadAvailabilityExceptions();
        hideModal();
    } catch (error) {
        showToast('Error al eliminar excepción: ' + error.message, 'error');
    }
}

// ADMIN: Cargar agenda del día
async function loadDayAgenda() {
    const date = elements.agendaDate.value;
    
    if (!date) {
        showToast('Por favor selecciona una fecha', 'error');
        return;
    }
    
    if (!selectedProfessional) return;
    
    // Mostrar indicador de carga
    elements.loadAgenda.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
    elements.loadAgenda.disabled = true;
    
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            profiles(full_name, phone)
        `)
        .eq('professional_id', selectedProfessional.id)
        .eq('date', date)
        .order('time_slot', { ascending: true });
    
    // Restaurar botón
    elements.loadAgenda.innerHTML = '<i class="fas fa-sync-alt"></i> Cargar Agenda';
    elements.loadAgenda.disabled = false;
    
    if (error) {
        console.error('Error al cargar agenda:', error);
        showToast('Error al cargar la agenda', 'error');
        return;
    }
    
    renderDayAgenda(data);
}

// ADMIN: Renderizar agenda del día
function renderDayAgenda(appointments) {
    elements.agendaList.innerHTML = '';
    
    if (appointments.length === 0) {
        elements.agendaList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-check"></i>
                <h3>No hay citas programadas</h3>
                <p>No se han programado citas para esta fecha</p>
            </div>
        `;
        return;
    }
    
    appointments.forEach(appointment => {
        const agendaItem = document.createElement('div');
        agendaItem.className = 'agenda-item';
        
        let statusColor = 'var(--primary-color)';
        let statusText = 'Reservada';
        if (appointment.status === 'cancelled') {
            statusColor = 'var(--error-color)';
            statusText = 'Cancelada';
        } else if (appointment.status === 'completed') {
            statusColor = 'var(--success-color)';
            statusText = 'Completada';
        }
        
        agendaItem.innerHTML = `
            <div class="agenda-info">
                <h3>${appointment.time_slot} - ${appointment.profiles.full_name}</h3>
                <div class="agenda-details">
                    <div class="detail">
                        <i class="fas fa-phone"></i>
                        <span>${appointment.profiles.phone || 'No proporcionado'}</span>
                    </div>
                    <div class="detail">
                        <i class="fas fa-info-circle"></i>
                        <span style="color: ${statusColor}">${statusText}</span>
                    </div>
                    ${appointment.notes ? `
                        <div class="detail">
                            <i class="fas fa-sticky-note"></i>
                            <span>${appointment.notes}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="agenda-actions">
                <button class="btn btn-outline add-notes" data-id="${appointment.id}">
                    <i class="fas fa-edit"></i> Notas
                </button>
                <button class="btn btn-primary change-status" data-id="${appointment.id}">
                    <i class="fas fa-sync-alt"></i> Estado
                </button>
            </div>
        `;
        
        elements.agendaList.appendChild(agendaItem);
    });
    
    // Agregar event listeners
    document.querySelectorAll('.add-notes').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = this.getAttribute('data-id');
            showAddNotesModal(appointmentId);
        });
    });
    
    document.querySelectorAll('.change-status').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = this.getAttribute('data-id');
            showChangeStatusModal(appointmentId);
        });
    });
}

// ADMIN: Mostrar modal para agregar notas
function showAddNotesModal(appointmentId) {
    const modalHTML = `
        <div class="form-group">
            <label for="appointment-notes">Notas de la consulta:</label>
            <textarea id="appointment-notes" rows="4" placeholder="Agrega observaciones o notas importantes sobre esta consulta"></textarea>
        </div>
    `;
    
    showModal(
        'Agregar Notas a la Cita',
        modalHTML,
        async () => {
            await updateAppointmentNotes(appointmentId);
        },
        'Cancelar',
        'Guardar'
    );
}

// ADMIN: Actualizar notas de una cita
async function updateAppointmentNotes(appointmentId) {
    const notes = document.getElementById('appointment-notes').value;
    
    try {
        const { error } = await supabase
            .from('appointments')
            .update({ notes: notes })
            .eq('id', appointmentId);
        
        if (error) throw error;
        
        showToast('Notas actualizadas correctamente', 'success');
        
        // Registrar en auditoría
        await logAction('update_appointment_notes', 'appointment', appointmentId, {
            notes: notes
        });
        
        // Recargar agenda
        await loadDayAgenda();
        hideModal();
    } catch (error) {
        showToast('Error al actualizar notas: ' + error.message, 'error');
    }
}

// ADMIN: Mostrar modal para cambiar estado
function showChangeStatusModal(appointmentId) {
    const modalHTML = `
        <div class="form-group">
            <label for="appointment-status">Nuevo estado de la cita:</label>
            <select id="appointment-status">
                <option value="reserved">Reservada</option>
                <option value="cancelled">Cancelada</option>
                <option value="completed">Completada</option>
            </select>
        </div>
    `;
    
    showModal(
        'Cambiar Estado de la Cita',
        modalHTML,
        async () => {
            await updateAppointmentStatus(appointmentId);
        },
        'Cancelar',
        'Actualizar'
    );
}

// ADMIN: Actualizar estado de una cita
async function updateAppointmentStatus(appointmentId) {
    const status = document.getElementById('appointment-status').value;
    
    try {
        const { error } = await supabase
            .from('appointments')
            .update({ status: status })
            .eq('id', appointmentId);
        
        if (error) throw error;
        
        showToast('Estado actualizado correctamente', 'success');
        
        // Registrar en auditoría
        await logAction('update_appointment_status', 'appointment', appointmentId, {
            status: status
        });
        
        // Recargar agenda
        await loadDayAgenda();
        hideModal();
    } catch (error) {
        showToast('Error al actualizar estado: ' + error.message, 'error');
    }
}

// ADMIN: Cargar citas para subir documentos
async function loadAppointmentsForDocuments() {
    if (!selectedProfessional) return;
    
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            id,
            date,
            time_slot,
            profiles(full_name)
        `)
        .eq('professional_id', selectedProfessional.id)
        .order('date', { ascending: false });
    
    if (error) {
        console.error('Error al cargar citas para documentos:', error);
        return;
    }
    
    renderAppointmentsForDocuments(data);
}

// ADMIN: Renderizar citas para subir documentos
function renderAppointmentsForDocuments(appointments) {
    elements.appointmentForDocument.innerHTML = '<option value="">Seleccionar cita</option>';
    
    appointments.forEach(appointment => {
        const option = document.createElement('option');
        option.value = appointment.id;
        option.textContent = `${appointment.date} ${appointment.time_slot} - ${appointment.profiles.full_name}`;
        elements.appointmentForDocument.appendChild(option);
    });
}

// ADMIN: Subir documento para una cita
async function uploadAppointmentDocument() {
    const appointmentId = elements.appointmentForDocument.value;
    const file = elements.documentFile.files[0];
    
    if (!appointmentId) {
        showToast('Por favor selecciona una cita', 'error');
        return;
    }
    
    if (!file) {
        showToast('Por favor selecciona un archivo', 'error');
        return;
    }
    
    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Solo se permiten archivos PDF, PNG, JPG o JPEG', 'error');
        return;
    }
    
    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('El archivo no puede ser mayor a 5MB', 'error');
        return;
    }
    
    // Mostrar indicador de carga
    elements.uploadDocument.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
    elements.uploadDocument.disabled = true;
    
    try {
        // Subir archivo a storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const storagePath = `documentos/${appointmentId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
            .from('documentos')
            .upload(storagePath, file);
        
        if (uploadError) throw uploadError;
        
        // Registrar en la base de datos
        const { error: dbError } = await supabase
            .from('appointment_files')
            .insert([
                {
                    appointment_id: appointmentId,
                    storage_path: storagePath
                }
            ]);
        
        if (dbError) throw dbError;
        
        showToast('Documento subido correctamente', 'success');
        
        // Registrar en auditoría
        await logAction('upload_document', 'appointment_file', null, {
            appointment_id: appointmentId,
            file_name: file.name,
            storage_path: storagePath
        });
        
        // Limpiar formulario
        elements.documentFile.value = '';
        document.getElementById('file-name').textContent = 'Ningún archivo seleccionado';
    } catch (error) {
        showToast('Error al subir documento: ' + error.message, 'error');
    } finally {
        // Restaurar botón
        elements.uploadDocument.innerHTML = '<i class="fas fa-upload"></i> Subir Documento';
        elements.uploadDocument.disabled = false;
    }
}

// Función para mostrar notificaciones toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="btn btn-link toast-close">&times;</button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
    
    // Cerrar manualmente
    toast.querySelector('.toast-close').addEventListener('click', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}

// Obtener icono para toast según el tipo
function getToastIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Función para mostrar modal
function showModal(title, message, confirmCallback = null, cancelText = 'Cancelar', confirmText = 'Confirmar') {
    elements.modalTitle.textContent = title;
    elements.modalMessage.innerHTML = message;
    elements.modalConfirm.textContent = confirmText;
    elements.modalCancel.textContent = cancelText;
    
    // Mostrar u ocultar botones según sea necesario
    if (confirmCallback) {
        elements.modalCancel.style.display = 'inline-block';
        elements.modalConfirm.style.display = 'inline-block';
    } else {
        elements.modalCancel.style.display = 'inline-block';
        elements.modalConfirm.style.display = 'none';
    }
    
    elements.modal.style.display = 'flex';
    
    // Configurar event listeners
    elements.modalConfirm.onclick = function() {
        if (confirmCallback) {
            confirmCallback();
        } else {
            hideModal();
        }
    };
    
    elements.modalCancel.onclick = hideModal;
}

// Función para ocultar modal
function hideModal() {
    elements.modal.style.display = 'none';
    elements.modalConfirm.onclick = null;
}

// Función para registrar acciones en auditoría
async function logAction(action, entity, entityId, meta = null) {
    if (!currentUser) return;
    
    try {
        const { error } = await supabase
            .from('audit_logs')
            .insert([
                {
                    user_id: currentUser.id,
                    action: action,
                    entity: entity,
                    entity_id: entityId,
                    meta: meta
                }
            ]);
        
        if (error) {
            console.error('Error al registrar auditoría:', error);
        }
    } catch (error) {
        console.error('Error al registrar auditoría:', error);
    }
}