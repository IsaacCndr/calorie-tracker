/**
 * NutriTrack - Pure Vanilla JavaScript Calorie & Macro Tracker
 * Features: LocalStorage persistent storage, TDEE calculator, 7-day analytics,
 * category meal management, quick food presets, and import/export.
 */

(function () {
  'use strict';

  // --- Storage Keys ---
  const STORAGE_KEYS = {
    LOGS: 'nutritrack_logs_v1',
    SETTINGS: 'nutritrack_settings_v1',
    INITIALIZED: 'nutritrack_initialized_v1',
    THEME: 'nutritrack_theme_v1'
  };

  // --- Default Configuration ---
  const DEFAULT_SETTINGS = {
    dailyGoal: 2000,
    proteinGoal: 140,
    carbsGoal: 210,
    fatGoal: 65
  };

  // --- Common Food Presets for Quick Logging ---
  const FOOD_PRESETS = [
    { name: '🥚 2 Boiled Eggs', meal: 'breakfast', calories: 140, protein: 12, carbs: 1, fat: 10 },
    { name: '🥣 Oatmeal & Honey', meal: 'breakfast', calories: 310, protein: 9, carbs: 55, fat: 5 },
    { name: '🍗 Grilled Chicken (150g)', meal: 'lunch', calories: 245, protein: 46, carbs: 0, fat: 5 },
    { name: '🍚 White Rice (1 cup)', meal: 'lunch', calories: 205, protein: 4, carbs: 45, fat: 0.5 },
    { name: '🥑 Avocado (Half)', meal: 'snack', calories: 160, protein: 2, carbs: 8, fat: 15 },
    { name: '🥛 Whey Protein Shake', meal: 'snack', calories: 130, protein: 25, carbs: 3, fat: 2 },
    { name: '🐟 Salmon Fillet (160g)', meal: 'dinner', calories: 330, protein: 35, carbs: 0, fat: 20 },
    { name: '🥗 Mixed Green Salad & Olive Oil', meal: 'dinner', calories: 180, protein: 3, carbs: 9, fat: 15 },
    { name: '🍎 Medium Apple', meal: 'snack', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
    { name: '☕ Coffee with Milk', meal: 'breakfast', calories: 60, protein: 3, carbs: 5, fat: 2.5 }
  ];

  // --- State ---
  let appSettings = loadSettings();
  let appLogs = loadLogs();
  let currentTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  let selectedDate = getTodayDateString();
  let editingEntryId = null;

  // --- DOM Elements ---
  const DOM = {
    // Header & Date Nav
    prevDayBtn: document.getElementById('prevDayBtn'),
    nextDayBtn: document.getElementById('nextDayBtn'),
    todayBtn: document.getElementById('todayBtn'),
    datePicker: document.getElementById('datePicker'),
    dateDisplay: document.getElementById('dateDisplay'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeToggleIcon: document.getElementById('themeToggleIcon'),
    themeToggleText: document.getElementById('themeToggleText'),
    openGoalsModalBtn: document.getElementById('openGoalsModalBtn'),
    openHistoryModalBtn: document.getElementById('openHistoryModalBtn'),

    // Hero Ring & Calorie Metrics
    calorieRing: document.getElementById('calorieRing'),
    remainingCaloriesVal: document.getElementById('remainingCaloriesVal'),
    targetCaloriesVal: document.getElementById('targetCaloriesVal'),
    consumedCaloriesVal: document.getElementById('consumedCaloriesVal'),
    calorieStatusBadge: document.getElementById('calorieStatusBadge'),

    // Macros
    proteinCurrent: document.getElementById('proteinCurrent'),
    proteinGoal: document.getElementById('proteinGoal'),
    proteinBar: document.getElementById('proteinBar'),
    proteinPct: document.getElementById('proteinPct'),
    proteinKcal: document.getElementById('proteinKcal'),

    carbsCurrent: document.getElementById('carbsCurrent'),
    carbsGoal: document.getElementById('carbsGoal'),
    carbsBar: document.getElementById('carbsBar'),
    carbsPct: document.getElementById('carbsPct'),
    carbsKcal: document.getElementById('carbsKcal'),

    fatCurrent: document.getElementById('fatCurrent'),
    fatGoal: document.getElementById('fatGoal'),
    fatBar: document.getElementById('fatBar'),
    fatPct: document.getElementById('fatPct'),
    fatKcal: document.getElementById('fatKcal'),

    // Presets & Food Form
    presetChipsContainer: document.getElementById('presetChipsContainer'),
    foodEntryForm: document.getElementById('foodEntryForm'),
    formHeaderTitle: document.getElementById('formHeaderTitle'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    editEntryId: document.getElementById('editEntryId'),
    foodName: document.getElementById('foodName'),
    mealCategory: document.getElementById('mealCategory'),
    foodCalories: document.getElementById('foodCalories'),
    foodProtein: document.getElementById('foodProtein'),
    foodCarbs: document.getElementById('foodCarbs'),
    foodFat: document.getElementById('foodFat'),
    saveFoodBtn: document.getElementById('saveFoodBtn'),

    // Meals List by Category
    dailyTotalKcal: document.getElementById('dailyTotalKcal'),
    clearDayBtn: document.getElementById('clearDayBtn'),
    breakfastSubtotal: document.getElementById('breakfastSubtotal'),
    lunchSubtotal: document.getElementById('lunchSubtotal'),
    dinnerSubtotal: document.getElementById('dinnerSubtotal'),
    snackSubtotal: document.getElementById('snackSubtotal'),
    breakfastItems: document.getElementById('breakfastItems'),
    lunchItems: document.getElementById('lunchItems'),
    dinnerItems: document.getElementById('dinnerItems'),
    snackItems: document.getElementById('snackItems'),

    // Modals: Goals
    goalsModal: document.getElementById('goalsModal'),
    closeGoalsModalBtn: document.getElementById('closeGoalsModalBtn'),
    cancelGoalsModalBtn: document.getElementById('cancelGoalsModalBtn'),
    tabManualGoalsBtn: document.getElementById('tabManualGoalsBtn'),
    tabTdeeCalcBtn: document.getElementById('tabTdeeCalcBtn'),
    tabManualContent: document.getElementById('tabManualContent'),
    tabTdeeContent: document.getElementById('tabTdeeContent'),
    goalsForm: document.getElementById('goalsForm'),
    goalCaloriesInput: document.getElementById('goalCaloriesInput'),
    goalProteinInput: document.getElementById('goalProteinInput'),
    goalCarbsInput: document.getElementById('goalCarbsInput'),
    goalFatInput: document.getElementById('goalFatInput'),
    macroCalorieSumNote: document.getElementById('macroCalorieSumNote'),
    autoBalanceMacrosBtn: document.getElementById('autoBalanceMacrosBtn'),

    // TDEE Calculator Elements
    tdeeForm: document.getElementById('tdeeForm'),
    calcGender: document.getElementById('calcGender'),
    calcAge: document.getElementById('calcAge'),
    calcWeight: document.getElementById('calcWeight'),
    calcHeight: document.getElementById('calcHeight'),
    calcActivity: document.getElementById('calcActivity'),
    calcGoal: document.getElementById('calcGoal'),
    bmrOutput: document.getElementById('bmrOutput'),
    maintenanceOutput: document.getElementById('maintenanceOutput'),
    targetOutput: document.getElementById('targetOutput'),
    applyTdeeBtn: document.getElementById('applyTdeeBtn'),

    // Modals: 7-Day History
    historyModal: document.getElementById('historyModal'),
    closeHistoryModalBtn: document.getElementById('closeHistoryModalBtn'),
    weeklyBarChart: document.getElementById('weeklyBarChart'),
    sevenDayAvgKcal: document.getElementById('sevenDayAvgKcal'),
    sevenDayAdherence: document.getElementById('sevenDayAdherence'),
    sevenDayTotalKcal: document.getElementById('sevenDayTotalKcal'),
    historyTableBody: document.getElementById('historyTableBody'),

    // Footer & Data Portability
    exportDataBtn: document.getElementById('exportDataBtn'),
    importDataBtn: document.getElementById('importDataBtn'),
    importFileInput: document.getElementById('importFileInput'),
    resetAllDataBtn: document.getElementById('resetAllDataBtn'),

    // Toast
    toastNotification: document.getElementById('toastNotification')
  };

  // --- Initialization ---
  function init() {
    applyTheme(currentTheme, false);
    checkFirstTimeSeed();
    setupEventListeners();
    renderPresets();
    updateDateDisplay();
    renderDashboard();
    calculateTdeePreview();
  }

  // --- Theme Toggle Management (Dark/Black Mode & Light Mode) ---
  function applyTheme(theme, save = true) {
    currentTheme = theme === 'light' ? 'light' : 'dark';
    if (save) {
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, currentTheme);
      } catch (e) {
        console.error('Failed to save theme to localStorage', e);
      }
    }

    if (currentTheme === 'light') {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      if (DOM.themeToggleIcon) DOM.themeToggleIcon.textContent = '🌙';
      if (DOM.themeToggleText) DOM.themeToggleText.textContent = 'Dark';
      if (DOM.themeToggleBtn) DOM.themeToggleBtn.title = 'Switch to Dark (Black) Mode';
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      if (DOM.themeToggleIcon) DOM.themeToggleIcon.textContent = '☀️';
      if (DOM.themeToggleText) DOM.themeToggleText.textContent = 'Light';
      if (DOM.themeToggleBtn) DOM.themeToggleBtn.title = 'Switch to Light Mode';
    }

    // Update ring & remaining numbers if already initialized
    if (DOM.remainingCaloriesVal) {
      const goalCal = Number(appSettings.dailyGoal) || 2000;
      const entries = appLogs[selectedDate] || [];
      const totalCalories = entries.reduce((acc, curr) => acc + (Number(curr.calories) || 0), 0);
      const remainingCal = goalCal - totalCalories;
      if (remainingCal >= 0) {
        DOM.remainingCaloriesVal.style.color = currentTheme === 'light' ? '#0f172a' : '#ffffff';
      }
      if (totalCalories === 0 && DOM.calorieRing) {
        DOM.calorieRing.style.stroke = currentTheme === 'light' ? '#cbd5e1' : '#27272a';
      }
    }
  }

  function toggleTheme() {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, true);
    showToast(`Switched to ${nextTheme === 'dark' ? 'Dark (Black)' : 'Light'} Mode`, 'info');
  }

  // --- Seed Initial Sample Data for Great First Experience ---
  function checkFirstTimeSeed() {
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInitialized) {
      const today = getTodayDateString();
      if (!appLogs[today] || appLogs[today].length === 0) {
        appLogs[today] = [
          {
            id: generateId(),
            name: '🥣 Oatmeal with Berries & Honey',
            meal: 'breakfast',
            calories: 320,
            protein: 10,
            carbs: 58,
            fat: 5,
            time: '08:15 AM'
          },
          {
            id: generateId(),
            name: '☕ Flat White (Oat Milk)',
            meal: 'breakfast',
            calories: 120,
            protein: 3,
            carbs: 14,
            fat: 4,
            time: '08:45 AM'
          },
          {
            id: generateId(),
            name: '🍗 Grilled Chicken Salad Bowl',
            meal: 'lunch',
            calories: 480,
            protein: 42,
            carbs: 22,
            fat: 16,
            time: '01:00 PM'
          }
        ];
        saveLogs();
      }
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  // --- LocalStorage Helpers ---
  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? Object.assign({}, DEFAULT_SETTINGS, JSON.parse(saved)) : Object.assign({}, DEFAULT_SETTINGS);
    } catch (e) {
      console.error('Failed to parse settings from localStorage', e);
      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
      showToast('Error saving settings to storage', 'danger');
    }
  }

  function loadLogs() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Failed to load logs from localStorage', e);
      return {};
    }
  }

  function saveLogs() {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(appLogs));
    } catch (e) {
      console.error('Failed to save logs to localStorage', e);
      showToast('Error saving food entry to storage', 'danger');
    }
  }

  // --- Date Utilities ---
  function getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateHuman(dateString) {
    const today = getTodayDateString();
    const parts = dateString.split('-');
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    // Check yesterday
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;

    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const formatted = dateObj.toLocaleDateString(undefined, options);

    if (dateString === today) {
      return `Today (${formatted})`;
    } else if (dateString === yestStr) {
      return `Yesterday (${formatted})`;
    }
    return formatted;
  }

  function shiftDate(offsetDays) {
    const parts = selectedDate.split('-');
    const current = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    current.setDate(current.getDate() + offsetDays);

    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    selectedDate = `${year}-${month}-${day}`;

    updateDateDisplay();
    renderDashboard();
  }

  function updateDateDisplay() {
    DOM.datePicker.value = selectedDate;
    DOM.dateDisplay.textContent = formatDateHuman(selectedDate);
  }

  // --- Render Presets Chips ---
  function renderPresets() {
    DOM.presetChipsContainer.innerHTML = '';
    FOOD_PRESETS.forEach(preset => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'preset-chip';
      chip.innerHTML = `<span>${preset.name}</span> <span class="preset-cal">${preset.calories} kcal</span>`;
      chip.addEventListener('click', () => {
        applyPresetToForm(preset);
      });
      DOM.presetChipsContainer.appendChild(chip);
    });
  }

  function applyPresetToForm(preset) {
    DOM.foodName.value = preset.name;
    DOM.mealCategory.value = preset.meal;
    DOM.foodCalories.value = preset.calories;
    DOM.foodProtein.value = preset.protein;
    DOM.foodCarbs.value = preset.carbs;
    DOM.foodFat.value = preset.fat;

    DOM.foodName.focus();
    showToast(`Loaded preset: ${preset.name}`, 'info');
  }

  // --- Core Dashboard Rendering ---
  function renderDashboard() {
    const entries = appLogs[selectedDate] || [];

    // Calculate totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const mealCategories = {
      breakfast: { items: [], total: 0 },
      lunch: { items: [], total: 0 },
      dinner: { items: [], total: 0 },
      snack: { items: [], total: 0 }
    };

    entries.forEach(entry => {
      const cal = Number(entry.calories) || 0;
      const pro = Number(entry.protein) || 0;
      const carb = Number(entry.carbs) || 0;
      const fat = Number(entry.fat) || 0;

      totalCalories += cal;
      totalProtein += pro;
      totalCarbs += carb;
      totalFat += fat;

      const cat = entry.meal || 'snack';
      if (mealCategories[cat]) {
        mealCategories[cat].items.push(entry);
        mealCategories[cat].total += cal;
      } else {
        mealCategories.snack.items.push(entry);
        mealCategories.snack.total += cal;
      }
    });

    // 1. Hero Ring & Calorie Numbers
    const goalCal = Number(appSettings.dailyGoal) || 2000;
    const remainingCal = goalCal - totalCalories;

    DOM.targetCaloriesVal.textContent = goalCal.toLocaleString();
    DOM.consumedCaloriesVal.textContent = totalCalories.toLocaleString();
    DOM.dailyTotalKcal.textContent = `Total: ${totalCalories.toLocaleString()} kcal`;

    if (remainingCal >= 0) {
      DOM.remainingCaloriesVal.textContent = remainingCal.toLocaleString();
      DOM.remainingCaloriesVal.style.color = currentTheme === 'light' ? '#0f172a' : '#ffffff';
    } else {
      DOM.remainingCaloriesVal.textContent = `+${Math.abs(remainingCal).toLocaleString()}`;
      DOM.remainingCaloriesVal.style.color = '#ef4444'; // Red highlight when over
    }

    // Update Status Badge & Ring
    const ringRadius = 75;
    const ringCircumference = 2 * Math.PI * ringRadius; // ~471.24
    let progressRatio = totalCalories / goalCal;
    if (progressRatio < 0) progressRatio = 0;

    let ringOffset;
    if (progressRatio <= 1) {
      ringOffset = ringCircumference * (1 - progressRatio);
    } else {
      ringOffset = 0;
    }
    DOM.calorieRing.style.strokeDashoffset = ringOffset;

    if (totalCalories === 0) {
      DOM.calorieStatusBadge.textContent = 'Not Started';
      DOM.calorieStatusBadge.className = 'badge badge-secondary';
      DOM.calorieRing.style.stroke = currentTheme === 'light' ? '#cbd5e1' : '#27272a';
    } else if (totalCalories <= goalCal * 0.9) {
      DOM.calorieStatusBadge.textContent = 'On Track';
      DOM.calorieStatusBadge.className = 'badge badge-success';
      DOM.calorieRing.style.stroke = '#10b981';
    } else if (totalCalories <= goalCal) {
      DOM.calorieStatusBadge.textContent = 'Near Target';
      DOM.calorieStatusBadge.className = 'badge badge-warning';
      DOM.calorieRing.style.stroke = '#f59e0b';
    } else {
      const overBy = totalCalories - goalCal;
      DOM.calorieStatusBadge.textContent = `Over Goal (+${overBy} kcal)`;
      DOM.calorieStatusBadge.className = 'badge badge-danger';
      DOM.calorieRing.style.stroke = '#ef4444';
    }

    // 2. Macronutrient Progress
    updateMacroMetric(
      DOM.proteinCurrent,
      DOM.proteinGoal,
      DOM.proteinBar,
      DOM.proteinPct,
      DOM.proteinKcal,
      totalProtein,
      appSettings.proteinGoal,
      4
    );

    updateMacroMetric(
      DOM.carbsCurrent,
      DOM.carbsGoal,
      DOM.carbsBar,
      DOM.carbsPct,
      DOM.carbsKcal,
      totalCarbs,
      appSettings.carbsGoal,
      4
    );

    updateMacroMetric(
      DOM.fatCurrent,
      DOM.fatGoal,
      DOM.fatBar,
      DOM.fatPct,
      DOM.fatKcal,
      totalFat,
      appSettings.fatGoal,
      9
    );

    // 3. Render Categorized Meal Lists
    renderMealGroup('breakfast', mealCategories.breakfast, DOM.breakfastSubtotal, DOM.breakfastItems);
    renderMealGroup('lunch', mealCategories.lunch, DOM.lunchSubtotal, DOM.lunchItems);
    renderMealGroup('dinner', mealCategories.dinner, DOM.dinnerSubtotal, DOM.dinnerItems);
    renderMealGroup('snack', mealCategories.snack, DOM.snackSubtotal, DOM.snackItems);
  }

  function updateMacroMetric(currentEl, goalEl, barEl, pctEl, kcalEl, currentVal, goalVal, kcalPerGram) {
    const cur = Math.round(currentVal * 10) / 10;
    const goal = Number(goalVal) || 1;
    const pct = Math.min(Math.round((cur / goal) * 100), 200);
    const kcal = Math.round(cur * kcalPerGram);

    currentEl.textContent = cur;
    goalEl.textContent = goal;
    pctEl.textContent = `${pct}% of target`;
    kcalEl.textContent = `${kcal} kcal`;

    barEl.style.width = `${Math.min(pct, 100)}%`;
    if (cur > goal) {
      barEl.style.filter = 'brightness(1.2)';
    } else {
      barEl.style.filter = 'none';
    }
  }

  function renderMealGroup(groupKey, data, subtotalEl, containerEl) {
    subtotalEl.textContent = `${data.total.toLocaleString()} kcal`;
    containerEl.innerHTML = '';

    if (!data.items || data.items.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-meal-placeholder';
      emptyDiv.textContent = 'No items logged yet';
      containerEl.appendChild(emptyDiv);
      return;
    }

    data.items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'meal-item-row';
      row.dataset.id = item.id;

      const p = item.protein !== undefined && item.protein !== '' ? Number(item.protein) : 0;
      const c = item.carbs !== undefined && item.carbs !== '' ? Number(item.carbs) : 0;
      const f = item.fat !== undefined && item.fat !== '' ? Number(item.fat) : 0;

      row.innerHTML = `
        <div class="item-left">
          <div class="item-name">${escapeHtml(item.name)}</div>
          <div class="item-macros-tags">
            <span>P: ${p}g</span>
            <span>•</span>
            <span>C: ${c}g</span>
            <span>•</span>
            <span>F: ${f}g</span>
            ${item.time ? `<span>•</span> <span>${escapeHtml(item.time)}</span>` : ''}
          </div>
        </div>
        <div class="item-right">
          <span class="item-calories">${Number(item.calories).toLocaleString()} kcal</span>
          <div class="item-actions">
            <button type="button" class="action-icon-btn edit-item-btn" title="Edit this entry">✏️</button>
            <button type="button" class="action-icon-btn delete-btn delete-item-btn" title="Delete entry">🗑️</button>
          </div>
        </div>
      `;

      // Event Listeners for Edit and Delete
      row.querySelector('.edit-item-btn').addEventListener('click', () => {
        beginEditEntry(item);
      });

      row.querySelector('.delete-item-btn').addEventListener('click', () => {
        deleteEntry(item.id);
      });

      containerEl.appendChild(row);
    });
  }

  // --- Food Entry CRUD ---
  function handleFoodFormSubmit(e) {
    e.preventDefault();

    const name = DOM.foodName.value.trim();
    const meal = DOM.mealCategory.value;
    const calories = Math.round(Number(DOM.foodCalories.value));
    const protein = DOM.foodProtein.value !== '' ? parseFloat(DOM.foodProtein.value) : 0;
    const carbs = DOM.foodCarbs.value !== '' ? parseFloat(DOM.foodCarbs.value) : 0;
    const fat = DOM.foodFat.value !== '' ? parseFloat(DOM.foodFat.value) : 0;

    if (!name || isNaN(calories) || calories < 0) {
      showToast('Please provide a valid food name and calories', 'danger');
      return;
    }

    if (!appLogs[selectedDate]) {
      appLogs[selectedDate] = [];
    }

    if (editingEntryId) {
      // Update existing
      const index = appLogs[selectedDate].findIndex(i => i.id === editingEntryId);
      if (index !== -1) {
        appLogs[selectedDate][index] = {
          ...appLogs[selectedDate][index],
          name,
          meal,
          calories,
          protein,
          carbs,
          fat
        };
        showToast(`Updated "${name}"`, 'success');
      }
      resetFormToCreate();
    } else {
      // Create new
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newEntry = {
        id: generateId(),
        name,
        meal,
        calories,
        protein,
        carbs,
        fat,
        time: timeStr
      };

      appLogs[selectedDate].push(newEntry);
      showToast(`Logged "${name}" (${calories} kcal)`, 'success');
      resetFormInputs();
    }

    saveLogs();
    renderDashboard();
  }

  function beginEditEntry(item) {
    editingEntryId = item.id;
    DOM.editEntryId.value = item.id;
    DOM.foodName.value = item.name;
    DOM.mealCategory.value = item.meal || 'snack';
    DOM.foodCalories.value = item.calories;
    DOM.foodProtein.value = item.protein !== undefined ? item.protein : '';
    DOM.foodCarbs.value = item.carbs !== undefined ? item.carbs : '';
    DOM.foodFat.value = item.fat !== undefined ? item.fat : '';

    DOM.formHeaderTitle.textContent = `Editing "${item.name}"`;
    DOM.saveFoodBtn.innerHTML = '<span>💾</span> Save Changes';
    DOM.cancelEditBtn.classList.remove('hidden');

    DOM.foodName.scrollIntoView({ behavior: 'smooth', block: 'center' });
    DOM.foodName.focus();
  }

  function resetFormToCreate() {
    editingEntryId = null;
    DOM.editEntryId.value = '';
    resetFormInputs();
    DOM.formHeaderTitle.textContent = 'Log Food or Drink';
    DOM.saveFoodBtn.innerHTML = '<span>➕</span> Log Food Item';
    DOM.cancelEditBtn.classList.add('hidden');
  }

  function resetFormInputs() {
    DOM.foodName.value = '';
    DOM.foodCalories.value = '';
    DOM.foodProtein.value = '';
    DOM.foodCarbs.value = '';
    DOM.foodFat.value = '';
  }

  function deleteEntry(entryId) {
    if (!appLogs[selectedDate]) return;
    const index = appLogs[selectedDate].findIndex(i => i.id === entryId);
    if (index !== -1) {
      const removed = appLogs[selectedDate].splice(index, 1)[0];
      saveLogs();
      renderDashboard();
      showToast(`Removed "${removed.name}"`, 'info');
      if (editingEntryId === entryId) {
        resetFormToCreate();
      }
    }
  }

  function clearSelectedDay() {
    const entries = appLogs[selectedDate] || [];
    if (entries.length === 0) {
      showToast('No entries to clear for this day', 'info');
      return;
    }

    if (window.confirm(`Clear all ${entries.length} items logged for ${formatDateHuman(selectedDate)}?`)) {
      appLogs[selectedDate] = [];
      saveLogs();
      resetFormToCreate();
      renderDashboard();
      showToast('Cleared all meals for today', 'info');
    }
  }

  // --- Goals & TDEE Modal Logic ---
  function openGoalsModal() {
    DOM.goalCaloriesInput.value = appSettings.dailyGoal;
    DOM.goalProteinInput.value = appSettings.proteinGoal;
    DOM.goalCarbsInput.value = appSettings.carbsGoal;
    DOM.goalFatInput.value = appSettings.fatGoal;
    updateMacroCalorieSumNote();

    calculateTdeePreview();
    DOM.goalsModal.classList.remove('hidden');
  }

  function closeGoalsModal() {
    DOM.goalsModal.classList.add('hidden');
  }

  function updateMacroCalorieSumNote() {
    const p = Number(DOM.goalProteinInput.value) || 0;
    const c = Number(DOM.goalCarbsInput.value) || 0;
    const f = Number(DOM.goalFatInput.value) || 0;
    const target = Number(DOM.goalCaloriesInput.value) || 0;

    const macroKcal = (p * 4) + (c * 4) + (f * 9);
    const diff = macroKcal - target;

    let noteText = `Macro sum: ${macroKcal.toLocaleString()} kcal`;
    if (target > 0) {
      if (Math.abs(diff) < 15) {
        noteText += ' (Balanced with target ✔️)';
        DOM.macroCalorieSumNote.style.color = '#34d399';
      } else if (diff > 0) {
        noteText += ` (+${diff} kcal over target)`;
        DOM.macroCalorieSumNote.style.color = '#fbbf24';
      } else {
        noteText += ` (${Math.abs(diff)} kcal unallocated)`;
        DOM.macroCalorieSumNote.style.color = '#94a3b8';
      }
    }
    DOM.macroCalorieSumNote.textContent = noteText;
  }

  function autoBalanceMacros() {
    const targetKcal = Number(DOM.goalCaloriesInput.value) || 2000;
    // Standard recommended athletic split: 30% Protein, 45% Carbs, 25% Fat
    const proteinGrams = Math.round((targetKcal * 0.30) / 4);
    const carbGrams = Math.round((targetKcal * 0.45) / 4);
    const fatGrams = Math.round((targetKcal * 0.25) / 9);

    DOM.goalProteinInput.value = proteinGrams;
    DOM.goalCarbsInput.value = carbGrams;
    DOM.goalFatInput.value = fatGrams;
    updateMacroCalorieSumNote();
    showToast('Balanced macros to 30% P / 45% C / 25% F', 'info');
  }

  function handleSaveGoalsForm(e) {
    e.preventDefault();
    const dailyGoal = Math.round(Number(DOM.goalCaloriesInput.value));
    const proteinGoal = Math.round(Number(DOM.goalProteinInput.value));
    const carbsGoal = Math.round(Number(DOM.goalCarbsInput.value));
    const fatGoal = Math.round(Number(DOM.goalFatInput.value));

    if (dailyGoal < 500) {
      showToast('Daily calorie target should be at least 500 kcal', 'danger');
      return;
    }

    appSettings = {
      dailyGoal,
      proteinGoal,
      carbsGoal,
      fatGoal
    };

    saveSettings();
    renderDashboard();
    closeGoalsModal();
    showToast('Goals updated successfully!', 'success');
  }

  // --- TDEE Calculator Engine ---
  function calculateTdeePreview() {
    const gender = DOM.calcGender.value;
    const age = Number(DOM.calcAge.value) || 25;
    const weight = Number(DOM.calcWeight.value) || 70;
    const height = Number(DOM.calcHeight.value) || 175;
    const activity = parseFloat(DOM.calcActivity.value) || 1.375;
    const goalAdjust = Number(DOM.calcGoal.value) || 0;

    // Mifflin - St Jeor formula
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const tdee = Math.round(bmr * activity);
    let target = Math.round(tdee + goalAdjust);
    if (target < 1200) target = 1200; // Safe minimum safeguard

    DOM.bmrOutput.textContent = `${Math.round(bmr).toLocaleString()} kcal`;
    DOM.maintenanceOutput.textContent = `${tdee.toLocaleString()} kcal`;
    DOM.targetOutput.textContent = `${target.toLocaleString()} kcal / day`;

    return target;
  }

  function applyTdeeResults() {
    const recommendedTarget = calculateTdeePreview();
    DOM.goalCaloriesInput.value = recommendedTarget;
    autoBalanceMacros();

    // Switch to manual tab and inform user
    switchTab('manual');
    showToast(`Applied ${recommendedTarget} kcal target! Review and click Save.`, 'success');
  }

  function switchTab(tab) {
    if (tab === 'manual') {
      DOM.tabManualGoalsBtn.classList.add('active');
      DOM.tabTdeeCalcBtn.classList.remove('active');
      DOM.tabManualContent.classList.add('active');
      DOM.tabTdeeContent.classList.remove('active');
    } else {
      DOM.tabManualGoalsBtn.classList.remove('active');
      DOM.tabTdeeCalcBtn.classList.add('active');
      DOM.tabManualContent.classList.remove('active');
      DOM.tabTdeeContent.classList.add('active');
      calculateTdeePreview();
    }
  }

  // --- 7-Day History & Analytics Modal ---
  function openHistoryModal() {
    renderHistoryAnalytics();
    DOM.historyModal.classList.remove('hidden');
  }

  function closeHistoryModal() {
    DOM.historyModal.classList.add('hidden');
  }

  function renderHistoryAnalytics() {
    // Collect past 7 days up to selected date
    const daysData = [];
    const baseParts = selectedDate.split('-');
    const baseDate = new Date(Number(baseParts[0]), Number(baseParts[1]) - 1, Number(baseParts[2]));

    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      const entries = appLogs[dateStr] || [];
      let totalCal = 0;
      let totalP = 0;
      let totalC = 0;
      let totalF = 0;

      entries.forEach(e => {
        totalCal += Number(e.calories) || 0;
        totalP += Number(e.protein) || 0;
        totalC += Number(e.carbs) || 0;
        totalF += Number(e.fat) || 0;
      });

      daysData.push({
        dateStr,
        dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
        dateFormatted: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        totalCal,
        totalP: Math.round(totalP),
        totalC: Math.round(totalC),
        totalF: Math.round(totalF),
        isCurrent: dateStr === selectedDate
      });
    }

    // Calculate Summary Stats
    const totalWeekKcal = daysData.reduce((sum, d) => sum + d.totalCal, 0);
    const avgWeekKcal = Math.round(totalWeekKcal / 7);
    const targetKcal = appSettings.dailyGoal;

    // Adherence: within ±15% of daily target
    let adheredDays = 0;
    daysData.forEach(d => {
      if (d.totalCal > 0 && Math.abs(d.totalCal - targetKcal) <= targetKcal * 0.15) {
        adheredDays++;
      }
    });
    const adherenceRate = Math.round((adheredDays / 7) * 100);

    DOM.sevenDayAvgKcal.textContent = `${avgWeekKcal.toLocaleString()} kcal`;
    DOM.sevenDayTotalKcal.textContent = `${totalWeekKcal.toLocaleString()} kcal`;
    DOM.sevenDayAdherence.textContent = `${adherenceRate}%`;

    // Render Custom Bar Chart
    DOM.weeklyBarChart.innerHTML = '';
    const maxVal = Math.max(targetKcal * 1.25, ...daysData.map(d => d.totalCal), 2500);

    // Goal guide dashed line
    const goalLineBottomPct = (targetKcal / maxVal) * 100;
    const goalLine = document.createElement('div');
    goalLine.className = 'goal-guide-line';
    goalLine.style.bottom = `${goalLineBottomPct}%`;
    goalLine.title = `Target: ${targetKcal} kcal`;
    DOM.weeklyBarChart.appendChild(goalLine);

    daysData.forEach(d => {
      const col = document.createElement('div');
      col.className = 'chart-col';

      const barWrap = document.createElement('div');
      barWrap.className = 'chart-bar-wrap';

      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      if (d.totalCal > targetKcal) {
        bar.classList.add('over');
      }

      const barHeightPct = Math.min((d.totalCal / maxVal) * 100, 100);
      bar.style.height = `${Math.max(barHeightPct, 2)}%`;

      if (d.totalCal > 0) {
        const valLabel = document.createElement('span');
        valLabel.className = 'chart-bar-val';
        valLabel.textContent = d.totalCal;
        barWrap.appendChild(valLabel);
      }

      barWrap.appendChild(bar);

      const dayLabel = document.createElement('span');
      dayLabel.className = 'chart-day-label';
      dayLabel.textContent = d.dayName;
      if (d.isCurrent) {
        dayLabel.style.color = '#38bdf8';
        dayLabel.style.fontWeight = '800';
      }

      col.appendChild(barWrap);
      col.appendChild(dayLabel);

      col.addEventListener('click', () => {
        selectedDate = d.dateStr;
        updateDateDisplay();
        renderDashboard();
        closeHistoryModal();
        showToast(`Jumped to ${d.dateFormatted}`, 'info');
      });

      DOM.weeklyBarChart.appendChild(col);
    });

    // Render Table
    DOM.historyTableBody.innerHTML = '';
    daysData.slice().reverse().forEach(d => {
      const tr = document.createElement('tr');
      const diff = d.totalCal - targetKcal;
      const diffFormatted = diff > 0 ? `+${diff}` : `${diff}`;
      const diffClass = diff > 0 ? 'diff-positive' : 'diff-negative';

      tr.innerHTML = `
        <td><strong>${d.dateFormatted}</strong> (${d.dayName})</td>
        <td><strong>${d.totalCal.toLocaleString()}</strong> kcal</td>
        <td>${targetKcal.toLocaleString()} kcal</td>
        <td class="${diffClass}">${d.totalCal === 0 ? '--' : diffFormatted + ' kcal'}</td>
        <td>${d.totalP}g / ${d.totalC}g / ${d.totalF}g</td>
        <td><button type="button" class="btn btn-sm btn-ghost view-day-btn">View</button></td>
      `;

      tr.querySelector('.view-day-btn').addEventListener('click', () => {
        selectedDate = d.dateStr;
        updateDateDisplay();
        renderDashboard();
        closeHistoryModal();
        showToast(`Jumped to ${d.dateFormatted}`, 'info');
      });

      DOM.historyTableBody.appendChild(tr);
    });
  }

  // --- Data Portability: Export, Import, Reset ---
  function exportData() {
    const payload = {
      version: 1,
      theme: currentTheme,
      exportedAt: new Date().toISOString(),
      settings: appSettings,
      logs: appLogs
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nutritrack_backup_${getTodayDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Backup successfully downloaded!', 'success');
  }

  function handleImportFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (!imported || typeof imported !== 'object') {
          throw new Error('Invalid JSON format');
        }

        if (imported.theme && (imported.theme === 'dark' || imported.theme === 'light')) {
          applyTheme(imported.theme, true);
        }

        if (imported.settings && typeof imported.settings.dailyGoal === 'number') {
          appSettings = Object.assign({}, DEFAULT_SETTINGS, imported.settings);
          saveSettings();
        }

        if (imported.logs && typeof imported.logs === 'object') {
          appLogs = imported.logs;
          saveLogs();
        }

        renderDashboard();
        showToast('Backup data successfully restored!', 'success');
      } catch (err) {
        console.error('Import error', err);
        showToast('Invalid backup file. Import failed.', 'danger');
      }
      DOM.importFileInput.value = '';
    };

    reader.readAsText(file);
  }

  function resetAllData() {
    const confirmText = prompt('WARNING: This will permanently delete all logged meals and reset your targets.\n\nTo confirm, type RESET below:');
    if (confirmText && confirmText.trim().toUpperCase() === 'RESET') {
      localStorage.removeItem(STORAGE_KEYS.LOGS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.INITIALIZED);

      appSettings = Object.assign({}, DEFAULT_SETTINGS);
      appLogs = {};
      selectedDate = getTodayDateString();

      checkFirstTimeSeed();
      updateDateDisplay();
      renderDashboard();
      resetFormToCreate();
      showToast('All data has been reset to defaults', 'info');
    }
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Theme Toggle (Dark/Black Mode <-> Light Mode)
    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Date Nav
    DOM.prevDayBtn.addEventListener('click', () => shiftDate(-1));
    DOM.nextDayBtn.addEventListener('click', () => shiftDate(1));
    DOM.todayBtn.addEventListener('click', () => {
      selectedDate = getTodayDateString();
      updateDateDisplay();
      renderDashboard();
    });

    DOM.datePicker.addEventListener('change', (e) => {
      if (e.target.value) {
        selectedDate = e.target.value;
        updateDateDisplay();
        renderDashboard();
      }
    });

    // Food Entry Form
    DOM.foodEntryForm.addEventListener('submit', handleFoodFormSubmit);
    DOM.cancelEditBtn.addEventListener('click', resetFormToCreate);
    DOM.clearDayBtn.addEventListener('click', clearSelectedDay);

    // Modals open/close
    DOM.openGoalsModalBtn.addEventListener('click', openGoalsModal);
    DOM.closeGoalsModalBtn.addEventListener('click', closeGoalsModal);
    DOM.cancelGoalsModalBtn.addEventListener('click', closeGoalsModal);

    DOM.openHistoryModalBtn.addEventListener('click', openHistoryModal);
    DOM.closeHistoryModalBtn.addEventListener('click', closeHistoryModal);

    // Modal background click to close
    DOM.goalsModal.addEventListener('click', (e) => {
      if (e.target === DOM.goalsModal) closeGoalsModal();
    });
    DOM.historyModal.addEventListener('click', (e) => {
      if (e.target === DOM.historyModal) closeHistoryModal();
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeGoalsModal();
        closeHistoryModal();
      }
    });

    // Tabs inside Goals modal
    DOM.tabManualGoalsBtn.addEventListener('click', () => switchTab('manual'));
    DOM.tabTdeeCalcBtn.addEventListener('click', () => switchTab('tdee'));

    // Manual Goals Form & inputs
    DOM.goalsForm.addEventListener('submit', handleSaveGoalsForm);
    [DOM.goalCaloriesInput, DOM.goalProteinInput, DOM.goalCarbsInput, DOM.goalFatInput].forEach(inp => {
      inp.addEventListener('input', updateMacroCalorieSumNote);
    });
    DOM.autoBalanceMacrosBtn.addEventListener('click', autoBalanceMacros);

    // TDEE calculator change events
    [DOM.calcGender, DOM.calcAge, DOM.calcWeight, DOM.calcHeight, DOM.calcActivity, DOM.calcGoal].forEach(inp => {
      inp.addEventListener('input', calculateTdeePreview);
      inp.addEventListener('change', calculateTdeePreview);
    });
    DOM.applyTdeeBtn.addEventListener('click', applyTdeeResults);

    // Backup & Data
    DOM.exportDataBtn.addEventListener('click', exportData);
    DOM.importDataBtn.addEventListener('click', () => DOM.importFileInput.click());
    DOM.importFileInput.addEventListener('change', handleImportFile);
    DOM.resetAllDataBtn.addEventListener('click', resetAllData);
  }

  // --- Toast Notification Helper ---
  let toastTimeout = null;
  function showToast(message, type = 'info') {
    if (!DOM.toastNotification) return;

    DOM.toastNotification.textContent = message;
    DOM.toastNotification.className = `toast-notification toast-${type}`;
    DOM.toastNotification.classList.remove('hidden');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      DOM.toastNotification.classList.add('hidden');
    }, 3200);
  }

  // --- Helper Utilities ---
  function generateId() {
    return 'item_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Start the application when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

