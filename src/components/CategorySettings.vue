<template>
  <div id="hud">
    <div
      v-if="!categories.length"
      class="hud-empty-message"
    >
      Select a HUD to configure controls
    </div>
    <div
      v-for="(category, index) in categories"
      :key="category.category_name ? category.category_name : 'category-' + index"
      class="hud_element"
    >
      <span>{{ category.category_name }}</span>
      <div class="checkbox-wrapper">
        <input
          type="checkbox"
          :id="`dont_change_${category.category_name}`"
          v-model="formValues[category.category_name].dont_change"
        >
        <label :for="`dont_change_${category.category_name}`">Dont change</label>
      </div>
      <div class="checkbox-wrapper">
        <input
          type="checkbox"
          :id="`heroes_left_${category.category_name}`"
          v-model="formValues[category.category_name].heroes_left"
        >
        <label :for="`heroes_left_${category.category_name}`">remaining</label>
      </div>
      <div
        class="select"
        v-if="!formValues[category.category_name].heroes_left"
      >
        <select
          :name="`hud[${category.category_name}][position]`"
          v-model="formValues[category.category_name].position"
        >
          <option value="">Select position</option>
          <option
            v-for="position in positions"
            :key="position"
            :value="position"
          >
            {{ position }}
          </option>
        </select>
      </div>
      <div class="ratings">
        <div
          class="checkbox-wrapper"
          v-for="bracket in brackets"
          :key="`${category.category_name}-${bracket}`"
        >
          <input
            type="checkbox"
            :id="`bracket_${category.category_name}_${bracket}`"
            :value="bracket"
            v-model="formValues[category.category_name].bracket_ids"
          >
          <label :for="`bracket_${category.category_name}_${bracket}`">{{ bracket }}</label>
        </div>
      </div>
      <input
        type="number"
        :name="`hud[${category.category_name}][count]`"
        v-model.number="formValues[category.category_name].count"
        placeholder="Count"
      >
    </div>
  </div>
</template>

<script setup>
defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  formValues: {
    type: Object,
    required: true,
  },
});

const positions = [
  "POSITION_1",
  "POSITION_2",
  "POSITION_3",
  "POSITION_4",
  "POSITION_5",
];

const brackets = [
  "HERALD",
  "GUARDIAN",
  "CRUSADER",
  "ARCHON",
  "LEGEND",
  "ANCIENT",
  "DIVINE",
  "IMMORTAL",
];
</script>

<style>
#hud {
  flex: 1;
  overflow-y: auto;
  margin-top: 10px;
}

.hud-empty-message {
  padding: 20px;
  text-align: center;
  color: #777;
  font-style: italic;
}

.hud_element {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
  background: #f7f7f7;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}

.hud_element span {
  font-weight: bold;
  color: #444;
  margin-right: 10px;
  flex: 1 1 100%;
}

.hud_element input[type="checkbox"] {
  display: none;
}

.hud_element label {
  display: inline-block;
  padding: 10px;
  margin: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

.hud_element input[type="checkbox"]:checked + label {
  background-color: #007bff;
  border-color: #0056b3;
  color: white;
}

.hud_element label:hover {
  background-color: #e6e6e6;
  border-color: #ccc;
}

.hud_element .ratings {
  flex: 1 1 100%;
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hud_element .ratings label {
  flex: 1 1 calc(25% - 8px);
}
</style>
