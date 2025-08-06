class TaskManager {
    constructor() {
        this.dailyTasks = [];
        this.weeklyTasks = [];
        this.monthlyTasks = [];
        this.monthlyGoals = [];
        this.dailyResetMode = 'remove';
        this.currentTaskToDelete = null;
        this.completedTasks = [];
        this.pendingTasks = [];
        this.taskHistory = {
            daily: {
                completed: [],
                incomplete: []
            },
            weekly: {
                completed: [],
                incomplete: []
            },
            monthly: {
                completed: [],
                incomplete: []
            }
        };
        this.init();
    }    init() {
        this.loadTasks();
        this.checkAndResetTasks();
        this.bindEvents();
        this.renderTasks();
        
        // Check for overdue tasks every minute
        setInterval(() => {
            this.checkOverdueTasks();
            this.renderTasks();
        }, 60000);
        
        // Initial check for overdue tasks
        this.checkOverdueTasks();
    }

    // Load tasks from localStorage
    loadTasks() {
        const dailyData = localStorage.getItem('tasks-daily');
        const weeklyData = localStorage.getItem('tasks-weekly');
        const monthlyData = localStorage.getItem('tasks-monthly');
        const goalsData = localStorage.getItem('tasks-goals');
        const completedData = localStorage.getItem('tasks-completed');
        const pendingData = localStorage.getItem('tasks-pending');
        const resetMode = localStorage.getItem('daily-reset-mode');
        const historyData = localStorage.getItem('task-history');
        
        if (dailyData) {
            this.dailyTasks = JSON.parse(dailyData);
        }
        
        if (weeklyData) {
            this.weeklyTasks = JSON.parse(weeklyData);
        }
        
        if (monthlyData) {
            this.monthlyTasks = JSON.parse(monthlyData);
        }
        
        if (goalsData) {
            this.monthlyGoals = JSON.parse(goalsData);
        }

        if (completedData) {
            this.completedTasks = JSON.parse(completedData);
        }

        if (pendingData) {
            this.pendingTasks = JSON.parse(pendingData);
        }

        if (historyData) {
            this.taskHistory = JSON.parse(historyData);
        }
        
        if (resetMode) {
            this.dailyResetMode = resetMode;
            document.querySelector(`input[name="dailyReset"][value="${resetMode}"]`).checked = true;
        }
        
        // Check for overdue tasks
        this.checkOverdueTasks();
        
        // Update progress counters
        this.updateProgressCounters();
    }
    
    // Update progress counters with accurate data
    updateProgressCounters() {
        const today = new Date().toDateString();
        
        // Daily progress
        const dailyCompleted = this.taskHistory.daily.completed.filter(
            task => new Date(task.completedAt).toDateString() === today
        ).length;
        const dailyTotal = this.dailyTasks.length + dailyCompleted;
        
        document.getElementById('dailyProgress').textContent = dailyCompleted.toString();
        document.getElementById('dailyTotal').textContent = dailyTotal.toString();
        
        if (dailyTotal > 0) {
            const dailyPercent = (dailyCompleted / dailyTotal) * 100;
            document.getElementById('dailyProgressBar').style.width = `${dailyPercent}%`;
        }
    }

    // Save tasks to localStorage
    saveTasks() {
        localStorage.setItem('tasks-daily', JSON.stringify(this.dailyTasks));
        localStorage.setItem('tasks-weekly', JSON.stringify(this.weeklyTasks));
        localStorage.setItem('tasks-monthly', JSON.stringify(this.monthlyTasks));
        localStorage.setItem('tasks-goals', JSON.stringify(this.monthlyGoals));
        localStorage.setItem('tasks-completed', JSON.stringify(this.completedTasks));
        localStorage.setItem('tasks-pending', JSON.stringify(this.pendingTasks));
        localStorage.setItem('daily-reset-mode', this.dailyResetMode);
    }

    // Check if tasks need to be reset (daily/weekly/monthly)
    checkAndResetTasks() {
        const now = new Date();
        const lastResetDaily = localStorage.getItem('last-reset-daily');
        const lastResetWeekly = localStorage.getItem('last-reset-weekly');
        const lastResetMonthly = localStorage.getItem('last-reset-monthly');
        
        // Check daily reset (every day at midnight)
        const currentDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (!lastResetDaily || new Date(lastResetDaily) < currentDayStart) {
            this.resetDailyTasks();
            localStorage.setItem('last-reset-daily', currentDayStart.toISOString());
        }
        
        // Check weekly reset (every Monday)
        const currentWeekStart = this.getWeekStart(now);
        if (!lastResetWeekly || new Date(lastResetWeekly) < currentWeekStart) {
            this.resetWeeklyTasks();
            localStorage.setItem('last-reset-weekly', currentWeekStart.toISOString());
        }
        
        // Check monthly reset (1st of each month)
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (!lastResetMonthly || new Date(lastResetMonthly) < currentMonthStart) {
            this.resetMonthlyTasks();
            this.resetMonthlyGoals();
            localStorage.setItem('last-reset-monthly', currentMonthStart.toISOString());
        }
    }

    // Get the start of the current week (Monday)
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    }

    // Reset daily tasks based on user preference
    resetDailyTasks() {
        if (this.dailyResetMode === 'remove') {
            // Remove completed tasks
            this.dailyTasks = this.dailyTasks.filter(task => !task.completed);
        } else {
            // Keep all tasks but mark as pending
            this.dailyTasks.forEach(task => {
                task.completed = false;
            });
        }
        this.saveTasks();
    }

    // Reset weekly tasks (remove completed, keep pending)
    resetWeeklyTasks() {
        this.weeklyTasks = this.weeklyTasks.filter(task => !task.completed);
        this.saveTasks();
    }

    // Reset monthly tasks (remove completed, keep pending)
    resetMonthlyTasks() {
        this.monthlyTasks = this.monthlyTasks.filter(task => !task.completed);
        this.saveTasks();
    }

    // Reset monthly goals (remove completed, keep pending)
    resetMonthlyGoals() {
        this.monthlyGoals = this.monthlyGoals.filter(goal => !goal.completed);
        this.saveTasks();
    }

    // Bind event listeners
    bindEvents() {
        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.showModal('taskModal');
            this.initializeDateSettings();
        });

        // Close modal buttons
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideModal('taskModal');
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideModal('taskModal');
        });

        // Task form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Confirmation modal
        document.getElementById('confirmCancel').addEventListener('click', () => {
            this.hideModal('confirmModal');
        });

        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.deleteTask();
        });

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape key to close modals
            if (e.key === 'Escape') {
                this.hideModal('taskModal');
                this.hideModal('confirmModal');
            }
            
            // Ctrl+E to export tasks
            if (e.ctrlKey && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                this.exportTasks();
            }
        });

        // Daily reset mode change
        document.querySelectorAll('input[name="dailyReset"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.dailyResetMode = e.target.value;
                this.saveTasks();
                this.showNotification(`Daily reset mode changed to: ${e.target.value === 'remove' ? 'Remove completed' : 'Keep as pending'}`, 'info');
            });
        });

        // Task type change to show/hide goal details
        document.getElementById('taskType').addEventListener('change', (e) => {
            const goalDetailsGroup = document.getElementById('goalDetailsGroup');
            if (e.target.value === 'goal') {
                goalDetailsGroup.style.display = 'block';
            } else {
                goalDetailsGroup.style.display = 'none';
            }
        });
    }

    // Show modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
        
        if (modalId === 'taskModal') {
            document.getElementById('taskTitle').focus();
        }
    }

    // Hide modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
        
        if (modalId === 'taskModal') {
            this.resetForm();
        }
    }

    // Reset task form
    resetForm() {
        document.getElementById('taskForm').reset();
    }

    // Add new task
    addTask() {
        try {
            // Get form elements
            const titleInput = document.getElementById('taskTitle');
            const descriptionInput = document.getElementById('taskDescription');
            const typeSelect = document.getElementById('taskType');
            const goalTargetInput = document.getElementById('goalTarget');

            // Validate inputs exist
            if (!titleInput || !typeSelect) {
                this.showNotification('Error: Form elements not found', 'error');
                return;
            }

            const title = titleInput.value.trim();
            const description = descriptionInput ? descriptionInput.value.trim() : '';
            const type = typeSelect.value;
            const goalTarget = goalTargetInput ? goalTargetInput.value : '';

            // Validate required fields
            if (!title || !type) {
                this.showNotification('Please fill in all required fields', 'error');
                return;
            }

            // Get date settings
            const customDateSetting = document.getElementById('customDateSetting').checked;
            let startDate, endDate;

            if (customDateSetting) {
                startDate = document.getElementById('taskStartDate').value;
                endDate = document.getElementById('taskEndDate').value;
            } else {
                const today = new Date();
                startDate = this.formatDate(today);
                endDate = this.formatDate(today);

                // Set default date range based on task type
                if (type === 'weekly') {
                    const weekEnd = new Date(today);
                    weekEnd.setDate(today.getDate() + 6);
                    endDate = this.formatDate(weekEnd);
                } else if (type === 'monthly') {
                    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    endDate = this.formatDate(monthEnd);
                }
            }

            // Create task object
            const task = {
                id: Date.now().toString(),
                title: title,
                description: description,
                type: type,
                startDate: startDate,
                endDate: endDate,
                completed: false,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };

            // Add goal-specific properties
            if (type === 'goal' && goalTarget) {
                task.target = parseInt(goalTarget);
                task.current = 0;
                task.isQuantifiable = true;
            }

            // Add to appropriate array
            switch (type) {
                case 'daily':
                    if (!this.dailyTasks) this.dailyTasks = [];
                    this.dailyTasks.push(task);
                    break;
                case 'weekly':
                    if (!this.weeklyTasks) this.weeklyTasks = [];
                    this.weeklyTasks.push(task);
                    break;
                case 'monthly':
                    if (!this.monthlyTasks) this.monthlyTasks = [];
                    this.monthlyTasks.push(task);
                    break;
                case 'goal':
                    if (!this.monthlyGoals) this.monthlyGoals = [];
                    this.monthlyGoals.push(task);
                    break;
                default:
                    this.showNotification('Invalid task type selected', 'error');
                    return;
            }

            // Save and update
            this.saveTasks();
            this.renderTasks();
            this.hideModal('taskModal');
            
            // Reset form
            document.getElementById('taskForm').reset();
            if (document.getElementById('goalDetailsGroup')) {
                document.getElementById('goalDetailsGroup').style.display = 'none';
            }
            
            // Show success message
            const typeLabel = type === 'goal' ? 'Goal' : 'Task';
            this.showNotification(`${typeLabel} added successfully!`, 'success');

        } catch (error) {
            console.error('Error adding task:', error);
            this.showNotification('An error occurred while adding the task', 'error');
        }
    }

    // Toggle task completion
    toggleTask(taskId, type) {
        let tasks;
        switch (type) {
            case 'daily':
                tasks = this.dailyTasks;
                break;
            case 'weekly':
                tasks = this.weeklyTasks;
                break;
            case 'monthly':
                tasks = this.monthlyTasks;
                break;
            case 'goal':
                tasks = this.monthlyGoals;
                break;
        }
        
        const task = tasks.find(t => t.id === taskId);
        const now = new Date();
        
        if (task) {
            if (!task.completed) {
                // Check if task is overdue
                const now = new Date();
                const endDate = new Date(task.endDate);
                if (endDate < now) {
                    this.showOverdueConfirmation(task, type);
                    return;
                }
                // Show completion confirmation
                this.showCompletionConfirmation(task, type);
            } else {
                // Unchecking a completed task
                task.completed = false;
                this.saveTasks();
                this.renderTasks();
                const itemType = type === 'goal' ? 'Goal' : 'Task';
                this.showNotification(`${itemType} marked as pending`, 'info');
            }
        }
    }

    // Show completion confirmation
    showCompletionConfirmation(task, type) {
        document.getElementById('confirmMessage').innerHTML = `
            Are you sure you want to mark "${task.title}" as completed?
            <div class="completion-options">
                <label>
                    <input type="radio" name="completionType" value="completed" checked>
                    Mark as Completed
                </label>
                <label>
                    <input type="radio" name="completionType" value="cancelled">
                    Cancel Task (Not Important)
                </label>
            </div>
        `;
        
        const confirmDelete = document.getElementById('confirmDelete');
        confirmDelete.textContent = 'Confirm';
        confirmDelete.onclick = () => this.handleTaskCompletion(task, type);
        
        this.showModal('confirmModal');
    }

    // Show overdue confirmation
    showOverdueConfirmation(task, type) {
        document.getElementById('confirmMessage').innerHTML = `
            This task is overdue! What would you like to do?
            <div class="completion-options">
                <label>
                    <input type="radio" name="completionType" value="completed">
                    Complete Anyway
                </label>
                <label>
                    <input type="radio" name="completionType" value="pending" checked>
                    Move to Pending
                </label>
                <label>
                    <input type="radio" name="completionType" value="cancelled">
                    Cancel Task
                </label>
            </div>
        `;
        
        const confirmDelete = document.getElementById('confirmDelete');
        confirmDelete.textContent = 'Confirm';
        confirmDelete.onclick = () => this.handleOverdueTask(task, type);
        
        this.showModal('confirmModal');
    }

    // Handle task completion
    handleTaskCompletion(task, type) {
        const completionType = document.querySelector('input[name="completionType"]:checked').value;
        const now = new Date();
        const completionData = {
            ...task,
            completionDate: now.toISOString(),
            completionType: completionType,
            originalType: type
        };
        
        if (completionType === 'completed') {
            task.completed = true;
            task.completedAt = now.toISOString();
            this.taskHistory[type].completed.push(completionData);
            this.completedTasks.push(completionData);
            
            // Update task counts immediately
            if (type === 'daily') {
                const dailyStats = document.getElementById('dailyProgressStats');
                const completed = dailyStats.querySelector('#dailyProgress');
                completed.textContent = (parseInt(completed.textContent) + 1).toString();
            }
        } else if (completionType === 'cancelled') {
            this.taskHistory[type].incomplete.push({
                ...completionData,
                reason: 'cancelled'
            });
        }
        
        this.removeTaskFromList(task.id, type);
        this.saveTasks();
        this.saveTaskHistory();
        this.renderTasks();
        this.hideModal('confirmModal');
        
        const message = completionType === 'completed' ? 'Task completed!' : 'Task cancelled';
        this.showNotification(message, completionType === 'completed' ? 'success' : 'info');
    }
    
    // Save task history
    saveTaskHistory() {
        localStorage.setItem('task-history', JSON.stringify(this.taskHistory));
    }
    
    // Load task history
    loadTaskHistory() {
        const history = localStorage.getItem('task-history');
        if (history) {
            this.taskHistory = JSON.parse(history);
        }
    }

    // Handle overdue task
    handleOverdueTask(task, type) {
        const completionType = document.querySelector('input[name="completionType"]:checked').value;
        
        switch (completionType) {
            case 'completed':
                task.completed = true;
                task.completedAt = new Date().toISOString();
                task.completedOverdue = true;
                this.completedTasks.push({...task, originalType: type});
                this.removeTaskFromList(task.id, type);
                this.showNotification('Task marked as completed', 'success');
                break;
                
            case 'pending':
                this.pendingTasks.push({...task, originalType: type});
                this.removeTaskFromList(task.id, type);
                this.showNotification('Task moved to pending', 'warning');
                break;
                
            case 'cancelled':
                this.removeTaskFromList(task.id, type);
                this.showNotification('Task cancelled', 'info');
                break;
        }
        
        this.saveTasks();
        this.renderTasks();
        this.hideModal('confirmModal');
    }

    // Check for overdue tasks and update progress
    checkOverdueTasks() {
        const now = new Date();
        const checkList = (tasks, type) => {
            return tasks.filter(task => {
                if (!task.completed && new Date(task.endDate) < now) {
                    this.pendingTasks.push({...task, originalType: type});
                    this.showNotification(`Task "${task.title}" is overdue!`, 'warning');
                    return false; // Remove from original list
                }
                return true; // Keep in original list
            });
        };

        this.dailyTasks = checkList(this.dailyTasks, 'daily');
        this.weeklyTasks = checkList(this.weeklyTasks, 'weekly');
        this.monthlyTasks = checkList(this.monthlyTasks, 'monthly');
        
        // Update progress after moving overdue tasks
        this.updateProgressOverview();
        this.saveTasks();
    }

    // Update progress overview with real-time stats
    updateProgressOverview() {
        // Calculate completed vs total tasks for each category
        const calculateProgress = (tasks, pendingTasks, type) => {
            const completed = tasks.filter(task => task.completed).length;
            const pending = pendingTasks.filter(task => task.originalType === type).length;
            const total = tasks.length + pending;
            return { completed, total, pending };
        };

        // Daily progress
        const dailyStats = calculateProgress(this.dailyTasks, this.pendingTasks, 'daily');
        document.getElementById('dailyProgress').textContent = dailyStats.completed;
        document.getElementById('dailyTotal').textContent = dailyStats.total;
        const dailyPercent = dailyStats.total > 0 ? (dailyStats.completed / dailyStats.total) * 100 : 0;
        document.getElementById('dailyProgressBar').style.width = `${dailyPercent}%`;
        
        // Weekly progress
        const weeklyStats = calculateProgress(this.weeklyTasks, this.pendingTasks, 'weekly');
        document.getElementById('weeklyProgress').textContent = weeklyStats.completed;
        document.getElementById('weeklyTotal').textContent = weeklyStats.total;
        const weeklyPercent = weeklyStats.total > 0 ? (weeklyStats.completed / weeklyStats.total) * 100 : 0;
        document.getElementById('weeklyProgressBar').style.width = `${weeklyPercent}%`;
        
        // Monthly goals progress
        const goalsStats = calculateProgress(this.monthlyGoals, this.pendingTasks, 'goal');
        document.getElementById('monthlyGoalProgress').textContent = goalsStats.completed;
        document.getElementById('monthlyGoalTotal').textContent = goalsStats.total;
        const goalsPercent = goalsStats.total > 0 ? (goalsStats.completed / goalsStats.total) * 100 : 0;
        document.getElementById('monthlyGoalProgressBar').style.width = `${goalsPercent}%`;
    }

    // Remove task from its original list
    removeTaskFromList(taskId, type) {
        switch (type) {
            case 'daily':
                this.dailyTasks = this.dailyTasks.filter(t => t.id !== taskId);
                break;
            case 'weekly':
                this.weeklyTasks = this.weeklyTasks.filter(t => t.id !== taskId);
                break;
            case 'monthly':
                this.monthlyTasks = this.monthlyTasks.filter(t => t.id !== taskId);
                break;
            case 'goal':
                this.monthlyGoals = this.monthlyGoals.filter(t => t.id !== taskId);
                break;
        }
    }

    // Show delete confirmation
    confirmDelete(taskId, type) {
        this.currentTaskToDelete = { id: taskId, type: type };
        this.showModal('confirmModal');
    }

    // Delete task
    deleteTask() {
        if (!this.currentTaskToDelete) return;

        const { id, type } = this.currentTaskToDelete;
        
        switch (type) {
            case 'daily':
                this.dailyTasks = this.dailyTasks.filter(task => task.id !== id);
                break;
            case 'weekly':
                this.weeklyTasks = this.weeklyTasks.filter(task => task.id !== id);
                break;
            case 'monthly':
                this.monthlyTasks = this.monthlyTasks.filter(task => task.id !== id);
                break;
            case 'goal':
                this.monthlyGoals = this.monthlyGoals.filter(task => task.id !== id);
                break;
        }

        this.saveTasks();
        this.renderTasks();
        this.hideModal('confirmModal');
        this.currentTaskToDelete = null;
        
        const itemType = type === 'goal' ? 'Goal' : 'Task';
        this.showNotification(`${itemType} deleted successfully!`, 'success');
    }

    // Update goal progress
    updateGoalProgress(goalId, newValue) {
        const goal = this.monthlyGoals.find(g => g.id === goalId);
        if (goal && goal.isQuantifiable) {
            goal.current = Math.max(0, Math.min(newValue, goal.target));
            
            // Auto-complete if target reached
            if (goal.current >= goal.target) {
                goal.completed = true;
            } else {
                goal.completed = false;
            }
            
            this.saveTasks();
            this.renderTasks();
            
            if (goal.completed) {
                this.showNotification('🎉 Goal completed!', 'success');
            }
        }
    }

    // Render all tasks
    renderTasks() {
        this.renderTaskList('dailyTasks', this.dailyTasks, 'daily');
        this.renderTaskList('weeklyTasks', this.weeklyTasks, 'weekly');
        this.renderTaskList('monthlyTasks', this.monthlyTasks, 'monthly');
        this.renderTaskList('monthlyGoals', this.monthlyGoals, 'goal');
        this.updateTaskCounts();
        this.updateProgressOverview();
    }

    // Render task list for a specific type
    renderTaskList(containerId, tasks, type) {
        const container = document.getElementById(containerId);
        
        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No ${type} tasks yet. Add your first task!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tasks.map(task => this.createTaskHTML(task, type)).join('');
    }

    // Create HTML for a single task
    createTaskHTML(task, type) {
        const createdDate = new Date(task.createdAt).toLocaleDateString();
        const now = new Date();
        const endDate = new Date(task.endDate);
        const isOverdue = !task.completed && endDate < now;
        
        const completedClass = task.completed ? 'completed' : '';
        const overdueClass = isOverdue ? 'overdue' : '';
        const checkedClass = task.completed ? 'checked' : '';
        
        let typeIcon = '';
        switch (type) {
            case 'daily': typeIcon = '📆 Daily'; break;
            case 'weekly': typeIcon = '📅 Weekly'; break;
            case 'monthly': typeIcon = '🗓️ Monthly'; break;
            case 'goal': typeIcon = '🎯 Goal'; break;
        }
        
        // Get completion status for status badge and task history info
        let statusBadge = '';
        if (task.completed) {
            statusBadge = '<span class="status-badge completed">Completed</span>';
        } else if (isOverdue) {
            statusBadge = '<span class="status-badge overdue">Overdue</span>';
        }
        
        // Get task history info
        const taskHistory = type === 'daily' ? 
            this.taskHistory.daily.completed.find(t => t.id === task.id) : null;
        const completionInfo = taskHistory ? 
            `<div class="completion-info">Completed on: ${new Date(taskHistory.completionDate).toLocaleString()}</div>` : '';
        
        let goalProgressHTML = '';
        if (type === 'goal' && task.isQuantifiable) {
            const progressPercent = (task.current / task.target) * 100;
            goalProgressHTML = `
                <div class="goal-progress">
                    <div class="goal-progress-text">${task.current} / ${task.target}</div>
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="goal-input">
                        <input type="number" value="${task.current}" min="0" max="${task.target}" 
                               onchange="taskManager.updateGoalProgress('${task.id}', parseInt(this.value))">
                        <button onclick="taskManager.updateGoalProgress('${task.id}', ${task.current + 1})">+1</button>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="task-item ${completedClass} ${overdueClass}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-checkbox ${checkedClass}" onclick="taskManager.toggleTask('${task.id}', '${type}')"></div>
                    <div class="task-title">${this.escapeHtml(task.title)}${statusBadge}</div>
                    <div class="task-actions">
                        <button class="task-delete" onclick="taskManager.confirmDelete('${task.id}', '${type}')" title="Delete ${type === 'goal' ? 'goal' : 'task'}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                ${goalProgressHTML}
                <div class="task-meta">
                    <span class="task-date">Created: ${createdDate}</span>
                    <span class="task-type">${typeIcon}</span>
                </div>
            </div>
        `;
    }

    // Update task counts
    updateTaskCounts() {
        const dailyCount = this.dailyTasks.length;
        const weeklyCount = this.weeklyTasks.length;
        const monthlyCount = this.monthlyTasks.length;
        const goalsCount = this.monthlyGoals.length;
        
        document.getElementById('dailyCount').textContent = `${dailyCount} task${dailyCount !== 1 ? 's' : ''}`;
        document.getElementById('weeklyCount').textContent = `${weeklyCount} task${weeklyCount !== 1 ? 's' : ''}`;
        document.getElementById('monthlyCount').textContent = `${monthlyCount} task${monthlyCount !== 1 ? 's' : ''}`;
        document.getElementById('goalsCount').textContent = `${goalsCount} goal${goalsCount !== 1 ? 's' : ''}`;
    }

    // Update progress overview
    updateProgressOverview() {
        // Daily progress
        const dailyCompleted = this.dailyTasks.filter(task => task.completed).length;
        const dailyTotal = this.dailyTasks.length;
        const dailyPercent = dailyTotal > 0 ? (dailyCompleted / dailyTotal) * 100 : 0;
        
        document.getElementById('dailyProgress').textContent = dailyCompleted;
        document.getElementById('dailyTotal').textContent = dailyTotal;
        document.getElementById('dailyProgressBar').style.width = `${dailyPercent}%`;
        
        // Weekly progress
        const weeklyCompleted = this.weeklyTasks.filter(task => task.completed).length;
        const weeklyTotal = this.weeklyTasks.length;
        const weeklyPercent = weeklyTotal > 0 ? (weeklyCompleted / weeklyTotal) * 100 : 0;
        
        document.getElementById('weeklyProgress').textContent = weeklyCompleted;
        document.getElementById('weeklyTotal').textContent = weeklyTotal;
        document.getElementById('weeklyProgressBar').style.width = `${weeklyPercent}%`;
        
        // Monthly goals progress
        const goalsCompleted = this.monthlyGoals.filter(goal => goal.completed).length;
        const goalsTotal = this.monthlyGoals.length;
        const goalsPercent = goalsTotal > 0 ? (goalsCompleted / goalsTotal) * 100 : 0;
        
        document.getElementById('monthlyGoalProgress').textContent = goalsCompleted;
        document.getElementById('monthlyGoalTotal').textContent = goalsTotal;
        document.getElementById('monthlyGoalProgressBar').style.width = `${goalsPercent}%`;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    initializeDateSettings() {
        const customDateCheckbox = document.getElementById('customDateSetting');
        const dateOptions = document.getElementById('dateOptions');
        const taskType = document.getElementById('taskType');
        const datePresets = document.querySelectorAll('.date-preset');
        
        // Initialize date inputs with today's date
        this.setDefaultDates();

        // Toggle date options visibility
        customDateCheckbox.addEventListener('change', (e) => {
            dateOptions.style.display = e.target.checked ? 'block' : 'none';
        });

        // Handle task type change
        taskType.addEventListener('change', (e) => {
            this.updateDateOptionsBasedOnType(e.target.value);
        });

        // Handle date preset buttons
        datePresets.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const preset = e.target.dataset.preset;
                this.setDatePreset(preset);
                
                // Update active state
                datePresets.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    setDefaultDates() {
        const today = new Date();
        const startDateInput = document.getElementById('taskStartDate');
        const endDateInput = document.getElementById('taskEndDate');
        
        startDateInput.value = this.formatDate(today);
        endDateInput.value = this.formatDate(today);
    }

    updateDateOptionsBasedOnType(taskType) {
        const today = new Date();
        const startDateInput = document.getElementById('taskStartDate');
        const endDateInput = document.getElementById('taskEndDate');

        switch (taskType) {
            case 'daily':
                startDateInput.value = this.formatDate(today);
                endDateInput.value = this.formatDate(today);
                break;
            case 'weekly':
                const weekEnd = new Date(today);
                weekEnd.setDate(today.getDate() + 6);
                startDateInput.value = this.formatDate(today);
                endDateInput.value = this.formatDate(weekEnd);
                break;
            case 'monthly':
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                startDateInput.value = this.formatDate(today);
                endDateInput.value = this.formatDate(monthEnd);
                break;
        }
    }

    setDatePreset(preset) {
        const today = new Date();
        const startDateInput = document.getElementById('taskStartDate');
        const endDateInput = document.getElementById('taskEndDate');

        switch (preset) {
            case 'today':
                startDateInput.value = this.formatDate(today);
                endDateInput.value = this.formatDate(today);
                break;
            case 'tomorrow':
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                startDateInput.value = this.formatDate(tomorrow);
                endDateInput.value = this.formatDate(tomorrow);
                break;
            case 'thisWeek':
                const weekEnd = new Date(today);
                weekEnd.setDate(today.getDate() + (6 - today.getDay()));
                startDateInput.value = this.formatDate(today);
                endDateInput.value = this.formatDate(weekEnd);
                break;
            case 'nextWeek':
                const nextWeekStart = new Date(today);
                nextWeekStart.setDate(today.getDate() + (7 - today.getDay() + 1));
                const nextWeekEnd = new Date(nextWeekStart);
                nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
                startDateInput.value = this.formatDate(nextWeekStart);
                endDateInput.value = this.formatDate(nextWeekEnd);
                break;
            case 'thisMonth':
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                startDateInput.value = this.formatDate(today);
                endDateInput.value = this.formatDate(monthEnd);
                break;
        }
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
        `;
        document.head.appendChild(style);

        // Add to document
        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // Get task statistics
    getStatistics() {
        const dailyCompleted = this.dailyTasks.filter(task => task.completed).length;
        const weeklyCompleted = this.weeklyTasks.filter(task => task.completed).length;
        const monthlyCompleted = this.monthlyTasks.filter(task => task.completed).length;
        const goalsCompleted = this.monthlyGoals.filter(goal => goal.completed).length;
        
        return {
            daily: {
                total: this.dailyTasks.length,
                completed: dailyCompleted,
                pending: this.dailyTasks.length - dailyCompleted
            },
            weekly: {
                total: this.weeklyTasks.length,
                completed: weeklyCompleted,
                pending: this.weeklyTasks.length - weeklyCompleted
            },
            monthly: {
                total: this.monthlyTasks.length,
                completed: monthlyCompleted,
                pending: this.monthlyTasks.length - monthlyCompleted
            },
            goals: {
                total: this.monthlyGoals.length,
                completed: goalsCompleted,
                pending: this.monthlyGoals.length - goalsCompleted
            }
        };
    }

    // Export tasks as JSON (for future enhancements)
    exportTasks() {
        const data = {
            daily: this.dailyTasks,
            weekly: this.weeklyTasks,
            monthly: this.monthlyTasks,
            goals: this.monthlyGoals,
            settings: {
                dailyResetMode: this.dailyResetMode
            },
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Tasks exported successfully!', 'success');
    }
}

// Initialize the task manager when the page loads
let taskManager;

document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
    
    // Add some helpful console messages for developers
    console.log('🛠️ Simple Task Manager loaded successfully!');
    console.log('💡 Tip: You can call taskManager.getStatistics() to see task statistics');
    console.log('📊 Tip: You can call taskManager.exportTasks() to export your tasks');
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N to add new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        taskManager.showModal('taskModal');
    }
    
    // Ctrl/Cmd + E to export tasks
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        taskManager.exportTasks();
    }
});

// Service Worker registration for offline functionality (future enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker can be added later for offline functionality
        console.log('💡 Service Worker support detected - ready for offline functionality');
    });
}