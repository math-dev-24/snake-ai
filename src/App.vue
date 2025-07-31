<script setup lang="ts">
import GridSnake from './components/GridSnake.vue'
import HumainControl from './components/HumainControl.vue'
import AIControls from './components/AIControls.vue'
import { useSnake } from './hooks/useSnake'
import { ref } from 'vue'

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

</script>

<template>
  <div class="grid grid-cols-2 gap-4 p-4">
    <!-- Panneau de gauche -->
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2">
        <button @click="mode = 'game'"
          class="bg-gradient-to-br flex items-center gap-1 from-sky-100 to-blue-100 text-sky-700 hover:text-sky-800 px-4 py-2 rounded-2xl font-medium text-base transition-all duration-300 transform hover:scale-102 hover:shadow-md shadow-sm border border-sky-200/50 focus:outline-none focus:ring-2 focus:ring-sky-300/30 cursor-pointer"
          :class="{ 'bg-gradient-to-br !from-sky-200 !to-blue-200 shadow-lg': mode === 'game' }">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z">
            </path>
          </svg>
          Human Mode
        </button>
        <button @click="mode = 'ai'"
          class="bg-gradient-to-br flex items-center gap-1 from-sky-100 to-blue-100 text-sky-700 hover:text-sky-800 px-4 py-2 rounded-2xl font-medium text-base transition-all duration-300 transform hover:scale-102 hover:shadow-md shadow-sm border border-sky-200/50 focus:outline-none focus:ring-2 focus:ring-sky-300/30 cursor-pointer"
          :class="{ 'bg-gradient-to-br !from-sky-200 !to-blue-200 shadow-lg': mode === 'ai' }">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm-4 8a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H8zm-3 2a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-3zm7 2.5a.5.5 0 0 0-1 0v1a.5.5 0 0 0 1 0v-1zm4 0a.5.5 0 0 0-1 0v1a.5.5 0 0 0 1 0v-1z" />
          </svg>
          AI Mode
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