<template>
  <div class="app-shell" v-cloak>
    <aside class="side-panel">
      <header class="app-header">
        <h1>Dota 2 Hud Generator</h1>
        <span id="app-version" class="app-version">{{ appVersion }}</span>
      </header>
      <form id="form" class="settings-form" @submit.prevent="handleSave">
        <div>
          <label for="api-key">Stratz API Key:</label>
          <input
            type="text"
            id="api-key"
            name="apiKey"
            placeholder="Enter your Stratz API Key"
            v-model="apiKey"
          >
        </div>
        <div>
          <label for="userid">User ID:</label>
          <select
            name="userid"
            id="userid"
            v-model="selectedUserId"
            :disabled="isLoadingUsers || !userIds.length"
          >
            <option
              v-if="isLoadingUsers || !userIds.length"
              value=""
              disabled
            >
              {{ isLoadingUsers ? "Loading users..." : "No users found" }}
            </option>
            <option
              v-for="userId in userIds"
              :key="userId"
              :value="userId"
            >{{ userId }}</option>
          </select>
        </div>
        <div>
          <label for="hudname">HUD Name:</label>
          <select
            name="hudname"
            id="hudname"
            v-model.number="selectedHudIndex"
            :disabled="isLoadingHuds || !hudOptions.length"
          >
            <option
              v-if="isLoadingHuds"
              value="-1"
              disabled
            >
              Loading HUDs...
            </option>
            <option
              v-else-if="!hudOptions.length"
              value="-1"
              disabled
            >
              Select a user first
            </option>
            <option
              v-for="(option, index) in hudOptions"
              :key="option.config_name + index"
              :value="index"
            >
              {{ option.config_name }}
            </option>
          </select>
        </div>
        <div id="hud">
          <div
            v-if="!visibleCategories.length"
            class="hud-empty-message"
          >
            Select a HUD to configure controls
          </div>
          <div
            v-for="(category, index) in visibleCategories"
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
        <div class="form-actions">
          <button id="save" type="submit" :disabled="isSaving">
            {{ isSaving ? "Saving..." : "Save" }}
          </button>
          <button
            id="generate"
            type="button"
            @click="handleGenerate"
            :disabled="isGenerating"
          >
            {{ isGenerating ? "Generating..." : "Generate" }}
          </button>
        </div>
      </form>
    </aside>
    <main class="layout-stage-area">
      <div class="hud-layout-wrapper">
        <div class="hud-layout-header">
          <h2>HUD Layout</h2>
          <span class="hud-layout-hint">Scaled preview of category positions</span>
        </div>
        <div
          id="hud-stage"
          class="hud-stage"
          :style="{ aspectRatio: `${stageMetrics.width} / ${stageMetrics.height}` }"
        >
          <div
            v-if="!hudBlocks.length"
            class="hud-stage-message"
          >
            Select a HUD to preview layout
          </div>
          <template v-else>
            <div
              v-for="block in hudBlocks"
              :key="block.category_name"
              class="hud-block"
              :style="block.style"
            >
              <div class="hud-block__header">
                <span>{{ block.category_name }}</span>
                <span class="hud-block__coords">{{ block.coords }}</span>
              </div>
              <div
                class="hero-tiles"
                :class="{ empty: heroPreviewStates.get(block.category_name)?.empty }"
              >
                <template v-if="heroPreviewStates.get(block.category_name)?.message">
                  {{ heroPreviewStates.get(block.category_name)?.message }}
                </template>
                <template v-else>
                  <span
                    v-for="heroId in heroPreviewStates.get(block.category_name)?.heroes || []"
                    :key="`${block.category_name}-${heroId}`"
                    class="hero-tile"
                  >
                    {{ heroId }}
                  </span>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted } from "vue";
import { POSITIONS, BRACKETS } from "./js/helpers.js";

const DEFAULT_STAGE = { width: 1920, height: 1080 };
const positions = POSITIONS;
const brackets = BRACKETS;

const debounce = (fn, wait = 250) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
};

const percentOf = (value, total) => (!total ? 0 : (value / total) * 100);

const getStageMetrics = categories => {
  if (!categories?.length) {
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

const mergeHudConfigs = (stored = {}, overrides = {}, categories = []) => {
  const merged = {};
  const names = new Set([
    ...categories.map(category => category.category_name),
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

const createCategoryValues = storedValues => ({
  dont_change: !!storedValues?.dont_change,
  heroes_left: !!storedValues?.heroes_left,
  position: storedValues?.position || "",
  bracket_ids: Array.isArray(storedValues?.bracket_ids) ? [...storedValues.bracket_ids] : [],
  count: storedValues?.count ?? "",
});

const hudData = ref({ configs: [] });
const configStore = ref({});
const userIds = ref([]);
const selectedUserId = ref("");
const selectedHudIndex = ref(-1);
const apiKey = ref("");
const appVersion = ref("v0.0.0");
const formValues = reactive({});
const previewCategories = ref([]);
const previewState = ref("idle");
const previewError = ref(null);
const previewRequestId = ref(0);
const isSaving = ref(false);
const isGenerating = ref(false);
const isLoadingUsers = ref(false);
const isLoadingHuds = ref(false);

const hudOptions = computed(() => Array.isArray(hudData.value?.configs) ? hudData.value.configs : []);
const currentHud = computed(() => {
  if (selectedHudIndex.value < 0) return null;
  return hudOptions.value[selectedHudIndex.value] || null;
});
const currentCategories = computed(() => {
  const categories = currentHud.value?.categories;
  if (!Array.isArray(categories)) return [];
  return categories.filter(category => category && category.category_name);
});
const stageMetrics = computed(() => getStageMetrics(currentCategories.value));
const hudBlocks = computed(() => {
  const metrics = stageMetrics.value;
  return currentCategories.value.map(category => {
    const x = Number(category.x_position) || 0;
    const y = Number(category.y_position) || 0;
    const width = Number(category.width) || 0;
    const height = Number(category.height) || 0;
    return {
      category_name: category.category_name,
      coords: `${Math.round(x)}, ${Math.round(y)}`,
      style: {
        left: `${percentOf(x, metrics.width)}%`,
        top: `${percentOf(y, metrics.height)}%`,
        width: `${percentOf(width, metrics.width)}%`,
        height: `${percentOf(height, metrics.height)}%`,
      },
    };
  });
});
const userHudStoredConfig = computed(() => {
  const userId = selectedUserId.value;
  const hudName = currentHud.value?.config_name;
  if (!userId || !hudName) return {};
  return configStore.value?.[userId]?.[hudName] || {};
});
const hudFormConfig = computed(() => {
  const result = {};
  currentCategories.value.forEach(category => {
    const values = formValues[category.category_name];
    if (!values) return;
    const entry = {
      dont_change: !!values.dont_change,
      heroes_left: !!values.heroes_left,
      bracket_ids: Array.isArray(values.bracket_ids) ? [...values.bracket_ids] : [],
    };
    if (!values.heroes_left && values.position) {
      entry.position = values.position;
    }
    if (values.count !== "" && values.count !== null && values.count !== undefined) {
      entry.count = Number(values.count);
    }
    result[category.category_name] = entry;
  });
  return result;
});
const heroPreviewStates = computed(() => {
  const state = previewState.value;
  const error = previewError.value;
  const previewMap = new Map(previewCategories.value.map(category => [category.category_name, category]));
  const map = new Map();
  currentCategories.value.forEach(category => {
    let entry;
    if (state === "idle") {
      entry = { message: "Preview appears after HUD is selected", empty: true, heroes: [] };
    } else if (state === "loading") {
      entry = { message: "Loading preview...", empty: true, heroes: [] };
    } else if (state === "error") {
      entry = { message: error || "Failed to load hero list", empty: true, heroes: [] };
    } else {
      const previewCategory = previewMap.get(category.category_name);
      const heroList = previewCategory?.hero_ids || [];
      if (!heroList.length) {
        entry = { message: "No heroes found for this category", empty: true, heroes: [] };
      } else {
        entry = { message: null, empty: false, heroes: heroList };
      }
    }
    map.set(category.category_name, entry);
  });
  return map;
});

const visibleCategories = computed(() => {
  return currentCategories.value.filter(category => {
    if (!category?.category_name) return false;
    return !!formValues[category.category_name];
  });
});

const setPreviewIdle = () => {
  previewCategories.value = [];
  previewState.value = "idle";
  previewError.value = null;
};

const clearFormValues = () => {
  Object.keys(formValues).forEach(key => {
    delete formValues[key];
  });
};

const rebuildFormValues = (categories, storedConfig = {}) => {
  clearFormValues();
  categories.forEach(category => {
    if (!category?.category_name) return;
    const storedValues = storedConfig[category.category_name] || {};
    formValues[category.category_name] = createCategoryValues(storedValues);
  });
};

const loadConfigStore = async () => {
  try {
    const stored = await window.versions.getConfig();
    configStore.value = stored || {};
    if (stored?.apiKey) {
      apiKey.value = stored.apiKey;
    }
  } catch (error) {
    console.error("Failed to load config:", error);
  }
};

const loadUserList = async () => {
  isLoadingUsers.value = true;
  try {
    const response = await window.versions.userlist();
    userIds.value = Array.isArray(response) ? response : [];
    if (userIds.value.length) {
      if (!userIds.value.includes(selectedUserId.value)) {
        selectedUserId.value = userIds.value[0];
      }
    } else {
      selectedUserId.value = "";
    }
  } catch (error) {
    console.error("Failed to load users:", error);
    userIds.value = [];
    selectedUserId.value = "";
  } finally {
    isLoadingUsers.value = false;
  }
};

const loadHudList = async userId => {
  if (!userId) {
    hudData.value = { configs: [] };
    selectedHudIndex.value = -1;
    return;
  }
  isLoadingHuds.value = true;
  try {
    const response = await window.versions.getHud(userId);
    hudData.value = response || { configs: [] };
    selectedHudIndex.value = Array.isArray(response?.configs) && response.configs.length ? 0 : -1;
  } catch (error) {
    console.error("Failed to load HUD list:", error);
    hudData.value = { configs: [] };
    selectedHudIndex.value = -1;
  } finally {
    isLoadingHuds.value = false;
  }
};

const refreshPreview = async () => {
  if (!hudOptions.value.length) {
    setPreviewIdle();
    return;
  }
  const userId = selectedUserId.value;
  const hudEntry = currentHud.value;
  if (!userId || !hudEntry) {
    setPreviewIdle();
    return;
  }

  const storedConfig = configStore.value?.[userId]?.[hudEntry.config_name] || {};
  const mergedConfig = mergeHudConfigs(storedConfig, hudFormConfig.value, currentCategories.value);
  const apiKeyValue = (apiKey.value || configStore.value?.apiKey || "").trim();

  previewState.value = "loading";
  previewError.value = null;
  previewRequestId.value += 1;
  const requestId = previewRequestId.value;

  try {
    const response = await window.versions.previewHud({
      userid: userId,
      hudName: hudEntry.config_name,
      hudConfig: mergedConfig,
      apiKey: apiKeyValue,
    });
    if (requestId !== previewRequestId.value) return;
    previewCategories.value = response?.categories || [];
    previewState.value = "ready";
    previewError.value = null;
  } catch (error) {
    if (requestId !== previewRequestId.value) return;
    previewCategories.value = [];
    previewState.value = "error";
    previewError.value = error?.message || "Unable to load preview";
    console.error("Failed to preview HUD:", error);
  }
};

const schedulePreviewUpdate = debounce(() => {
  refreshPreview();
}, 400);

const handleSave = async () => {
  if (!selectedUserId.value || !currentHud.value) {
    alert("Please select a user and HUD first.");
    return;
  }
  isSaving.value = true;
  try {
    const hudName = currentHud.value.config_name;
    const nextConfig = JSON.parse(JSON.stringify(configStore.value || {}));
    const hudConfigSnapshot = JSON.parse(JSON.stringify(hudFormConfig.value || {}));
    nextConfig.apiKey = apiKey.value || "";
    nextConfig[selectedUserId.value] = nextConfig[selectedUserId.value] || {};
    nextConfig[selectedUserId.value][hudName] = hudConfigSnapshot;
    await window.versions.setConfig(nextConfig);
    configStore.value = nextConfig;
    alert("Configuration saved!");
  } catch (error) {
    console.error("Failed to save config:", error);
    alert("Failed to save configuration.");
  } finally {
    isSaving.value = false;
  }
};

const handleGenerate = async () => {
  isGenerating.value = true;
  try {
    await window.versions.generate();
  } catch (error) {
    console.error("Failed to generate HUD:", error);
  } finally {
    isGenerating.value = false;
  }
};

const applyAppVersion = async () => {
  try {
    const version = await window.versions.getAppVersion();
    if (version) {
      appVersion.value = `v${version}`;
    }
  } catch (error) {
    console.error("Failed to fetch app version:", error);
  }
};

watch(selectedUserId, userId => {
  if (!userId) {
    hudData.value = { configs: [] };
    selectedHudIndex.value = -1;
    clearFormValues();
    setPreviewIdle();
    return;
  }
  loadHudList(userId);
});

watch([currentCategories, userHudStoredConfig], ([categories, stored]) => {
  if (!categories.length) {
    clearFormValues();
    setPreviewIdle();
    return;
  }
  rebuildFormValues(categories, stored);
  schedulePreviewUpdate();
}, { immediate: true });

watch(formValues, () => schedulePreviewUpdate(), { deep: true });
watch(apiKey, () => schedulePreviewUpdate());
watch(selectedHudIndex, () => schedulePreviewUpdate());

onMounted(async () => {
  await Promise.all([loadConfigStore(), applyAppVersion()]);
  await loadUserList();
});
</script>
