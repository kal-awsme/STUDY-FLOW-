/* =========================================================
   STUDYFLOW — APPLICATION ENGINE
   Plain JavaScript / no framework / no backend
   ========================================================= */

(() => {
  "use strict";

  const STORAGE_KEYS = {
    exams: "studyflow_exams_v1",
    tasks: "studyflow_tasks_v1",
    focus: "studyflow_focus_v1"
  };

  const VIEWS = ["home", "exams", "plan"];

  const DEFAULT_TASKS = [
    {
      id: "task-1",
      title: "Review Chapter 4",
      subtitle: "Physics · 20 min",
      completed: false
    },
    {
      id: "task-2",
      title: "Review important formulas",
      subtitle: "Physics · 10 min",
      completed: false
    },
    {
      id: "task-3",
      title: "Practice 10 questions",
      subtitle: "Physics · 15 min",
      completed: false
    }
  ];

  const SAMPLE_EXAMS = [
    {
      id: "sample-physics",
      subject: "Physics",
      date: "2026-09-30",
      difficulty: "hard",
      confidence: 30,
      notes: "Chapter 4 and important formulas."
    },
    {
      id: "sample-history",
      subject: "History",
      date: "2026-10-03",
      difficulty: "medium",
      confidence: 55,
      notes: "Review important dates and events."
    },
    {
      id: "sample-math",
      subject: "Math",
      date: "2026-10-07",
      difficulty: "medium",
      confidence: 70,
      notes: "Practice mixed questions."
    },
    {
      id: "sample-english",
      subject: "English",
      date: "2026-10-10",
      difficulty: "easy",
      confidence: 80,
      notes: "Vocabulary and reading."
    }
  ];

  const state = {
    currentView: "home",
    exams: [],
    tasks: [],
    focusCompleted: false,
    editingExamId: null,
    toastTimer: null,
    viewTimer: null,
    initialized: false
  };

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  const dom = {};

  function cacheDOM() {
    dom.app = $("#app");

    dom.views = {
      home: $("#home-view"),
      exams: $("#exams-view"),
      plan: $("#plan-view")
    };

    dom.navItems = $$("[data-nav]");

    dom.home = {
      greeting: $("#greeting-label"),
      priorityTitle: $("#priority-title"),
      priorityBadge: $("#priority-badge"),
      priorityDate: $("#priority-date"),
      priorityConfidence: $("#priority-confidence"),
      priorityDifficulty: $("#priority-difficulty"),
      countdownNumber: $("#countdown-number"),
      focusTitle: $("#focus-task-title"),
      focusSubtitle: $("#focus-task-subtitle"),
      focusButton: $('[data-action="complete-focus"]'),
      upcoming: $("#upcoming-exams")
    };

    dom.exams = {
      count: $("#exam-count"),
      highCount: $("#exam-high-count"),
      list: $("#exam-list"),
      empty: $("#empty-exams")
    };

    dom.plan = {
      date: $("#plan-date"),
      percent: $("#progress-percent"),
      completed: $("#completed-count"),
      total: $("#total-task-count"),
      bar: $("#progress-bar"),
      message: $("#progress-message"),
      taskList: $("#study-task-list")
    };

    dom.examModal = $("#exam-modal");
    dom.priorityModal = $("#priority-modal");
    dom.settingsModal = $("#settings-modal");

    dom.form = $("#exam-form");
    dom.formTitle = $("#exam-modal-title");
    dom.formId = $("#exam-id");
    dom.subject = $("#subject");
    dom.examDate = $("#exam-date-input");
    dom.difficulty = $("#difficulty");
    dom.confidence = $("#confidence");
    dom.confidenceValue = $("#confidence-value");
    dom.notes = $("#notes");

    dom.detail = {
      title: $("#priority-detail-title"),
      days: $("#detail-days-left"),
      confidence: $("#detail-confidence"),
      difficulty: $("#detail-difficulty"),
      reason: $("#detail-reason")
    };

    dom.toast = $("#toast");
    dom.aiLoading = $("#ai-loading");
  }

  function createId(prefix = "id") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  function safeParse(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function loadStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);

      if (raw === null) {
        return fallback;
      }

      return safeParse(raw, fallback);
    } catch {
      return fallback;
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      showToast("Your browser could not save this change.");
    }
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function capitalize(value) {
    if (!value) return "";

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
  }

  function todayStart() {
    const now = new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
  }

  function parseLocalDate(dateString) {
    if (!dateString) return null;

    const parts = String(dateString)
      .split("-")
      .map(Number);

    if (
      parts.length !== 3 ||
      parts.some(Number.isNaN)
    ) {
      return null;
    }

    const [year, month, day] = parts;

    return new Date(
      year,
      month - 1,
      day
    );
  }

  function formatDate(dateString, options = {}) {
    const date = parseLocalDate(dateString);

    if (!date) return "—";

    return new Intl.DateTimeFormat("en-US", {
      month: options.month || "short",
      day: options.day || "numeric",
      year: options.year || undefined
    }).format(date);
  }

  function formatMonth(dateString) {
    const date = parseLocalDate(dateString);

    if (!date) return "—";

    return new Intl.DateTimeFormat("en-US", {
      month: "short"
    })
      .format(date)
      .toUpperCase();
  }

  function formatDay(dateString) {
    const date = parseLocalDate(dateString);

    if (!date) return "—";

    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit"
    }).format(date);
  }

  function daysUntil(dateString) {
    const target = parseLocalDate(dateString);

    if (!target) return Infinity;

    const today = todayStart();

    return Math.ceil(
      (target - today) / 86400000
    );
  }

  function formatDaysLeft(days) {
    if (days < 0) {
      return `${Math.abs(days)}d overdue`;
    }

    if (days === 0) {
      return "Today";
    }

    if (days === 1) {
      return "1 day";
    }

    return `${days} days`;
  }

  function difficultyWeight(difficulty) {
    const weights = {
      easy: 1,
      medium: 2,
      hard: 3
    };

    return weights[difficulty] || 2;
  }

  function difficultyLabel(difficulty) {
    return capitalize(difficulty || "medium");
  }

  function priorityClass(priority) {
    return `priority-${priority}`;
  }

  /* =========================================================
     PRIORITY ENGINE
     ========================================================= */

  function calculatePriority(exam) {
    const days = daysUntil(exam.date);

    const difficulty =
      difficultyWeight(exam.difficulty);

    const confidence =
      clamp(
        Number(exam.confidence) || 0,
        0,
        100
      );

    let deadlineScore;

    if (days <= 0) {
      deadlineScore = 60;
    } else if (days === 1) {
      deadlineScore = 55;
    } else if (days === 2) {
      deadlineScore = 47;
    } else if (days === 3) {
      deadlineScore = 39;
    } else if (days <= 5) {
      deadlineScore = 31;
    } else if (days <= 7) {
      deadlineScore = 24;
    } else if (days <= 14) {
      deadlineScore = 16;
    } else {
      deadlineScore = 8;
    }

    const difficultyScore =
      difficulty * 7;

    const confidenceScore =
      ((100 - confidence) / 100) * 30;

    const score =
      deadlineScore +
      difficultyScore +
      confidenceScore;

    let priority = "low";

    if (score >= 67) {
      priority = "high";
    } else if (score >= 43) {
      priority = "medium";
    }

    return {
      score: Math.round(score),
      priority,
      days,
      deadlineScore,
      difficultyScore,
      confidenceScore
    };
  }

  function sortExams(exams) {
    return [...exams].sort((a, b) => {
      const priorityA =
        calculatePriority(a);

      const priorityB =
        calculatePriority(b);

      if (
        priorityB.score !==
        priorityA.score
      ) {
        return (
          priorityB.score -
          priorityA.score
        );
      }

      const dateA =
        parseLocalDate(a.date)?.getTime() ??
        Infinity;

      const dateB =
        parseLocalDate(b.date)?.getTime() ??
        Infinity;

      return dateA - dateB;
    });
  }

  function getPriorityExam() {
    const validExams =
      state.exams.filter(
        exam =>
          exam &&
          exam.subject &&
          exam.date
      );

    return (
      sortExams(validExams)[0] ||
      null
    );
  }

  /* =========================================================
     INITIAL DATA
     ========================================================= */

  function initializeData() {
    const storedExams =
      loadStorage(
        STORAGE_KEYS.exams,
        null
      );

    const storedTasks =
      loadStorage(
        STORAGE_KEYS.tasks,
        null
      );

    const storedFocus =
      loadStorage(
        STORAGE_KEYS.focus,
        false
      );

    if (Array.isArray(storedExams)) {
      state.exams = storedExams;
    } else {
      state.exams =
        SAMPLE_EXAMS.map(
          exam => ({ ...exam })
        );

      saveStorage(
        STORAGE_KEYS.exams,
        state.exams
      );
    }

    state.tasks =
      Array.isArray(storedTasks)
        ? storedTasks
        : DEFAULT_TASKS.map(
            task => ({ ...task })
          );

    state.focusCompleted =
      Boolean(storedFocus);

    if (!storedTasks) {
      saveStorage(
        STORAGE_KEYS.tasks,
        state.tasks
      );
    }
  }

  /* =========================================================
     NAVIGATION
     ========================================================= */

  function navigateTo(viewName) {
    if (!VIEWS.includes(viewName)) {
      return;
    }

    if (
      state.currentView ===
      viewName
    ) {
      return;
    }

    const previousView =
      dom.views[
        state.currentView
      ];

    const nextView =
      dom.views[viewName];

    if (!nextView) {
      return;
    }

    if (state.viewTimer) {
      clearTimeout(
        state.viewTimer
      );
    }

    if (previousView) {
      previousView.classList.add(
        "is-leaving"
      );

      state.viewTimer =
        setTimeout(() => {
          previousView.hidden = true;

          previousView.classList.remove(
            "is-leaving"
          );

          nextView.hidden = false;

          requestAnimationFrame(() => {
            nextView.classList.remove(
              "is-leaving"
            );
          });
        }, 170);
    } else {
      nextView.hidden = false;
    }

    state.currentView =
      viewName;

    updateNavigation(viewName);

    if (viewName === "home") {
      renderHome();
    }

    if (viewName === "exams") {
      renderExams();
    }

    if (viewName === "plan") {
      renderPlan();
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function updateNavigation(viewName) {
    dom.navItems.forEach(item => {
      const target =
        item.dataset.nav;

      const active =
        target === viewName;

      item.classList.toggle(
        "is-active",
        active
      );

      if (active) {
        item.setAttribute(
          "aria-current",
          "page"
        );
      } else {
        item.removeAttribute(
          "aria-current"
        );
      }
    });
  }

  /* =========================================================
     HOME
     ========================================================= */

  function renderGreeting() {
    const hour =
      new Date().getHours();

    let greeting =
      "Good evening";

    if (hour < 5) {
      greeting = "Good night";
    } else if (hour < 12) {
      greeting = "Good morning";
    } else if (hour < 18) {
      greeting = "Good afternoon";
    }

    dom.home.greeting.textContent =
      greeting;
  }

  function renderHome() {
    renderGreeting();

    const priorityExam =
      getPriorityExam();

    if (!priorityExam) {
      renderEmptyHome();

      renderUpcomingExams([]);

      return;
    }

    const priority =
      calculatePriority(
        priorityExam
      );

    dom.home.priorityTitle.textContent =
      priorityExam.subject;

    dom.home.priorityBadge.textContent =
      `${priority.priority.toUpperCase()} PRIORITY`;

    dom.home.priorityBadge.className =
      `priority-badge ${priorityClass(
        priority.priority
      )}`;

    dom.home.priorityDate.textContent =
      formatDate(
        priorityExam.date
      );

    dom.home.priorityConfidence.textContent =
      `${clamp(
        Number(priorityExam.confidence) || 0,
        0,
        100
      )}%`;

    dom.home.priorityDifficulty.textContent =
      difficultyLabel(
        priorityExam.difficulty
      );

    dom.home.countdownNumber.textContent =
      priority.days <= 0
        ? "!"
        : Math.max(
            priority.days,
            1
          );

    const focus =
      getFocusTask(priorityExam);

    dom.home.focusTitle.textContent =
      focus.title;

    dom.home.focusSubtitle.textContent =
      focus.subtitle;

    dom.home.focusButton.classList.toggle(
      "is-complete",
      state.focusCompleted
    );

    dom.home.focusButton.setAttribute(
      "aria-label",
      state.focusCompleted
        ? "Mark today's focus as incomplete"
        : "Mark today's focus as complete"
    );

    renderUpcomingExams(
      sortExams(
        state.exams
      ).slice(0, 3)
    );
  }

  function renderEmptyHome() {
    dom.home.priorityTitle.textContent =
      "No exams yet";

    dom.home.priorityBadge.textContent =
      "READY WHEN YOU ARE";

    dom.home.priorityBadge.className =
      "priority-badge priority-low";

    dom.home.priorityDate.textContent =
      "—";

    dom.home.priorityConfidence.textContent =
      "—";

    dom.home.priorityDifficulty.textContent =
      "—";

    dom.home.countdownNumber.textContent =
      "0";

    dom.home.focusTitle.textContent =
      "Add your first exam";

    dom.home.focusSubtitle.textContent =
      "We'll turn it into your next priority.";

    dom.home.focusButton.classList.remove(
      "is-complete"
    );

    renderUpcomingExams([]);
  }

  function getFocusTask(priorityExam) {
    const firstIncomplete =
      state.tasks.find(
        task => !task.completed
      );

    if (firstIncomplete) {
      return firstIncomplete;
    }

    return {
      title:
        `Review ${priorityExam.subject}`,

      subtitle:
        `${difficultyLabel(
          priorityExam.difficulty
        )} · Keep your momentum`
    };
  }

  function renderUpcomingExams(exams) {
    if (!exams.length) {
      dom.home.upcoming.innerHTML = `
        <article class="exam-preview card">
          <div class="exam-date">
            <span class="exam-month">—</span>
            <strong class="exam-day">+</strong>
          </div>

          <div class="exam-info">
            <h3>No upcoming exams</h3>
            <p>Add an exam to see it here.</p>
          </div>
        </article>
      `;

      return;
    }

    dom.home.upcoming.innerHTML =
      exams
        .map(exam => {
          const priority =
            calculatePriority(
              exam
            );

          return `
            <article
              class="exam-preview card"
              data-exam-id="${escapeHTML(
                exam.id
              )}"
            >

              <div class="exam-date">
                <span class="exam-month">
                  ${escapeHTML(
                    formatMonth(
                      exam.date
                    )
                  )}
                </span>

                <strong class="exam-day">
                  ${escapeHTML(
                    formatDay(
                      exam.date
                    )
                  )}
                </strong>
              </div>

              <div class="exam-info">
                <h3>
                  ${escapeHTML(
                    exam.subject
                  )}
                </h3>

                <p>
                  ${escapeHTML(
                    difficultyLabel(
                      exam.difficulty
                    )
                  )}
                  ·
                  ${escapeHTML(
                    String(
                      exam.confidence
                    )
                  )}% confidence
                </p>
              </div>

              <span
                class="priority-dot priority-dot-${escapeHTML(
                  priority.priority
                )}"
                aria-label="${escapeHTML(
                  priority.priority
                )} priority"
              ></span>

            </article>
          `;
        })
        .join("");
  }

  /* =========================================================
     EXAMS
     ========================================================= */

  function renderExams() {
    const sorted =
      sortExams(
        state.exams
      );

    const highCount =
      sorted.filter(
        exam =>
          calculatePriority(
            exam
          ).priority === "high"
      ).length;

    dom.exams.count.textContent =
      `${sorted.length} ${
        sorted.length === 1
          ? "exam"
          : "exams"
      }`;

    dom.exams.highCount.textContent =
      String(highCount);

    dom.exams.list.innerHTML = "";

    dom.exams.empty.hidden =
      sorted.length > 0;

    if (!sorted.length) {
      return;
    }

    const fragment =
      document.createDocumentFragment();

    sorted.forEach(exam => {
      fragment.appendChild(
        createExamCard(exam)
      );
    });

    dom.exams.list.appendChild(
      fragment
    );
  }

  function createExamCard(exam) {
    const article =
      document.createElement(
        "article"
      );

    article.className =
      "exam-card card";

    article.dataset.examId =
      exam.id;

    const priority =
      calculatePriority(
        exam
      );

    article.innerHTML = `
      <div class="exam-date">
        <span class="exam-month">
          ${escapeHTML(
            formatMonth(
              exam.date
            )
          )}
        </span>

        <strong class="exam-day">
          ${escapeHTML(
            formatDay(
              exam.date
            )
          )}
        </strong>
      </div>

      <div class="exam-card-main">
        <h3>
          ${escapeHTML(
            exam.subject
          )}
        </h3>

        <p>
          ${escapeHTML(
            formatDaysLeft(
              priority.days
            )
          )}
          ·
          ${escapeHTML(
            difficultyLabel(
              exam.difficulty
            )
          )}
          ·
          ${escapeHTML(
            String(
              exam.confidence
            )
          )}% confidence
        </p>
      </div>

      <div class="exam-card-actions">

        <button
          class="small-icon-button"
          type="button"
          data-action="edit-exam"
          data-id="${escapeHTML(
            exam.id
          )}"
          aria-label="Edit ${escapeHTML(
            exam.subject
          )}"
        >✎</button>

        <button
          class="small-icon-button"
          type="button"
          data-action="delete-exam"
          data-id="${escapeHTML(
            exam.id
          )}"
          aria-label="Delete ${escapeHTML(
            exam.subject
          )}"
        >×</button>

      </div>
    `;

    return article;
  }

  /* =========================================================
     STUDY PLAN
     ========================================================= */

  function renderPlan() {
    const now =
      new Date();

    dom.plan.date.textContent =
      new Intl.DateTimeFormat(
        "en-US",
        {
          weekday: "short",
          month: "short",
          day: "numeric"
        }
      ).format(now);

    const total =
      state.tasks.length;

    const completed =
      state.tasks.filter(
        task =>
          task.completed
      ).length;

    const percentage =
      total === 0
        ? 0
        : Math.round(
            (completed / total) *
              100
          );

    dom.plan.percent.textContent =
      `${percentage}%`;

    dom.plan.completed.textContent =
      String(completed);

    dom.plan.total.textContent =
      String(total);

    dom.plan.bar.style.width =
      `${percentage}%`;

    if (
      percentage === 100 &&
      total > 0
    ) {
      dom.plan.message.textContent =
        "Session complete. Nice work — protect the momentum.";
    } else if (
      percentage >= 66
    ) {
      dom.plan.message.textContent =
        "Almost there. Finish the last stretch.";
    } else if (
      percentage > 0
    ) {
      dom.plan.message.textContent =
        "Good start. Keep the next task small and focused.";
    } else {
      dom.plan.message.textContent =
        "Start with your first task.";
    }

    renderTasks();
  }

  function renderTasks() {
    if (!state.tasks.length) {
      dom.plan.taskList.innerHTML = `
        <div class="empty-state card">
          <div
            class="empty-icon"
            aria-hidden="true"
          >
            ✦
          </div>

          <h3>
            Your plan is clear
          </h3>

          <p>
            Add an exam and StudyFlow
            will build your next steps.
          </p>
        </div>
      `;

      return;
    }

    dom.plan.taskList.innerHTML =
      state.tasks
        .map(
          task => `
            <label class="study-task card">

              <input
                type="checkbox"
                data-task-id="${escapeHTML(
                  task.id
                )}"
                ${
                  task.completed
                    ? "checked"
                    : ""
                }
              >

              <span
                class="custom-checkbox"
                aria-hidden="true"
              >
                <span>✓</span>
              </span>

              <span class="task-content">
                <strong>
                  ${escapeHTML(
                    task.title
                  )}
                </strong>

                <small>
                  ${escapeHTML(
                    task.subtitle
                  )}
                </small>
              </span>

            </label>
          `
        )
        .join("");
  }

  function getPlanForExam(exam) {
    if (!exam) {
      return [];
    }

    const subject =
      exam.subject;

    const notes =
      exam.notes?.trim();

    const defaultPlan = [
      {
        id: createId("task"),
        title:
          "Review the core topics",
        subtitle:
          `${subject} · 20 min`,
        completed: false
      },
      {
        id: createId("task"),
        title:
          "Review key formulas and facts",
        subtitle:
          `${subject} · 10 min`,
        completed: false
      },
      {
        id: createId("task"),
        title:
          "Practice 10 questions",
        subtitle:
          `${subject} · 15 min`,
        completed: false
      }
    ];

    if (notes) {
      defaultPlan[0].title =
        `Review ${notes}`;
    }

    return defaultPlan;
  }

  /* =========================================================
     EXAM FORM
     ========================================================= */

  function openAddExam() {
    state.editingExamId =
      null;

    dom.form.reset();

    dom.formId.value =
      "";

    dom.formTitle.textContent =
      "Add exam";

    dom.difficulty.value =
      "medium";

    dom.confidence.value =
      "50";

    updateConfidenceUI();

    setMinimumExamDate();

    openModal(
      dom.examModal
    );
  }

  function openEditExam(examId) {
    const exam =
      state.exams.find(
        item =>
          item.id === examId
      );

    if (!exam) {
      return;
    }

    state.editingExamId =
      examId;

    dom.formId.value =
      exam.id;

    dom.formTitle.textContent =
      "Edit exam";

    dom.subject.value =
      exam.subject;

    dom.examDate.value =
      exam.date;

    dom.difficulty.value =
      exam.difficulty;

    dom.confidence.value =
      clamp(
        Number(
          exam.confidence
        ) || 0,
        0,
        100
      );

    dom.notes.value =
      exam.notes || "";

    updateConfidenceUI();

    openModal(
      dom.examModal
    );
  }

  function setMinimumExamDate() {
    const now =
      new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        now.getDate()
      ).padStart(2, "0");

    dom.examDate.min =
      `${year}-${month}-${day}`;
  }

  function updateConfidenceUI() {
    const value =
      clamp(
        Number(
          dom.confidence.value
        ) || 0,
        0,
        100
      );

    dom.confidenceValue.textContent =
      `${value}%`;

    dom.confidence.style.setProperty(
      "--range-progress",
      `${value}%`
    );
  }

  function validateExamForm() {
    const subject =
      dom.subject.value.trim();

    const date =
      dom.examDate.value;

    const confidence =
      Number(
        dom.confidence.value
      );

    if (!subject) {
      showToast(
        "Give the exam a subject."
      );

      dom.subject.focus();

      return false;
    }

    if (
      !date ||
      !parseLocalDate(date)
    ) {
      showToast(
        "Choose a valid exam date."
      );

      dom.examDate.focus();

      return false;
    }

    if (
      daysUntil(date) < 0
    ) {
      showToast(
        "Choose today or a future date."
      );

      dom.examDate.focus();

      return false;
    }

    if (
      !Number.isFinite(
        confidence
      ) ||
      confidence < 0 ||
      confidence > 100
    ) {
      showToast(
        "Confidence must be between 0% and 100%."
      );

      dom.confidence.focus();

      return false;
    }

    return true;
  }

  function handleExamSubmit(event) {
    event.preventDefault();

    if (!validateExamForm()) {
      return;
    }

    const exam = {
      id:
        state.editingExamId ||
        createId("exam"),

      subject:
        dom.subject.value.trim(),

      date:
        dom.examDate.value,

      difficulty:
        dom.difficulty.value,

      confidence:
        Number(
          dom.confidence.value
        ),

      notes:
        dom.notes.value.trim()
    };

    const existingIndex =
      state.exams.findIndex(
        item =>
          item.id === exam.id
      );

    if (
      existingIndex >= 0
    ) {
      state.exams[
        existingIndex
      ] = exam;

      showToast(
        "Exam updated."
      );
    } else {
      state.exams.push(
        exam
      );

      showToast(
        "Exam added."
      );
    }

    saveStorage(
      STORAGE_KEYS.exams,
      state.exams
    );

    closeModal(
      dom.examModal
    );

    renderHome();
    renderExams();
    renderPlan();

    const priorityExam =
      getPriorityExam();

    if (
      priorityExam &&
      priorityExam.id === exam.id
    ) {
      regeneratePlanForPriority(
        false
      );
    }
  }

  /* =========================================================
     DELETE EXAM
     ========================================================= */

  function deleteExam(examId) {
    const exam =
      state.exams.find(
        item =>
          item.id === examId
      );

    if (!exam) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${exam.subject}" from StudyFlow?`
      );

    if (!confirmed) {
      return;
    }

    state.exams =
      state.exams.filter(
        item =>
          item.id !== examId
      );

    saveStorage(
      STORAGE_KEYS.exams,
      state.exams
    );

    renderHome();
    renderExams();
    renderPlan();

    showToast(
      "Exam deleted."
    );
  }

  /* =========================================================
     TASK ACTIONS
     ========================================================= */

  function toggleTask(
    taskId,
    completed
  ) {
    const task =
      state.tasks.find(
        item =>
          item.id === taskId
      );

    if (!task) {
      return;
    }

    task.completed =
      Boolean(completed);

    saveStorage(
      STORAGE_KEYS.tasks,
      state.tasks
    );

    renderPlan();

    if (task.completed) {
      showToast(
        "Task complete. Keep going."
      );

      const card =
        dom.plan.taskList
          .querySelector(
            `[data-task-id="${CSS.escape(
              taskId
            )}"]`
          )
          ?.closest(
            ".study-task"
          );

      if (card) {
        card.classList.add(
          "success-glow"
        );

        setTimeout(() => {
          card.classList.remove(
            "success-glow"
          );
        }, 520);
      }
    }
  }

  function completeFocus() {
    state.focusCompleted =
      !state.focusCompleted;

    saveStorage(
      STORAGE_KEYS.focus,
      state.focusCompleted
    );

    renderHome();

    if (
      state.focusCompleted
    ) {
      showToast(
        "Today's focus complete."
      );
    } else {
      showToast(
        "Focus reopened."
      );
    }
  }

  function regeneratePlanForPriority(
    showLoading = true
  ) {
    const exam =
      getPriorityExam();

    if (!exam) {
      state.tasks = [];

      saveStorage(
        STORAGE_KEYS.tasks,
        state.tasks
      );

      renderPlan();

      return;
    }

    const applyPlan = () => {
      state.tasks =
        getPlanForExam(exam);

      state.focusCompleted =
        false;

      saveStorage(
        STORAGE_KEYS.tasks,
        state.tasks
      );

      saveStorage(
        STORAGE_KEYS.focus,
        false
      );

      renderHome();
      renderPlan();

      if (showLoading) {
        showToast(
          `New plan built for ${exam.subject}.`
        );
      }
    };

    if (!showLoading) {
      applyPlan();

      return;
    }

    showAILoading();

    setTimeout(() => {
      hideAILoading();

      applyPlan();
    }, 720);
  }

  /* =========================================================
     MODALS
     ========================================================= */

  function openModal(modal) {
    if (!modal) {
      return;
    }

    modal.hidden = false;

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow =
      "hidden";
  }

  function closeModal(modal) {
    if (!modal) {
      return;
    }

    modal.hidden = true;

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    const anyOpen = [
      dom.examModal,
      dom.priorityModal,
      dom.settingsModal
    ].some(
      item =>
        item &&
        !item.hidden
    );

    if (!anyOpen) {
      document.body.style.overflow =
        "";
    }
  }

  function openPriority() {
    const exam =
      getPriorityExam();

    if (!exam) {
      showToast(
        "Add an exam first."
      );

      navigateTo("exams");

      return;
    }

    const priority =
      calculatePriority(exam);

    dom.detail.title.textContent =
      exam.subject;

    dom.detail.days.textContent =
      priority.days <= 0
        ? "Now"
        : String(
            priority.days
          );

    dom.detail.confidence.textContent =
      `${exam.confidence}%`;

    dom.detail.difficulty.textContent =
      difficultyLabel(
        exam.difficulty
      );

    dom.detail.reason.textContent =
      buildPriorityReason(
        exam,
        priority
      );

    const badge =
      dom.priorityModal.querySelector(
        ".priority-badge"
      );

    if (badge) {
      badge.textContent =
        `${priority.priority.toUpperCase()} PRIORITY`;

      badge.className =
        `priority-badge ${priorityClass(
          priority.priority
        )}`;
    }

    openModal(
      dom.priorityModal
    );
  }

  function buildPriorityReason(
    exam,
    priority
  ) {
    const reasons = [];

    if (priority.days <= 2) {
      reasons.push(
        "the exam is very close"
      );
    } else if (
      priority.days <= 5
    ) {
      reasons.push(
        "the exam is approaching"
      );
    }

    if (exam.confidence < 50) {
      reasons.push(
        "your confidence is still low"
      );
    }

    if (
      exam.difficulty ===
      "hard"
    ) {
      reasons.push(
        "the subject is marked hard"
      );
    }

    if (!reasons.length) {
      return "This subject currently has the highest combined study priority.";
    }

    const reasonText =
      reasons.length === 1
        ? reasons[0]
        : `${reasons
            .slice(0, -1)
            .join(", ")} and ${
            reasons.at(-1)
          }`;

    return `Your priority is high because ${reasonText}. This subject should be one of your main study focuses.`;
  }

  function openSettings() {
    openModal(
      dom.settingsModal
    );
  }

  /* =========================================================
     SETTINGS
     ========================================================= */

  function resetAllData() {
    const confirmed =
      window.confirm(
        "Reset StudyFlow's saved exams and progress?"
      );

    if (!confirmed) {
      return;
    }

    state.exams = [];
    state.tasks = [];
    state.focusCompleted =
      false;

    try {
      localStorage.removeItem(
        STORAGE_KEYS.exams
      );

      localStorage.removeItem(
        STORAGE_KEYS.tasks
      );

      localStorage.removeItem(
        STORAGE_KEYS.focus
      );
    } catch {
      /* Ignore storage cleanup failure. */
    }

    closeModal(
      dom.settingsModal
    );

    renderHome();
    renderExams();
    renderPlan();

    showToast(
      "StudyFlow has been reset."
    );
  }

  /* =========================================================
     TOAST / LOADING
     ========================================================= */

  function showToast(message) {
    if (!dom.toast) {
      return;
    }

    if (state.toastTimer) {
      clearTimeout(
        state.toastTimer
      );
    }

    dom.toast.textContent =
      message;

    dom.toast.hidden =
      false;

    dom.toast.style.animation =
      "none";

    void dom.toast.offsetWidth;

    dom.toast.style.animation =
      "";

    state.toastTimer =
      setTimeout(() => {
        dom.toast.hidden =
          true;
      }, 2200);
  }

  function showAILoading() {
    if (!dom.aiLoading) {
      return;
    }

    dom.aiLoading.hidden =
      false;

    dom.aiLoading.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  function hideAILoading() {
    if (!dom.aiLoading) {
      return;
    }

    dom.aiLoading.hidden =
      true;

    dom.aiLoading.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  /* =========================================================
     TOUCH RIPPLE
     ========================================================= */

  function createRipple(event) {
    if (!event.isTrusted) {
      return;
    }

    const target =
      event.target.closest(
        "button, .study-task, .exam-preview, .exam-card"
      );

    if (!target) {
      return;
    }

    const ripple =
      document.createElement(
        "span"
      );

    ripple.className =
      "touch-ripple";

    ripple.style.left =
      `${event.clientX}px`;

    ripple.style.top =
      `${event.clientY}px`;

    document.body.appendChild(
      ripple
    );

    setTimeout(() => {
      ripple.remove();
    }, 500);
  }

  /* =========================================================
     EVENTS
     ========================================================= */

  function handleClick(event) {
    const target =
      event.target.closest(
        "[data-action], [data-nav]"
      );

    if (!target) {
      return;
    }

    const navTarget =
      target.dataset.nav;

    const action =
      target.dataset.action;

    if (navTarget) {
      navigateTo(
        navTarget
      );

      return;
    }

    if (!action) {
      return;
    }

    switch (action) {
      case "open-settings":
        openSettings();
        break;

      case "close-settings":
        closeModal(
          dom.settingsModal
        );
        break;

      case "open-add-exam":
        openAddExam();
        break;

      case "close-exam-modal":
        closeModal(
          dom.examModal
        );
        break;

      case "open-priority":
        openPriority();
        break;

      case "close-priority":
        closeModal(
          dom.priorityModal
        );
        break;

      case "go-to-plan":
        closeModal(
          dom.priorityModal
        );

        navigateTo("plan");
        break;

      case "complete-focus":
        completeFocus();
        break;

      case "edit-exam":
        openEditExam(
          target.dataset.id
        );
        break;

      case "delete-exam":
        deleteExam(
          target.dataset.id
        );
        break;

      case "regenerate-plan":
        regeneratePlanForPriority(
          true
        );
        break;

      case "reset-data":
        resetAllData();
        break;

      default:
        break;
    }
  }

  function handleChange(event) {
    if (
      event.target.matches(
        "#confidence"
      )
    ) {
      updateConfidenceUI();

      return;
    }

    if (
      event.target.matches(
        "#study-task-list input[type='checkbox']"
      )
    ) {
      toggleTask(
        event.target.dataset.taskId,
        event.target.checked
      );
    }
  }

  function handleKeydown(event) {
    if (
      event.key !== "Escape"
    ) {
      return;
    }

    const openModalElement =
      [
        dom.examModal,
        dom.priorityModal,
        dom.settingsModal
      ].find(
        modal =>
          modal &&
          !modal.hidden
      );

    if (openModalElement) {
      closeModal(
        openModalElement
      );
    }
  }

  function handleDocumentClick(
    event
  ) {
    const preview =
      event.target.closest(
        "#upcoming-exams .exam-preview"
      );

    if (
      preview &&
      preview.dataset.examId
    ) {
      const exam =
        state.exams.find(
          item =>
            item.id ===
            preview.dataset.examId
        );

      if (exam) {
        const priority =
          calculatePriority(
            exam
          );

        dom.detail.title.textContent =
          exam.subject;

        dom.detail.days.textContent =
          priority.days <= 0
            ? "Now"
            : String(
                priority.days
              );

        dom.detail.confidence.textContent =
          `${exam.confidence}%`;

        dom.detail.difficulty.textContent =
          difficultyLabel(
            exam.difficulty
          );

        dom.detail.reason.textContent =
          buildPriorityReason(
            exam,
            priority
          );

        const badge =
          dom.priorityModal.querySelector(
            ".priority-badge"
          );

        if (badge) {
          badge.textContent =
            `${priority.priority.toUpperCase()} PRIORITY`;

          badge.className =
            `priority-badge ${priorityClass(
              priority.priority
            )}`;
        }

        openModal(
          dom.priorityModal
        );
      }
    }
  }

  /* =========================================================
     INITIAL STATE
     ========================================================= */

  function ensureInitialView() {
    VIEWS.forEach(
      viewName => {
        const view =
          dom.views[
            viewName
          ];

        if (!view) {
          return;
        }

        view.hidden =
          viewName !== "home";
      }
    );

    updateNavigation(
      "home"
    );
  }

  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    if (state.initialized) {
      return;
    }

    cacheDOM();

    if (
      !dom.app ||
      !dom.form
    ) {
      console.error(
        "StudyFlow could not initialize: required DOM is missing."
      );

      return;
    }

    initializeData();

    ensureInitialView();

    renderHome();
    renderExams();
    renderPlan();

    updateConfidenceUI();

    setMinimumExamDate();

    document.addEventListener(
      "click",
      handleClick
    );

    document.addEventListener(
      "click",
      handleDocumentClick
    );

    document.addEventListener(
      "pointerdown",
      createRipple
    );

    document.addEventListener(
      "keydown",
      handleKeydown
    );

    dom.form.addEventListener(
      "submit",
      handleExamSubmit
    );

    document.addEventListener(
      "change",
      handleChange
    );

    /*
      Keep priority data fresh if the app
      stays open across midnight.
    */
    setInterval(() => {
      renderHome();
      renderExams();
      renderPlan();
    }, 60000);

    state.initialized =
      true;
  }

  /* =========================================================
     START
     ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );
  } else {
    init();
  }

})();