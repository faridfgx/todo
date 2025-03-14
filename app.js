// Task management
let tasks = [];
let currentFilter = 'all';
let deferredPrompt = null;
let dialogCallback = null;
let isLocked = false;
let hasPassword = false;

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskContainer = document.getElementById('task-container');
const emptyState = document.getElementById('empty-state');
const taskCount = document.getElementById('task-count');
const filterButtons = document.querySelectorAll('.filter-button');
const connectionStatus = document.getElementById('connection-status');
const settingsDrawer = document.getElementById('settings-drawer');
const settingsOverlay = document.getElementById('settings-overlay');
const settingsToggleBtn = document.getElementById('settings-toggle');
const closeDrawerBtn = document.getElementById('close-drawer');
const exportDataBtn = document.getElementById('export-data');
const importDataBtn = document.getElementById('import-data');
const importFileInput = document.getElementById('import-file');
const clearAllTasksBtn = document.getElementById('clear-all-tasks');
const passwordActionsContainer = document.getElementById('password-actions');
const themeOptions = document.querySelectorAll('.theme-option');
const toastContainer = document.getElementById('toast-container');
const confirmationDialog = document.getElementById('confirmation-dialog');
const dialogTitle = document.getElementById('dialog-title');
const dialogMessage = document.getElementById('dialog-message');
const dialogCancelBtn = document.getElementById('dialog-cancel');
const dialogConfirmBtn = document.getElementById('dialog-confirm');
const installPrompt = document.getElementById('install-prompt');
const installButton = document.getElementById('install-button');
const installLater = document.getElementById('install-later');

// Initialize the app
function init() {
  loadTasks();
  checkLockStatus();
  renderTasks();
  updateTaskCount();
  updateConnectionStatus();
  loadTheme();
  registerEventListeners();
  setupServiceWorker();
}

// Password protection functions
function checkLockStatus() {
  hasPassword = !!localStorage.getItem('vault-password');
  isLocked = hasPassword && localStorage.getItem('vault-locked') === 'true';
  
  // Update UI based on lock status
  document.body.classList.toggle('app-locked', isLocked);
  
  // Update password protection settings
  updatePasswordProtectionUI();
  
  if (isLocked) {
    promptForPassword();
  }
}

function promptForPassword() {
  showPasswordDialog(
    'Enter Password',
    'Please enter your password to unlock your tasks:',
    validatePassword
  );
}

function validatePassword(enteredPassword) {
  const storedHash = localStorage.getItem('vault-password');
  const enteredHash = hashPassword(enteredPassword);
  
  if (enteredHash === storedHash) {
    unlockApp();
    showToast('Tasks unlocked successfully', 'success');
  } else {
    showToast('Incorrect password', 'error');
    setTimeout(promptForPassword, 500);
  }
}

function unlockApp() {
  isLocked = false;
  localStorage.setItem('vault-locked', 'false');
  document.body.classList.remove('app-locked');
  renderTasks();
  updateTaskCount();
}

function lockApp() {
  isLocked = true;
  localStorage.setItem('vault-locked', 'true');
  document.body.classList.add('app-locked');
  renderTasks();
  updateTaskCount();
  showToast('Tasks locked', 'success');
}

function setPassword() {
  showPasswordDialog(
    'Set Password',
    'Enter a new password to protect your tasks:',
    (newPassword) => {
      if (newPassword.length < 4) {
        showToast('Password must be at least 4 characters', 'error');
        return;
      }
      
      localStorage.setItem('vault-password', hashPassword(newPassword));
      hasPassword = true;
      updatePasswordProtectionUI();
      showToast('Password set successfully', 'success');
      
      // Ask if user wants to lock now
      showConfirmationDialog(
        'Lock Now?',
        'Do you want to lock your tasks now?',
        lockApp
      );
    }
  );
}

function changePassword() {
  showPasswordDialog(
    'Current Password',
    'Enter your current password:',
    (currentPassword) => {
      const storedHash = localStorage.getItem('vault-password');
      const enteredHash = hashPassword(currentPassword);
      
      if (enteredHash === storedHash) {
        showPasswordDialog(
          'New Password',
          'Enter your new password:',
          (newPassword) => {
            if (newPassword.length < 4) {
              showToast('Password must be at least 4 characters', 'error');
              return;
            }
            
            localStorage.setItem('vault-password', hashPassword(newPassword));
            showToast('Password changed successfully', 'success');
          }
        );
      } else {
        showToast('Incorrect password', 'error');
      }
    }
  );
}

function removePassword() {
  showPasswordDialog(
    'Remove Password',
    'Enter your current password to remove protection:',
    (currentPassword) => {
      const storedHash = localStorage.getItem('vault-password');
      const enteredHash = hashPassword(currentPassword);
      
      if (enteredHash === storedHash) {
        localStorage.removeItem('vault-password');
        localStorage.setItem('vault-locked', 'false');
        hasPassword = false;
        isLocked = false;
        document.body.classList.remove('app-locked');
        updatePasswordProtectionUI();
        renderTasks();
        updateTaskCount();
        showToast('Password protection removed', 'success');
      } else {
        showToast('Incorrect password', 'error');
      }
    }
  );
}

function updatePasswordProtectionUI() {
  if (!passwordActionsContainer) return;
  
  passwordActionsContainer.innerHTML = '';
  
  if (!hasPassword) {
    const setPasswordBtn = document.createElement('button');
    setPasswordBtn.id = 'set-password';
    setPasswordBtn.className = 'secondary';
    setPasswordBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      Set Password
    `;
    setPasswordBtn.addEventListener('click', setPassword);
    passwordActionsContainer.appendChild(setPasswordBtn);
  } else {
    const lockAppBtn = document.createElement('button');
    lockAppBtn.id = 'lock-app';
    lockAppBtn.className = isLocked ? 'secondary' : 'primary';
    lockAppBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      ${isLocked ? 'Unlock App' : 'Lock App'}
    `;
    
    lockAppBtn.addEventListener('click', () => {
      if (isLocked) {
        promptForPassword();
      } else {
        lockApp();
      }
    });
    
    const changePasswordBtn = document.createElement('button');
    changePasswordBtn.id = 'change-password';
    changePasswordBtn.className = 'secondary';
    changePasswordBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <line x1="12" y1="16" x2="12" y2="16.01" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      Change Password
    `;
    changePasswordBtn.addEventListener('click', changePassword);
    
    const removePasswordBtn = document.createElement('button');
    removePasswordBtn.id = 'remove-password';
    removePasswordBtn.className = 'secondary danger';
    removePasswordBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <line x1="8" y1="16" x2="16" y2="16" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      Remove Password
    `;
    removePasswordBtn.addEventListener('click', removePassword);
    
    passwordActionsContainer.appendChild(lockAppBtn);
    passwordActionsContainer.appendChild(changePasswordBtn);
    passwordActionsContainer.appendChild(removePasswordBtn);
  }
}

// Simple hash function (in a real app, use a more secure method)
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

// Custom password dialog
function showPasswordDialog(title, message, callback) {
  // Create a custom dialog for password input
  const passwordDialog = document.createElement('div');
  passwordDialog.className = 'dialog-container open';
  passwordDialog.id = 'password-dialog';
  
  passwordDialog.innerHTML = `
    <div class="dialog">
      <div class="dialog-header">
        <h3>${title}</h3>
      </div>
      <div class="dialog-content">
        <p>${message}</p>
        <input type="password" id="password-input" class="task-input" placeholder="Password" autocomplete="current-password">
      </div>
      <div class="dialog-footer">
        <button class="secondary" id="password-cancel">Cancel</button>
        <button id="password-confirm">Confirm</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(passwordDialog);
  
  const passwordInput = document.getElementById('password-input');
  const passwordConfirm = document.getElementById('password-confirm');
  const passwordCancel = document.getElementById('password-cancel');
  
  // Focus the input
  setTimeout(() => passwordInput.focus(), 100);
  
  // Handle confirmation
  const handleConfirm = () => {
    const password = passwordInput.value.trim();
    if (password) {
      passwordDialog.remove();
      callback(password);
    } else {
      passwordInput.classList.add('error');
      setTimeout(() => passwordInput.classList.remove('error'), 500);
    }
  };
  
  passwordConfirm.addEventListener('click', handleConfirm);
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleConfirm();
  });
  
  // Handle cancellation
  passwordCancel.addEventListener('click', () => {
    passwordDialog.remove();
    if (isLocked) promptForPassword(); // If canceling during unlock, prompt again
  });
}

// Local Storage functions
function loadTasks() {
  const storedTasks = localStorage.getItem('vault-tasks');
  tasks = storedTasks ? JSON.parse(storedTasks) : [];
}

function saveTasks() {
  localStorage.setItem('vault-tasks', JSON.stringify(tasks));
}

function loadTheme() {
  const storedTheme = localStorage.getItem('vault-theme') || 'light';
  document.body.className = `${storedTheme}-theme`;
  if (isLocked) document.body.classList.add('app-locked');
  
  themeOptions.forEach(option => {
    option.classList.toggle('active', option.dataset.theme === storedTheme);
  });
}

function saveTheme(theme) {
  localStorage.setItem('vault-theme', theme);
}

// Task CRUD operations
function addTask(text) {
  if (isLocked) {
    showToast('App is locked. Unlock to add tasks.', 'warning');
    promptForPassword();
    return;
  }
  
  const newTask = {
    id: Date.now().toString(),
    text: text,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  tasks.unshift(newTask); // Add to beginning of array
  saveTasks();
  renderTasks();
  updateTaskCount();
  showToast('Task added successfully', 'success');
}

function toggleTaskCompletion(id) {
  if (isLocked) {
    showToast('App is locked. Unlock to modify tasks.', 'warning');
    promptForPassword();
    return;
  }
  
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex !== -1) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    saveTasks();
    renderTasks();
    updateTaskCount();
  }
}

function editTask(id) {
  if (isLocked) {
    showToast('App is locked. Unlock to edit tasks.', 'warning');
    promptForPassword();
    return;
  }
  
  const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
  const taskContent = taskElement.querySelector('.task-content');
  const taskText = taskContent.textContent;
  
  // Replace task content with editable input
  const inputElement = document.createElement('input');
  inputElement.type = 'text';
  inputElement.className = 'task-edit-input';
  inputElement.value = taskText;
  
  // Replace content with input
  taskContent.innerHTML = '';
  taskContent.appendChild(inputElement);
  inputElement.focus();
  
  // Save on blur or Enter key
  const saveEdit = () => {
    const newText = inputElement.value.trim();
    if (newText) {
      const taskIndex = tasks.findIndex(task => task.id === id);
      if (taskIndex !== -1) {
        tasks[taskIndex].text = newText;
        saveTasks();
        renderTasks();
        showToast('Task updated', 'success');
      }
    }
  };
  
  inputElement.addEventListener('blur', saveEdit);
  inputElement.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      renderTasks(); // Cancel edit
    }
  });
}

function deleteTask(id) {
  if (isLocked) {
    showToast('App is locked. Unlock to delete tasks.', 'warning');
    promptForPassword();
    return;
  }
  
  showConfirmationDialog(
    'Delete Task',
    'Are you sure you want to delete this task?',
    () => {
      const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
      taskElement.classList.add('deleting');
      
      // Add animation delay before actual deletion
      setTimeout(() => {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateTaskCount();
        showToast('Task deleted', 'success');
      }, 300); // Match the animation duration
    }
  );
}

// Task rendering
function renderTasks() {
  // Clear existing tasks except empty state
  const taskElements = taskContainer.querySelectorAll('.task-item');
  taskElements.forEach(element => element.remove());

  // If locked, show lock screen
  if (isLocked) {
    emptyState.style.display = 'flex';
    emptyState.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      <h3>Your tasks are locked</h3>
      <p>Enter your password to unlock</p>
      <button id="unlock-button" class="primary">Unlock</button>
    `;
    
    document.getElementById('unlock-button').addEventListener('click', promptForPassword);
    return;
  }
  
  // Filter tasks based on current filter
  let filteredTasks = tasks;
  if (currentFilter === 'active') {
    filteredTasks = tasks.filter(task => !task.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(task => task.completed);
  }

  // Show or hide empty state
  if (filteredTasks.length === 0) {
    emptyState.style.display = 'flex';
    emptyState.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="9" x2="15" y2="15" />
        <line x1="15" y1="9" x2="9" y2="15" />
      </svg>
      <h3>No tasks yet</h3>
      <p>Add your first task to get started</p>
    `;
  } else {
    emptyState.style.display = 'none';
  }

  // Render each task
  filteredTasks.forEach(task => {
    const taskElement = createTaskElement(task);
    taskContainer.appendChild(taskElement);
  });
}

function createTaskElement(task) {
  const taskElement = document.createElement('div');
  taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
  taskElement.dataset.id = task.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;
  checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));

  const content = document.createElement('div');
  content.className = 'task-content';
  content.textContent = task.text;
  
  // Add date information
  const dateInfo = document.createElement('div');
  dateInfo.className = 'task-date-info';
  
  // Format the date
  const taskDate = new Date(task.createdAt);
  const formattedDate = taskDate.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
  
  dateInfo.innerHTML = `
    <span class="task-date">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      ${formattedDate}
    </span>
  `;
  
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'content-wrapper';
  contentWrapper.appendChild(content);
  contentWrapper.appendChild(dateInfo);

  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const editButton = document.createElement('button');
  editButton.className = 'action-button edit-button';
  editButton.title = 'Edit task';
  editButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  `;
  editButton.addEventListener('click', () => editTask(task.id));

  const deleteButton = document.createElement('button');
  deleteButton.className = 'action-button delete-button';
  deleteButton.title = 'Delete task';
  deleteButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  `;
  deleteButton.addEventListener('click', () => deleteTask(task.id));

  actions.appendChild(editButton);
  actions.appendChild(deleteButton);

  taskElement.appendChild(checkbox);
  taskElement.appendChild(contentWrapper);
  taskElement.appendChild(actions);

  // Add ripple effect on click
  taskElement.addEventListener('mousedown', function(e) {
    if (e.target === taskElement || e.target === contentWrapper || e.target === content) {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      this.appendChild(ripple);
      
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size/2}px`;
      ripple.style.top = `${e.clientY - rect.top - size/2}px`;
      
      ripple.classList.add('active');
      
      setTimeout(() => {
        ripple.remove();
      }, 500);
    }
  });

  return taskElement;
}

function updateTaskCount() {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const activeTasks = totalTasks - completedTasks;
  
  if (isLocked) {
    taskCount.textContent = 'Locked';
    return;
  }
  
  if (currentFilter === 'all') {
    taskCount.textContent = `${totalTasks} task${totalTasks !== 1 ? 's' : ''}`;
  } else if (currentFilter === 'active') {
    taskCount.textContent = `${activeTasks} active task${activeTasks !== 1 ? 's' : ''}`;
  } else if (currentFilter === 'completed') {
    taskCount.textContent = `${completedTasks} completed task${completedTasks !== 1 ? 's' : ''}`;
  }
}

// Enhanced Toast notifications
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Add icons based on toast type
  let iconSvg = '';
  switch(type) {
    case 'success':
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>`;
      break;
    case 'warning':
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>`;
      break;
    case 'error':
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`;
      break;
    default:
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a76a8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>`;
  }
  
  // Create the toast with content and close button
  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-content">${message}</div>
    <div class="toast-close">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
  `;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Add close button functionality
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  });
  
  // Remove toast after longer duration (5 seconds)
  setTimeout(() => {
    if (toast.parentNode === toastContainer) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (toast.parentNode === toastContainer) {
          toast.remove();
        }
      }, 300);
    }
  }, 5000); // Increased from 3000 to 5000ms
}

// Confirmation dialog
function showConfirmationDialog(title, message, confirmCallback) {
  dialogTitle.textContent = title;
  dialogMessage.textContent = message;
  dialogCallback = confirmCallback;
  confirmationDialog.classList.add('open');
}

function closeConfirmationDialog() {
  confirmationDialog.classList.remove('open');
  dialogCallback = null;
}

// Connection status handling
function updateConnectionStatus() {
  if (navigator.onLine) {
    connectionStatus.className = 'status-indicator online';
    connectionStatus.innerHTML = '<span class="status-dot"></span><span class="status-text">Online</span>';
  } else {
    connectionStatus.className = 'status-indicator offline';
    connectionStatus.innerHTML = '<span class="status-dot"></span><span class="status-text">Offline</span>';
    showToast('You are offline. Changes will be saved locally.', 'warning');
  }
}

// Event handlers and utility functions
function toggleSettingsDrawer() {
  settingsDrawer.classList.toggle('open');
  settingsOverlay.classList.toggle('open');
}

function exportTasksToJson() {
  if (isLocked) {
    showToast('App is locked. Unlock to export tasks.', 'warning');
    promptForPassword();
    return;
  }
  
  if (tasks.length === 0) {
    showToast('No tasks to export', 'warning');
    return;
  }
  
  const dataStr = JSON.stringify(tasks, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `vault-tasks-${new Date().toISOString().slice(0,10)}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  showToast('Tasks exported successfully', 'success');
}

function importTasksFromJson() {
  if (isLocked) {
    showToast('App is locked. Unlock to import tasks.', 'warning');
    promptForPassword();
    return;
  }
  
  importFileInput.click();
}

function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedTasks = JSON.parse(e.target.result);
      if (Array.isArray(importedTasks)) {
        showConfirmationDialog(
          'Import Tasks',
          'Do you want to replace your current tasks with the imported tasks?',
          () => {
            tasks = importedTasks;
            saveTasks();
            renderTasks();
            updateTaskCount();
            showToast('Tasks imported successfully', 'success');
            event.target.value = '';
          }
        );
      } else {
        showToast('Invalid task format', 'error');
      }
    } catch (err) {
      showToast('Failed to parse JSON file', 'error');
    }
  };
  reader.readAsText(file);
}

function clearAllTasks() {
  if (isLocked) {
    showToast('App is locked. Unlock to clear tasks.', 'warning');
    promptForPassword();
    return;
  }
  
  if (tasks.length === 0) {
    showToast('No tasks to clear', 'warning');
    return;
  }
  
  showConfirmationDialog(
    'Clear All Tasks',
    'Are you sure you want to delete all tasks? This cannot be undone.',
    () => {
      tasks = [];
      saveTasks();
      renderTasks();
      updateTaskCount();
      showToast('All tasks cleared', 'success');
    }
  );
}

function changeTheme(theme) {
  document.body.className = `${theme}-theme`;
  if (isLocked) document.body.classList.add('app-locked');
  saveTheme(theme);
  themeOptions.forEach(option => {
    option.classList.toggle('active', option.dataset.theme === theme);
  });
}

// Register Event Listeners
function registerEventListeners() {
  // Task form submission
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskText = taskInput.value.trim();
    if (taskText) {
      addTask(taskText);
      taskInput.value = '';
    }
  });
  
  // Filter buttons
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (isLocked) {
        showToast('App is locked. Unlock to filter tasks.', 'warning');
        promptForPassword();
        return;
      }
      
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentFilter = button.dataset.filter;
      renderTasks();
      updateTaskCount();
    });
  });
  
  // Settings drawer
  settingsToggleBtn.addEventListener('click', toggleSettingsDrawer);
  closeDrawerBtn.addEventListener('click', toggleSettingsDrawer);
  settingsOverlay.addEventListener('click', toggleSettingsDrawer);
  
  // Settings actions
  exportDataBtn.addEventListener('click', exportTasksToJson);
  importDataBtn.addEventListener('click', importTasksFromJson);
  importFileInput.addEventListener('change', handleFileImport);
  clearAllTasksBtn.addEventListener('click', clearAllTasks);
  
  // Theme options
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      changeTheme(option.dataset.theme);
    });
  });
  
  // Confirmation dialog
  dialogConfirmBtn.addEventListener('click', () => {
    if (dialogCallback) {
      dialogCallback();
    }
    closeConfirmationDialog();
  });
  
  dialogCancelBtn.addEventListener('click', closeConfirmationDialog);
  
  // Install prompt
  installButton.addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          showToast('Thank you for installing Vault!', 'success');
        }
        deferredPrompt = null;
      });
      installPrompt.style.display = 'none';
    }
  });
  
  installLater.addEventListener('click', () => {
    installPrompt.style.display = 'none';
    localStorage.setItem('install-prompt-dismissed', 'true');
  });
  
  // Online/offline events
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
}

// Service Worker for offline functionality
function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Determine the correct path based on current location
      const basePath = location.pathname.includes('/todo/') ? '/todo' : '';
      const swPath = `${basePath}/sw.js`;
      
      navigator.serviceWorker.register(swPath).then(registration => {
        console.log('ServiceWorker registered with scope:', registration.scope);
      }).catch(error => {
        console.log('ServiceWorker registration failed:', error);
        showToast('Service worker registration failed. Some offline features may not work.', 'warning');
      });
    });
    
    // Handle PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;
      
      // Don't show if user has dismissed before
      if (!localStorage.getItem('install-prompt-dismissed')) {
        installPrompt.style.display = 'flex';
      }
    });
    
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        showToast(event.data.message, 'success');
      }
    });
  }
}

// Run initialization
document.addEventListener('DOMContentLoaded', init);