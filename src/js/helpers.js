// helpers.js

export const POSITIONS = ["POSITION_1", "POSITION_2", "POSITION_3", "POSITION_4", "POSITION_5"];
export const BRACKETS = ["HERALD", "GUARDIAN", "CRUSADER", "ARCHON", "LEGEND", "ANCIENT", "DIVINE", "IMMORTAL"];

// Створення чекбоксу
export const createCheckbox = (name, labelText, checked, value = "1") => {
    // Створюємо контейнер для чекбокса та лейбла
    const wrapper = document.createElement("div");
    wrapper.className = "checkbox-wrapper";

    // Створюємо сам чекбокс
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = name;
    checkbox.id = name+value; // Унікальний ID для прив'язки label
    checkbox.value = value;
    checkbox.checked = !!checked;

    // Створюємо лейбл
    const label = document.createElement("label");
    label.htmlFor = name+value; // Прив'язуємо до чекбокса через атрибут htmlFor
    label.textContent = labelText;

    // Додаємо чекбокс і лейбл у контейнер
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);

    return wrapper;
};


// Створення випадаючого списку
export const createDropdown = (name, options, selectedValue) => {
    const wrapper = document.createElement("div");
    wrapper.className = "select";
    const select = document.createElement("select");
    select.name = name;
    options.forEach(optionValue => {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionValue;
        option.selected = optionValue === selectedValue;
        select.appendChild(option);
    });
    wrapper.appendChild(select);
    return wrapper;
}