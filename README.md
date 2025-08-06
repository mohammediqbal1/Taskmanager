# 🛠️ Simple Task Manager (Internal Tool)

This is a lightweight internal tool for managing **weekly** and **monthly** tasks. It's built with just HTML, CSS, and JavaScript, using the browser’s local storage to save progress.

---

## 🚀 Features

- ✅ Add Weekly and Monthly Tasks
- ✅ Mark tasks as Completed
- ❌ Uncompleted tasks automatically stay as "Pending"
- ♻️ Weekly/Monthly reset of task board
- 💾 Data stored in browser (localStorage)
- ➕ Add / 🗑️ Remove Tasks

---

## 📂 How to Use

1. Open `index.html` in your browser.
2. Click on `Add Task` and choose **Weekly** or **Monthly**.
3. Tasks appear in their respective sections.
4. Mark them as ✅ when completed.
5. Old completed tasks are removed on new week/month.
6. Unchecked tasks stay as pending.

---

## 🧠 How it Works

- All task data is stored in localStorage (`tasks-weekly` and `tasks-monthly`).
- Uses `Date()` to check weekly or monthly reset.
- Simple JavaScript functions handle UI updates and logic.

---

## 📌 Technologies Used

- HTML5
- CSS3
- JavaScript (Vanilla)
- localStorage API

---

## 📈 Ideas for Future Enhancements

- Add due dates to tasks
- Add user authentication (optional)
- Sync with Google Calendar
- Export tasks as CSV

---

## ✍️ Author

Developed by [Your Name or Team Name]
