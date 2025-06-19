import { createCheckbox, createDropdown, POSITIONS, BRACKETS } from "./helpers.js";

let hud = []; // Поточний HUD
let config = {}; // Глобальна конфігурація

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

    hudDiv.innerHTML = ""; // Очищення попереднього HUD

    selectedConfig.forEach(category => {
        const elementValues = userConfig[category.category_name] || {};
        hudDiv.appendChild(createHudElement(category, elementValues));
    });
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

// Ініціалізація
loadConfig();
loadUserList();
