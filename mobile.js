// Mobile-specific functionality
class MobileUI {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.initMobileHandlers();
    }

    initMobileHandlers() {
        // Add task button
        document.getElementById('mobile-add-task')?.addEventListener('click', () => {
            this.taskManager.showAddTaskModal();
        });

        // Filter button
        document.getElementById('mobile-filter')?.addEventListener('click', () => {
            this.showFilterMenu();
        });

        // More options button
        document.getElementById('mobile-more')?.addEventListener('click', () => {
            this.showMoreOptions();
        });

        // Handle mobile navigation
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.mobile-nav-item').forEach(navItem => {
                    navItem.classList.remove('active');
                });
                item.classList.add('active');
            });
        });
    }

    showFilterMenu() {
        const filterOptions = [
            { text: 'All Tasks', action: () => this.taskManager.filterTasks('all') },
            { text: 'Daily Tasks', action: () => this.taskManager.filterTasks('daily') },
            { text: 'Weekly Tasks', action: () => this.taskManager.filterTasks('weekly') },
            { text: 'Monthly Tasks', action: () => this.taskManager.filterTasks('monthly') },
            { text: 'Completed', action: () => this.taskManager.filterTasks('completed') },
            { text: 'Pending', action: () => this.taskManager.filterTasks('pending') }
        ];

        this.showActionSheet('Filter Tasks', filterOptions);
    }

    showMoreOptions() {
        const moreOptions = [
            { text: 'Export Data', action: () => this.taskManager.exportData() },
            { text: 'Import Data', action: () => document.getElementById('importFile').click() },
            { text: 'Clear All Data', action: () => this.taskManager.clearAllData() },
            { text: 'View Statistics', action: () => this.taskManager.showStatistics() },
            { text: 'Settings', action: () => this.showSettings() }
        ];

        this.showActionSheet('More Options', moreOptions);
    }

    showActionSheet(title, options) {
        // Remove any existing action sheet
        const existingSheet = document.querySelector('.action-sheet');
        if (existingSheet) {
            existingSheet.remove();
        }

        // Create action sheet
        const sheet = document.createElement('div');
        sheet.className = 'action-sheet';
        
        const sheetContent = document.createElement('div');
        sheetContent.className = 'action-sheet-content';

        // Add title
        const titleElement = document.createElement('div');
        titleElement.className = 'action-sheet-title';
        titleElement.textContent = title;
        sheetContent.appendChild(titleElement);

        // Add options
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'action-sheet-button';
            button.textContent = option.text;
            button.addEventListener('click', () => {
                this.hideActionSheet();
                option.action();
            });
            sheetContent.appendChild(button);
        });

        // Add cancel button
        const cancelButton = document.createElement('button');
        cancelButton.className = 'action-sheet-button action-sheet-cancel';
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => this.hideActionSheet());
        sheetContent.appendChild(cancelButton);

        sheet.appendChild(sheetContent);
        document.body.appendChild(sheet);

        // Add backdrop and show animation
        requestAnimationFrame(() => {
            sheet.classList.add('action-sheet-visible');
        });

        // Close on backdrop click
        sheet.addEventListener('click', (e) => {
            if (e.target === sheet) {
                this.hideActionSheet();
            }
        });
    }

    hideActionSheet() {
        const sheet = document.querySelector('.action-sheet');
        if (sheet) {
            sheet.classList.remove('action-sheet-visible');
            setTimeout(() => sheet.remove(), 300);
        }
    }

    showSettings() {
        // Implement settings modal
        const options = [
            { text: 'Daily Reset Mode', action: () => this.showResetModeOptions() },
            { text: 'Theme', action: () => this.showThemeOptions() },
            { text: 'Notifications', action: () => this.showNotificationOptions() }
        ];

        this.showActionSheet('Settings', options);
    }

    showResetModeOptions() {
        const options = [
            { 
                text: 'Remove Completed', 
                action: () => {
                    this.taskManager.setDailyResetMode('remove');
                    this.showNotification('Reset mode updated');
                }
            },
            { 
                text: 'Keep as History', 
                action: () => {
                    this.taskManager.setDailyResetMode('keep');
                    this.showNotification('Reset mode updated');
                }
            }
        ];

        this.showActionSheet('Daily Reset Mode', options);
    }

    showThemeOptions() {
        const options = [
            { text: 'Light', action: () => this.setTheme('light') },
            { text: 'Dark', action: () => this.setTheme('dark') },
            { text: 'System', action: () => this.setTheme('system') }
        ];

        this.showActionSheet('Choose Theme', options);
    }

    setTheme(theme) {
        // Implement theme switching logic
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.showNotification(`Theme set to ${theme}`);
    }

    showNotificationOptions() {
        const options = [
            { text: 'Enable All', action: () => this.updateNotificationSettings('all') },
            { text: 'Due Tasks Only', action: () => this.updateNotificationSettings('due') },
            { text: 'Disable All', action: () => this.updateNotificationSettings('none') }
        ];

        this.showActionSheet('Notification Settings', options);
    }

    updateNotificationSettings(setting) {
        localStorage.setItem('notifications', setting);
        this.showNotification('Notification settings updated');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('notification-visible');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('notification-visible');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize mobile UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a mobile device
    if (window.innerWidth <= 767) {
        // Initialize mobile UI with the existing task manager instance
        const mobileUI = new MobileUI(window.taskManager);
    }
});
