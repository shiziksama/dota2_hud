<template>
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
</template>

<script setup>
import { computed } from "vue";

const DEFAULT_STAGE = { width: 1920, height: 1080 };

const percentOf = (value, total) => (!total ? 0 : (value / total) * 100);

const getStageMetrics = categories => {
  if (!categories?.length) {
    return { ...DEFAULT_STAGE };
  }

  let maxX = 0;
  let maxY = 0;
  categories.forEach(category => {
    const width = Number(category?.width) || 0;
    const height = Number(category?.height) || 0;
    const x = Number(category?.x_position) || 0;
    const y = Number(category?.y_position) || 0;
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  return {
    width: maxX || DEFAULT_STAGE.width,
    height: maxY || DEFAULT_STAGE.height,
  };
};

const props = defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  previewState: {
    type: String,
    default: "idle",
  },
  previewError: {
    type: String,
    default: null,
  },
  previewCategories: {
    type: Array,
    default: () => [],
  },
});

const stageMetrics = computed(() => getStageMetrics(props.categories));

const hudBlocks = computed(() => {
  const metrics = stageMetrics.value;
  return props.categories
    .filter(category => category?.category_name)
    .map(category => {
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

const heroPreviewStates = computed(() => {
  const previewMap = new Map(
    props.previewCategories
      .filter(category => category?.category_name)
      .map(category => [category.category_name, category]),
  );

  const map = new Map();
  props.categories
    .filter(category => category?.category_name)
    .forEach(category => {
      let entry;
      if (props.previewState === "idle") {
        entry = { message: "Preview appears after HUD is selected", empty: true, heroes: [] };
      } else if (props.previewState === "loading") {
        entry = { message: "Loading preview...", empty: true, heroes: [] };
      } else if (props.previewState === "error") {
        entry = { message: props.previewError || "Failed to load hero list", empty: true, heroes: [] };
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
</script>

<style>
.layout-stage-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #050608;
  box-sizing: border-box;
  height: 100vh;
  overflow: hidden;
}

.hud-layout-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #f2f2f2;
  min-height: 0;
}

.hud-layout-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.hud-layout-header h2 {
  margin: 0;
  font-size: 1.3em;
}

.hud-layout-hint {
  font-size: 0.85em;
  color: #bbb;
}

.hud-stage {
  position: relative;
  flex: 1;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  background: radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 45%),
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.05) 0, rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 60px),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0, rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 60px),
    #0d1117;
  overflow: hidden;
  min-height: 0;
}

.hud-stage-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ccc;
  font-size: 1em;
  text-align: center;
}

.hud-block {
  position: absolute;
  border: 1px solid rgba(0, 180, 255, 0.8);
  border-radius: 6px;
  box-shadow: 0 8px 14px rgba(0, 0, 0, 0.35);
  background: rgba(0, 120, 255, 0.12);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-sizing: border-box;
  overflow: hidden;
}

.hud-block__header {
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #f2f2f2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hud-block__coords {
  font-weight: normal;
  font-size: 0.7em;
  color: rgba(255, 255, 255, 0.75);
  margin-left: 8px;
}

.hero-tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hero-tiles.empty::after {
  content: "No heroes to display";
  color: #777;
  font-style: italic;
}

.hero-tile {
  min-width: 34px;
  padding: 4px 6px;
  border-radius: 4px;
  background-color: #1b2838;
  color: #fff;
  font-size: 0.75em;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.hud-block .hero-tiles {
  gap: 4px;
}
</style>
