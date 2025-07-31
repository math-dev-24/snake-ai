<template>
    <div class="ai-controls bg-white p-4 rounded-xl shadow-lg border border-gray-200">
        <!-- État de l'IA -->
        <div class="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex items-center justify-between mb-2">
                <span class="text-gray-700 font-medium">IA</span>
                <span :class="isAIPlaying ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'"
                    class="px-3 py-1 rounded-full text-sm font-medium">
                    {{ isAIPlaying ? 'Activé' : 'Désactivé' }}
                </span>
            </div>

            <div v-if="aiDecision" class="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div class="text-sm text-gray-700">
                    <div class="flex justify-between mb-1">
                        <span>Décision:</span>
                        <span class="font-semibold text-blue-700">{{ aiDecision.direction }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Confiance:</span>
                        <span class="font-semibold text-blue-700">{{ Math.round(aiConfidence * 100) }}%</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Boutons de contrôle -->
        <div class="space-y-2 mb-4 flex gap-2 justify-between items-center">
            <button @click="toggleAIMode" :disabled="isTraining"
                class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                {{ isAIPlaying ? 'Arrêter IA' : 'Démarrer IA' }}
            </button>

            <button @click="startTraining" :disabled="isTraining || isAIPlaying"
                class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                {{ isTraining ? 'Entraînement en cours...' : 'Entraîner IA' }}
            </button>

            <button @click="loadModel" :disabled="isTraining"
                class="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                Charger modèle
            </button>
        </div>

        <!-- Barre de progression d'entraînement -->
        <div v-if="isTraining" class="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div class="flex justify-between text-sm mb-2">
                <span class="text-gray-700 font-medium">Progression:</span>
                <span class="text-yellow-700 font-semibold">{{ Math.round(trainingProgress) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-yellow-500 h-3 rounded-full transition-all duration-300 shadow-sm"
                    :style="{ width: `${trainingProgress}%` }"></div>
            </div>
        </div>

        <!-- Performances de l'IA -->
        <div class="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 class="text-blue-800 font-semibold mb-2 text-lg">Performances IA</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="flex justify-between p-2 bg-white rounded border border-blue-100">
                    <span class="text-gray-600">Parties totales:</span>
                    <span class="font-semibold text-blue-700">{{ aiPerformance.gamesPlayed }}</span>
                </div>
                <div class="flex justify-between p-2 bg-white rounded border border-blue-100">
                    <span class="text-gray-600">Parties actuelles:</span>
                    <span class="font-semibold text-blue-700">{{ aiGamesPlayed }}</span>
                </div>
                <div class="flex justify-between p-2 bg-white rounded border border-blue-100">
                    <span class="text-gray-600">Score moyen:</span>
                    <span class="font-semibold text-blue-700">{{ Math.round(aiPerformance.averageScore) }}</span>
                </div>
                <div class="flex justify-between p-2 bg-white rounded border border-blue-100">
                    <span class="text-gray-600">Meilleur score:</span>
                    <span class="font-semibold text-blue-700">{{ aiPerformance.bestScore }}</span>
                </div>
                <div class="flex justify-between p-2 bg-white rounded border border-blue-100 col-span-2">
                    <span class="text-gray-600">Taux de victoire:</span>
                    <span class="font-semibold text-blue-700">{{ Math.round(aiPerformance.winRate * 100) }}%</span>
                </div>
            </div>
        </div>

        <!-- Configuration d'entraînement -->
        <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <h4 class="text-gray-800 font-semibold mb-2 text-lg">Configuration</h4>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between items-center">
                    <label class="text-gray-700 font-medium">Epochs:</label>
                    <input :value="trainingConfig.epochs"
                        @input="updateEpochs(Number(($event.target as HTMLInputElement).value))" type="number" min="1"
                        max="100"
                        class="w-24 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div class="flex justify-between items-center">
                    <label class="text-gray-700 font-medium">Alpha (Learning Rate):</label>
                    <input :value="trainingConfig.learningRate"
                        @input="updateLearningRate(Number(($event.target as HTMLInputElement).value))" type="number"
                        step="0.001" min="0.001" max="0.1"
                        class="w-24 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div class="flex justify-between items-center">
                    <label class="text-gray-700 font-medium">Epsilon (Exploration):</label>
                    <input :value="trainingConfig.epsilon"
                        @input="updateEpsilon(Number(($event.target as HTMLInputElement).value))" type="number"
                        step="0.01" min="0.01" max="1.0"
                        class="w-24 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div class="mt-3 p-2 bg-white rounded-lg border border-gray-200">
                    <div class="text-xs text-gray-600 space-y-1">
                        <div class="flex justify-between">
                            <span>Epsilon:</span>
                            <span class="font-medium text-blue-600">{{ Math.round(trainingConfig.epsilon * 100) }}%
                                exploration</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Learning Rate:</span>
                            <span class="font-medium text-blue-600">{{ trainingConfig.learningRate }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { AIDecision, AIPerformance, AITrainingConfig } from '@/types/ai'

interface Props {
    isAIPlaying: boolean
    isTraining: boolean
    aiDecision: AIDecision | null
    aiConfidence: number
    trainingProgress: number
    aiPerformance: AIPerformance
    trainingConfig: AITrainingConfig
    aiGamesPlayed: number
}

interface Emits {
    (e: 'toggle-ai'): void
    (e: 'train-ai'): void
    (e: 'load-model'): void
    (e: 'update-config', config: Partial<AITrainingConfig>): void
    (e: 'start-ai-game'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const toggleAIMode = () => {
    emit('toggle-ai')
}

const startTraining = () => {
    emit('start-ai-game')
    emit('train-ai')
}

const loadModel = () => {
    emit('load-model')
}

const updateEpochs = (value: number) => {
    emit('update-config', { epochs: value })
}

const updateLearningRate = (value: number) => {
    emit('update-config', { learningRate: value })
}

const updateEpsilon = (value: number) => {
    emit('update-config', { epsilon: value })
}
</script>