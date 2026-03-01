// ===== MAIN APPLICATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
});

// ===== PASSWORD MANAGER =====
class PasswordManager {
    constructor() {
        this.defaultPassword = 'admin123';
        this.passwordKey = 'quickdishkitchen_admin_password';
        this.isAuthenticated = false;
        this.loginAttempts = 0;
        this.maxAttempts = 5;
        this.lockoutTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.lockoutKey = 'quickdishkitchen_lockout';
        
        this.init();
    }
    
    init() {
        // Check if user is locked out
        this.checkLockout();
        
        // Set default password if not exists
        if (!this.getStoredPassword()) {
            this.setPassword(this.defaultPassword);
        }
    }
    
    // Get stored password (hashed)
    getStoredPassword() {
        return localStorage.getItem(this.passwordKey);
    }
    
    // Set new password (hashed)
    setPassword(newPassword) {
        // Simple hash function for demo purposes
        // In a real app, use a proper hashing library
        const hashedPassword = this.hashPassword(newPassword);
        localStorage.setItem(this.passwordKey, hashedPassword);
    }
    
    // Simple hash function (for demonstration only)
    hashPassword(password) {
        // This is a VERY basic hash - in production use a proper hashing library
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36) + password.length;
    }
    
    // Verify password
    verifyPassword(inputPassword) {
        // Check lockout first
        if (this.isLockedOut()) {
            return { success: false, message: 'Too many failed attempts. Please try again later.' };
        }
        
        const storedHash = this.getStoredPassword();
        const inputHash = this.hashPassword(inputPassword);
        
        if (storedHash === inputHash) {
            // Successful login
            this.isAuthenticated = true;
            this.loginAttempts = 0;
            localStorage.removeItem(this.lockoutKey);
            return { success: true, message: 'Login successful' };
        } else {
            // Failed login
            this.loginAttempts++;
            
            if (this.loginAttempts >= this.maxAttempts) {
                // Lock the user out
                const lockoutUntil = Date.now() + this.lockoutTime;
                localStorage.setItem(this.lockoutKey, lockoutUntil.toString());
                return { 
                    success: false, 
                    message: `Too many failed attempts. Please try again in 5 minutes.` 
                };
            }
            
            const attemptsLeft = this.maxAttempts - this.loginAttempts;
            return { 
                success: false, 
                message: `Incorrect password. ${attemptsLeft} attempt(s) remaining.` 
            };
        }
    }
    
    // Check if user is locked out
    isLockedOut() {
        const lockoutUntil = localStorage.getItem(this.lockoutKey);
        if (!lockoutUntil) return false;
        
        const lockoutTime = parseInt(lockoutUntil);
        const currentTime = Date.now();
        
        if (currentTime < lockoutTime) {
            return true;
        } else {
            // Lockout expired
            localStorage.removeItem(this.lockoutKey);
            this.loginAttempts = 0;
            return false;
        }
    }
    
    // Get lockout time remaining in minutes
    getLockoutTimeRemaining() {
        const lockoutUntil = localStorage.getItem(this.lockoutKey);
        if (!lockoutUntil) return 0;
        
        const lockoutTime = parseInt(lockoutUntil);
        const currentTime = Date.now();
        const timeRemaining = Math.max(0, lockoutTime - currentTime);
        
        return Math.ceil(timeRemaining / 60000); // Convert to minutes
    }
    
    // Check lockout status
    checkLockout() {
        if (this.isLockedOut()) {
            const minutesLeft = this.getLockoutTimeRemaining();
            console.warn(`Admin panel locked. Try again in ${minutesLeft} minute(s).`);
        }
    }
    
    // Logout
    logout() {
        this.isAuthenticated = false;
    }
    
    // Change password
    changePassword(currentPassword, newPassword) {
        const verification = this.verifyPassword(currentPassword);
        
        if (verification.success) {
            this.setPassword(newPassword);
            return { success: true, message: 'Password changed successfully' };
        } else {
            return { success: false, message: verification.message };
        }
    }
    
    // Get password strength
    getPasswordStrength(password) {
        if (password.length < 6) return { strength: 'weak', message: 'Too short' };
        
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score <= 1) return { strength: 'weak', message: 'Weak' };
        if (score <= 3) return { strength: 'medium', message: 'Medium' };
        return { strength: 'strong', message: 'Strong' };
    }
}

// ===== DATA MANAGER =====
class DataManager {
    constructor(passwordManager) {
        this.passwordManager = passwordManager;
        this.defaultData = {
            offers: [
                {
                    id: '1',
                    title: '30% Off on First Order',
                    description: 'Get 30% discount on your first order above ₹300',
                    code: 'QDK30',
                    validUntil: '2023-12-31',
                    active: true
                },
                {
                    id: '2',
                    title: 'Free Delivery',
                    description: 'Free delivery on all orders above ₹500',
                    code: '',
                    validUntil: '2023-12-31',
                    active: true
                },
                {
                    id: '3',
                    title: 'Weekend Special',
                    description: 'Buy any biryani and get a free dessert',
                    code: 'WEEKEND',
                    validUntil: '2023-12-25',
                    active: true
                }
            ],
            links: {
                swiggy: 'https://swiggy.com/restaurant/quickdishkitchen',
                zomato: 'https://zomato.com/restaurant/quickdishkitchen'
            },
            contact: {
                phone: '+91 98765 43210',
                whatsapp: 'https://wa.me/919876543210',
                location: 'Bengaluru, India'
            }
        };
        
        this.loadData();
    }
    
    // Load data from localStorage or use defaults
    loadData() {
        const savedData = localStorage.getItem('quickdishkitchen_data');
        
        if (savedData) {
            try {
                this.data = JSON.parse(savedData);
                
                // Merge with defaults to ensure new properties are added
                this.data.offers = [...this.data.offers];
                this.data.links = {...this.defaultData.links, ...this.data.links};
                this.data.contact = {...this.defaultData.contact, ...this.data.contact};
            } catch (e) {
                console.error('Error parsing saved data:', e);
                this.data = {...this.defaultData};
            }
        } else {
            this.data = {...this.defaultData};
            this.saveData();
        }
    }
    
    // Save data to localStorage (only if authenticated)
    saveData() {
        if (!this.passwordManager.isAuthenticated) {
            this.showNotification('Authentication required to save data!', 'error');
            return false;
        }
        
        localStorage.setItem('quickdishkitchen_data', JSON.stringify(this.data));
        this.showNotification('Data saved successfully!');
        return true;
    }
    
    // Get all offers
    getOffers() {
        return this.data.offers;
    }
    
    // Get active offers only
    getActiveOffers() {
        return this.data.offers.filter(offer => offer.active);
    }
    
    // Get offer by ID
    getOfferById(id) {
        return this.data.offers.find(offer => offer.id === id);
    }
    
    // Add a new offer (only if authenticated)
    addOffer(offer) {
        if (!this.passwordManager.isAuthenticated) {
            this.showNotification('Please login to add offers!', 'error');
            return null;
        }
        
        // Generate a unique ID
        offer.id = Date.now().toString();
        this.data.offers.push(offer);
        this.saveData();
        return offer.id;
    }
    
    // Update an existing offer (only if authenticated)
    updateOffer(id, updatedOffer) {
        if (!this.passwordManager.isAuthenticated) {
            this.showNotification('Please login to update offers!', 'error');
            return false;
        }
        
        const index = this.data.offers.findIndex(offer => offer.id === id);
        if (index !== -1) {
            this.data.offers[index] = {...updatedOffer, id};
            this.saveData();
            return true;
        }
        return false;
    }
    
    // Delete an offer (only if authenticated)
    deleteOffer(id) {
        if (!this.passwordManager.isAuthenticated) {
            this.showNotification('Please login to delete offers!', 'error');
            return false;
        }
        
        const index = this.data.offers.findIndex(offer => offer.id === id);
        if (index !== -1) {
            this.data.offers.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }
    
    // Toggle offer status (only if authenticated)
    toggleOfferStatus(id) {
        if (!this.passwordManager.isAuthenticated) {
            this.showNotification('Please login to modify offers!', 'error');
            return false;
        }
        
        const offer = this.getOfferById(id);
        if (offer) {
            offer.active = !offer.active;
            this.saveData();
            return offer.active;
        }
        return false;
    }
    
    // Get links
    getLinks() {
        return this.data.links;
    }
    
    // Update links (only if authenticated)
    updateLinks(links) {
        if (!this.passwordManager.isAuthenticated) {
            this.showNotification('Please login to update links!', 'error');
            return false;
        }
        
        this.data.links = {...this.data.links, ...links};
        this.saveData();
        return true;
    }
    
    // Get contact info
    getContactInfo() {
        return this.data.contact;
    }
    
    // Update contact info (only if authenticated)
    updateContactInfo(contact) {
        if (!this.passwordManager.isAuthenticated) {
            this.showNotification('Please login to update contact info!', 'error');
            return false;
        }
        
        this.data.contact = {...this.data.contact, ...contact};
        this.saveData();
        return true;
    }
    
    // Export data as JSON file
    exportData() {
        if (!this.passwordManager.isAuthenticated) {
            this.showNotification('Please login to export data!', 'error');
            return;
        }
        
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'quickdishkitchen_data.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showNotification('Data exported successfully!');
    }
    
    // Import data from JSON file (only if authenticated)
    importData(file, callback) {
        if (!this.passwordManager.isAuthenticated) {
            this.showNotification('Please login to import data!', 'error');
            if (callback) callback(false);
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                
                // Validate the imported data structure
                if (importedData.offers && importedData.links && importedData.contact) {
                    this.data = importedData;
                    this.saveData();
                    this.showNotification('Data imported successfully!');
                    if (callback) callback(true);
                } else {
                    this.showNotification('Invalid data format!', 'error');
                    if (callback) callback(false);
                }
            } catch (e) {
                console.error('Error importing data:', e);
                this.showNotification('Error importing data!', 'error');
                if (callback) callback(false);
            }
        };
        
        reader.readAsText(file);
    }
    
    // Reset to default data (only if authenticated)
    resetData() {
        if (!this.passwordManager.isAuthenticated) {
            this.showNotification('Please login to reset data!', 'error');
            return false;
        }
        
        if (confirm('Are you sure you want to reset all data to defaults? This cannot be undone.')) {
            this.data = {...this.defaultData};
            this.saveData();
            this.showNotification('Data reset to defaults!');
            return true;
        }
        return false;
    }
    
    // Show notification
    showNotification(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = toast.querySelector('.toast-message');
        const toastIcon = toast.querySelector('.toast-icon');
        
        toastMessage.textContent = message;
        
        // Change icon based on type
        if (type === 'error') {
            toastIcon.className = 'fas fa-exclamation-circle toast-icon';
            toast.style.backgroundColor = 'var(--danger-color)';
        } else {
            toastIcon.className = 'fas fa-check-circle toast-icon';
            toast.style.backgroundColor = 'var(--success-color)';
        }
        
        toast.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// ===== UI MANAGER =====
class UIManager {
    constructor(dataManager, passwordManager) {
        this.dataManager = dataManager;
        this.passwordManager = passwordManager;
        this.currentOfferId = null;
        this.setupEventListeners();
    }
    
    // Initialize the UI
    init() {
        this.setCurrentYear();
        this.renderAllSections();
        this.setupNavigation();
    }
    
    // Set current year in footer
    setCurrentYear() {
        document.getElementById('currentYear').textContent = new Date().getFullYear();
    }
    
    // Setup all event listeners
    setupEventListeners() {
        // Admin panel access
        document.getElementById('adminAccessBtn').addEventListener('click', () => this.showPasswordModal());
        
        // Password modal
        document.getElementById('submitPasswordBtn').addEventListener('click', () => this.verifyAdminPassword());
        document.getElementById('cancelPasswordBtn').addEventListener('click', () => this.hidePasswordModal());
        document.getElementById('adminPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyAdminPassword();
        });
        
        // Admin panel
        document.getElementById('closeAdminBtn').addEventListener('click', () => this.toggleAdminPanel(false));
        
        // Admin tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchAdminTab(e.target.dataset.tab));
        });
        
        // Offer management
        document.getElementById('addOfferBtn').addEventListener('click', () => this.openOfferModal());
        document.getElementById('saveOfferBtn').addEventListener('click', () => this.saveOffer());
        document.getElementById('cancelOfferBtn').addEventListener('click', () => this.closeOfferModal());
        document.getElementById('deleteOfferBtn').addEventListener('click', () => this.deleteOffer());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeOfferModal());
        
        // Links and contact
        document.getElementById('saveLinksBtn').addEventListener('click', () => this.saveLinks());
        document.getElementById('saveContactBtn').addEventListener('click', () => this.saveContactInfo());
        
        // Data management
        document.getElementById('exportDataBtn').addEventListener('click', () => this.dataManager.exportData());
        document.getElementById('importDataBtn').addEventListener('click', () => document.getElementById('importDataFile').click());
        document.getElementById('importDataFile').addEventListener('change', (e) => this.importData(e));
        document.getElementById('resetDataBtn').addEventListener('click', () => this.resetData());
        
        // Change password
        document.getElementById('changePasswordBtn').addEventListener('click', () => this.changePassword());
        
        // Password strength indicator
        document.getElementById('newPassword').addEventListener('input', (e) => this.updatePasswordStrength(e.target.value));
        
        // Close modals when clicking outside
        document.getElementById('adminPanel').addEventListener('click', (e) => {
            if (e.target.id === 'adminPanel') this.toggleAdminPanel(false);
        });
        
        document.getElementById('offerModal').addEventListener('click', (e) => {
            if (e.target.id === 'offerModal') this.closeOfferModal();
        });
        
        document.getElementById('passwordModal').addEventListener('click', (e) => {
            if (e.target.id === 'passwordModal') this.hidePasswordModal();
        });
        
        // Mobile menu toggle
        document.getElementById('menuToggle').addEventListener('click', () => this.toggleMobileMenu());
        
        // Auto-logout after 30 minutes of inactivity
        this.setupAutoLogout();
    }
    
    // Show password modal
    showPasswordModal() {
        const modal = document.getElementById('passwordModal');
        const passwordInput = document.getElementById('adminPassword');
        const errorDiv = document.getElementById('passwordError');
        
        // Reset form
        passwordInput.value = '';
        errorDiv.style.display = 'none';
        passwordInput.focus();
        
        // Check if user is locked out
        if (this.passwordManager.isLockedOut()) {
            const minutesLeft = this.passwordManager.getLockoutTimeRemaining();
            errorDiv.innerHTML = `<i class="fas fa-lock"></i> Too many failed attempts. Please try again in ${minutesLeft} minute(s).`;
            errorDiv.style.display = 'block';
            passwordInput.disabled = true;
            document.getElementById('submitPasswordBtn').disabled = true;
        } else {
            passwordInput.disabled = false;
            document.getElementById('submitPasswordBtn').disabled = false;
        }
        
        modal.classList.add('active');
    }
    
    // Hide password modal
    hidePasswordModal() {
        document.getElementById('passwordModal').classList.remove('active');
        document.getElementById('adminPassword').value = '';
        document.getElementById('passwordError').style.display = 'none';
    }
    
    // Verify admin password
    verifyAdminPassword() {
        const password = document.getElementById('adminPassword').value;
        const result = this.passwordManager.verifyPassword(password);
        
        if (result.success) {
            this.hidePasswordModal();
            this.toggleAdminPanel(true);
        } else {
            document.getElementById('passwordError').innerHTML = `<i class="fas fa-exclamation-circle"></i> ${result.message}`;
            document.getElementById('passwordError').style.display = 'block';
            document.getElementById('adminPassword').value = '';
            document.getElementById('adminPassword').focus();
            
            // If locked out, disable the form
            if (this.passwordManager.isLockedOut()) {
                document.getElementById('adminPassword').disabled = true;
                document.getElementById('submitPasswordBtn').disabled = true;
            }
        }
    }
    
    // Toggle admin panel (only if authenticated)
    toggleAdminPanel(show) {
        if (show && !this.passwordManager.isAuthenticated) {
            this.showPasswordModal();
            return;
        }
        
        const adminPanel = document.getElementById('adminPanel');
        if (show) {
            adminPanel.classList.add('active');
            this.loadAdminData();
        } else {
            adminPanel.classList.remove('active');
        }
    }
    
    // Switch admin tabs
    switchAdminTab(tabId) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // Update active tab content
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}Tab`);
        });
    }
    
    // Load data into admin panel
    loadAdminData() {
        this.renderAdminOffers();
        this.loadAdminLinks();
        this.loadAdminContact();
    }
    
    // Render offers in admin panel
    renderAdminOffers() {
        const offers = this.dataManager.getOffers();
        const container = document.getElementById('adminOffersList');
        
        if (offers.length === 0) {
            container.innerHTML = '<p class="no-offers">No offers added yet.</p>';
            return;
        }
        
        container.innerHTML = '';
        
        offers.forEach(offer => {
            const offerElement = document.createElement('div');
            offerElement.className = 'admin-offer-item';
            offerElement.innerHTML = `
                <div class="admin-offer-info">
                    <h4>${offer.title}</h4>
                    <p>${offer.description}</p>
                    <div class="offer-details">
                        <small><strong>Code:</strong> ${offer.code || 'N/A'}</small> | 
                        <small><strong>Valid Until:</strong> ${offer.validUntil || 'N/A'}</small>
                    </div>
                </div>
                <div class="admin-offer-actions">
                    <button class="btn btn-small ${offer.active ? 'btn-success' : 'btn-secondary'}" onclick="uiManager.toggleOfferStatus('${offer.id}')">
                        ${offer.active ? 'Active' : 'Inactive'}
                    </button>
                    <button class="btn btn-small btn-primary" onclick="uiManager.editOffer('${offer.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            `;
            
            container.appendChild(offerElement);
        });
    }
    
    // Load links into admin form
    loadAdminLinks() {
        const links = this.dataManager.getLinks();
        document.getElementById('swiggyLink').value = links.swiggy;
        document.getElementById('zomatoLink').value = links.zomato;
    }
    
    // Load contact info into admin form
    loadAdminContact() {
        const contact = this.dataManager.getContactInfo();
        document.getElementById('phoneNumber').value = contact.phone;
        document.getElementById('whatsappLink').value = contact.whatsapp;
        document.getElementById('locationText').value = contact.location;
    }
    
    // Toggle offer status
    toggleOfferStatus(id) {
        if (this.passwordManager.isAuthenticated) {
            this.dataManager.toggleOfferStatus(id);
            this.renderAdminOffers();
            this.renderAllPublicOffers();
        } else {
            this.showPasswordModal();
        }
    }
    
    // Open offer modal for editing or adding
    openOfferModal(offerId = null) {
        if (!this.passwordManager.isAuthenticated) {
            this.showPasswordModal();
            return;
        }
        
        const modal = document.getElementById('offerModal');
        const modalTitle = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteOfferBtn');
        
        if (offerId) {
            // Edit existing offer
            this.currentOfferId = offerId;
            const offer = this.dataManager.getOfferById(offerId);
            
            modalTitle.textContent = 'Edit Offer';
            document.getElementById('offerTitle').value = offer.title;
            document.getElementById('offerDescription').value = offer.description;
            document.getElementById('offerCode').value = offer.code;
            document.getElementById('offerValid').value = offer.validUntil;
            document.getElementById('offerActive').checked = offer.active;
            deleteBtn.style.display = 'inline-block';
        } else {
            // Add new offer
            this.currentOfferId = null;
            modalTitle.textContent = 'Add New Offer';
            document.getElementById('offerTitle').value = '';
            document.getElementById('offerDescription').value = '';
            document.getElementById('offerCode').value = '';
            document.getElementById('offerValid').value = '';
            document.getElementById('offerActive').checked = true;
            deleteBtn.style.display = 'none';
        }
        
        modal.classList.add('active');
    }
    
    // Close offer modal
    closeOfferModal() {
        document.getElementById('offerModal').classList.remove('active');
        this.currentOfferId = null;
    }
    
    // Edit offer
    editOffer(id) {
        if (this.passwordManager.isAuthenticated) {
            this.openOfferModal(id);
        } else {
            this.showPasswordModal();
        }
    }
    
    // Save offer (add or update)
    saveOffer() {
        if (!this.passwordManager.isAuthenticated) {
            this.showPasswordModal();
            return;
        }
        
        const title = document.getElementById('offerTitle').value.trim();
        const description = document.getElementById('offerDescription').value.trim();
        const code = document.getElementById('offerCode').value.trim();
        const validUntil = document.getElementById('offerValid').value;
        const active = document.getElementById('offerActive').checked;
        
        if (!title || !description) {
            this.dataManager.showNotification('Please fill in all required fields!', 'error');
            return;
        }
        
        const offer = {
            title,
            description,
            code,
            validUntil,
            active
        };
        
        if (this.currentOfferId) {
            // Update existing offer
            this.dataManager.updateOffer(this.currentOfferId, offer);
        } else {
            // Add new offer
            this.dataManager.addOffer(offer);
        }
        
        this.closeOfferModal();
        this.renderAdminOffers();
        this.renderAllPublicOffers();
    }
    
    // Delete offer
    deleteOffer() {
        if (!this.passwordManager.isAuthenticated) {
            this.showPasswordModal();
            return;
        }
        
        if (confirm('Are you sure you want to delete this offer?')) {
            this.dataManager.deleteOffer(this.currentOfferId);
            this.closeOfferModal();
            this.renderAdminOffers();
            this.renderAllPublicOffers();
        }
    }
    
    // Save links
    saveLinks() {
        if (!this.passwordManager.isAuthenticated) {
            this.showPasswordModal();
            return;
        }
        
        const swiggyLink = document.getElementById('swiggyLink').value.trim();
        const zomatoLink = document.getElementById('zomatoLink').value.trim();
        
        if (!swiggyLink || !zomatoLink) {
            this.dataManager.showNotification('Please fill in all links!', 'error');
            return;
        }
        
        this.dataManager.updateLinks({ swiggy: swiggyLink, zomato: zomatoLink });
        this.updatePublicLinks();
    }
    
    // Save contact info
    saveContactInfo() {
        if (!this.passwordManager.isAuthenticated) {
            this.showPasswordModal();
            return;
        }
        
        const phone = document.getElementById('phoneNumber').value.trim();
        const whatsapp = document.getElementById('whatsappLink').value.trim();
        const location = document.getElementById('locationText').value.trim();
        
        if (!phone || !whatsapp || !location) {
            this.dataManager.showNotification('Please fill in all contact information!', 'error');
            return;
        }
        
        this.dataManager.updateContactInfo({ phone, whatsapp, location });
        this.updatePublicContactInfo();
    }
    
    // Import data
    importData(event) {
        if (!this.passwordManager.isAuthenticated) {
            this.showPasswordModal();
            return;
        }
        
        const file = event.target.files[0];
        if (file) {
            this.dataManager.importData(file, (success) => {
                if (success) {
                    this.loadAdminData();
                    this.renderAllSections();
                    event.target.value = ''; // Reset file input
                }
            });
        }
    }
    
    // Reset data
    resetData() {
        if (!this.passwordManager.isAuthenticated) {
            this.showPasswordModal();
            return;
        }
        
        if (this.dataManager.resetData()) {
            this.loadAdminData();
            this.renderAllSections();
        }
    }
    
    // Change password
    changePassword() {
        if (!this.passwordManager.isAuthenticated) {
            this.showPasswordModal();
            return;
        }
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.dataManager.showNotification('Please fill in all password fields!', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.dataManager.showNotification('New passwords do not match!', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            this.dataManager.showNotification('Password must be at least 6 characters long!', 'error');
            return;
        }
        
        const result = this.passwordManager.changePassword(currentPassword, newPassword);
        
        if (result.success) {
            this.dataManager.showNotification('Password changed successfully!');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            document.getElementById('passwordStrength').innerHTML = '';
        } else {
            this.dataManager.showNotification(result.message, 'error');
        }
    }
    
    // Update password strength indicator
    updatePasswordStrength(password) {
        const strengthDiv = document.getElementById('passwordStrength');
        if (!password) {
            strengthDiv.innerHTML = '';
            return;
        }
        
        const strength = this.passwordManager.getPasswordStrength(password);
        strengthDiv.innerHTML = `Strength: <span class="strength-${strength.strength}">${strength.message}</span>`;
    }
    
    // Setup auto-logout after inactivity
    setupAutoLogout() {
        let inactivityTimer;
        
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            if (this.passwordManager.isAuthenticated) {
                // Logout after 30 minutes of inactivity
                inactivityTimer = setTimeout(() => {
                    if (this.passwordManager.isAuthenticated) {
                        this.passwordManager.logout();
                        this.dataManager.showNotification('Automatically logged out due to inactivity', 'error');
                        this.toggleAdminPanel(false);
                    }
                }, 30 * 60 * 1000); // 30 minutes
            }
        };
        
        // Reset timer on user activity
        ['click', 'mousemove', 'keypress', 'scroll'].forEach(event => {
            document.addEventListener(event, resetTimer);
        });
        
        resetTimer();
    }
    
    // Render all public sections
    renderAllSections() {
        this.renderHomeOffers();
        this.renderOffersSection();
        this.updatePublicLinks();
        this.updatePublicContactInfo();
    }
    
    // Render offers on homepage
    renderHomeOffers() {
        const offers = this.dataManager.getActiveOffers().slice(0, 3); // Show only 3 on homepage
        const container = document.getElementById('homeOffersGrid');
        
        if (offers.length === 0) {
            container.innerHTML = '<p class="no-offers">No active offers at the moment.</p>';
            return;
        }
        
        container.innerHTML = '';
        
        offers.forEach(offer => {
            const offerElement = this.createOfferCard(offer);
            container.appendChild(offerElement);
        });
    }
    
    // Render offers section
    renderOffersSection() {
        const offers = this.dataManager.getActiveOffers();
        const container = document.getElementById('offersContainer');
        
        if (offers.length === 0) {
            container.innerHTML = '<p class="no-offers">No active offers at the moment. Check back soon!</p>';
            return;
        }
        
        container.innerHTML = '';
        
        offers.forEach(offer => {
            const offerElement = this.createOfferCard(offer);
            container.appendChild(offerElement);
        });
    }
    
    // Create offer card element
    createOfferCard(offer) {
        const offerElement = document.createElement('div');
        offerElement.className = 'offer-card';
        
        offerElement.innerHTML = `
            <div class="offer-header">
                <h4>${offer.title}</h4>
                ${offer.code ? `<span class="offer-badge">${offer.code}</span>` : ''}
            </div>
            <div class="offer-body">
                <p class="offer-description">${offer.description}</p>
            </div>
            <div class="offer-footer">
                <div class="offer-validity">
                    <small><i class="far fa-calendar"></i> Valid until: ${offer.validUntil || 'N/A'}</small>
                </div>
                <div class="offer-status">
                    <i class="fas fa-circle ${offer.active ? 'status-active' : 'status-inactive'}"></i>
                    <span class="${offer.active ? 'status-active' : 'status-inactive'}">${offer.active ? 'Active' : 'Inactive'}</span>
                </div>
            </div>
        `;
        
        return offerElement;
    }
    
    // Update all public links
    updatePublicLinks() {
        const links = this.dataManager.getLinks();
        
        // Update all Swiggy buttons
        document.querySelectorAll('[id*="swiggy"], [id*="Swiggy"]').forEach(btn => {
            if (btn.tagName === 'A') {
                btn.href = links.swiggy;
            }
        });
        
        // Update all Zomato buttons
        document.querySelectorAll('[id*="zomato"], [id*="Zomato"]').forEach(btn => {
            if (btn.tagName === 'A') {
                btn.href = links.zomato;
            }
        });
    }
    
    // Update all public contact info
    updatePublicContactInfo() {
        const contact = this.dataManager.getContactInfo();
        
        // Update phone number
        document.getElementById('contactPhone').textContent = contact.phone;
        document.getElementById('footerPhone').textContent = contact.phone;
        
        // Update call button
        document.getElementById('callBtn').href = `tel:${contact.phone.replace(/\s/g, '')}`;
        
        // Update WhatsApp button
        document.getElementById('whatsappBtn').href = contact.whatsapp;
        
        // Update location
        document.getElementById('locationInfo').textContent = contact.location;
        document.getElementById('footerLocation').textContent = contact.location;
    }
    
    // Setup navigation
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.section');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get target section id
                const targetId = link.getAttribute('href').substring(1);
                
                // Update active nav link
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                link.classList.add('active');
                
                // Show target section
                sections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === targetId) {
                        section.classList.add('active');
                    }
                });
                
                // Close mobile menu if open
                this.closeMobileMenu();
            });
        });
    }
    
    // Toggle mobile menu
    toggleMobileMenu() {
        const nav = document.getElementById('mainNav');
        nav.classList.toggle('active');
    }
    
    // Close mobile menu
    closeMobileMenu() {
        document.getElementById('mainNav').classList.remove('active');
    }
}

// ===== INITIALIZE APPLICATION =====
let passwordManager, dataManager, uiManager;

function initApp() {
    // Initialize password manager
    passwordManager = new PasswordManager();
    
    // Initialize data manager
    dataManager = new DataManager(passwordManager);
    
    // Initialize UI manager
    uiManager = new UIManager(dataManager, passwordManager);
    uiManager.init();
    
    // Make uiManager globally accessible for inline event handlers
    window.uiManager = uiManager;
    window.passwordManager = passwordManager;
}