import { createCheckbox, createDropdown, POSITIONS, BRACKETS } from "./helpers.js";

let hud = []; // Поточний HUD
let config = {}; // Глобальна конфігурація
let currentCategories = [];
let previewCategories = [];
let previewState = "idle"; // idle | loading | ready | error
let previewError = null;
let previewRequestId = 0;

const debounce = (fn, wait = 250) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
    };
};

const escapeAttributeValue = value => (value || "").replace(/'/g, "\\'");

const buildFieldName = (categoryName, field, isArray = false) => {
    const suffix = isArray ? "[]" : "";
    return "hud[" + categoryName + "][" + field + "]" + suffix;
};

const buildSelector = (element, categoryName, field, isArray = false) => {
    const name = escapeAttributeValue(buildFieldName(categoryName, field, isArray));
    return element + "[name='" + name + "']";
};

const DEFAULT_STAGE = { width: 1920, height: 1080 };

const percentOf = (value, total) => {
    if (!total) return 0;
    return (value / total) * 100;
};

const getStageMetrics = categories => {
    if (!categories || !categories.length) {
        return { ...DEFAULT_STAGE };
    }

    let maxX = 0;
    let maxY = 0;
    categories.forEach(category => {
        const width = Number(category.width) || 0;
        const height = Number(category.height) || 0;
        const x = Number(category.x_position) || 0;
        const y = Number(category.y_position) || 0;
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
    });

    return {
        width: maxX || DEFAULT_STAGE.width,
        height: maxY || DEFAULT_STAGE.height,
    };
};

const getPreviewMap = () => {
    const categoriesList = Array.isArray(previewCategories)
        ? previewCategories
        : Object.values(previewCategories || {});
    return new Map(categoriesList.map(category => [category.category_name, category]));
};

const collectHudFormConfig = () => {
    const result = {};
    (currentCategories || []).forEach(category => {
        const entry = {};
        const dontChangeInput = document.querySelector(buildSelector("input", category.category_name, "dont_change"));
        if (dontChangeInput) {
            entry.dont_change = dontChangeInput.checked;
        }

        const heroesLeftInput = document.querySelector(buildSelector("input", category.category_name, "heroes_left"));
        if (heroesLeftInput) {
            entry.heroes_left = heroesLeftInput.checked;
        }

        if (!entry.heroes_left) {
            const positionSelect = document.querySelector(buildSelector("select", category.category_name, "position"));
            if (positionSelect && positionSelect.value) {
                entry.position = positionSelect.value;
            }
        }

        const bracketSelector = buildSelector("input", category.category_name, "bracket_ids", true);
        const bracketInputs = document.querySelectorAll(bracketSelector);
        entry.bracket_ids = Array.from(bracketInputs)
            .filter(input => input.checked)
            .map(input => input.value);

        const countInput = document.querySelector(buildSelector("input", category.category_name, "count"));
        if (countInput && countInput.value !== "") {
            entry.count = Number(countInput.value);
        }

        result[category.category_name] = entry;
    });

    return result;
};

const mergeHudConfigs = (stored = {}, overrides = {}) => {
    const merged = {};
    const names = new Set([
        ...(currentCategories || []).map(category => category.category_name),
        ...Object.keys(stored || {}),
    ]);

    names.forEach(name => {
        const base = stored[name] ? { ...stored[name] } : {};
        const override = overrides[name] || {};
        const combined = { ...base, ...override };

        if ("bracket_ids" in override) {
            combined.bracket_ids = override.bracket_ids || [];
        }
        if ("dont_change" in override) {
            combined.dont_change = !!override.dont_change;
        }
        if ("heroes_left" in override) {
            combined.heroes_left = !!override.heroes_left;
        }
        if ("position" in override && !combined.heroes_left) {
            combined.position = override.position;
        }
        if ("count" in override) {
            combined.count = override.count;
        }
        if (combined.heroes_left) {
            delete combined.position;
        }

        merged[name] = combined;
    });

    return merged;
};

const renderHudLayout = () => {
    const stage = document.getElementById("hud-stage");
    if (!stage) return;

    stage.innerHTML = "";

    if (!currentCategories.length) {
        const placeholder = document.createElement("div");
        placeholder.className = "hud-stage-message";
        placeholder.textContent = "Select a HUD to preview layout";
        stage.appendChild(placeholder);
        return;
    }

    const metrics = getStageMetrics(currentCategories);
    stage.style.aspectRatio = `${metrics.width} / ${metrics.height}`;
    currentCategories.forEach(category => {
        const x = Number(category.x_position) || 0;
        const y = Number(category.y_position) || 0;
        const width = Number(category.width) || 0;
        const height = Number(category.height) || 0;

        const block = document.createElement("div");
        block.className = "hud-block";
        block.style.left = `${percentOf(x, metrics.width)}%`;
        block.style.top = `${percentOf(y, metrics.height)}%`;
        block.style.width = `${percentOf(width, metrics.width)}%`;
        block.style.height = `${percentOf(height, metrics.height)}%`;

        const header = document.createElement("div");
        header.className = "hud-block__header";

        const title = document.createElement("span");
        title.textContent = category.category_name;
        header.appendChild(title);

        const coords = document.createElement("span");
        coords.className = "hud-block__coords";
        coords.textContent = `${Math.round(x)}, ${Math.round(y)}`;
        header.appendChild(coords);

        block.appendChild(header);

        const heroTiles = document.createElement("div");
        heroTiles.className = "hero-tiles empty";
        heroTiles.dataset.category = category.category_name;

        block.appendChild(heroTiles);
        stage.appendChild(block);
    });
};

const renderHeroPreview = () => {
    const tileContainers = document.querySelectorAll(".hero-tiles");
    const previewMap = getPreviewMap();

    tileContainers.forEach(container => {
        const categoryName = container.dataset.category;
        container.innerHTML = "";
        container.classList.remove("empty");

        if (previewState === "idle") {
            container.textContent = "Preview appears after HUD is selected";
            container.classList.add("empty");
            return;
        }

        if (previewState === "loading") {
            container.textContent = "Loading preview...";
            container.classList.add("empty");
            return;
        }

        if (previewState === "error") {
            container.textContent = previewError || "Failed to load hero list";
            container.classList.add("empty");
            return;
        }

        const previewCategory = previewMap.get(categoryName);
        const heroList = previewCategory?.hero_ids || [];

        if (!heroList.length) {
            container.textContent = "No heroes found for this category";
            container.classList.add("empty");
            return;
        }

        heroList.forEach(heroId => {
            const tile = document.createElement("span");
            tile.className = "hero-tile";
            tile.textContent = heroId;
            container.appendChild(tile);
        });
    });
};

const refreshPreview = async () => {
    if (!hud?.configs?.length) {
        previewCategories = [];
        previewState = "idle";
        renderHeroPreview();
        return;
    }

    const userId = document.getElementById("userid").value;
    const hudIndex = document.getElementById("hudname").value;
    const selectedHud = hud.configs[hudIndex];

    if (!userId || !selectedHud) {
        previewCategories = [];
        previewState = "idle";
        renderHeroPreview();
        return;
    }

    const formConfig = collectHudFormConfig();
    const storedConfig = (config[userId] && config[userId][selectedHud.config_name]) || {};
    const mergedConfig = mergeHudConfigs(storedConfig, formConfig);
    const apiKeyField = document.getElementById("api-key");
    const apiKeyValue = (apiKeyField.value || "").trim() || config.apiKey;

    previewState = "loading";
    previewError = null;
    previewRequestId += 1;
    const requestId = previewRequestId;
    renderHeroPreview();

    try {
        const response = await window.versions.previewHud({
            userid: userId,
            hudName: selectedHud.config_name,
            hudConfig: mergedConfig,
            apiKey: apiKeyValue,
        });

        if (requestId !== previewRequestId) return;

        previewCategories = response?.categories || [];
        previewState = "ready";
        previewError = null;
    } catch (error) {
        if (requestId !== previewRequestId) return;
        previewCategories = [];
        previewState = "error";
        previewError = error?.message || "Unable to load preview";
        console.error("Failed to preview HUD:", error);
    }

    renderHeroPreview();
};

const schedulePreviewUpdate = debounce(() => {
    refreshPreview();
}, 400);

const applyAppVersion = async () => {
    try {
        const version = await window.versions.getAppVersion();
        const versionLabel = document.getElementById("app-version");
        if (versionLabel && version) {
            versionLabel.textContent = `v${version}`;
        }
    } catch (error) {
        console.error("Failed to fetch app version:", error);
    }
};

// Завантаження конфігурації
const loadConfig = async () => {
    try {
        config = await window.versions.getConfig();
        if (config.apiKey) {
            document.getElementById("api-key").value = config.apiKey;
        }
    } catch (error) {
        console.error("Помилка при завантаженні конфігурації:", error);
    }
};

// Завантаження списку користувачів
const loadUserList = async () => {
    try {
        const response = await window.versions.userlist();
        const select = document.getElementById("userid");
        select.innerHTML = ""; // Очищення попереднього списку
        response.forEach(userId => {
            const option = document.createElement("option");
            option.value = userId;
            option.textContent = userId;
            select.appendChild(option);
        });
        loadHudList();
    } catch (error) {
        console.error("Помилка при завантаженні списку користувачів:", error);
    }
};

// Завантаження списку HUD
const loadHudList = async () => {
    try {
        const userId = document.getElementById("userid").value;
        hud = await window.versions.getHud(userId);
        const select = document.getElementById("hudname");
        select.innerHTML = ""; // Очищення попереднього списку
        hud.configs.forEach((config, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = config.config_name;
            select.appendChild(option);
        });
        loadHud();
    } catch (error) {
        console.error("Помилка при завантаженні HUD:", error);
    }
};

// Завантаження конкретного HUD
const loadHud = () => {
    const hudDiv = document.getElementById("hud");
    const userId = document.getElementById("userid").value;
    const hudName = document.getElementById("hudname").value;
    const selectedConfig = hud.configs[hudName]?.categories || [];
    const userConfig = (config[userId]?.[hud.configs[hudName]?.config_name]) || {};

    currentCategories = selectedConfig;
    hudDiv.innerHTML = ""; // Очищення попереднього HUD

    selectedConfig.forEach(category => {
        const elementValues = userConfig[category.category_name] || {};
        hudDiv.appendChild(createHudElement(category, elementValues));
    });

    renderHudLayout();
    renderHeroPreview();
    refreshPreview();
};

// Створення елемента HUD
const createHudElement = (category, elementValues) => {
    const container = document.createElement("div");
    container.className = "hud_element";

    const categoryLabel = document.createElement("span");
    categoryLabel.textContent = category.category_name;
    container.appendChild(categoryLabel);

    // Checkbox: Dont Change
    container.appendChild(createCheckbox(
        `hud[${category.category_name}][dont_change]`,
        "Dont change",
        elementValues.dont_change
    ));

    // Checkbox: Heroes Left
    container.appendChild(createCheckbox(
        `hud[${category.category_name}][heroes_left]`,
        "remaining",
        elementValues.heroes_left
    ));

    // Dropdown: Position (не потрібен, якщо вибрано heroes_left)
    if (!elementValues.heroes_left) {
        container.appendChild(createDropdown(
            `hud[${category.category_name}][position]`,
            POSITIONS,
            elementValues.position
        ));
    }

    // Ratings
    const ratingsDiv = document.createElement("div");
    ratingsDiv.className = "ratings";
    BRACKETS.forEach(bracket => {
        ratingsDiv.appendChild(createCheckbox(
            `hud[${category.category_name}][bracket_ids][]`,
            bracket,
            elementValues.bracket_ids?.includes(bracket),
            bracket
        ));
    });
    container.appendChild(ratingsDiv);

    // Input: Count
    const countInput = document.createElement("input");
    countInput.type = "number";
    countInput.name = `hud[${category.category_name}][count]`;
    countInput.value = elementValues.count || "";
    container.appendChild(countInput);

    return container;
};

// Обробка подій
document.getElementById("hudname").addEventListener("change", loadHud);
document.getElementById("userid").addEventListener("change", loadHudList);

document.getElementById("save").addEventListener("click", async e => {
    e.preventDefault();
    const userId = document.getElementById("userid").value;
    const hudName = hud.configs[document.getElementById("hudname").value]?.config_name;

    // Збираємо всі дані з форми
    const formData = jQuery("#form").serializeJSON();
    config.apiKey = formData.apiKey; // Додаємо API Key до конфігурації
    config[userId] = config[userId] || {};
    config[userId][hudName] = formData.hud;

    // Зберігаємо конфігурацію
    try {
        await window.versions.setConfig(config);
        alert("Конфігурація успішно збережена!");
    } catch (error) {
        console.error("Помилка при збереженні конфігурації:", error);
        alert("Не вдалося зберегти конфігурацію.");
    }
});

document.getElementById("generate").addEventListener("click", e => {
    e.preventDefault();
    window.versions.generate();
});

const hudControlsContainer = document.getElementById("hud");
if (hudControlsContainer) {
    hudControlsContainer.addEventListener("input", () => schedulePreviewUpdate());
    hudControlsContainer.addEventListener("change", () => schedulePreviewUpdate());
}

const apiKeyInput = document.getElementById("api-key");
if (apiKeyInput) {
    apiKeyInput.addEventListener("input", () => schedulePreviewUpdate());
    apiKeyInput.addEventListener("change", () => schedulePreviewUpdate());
}

// Ініціалізація
loadConfig();
loadUserList();
applyAppVersion();
