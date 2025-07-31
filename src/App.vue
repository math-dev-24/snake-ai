<script setup lang="ts">
import GridSnake from './components/GridSnake.vue'
import HumainControl from './components/HumainControl.vue'
import AIControls from './components/AIControls.vue'
import { useSnake } from './hooks/useSnake'
import { onMounted, onUnmounted, ref } from 'vue'
import { handleKeydown } from './shared/key'

const {
  score,
  snake,
  apple,
  path,
  show_path,
  is_playing,
  game_over,
  startGame,
  restartGame,
  changeDirection,
  high_score,
  // IA
  isAIPlaying,
  isTraining,
  aiDecision,
  aiConfidence,
  trainAI,
  toggleAIMode,
  loadSavedModel,
  aiPerformance,
  trainingConfig,
  startAIGame,
  updateTrainingConfig,
  ai_games_played
} = useSnake()

const mode = ref<'game' | 'ai'>('game')

const toggleMode = () => {
  mode.value = mode.value === 'game' ? 'ai' : 'game'
}

const handleKeydownEvent = (event: KeyboardEvent) => {
  handleKeydown(event, is_playing, isAIPlaying, snake, changeDirection)
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydownEvent)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydownEvent)
})
</script>

<template>
  <div class="grid grid-cols-2 gap-4 p-4">
    <!-- Panneau de gauche -->
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <button @click="toggleMode" class="bg-blue-500 text-white px-4 py-2 rounded-md">
          {{ mode === 'game' ? 'Mode IA' : 'Mode Jeu' }}
        </button>
      </div>

      <HumainControl v-if="mode === 'game'" :in-play="is_playing" :show-path="show_path" :score="score"
        :game-over="game_over" :high-score="high_score" @play="startGame" @restart="restartGame"
        @show-path="show_path = !show_path" />

      <AIControls v-if="mode === 'ai'" :isAIPlaying="isAIPlaying" :isTraining="isTraining" :aiDecision="aiDecision"
        :aiConfidence="aiConfidence" :trainingProgress="0" :aiPerformance="aiPerformance"
        :trainingConfig="trainingConfig" :aiGamesPlayed="ai_games_played" @toggle-ai="toggleAIMode" @train-ai="trainAI"
        @load-model="loadSavedModel" @update-config="updateTrainingConfig" @start-ai-game="startAIGame" />
    </div>

    <!-- Grille de jeu -->
    <div class="flex-1">
      <GridSnake :grid-size="20" :snake="snake.body" :apple="apple" :path="path" :show-path="show_path"
        :direction="snake.direction" />
    </div>
  </div>
</template>