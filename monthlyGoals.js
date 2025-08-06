class MonthlyGoalsManager {
    constructor() {
        this.goals = [];
        this.archivedGoals = [];
        this.init();
    }

    init() {
        this.loadGoals();
        this.bindEvents();
        this.renderGoals();
        this.updateOverview();
        // Check goals daily for pending status
        this.checkGoalStatus();
        // Set up periodic check for goal status
        setInterval(() => this.checkGoalStatus(), 1000 * 60 * 60); // Check every hour
    }

    loadGoals() {
        const goalsData = localStorage.getItem('monthly-goals');
        const archivedData = localStorage.getItem('archived-goals');
        
        if (goalsData) {
            this.goals = JSON.parse(goalsData);
        }
        
        if (archivedData) {
            this.archivedGoals = JSON.parse(archivedData);
        }
    }

    saveGoals() {
        localStorage.setItem('monthly-goals', JSON.stringify(this.goals));
        localStorage.setItem('archived-goals', JSON.stringify(this.archivedGoals));
    }

    bindEvents() {
        // Add Goal Button
        document.getElementById('addGoalBtn').addEventListener('click', () => {
            this.showModal('goalModal');
            this.setDefaultDates();
        });

        // Close Modal Buttons
        document.getElementById('closeGoalModal').addEventListener('click', () => {
            this.hideModal('goalModal');
        });

        document.getElementById('cancelGoalBtn').addEventListener('click', () => {
            this.hideModal('goalModal');
        });

        // Auto Generate Checkbox
        document.getElementById('autoGenerate').addEventListener('change', (e) => {
            const weeklyMilestones = document.getElementById('weeklyMilestones');
            weeklyMilestones.style.display = e.target.checked ? 'block' : 'none';
            
            if (e.target.checked) {
                const title = document.getElementById('goalTitle').value;
                if (title) {
                    this.prefillMilestones(title);
                }
            }
        });

        // Goal Title Change
        document.getElementById('goalTitle').addEventListener('input', (e) => {
            if (document.getElementById('autoGenerate').checked) {
                this.prefillMilestones(e.target.value);
            }
        });

        // Goal Form Submission
        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGoal();
        });

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        });
    }

    setDefaultDates() {
        const today = new Date();
        
        // Set default dates to today
        document.getElementById('startDate').value = this.formatDate(today);
        
        // Set end date to 30 days from now by default
        const defaultEndDate = new Date(today);
        defaultEndDate.setDate(today.getDate() + 30);
        document.getElementById('endDate').value = this.formatDate(defaultEndDate);
        
        // Add date change listeners
        document.getElementById('startDate').addEventListener('change', this.validateDates.bind(this));
        document.getElementById('endDate').addEventListener('change', this.validateDates.bind(this));
    }

    validateDates() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        
        if (endDate < startDate) {
            // If end date is before start date, set it to start date + 30 days
            const newEndDate = new Date(startDate);
            newEndDate.setDate(startDate.getDate() + 30);
            document.getElementById('endDate').value = this.formatDate(newEndDate);
            this.showNotification('End date adjusted to maintain 30-day minimum duration', 'info');
        }
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    prefillMilestones(title) {
        document.getElementById('week1').value = `Research and Planning for ${title}`;
        document.getElementById('week2').value = `Initial Implementation of ${title}`;
        document.getElementById('week3').value = `Progress Review and Adjustments for ${title}`;
        document.getElementById('week4').value = `Final Implementation and Completion of ${title}`;
    }

    addGoal() {
        try {
            // Get form elements
            const titleInput = document.getElementById('goalTitle');
            const descriptionInput = document.getElementById('goalDescription');
            const startDateInput = document.getElementById('startDate');
            const endDateInput = document.getElementById('endDate');
            const autoGenerateInput = document.getElementById('autoGenerate');

            // Validate required fields
            if (!titleInput || !descriptionInput || !startDateInput || !endDateInput) {
                this.showNotification('Error: Required form elements not found', 'error');
                return;
            }

            // Get values and validate
            const title = titleInput.value.trim();
            const description = descriptionInput.value.trim();
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            const autoGenerate = autoGenerateInput.checked;

            if (!title || !description || !startDate || !endDate) {
                this.showNotification('Please fill in all required fields', 'error');
                return;
            }

            // Validate dates
            const start = new Date(startDate);
            const end = new Date(endDate);
            const today = new Date();

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                this.showNotification('Invalid date format', 'error');
                return;
            }

            if (end < start) {
                this.showNotification('End date cannot be before start date', 'error');
                return;
            }

            // Collect milestones
            const milestones = [];
            let hasMilestones = false;

            for (let i = 1; i <= 4; i++) {
                const milestoneInput = document.getElementById(`week${i}`);
                if (milestoneInput) {
                    const milestone = milestoneInput.value.trim();
                    if (milestone) {
                        milestones.push({
                            week: i,
                            text: milestone,
                            completed: false,
                            dueDate: new Date(start.getTime() + (i * 7 * 24 * 60 * 60 * 1000)) // Due date is start date + i weeks
                        });
                        hasMilestones = true;
                    }
                }
            }

            if (!hasMilestones && autoGenerate) {
                this.showNotification('Please add at least one milestone', 'error');
                return;
            }

            // Create goal object
            const goal = {
                id: Date.now().toString(),
                title,
                description,
                startDate,
                endDate,
                milestones,
                progress: 0,
                completed: false,
                createdAt: new Date().toISOString(),
                status: 'active',
                lastUpdated: new Date().toISOString()
            };

            // Add goal and update
            this.goals.push(goal);
            this.saveGoals();
            this.renderGoals();
            this.updateOverview();
            this.hideModal('goalModal');
            this.showNotification('Goal added successfully!', 'success');
            
            // Reset form
            document.getElementById('goalForm').reset();
            document.getElementById('weeklyMilestones').style.display = 'none';

        } catch (error) {
            console.error('Error adding goal:', error);
            this.showNotification('An error occurred while adding the goal', 'error');
        }
    }

    toggleMilestone(goalId, milestoneIndex) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal && goal.milestones[milestoneIndex]) {
            goal.milestones[milestoneIndex].completed = !goal.milestones[milestoneIndex].completed;
            
            // Update goal progress
            const completedMilestones = goal.milestones.filter(m => m.completed).length;
            goal.progress = Math.round((completedMilestones / goal.milestones.length) * 100);
            goal.completed = goal.progress === 100;

            if (goal.completed) {
                this.showNotification('🎉 Goal completed!', 'success');
            }

            this.saveGoals();
            this.renderGoals();
            this.updateOverview();
        }
    }

    archiveGoal(goalId) {
        const goalIndex = this.goals.findIndex(g => g.id === goalId);
        if (goalIndex !== -1) {
            const goal = this.goals[goalIndex];
            const endDate = new Date(goal.endDate);
            const today = new Date();

            // If goal is not completed and past end date, mark as pending
            if (!goal.completed && endDate < today) {
                goal.status = 'pending';
                goal.pendingReason = 'Deadline passed without completion';
            }

            goal.archivedAt = new Date().toISOString();
            this.archivedGoals.push(goal);
            this.goals.splice(goalIndex, 1);
            this.saveGoals();
            this.renderGoals();
            this.updateOverview();
            
            const status = goal.status === 'pending' ? 'moved to pending' : 'archived';
            this.showNotification(`Goal ${status} successfully!`, 'info');
        }
    }

    checkGoalStatus() {
        const today = new Date();
        let hasChanges = false;

        this.goals.forEach(goal => {
            const endDate = new Date(goal.endDate);
            
            // Check if goal is overdue
            if (!goal.completed && endDate < today && !goal.status) {
                goal.status = 'pending';
                goal.pendingReason = 'Deadline passed without completion';
                hasChanges = true;
            }

            // Check if goal should be automatically moved to pending
            if (!goal.completed && endDate < today && !goal.archived) {
                this.archiveGoal(goal.id);
                hasChanges = true;
            }
        });

        if (hasChanges) {
            this.saveGoals();
            this.renderGoals();
            this.updateOverview();
        }
    }

    deleteGoal(goalId, isArchived = false) {
        if (isArchived) {
            this.archivedGoals = this.archivedGoals.filter(g => g.id !== goalId);
        } else {
            this.goals = this.goals.filter(g => g.id !== goalId);
        }
        this.saveGoals();
        this.renderGoals();
        this.updateOverview();
        this.showNotification('Goal deleted successfully!', 'success');
    }

    renderGoals() {
        this.renderGoalsList(this.goals, 'goalsList', false);
        this.renderGoalsList(this.archivedGoals, 'goalsArchive', true);
    }

    renderGoalsList(goals, containerId, isArchived) {
        const container = document.getElementById(containerId);
        
        if (goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullseye"></i>
                    <p>No ${isArchived ? 'archived' : ''} goals yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = goals.map(goal => this.createGoalHTML(goal, isArchived)).join('');
    }

    createGoalHTML(goal, isArchived) {
        const startDate = new Date(goal.startDate).toLocaleDateString();
        const endDate = new Date(goal.endDate).toLocaleDateString();
        
        return `
            <div class="goal-item ${goal.completed ? 'completed' : ''}" data-id="${goal.id}">
                <div class="goal-header">
                    <div>
                        <h3 class="goal-title">${this.escapeHtml(goal.title)}</h3>
                        <div class="goal-dates">
                            <span><span class="date-label">Start:</span> ${startDate}</span>
                            <span><span class="date-label">End:</span> ${endDate}</span>
                        </div>
                    </div>
                    <div class="goal-actions">
                        ${!isArchived ? `
                            <button class="goal-archive" onclick="goalsManager.archiveGoal('${goal.id}')" title="Archive Goal">
                                <i class="fas fa-archive"></i>
                            </button>
                        ` : ''}
                        <button class="goal-delete" onclick="goalsManager.deleteGoal('${goal.id}', ${isArchived})" title="Delete Goal">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="goal-description">${this.escapeHtml(goal.description)}</p>
                <div class="goal-progress">
                    <div class="goal-progress-text">${goal.progress}% Complete</div>
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${goal.progress}%"></div>
                    </div>
                </div>
                ${!isArchived ? `
                    <div class="weekly-milestones">
                        <h4 class="milestone-header">Weekly Milestones</h4>
                        ${goal.milestones.map((milestone, index) => `
                            <div class="milestone-item">
                                <input type="checkbox" 
                                    class="milestone-checkbox" 
                                    ${milestone.completed ? 'checked' : ''} 
                                    onchange="goalsManager.toggleMilestone('${goal.id}', ${index})">
                                <span class="milestone-text">${this.escapeHtml(milestone.text)}</span>
                                <span class="milestone-status ${milestone.completed ? 'completed' : 'pending'}">
                                    ${milestone.completed ? 'Completed' : 'Pending'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    updateOverview() {
        const completed = this.goals.filter(g => g.completed).length;
        const pending = this.archivedGoals.filter(g => g.status === 'pending').length;
        const inProgress = this.goals.filter(g => !g.completed).length;
        const total = this.goals.length;

        document.getElementById('goalsCompleted').textContent = completed;
        document.getElementById('goalsInProgress').textContent = inProgress;
        document.getElementById('totalGoals').textContent = total;
        document.getElementById('goalsPending').textContent = pending;
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
        document.getElementById('goalForm').reset();
        document.getElementById('weeklyMilestones').style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

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
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the goals manager
let goalsManager;
document.addEventListener('DOMContentLoaded', () => {
    goalsManager = new MonthlyGoalsManager();
});
