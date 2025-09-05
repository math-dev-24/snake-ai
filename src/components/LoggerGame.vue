<script setup lang="ts">
import { computed } from 'vue';
import { LoggerService } from '@/services';
import type { LogLevel } from '@/types';

const props = defineProps<{
    logger: LoggerService
}>()

const logAI = computed(() => props.logger.getLogs())

const getTypeColor = (type: LogLevel) => {
    switch (type) {
        case 'info':
            return 'text-blue-600 bg-blue-50'
        case 'error':
            return 'text-red-600 bg-red-50'
        case 'warn':
            return 'text-yellow-600 bg-yellow-50'
        case 'debug':
            return 'text-gray-600 bg-gray-50'
        default:
            return 'text-gray-600 bg-gray-50'
    }
}


const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date)
}
</script>

<template>
    <div class="w-full mx-auto p-6 col-span-2 border-t border-gray-200 bg-white rounded-lg shadow-sm">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span class="text-white text-sm font-bold">📊</span>
                </div>
              <h3 class="text-lg font-semibold text-gray-900">Journal d'activité</h3>
            </div>
            <div class="flex items-center gap-2">
                <div class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {{ logAI.length }} entrée{{ logAI.length > 1 ? 's' : '' }}
                </div>
            </div>
        </div>

        <!-- Logs Container -->
        <div class="flex flex-col h-full">
            <div class="flex-1 overflow-y-auto flex flex-col max-h-96 space-y-1">
                <div v-for="(log, index) in logAI" :key="index"
                    class="flex items-start justify-between gap-4 py-0.5 px-1 transition-all duration-200"
                    :class="getTypeColor(log.level)">
                    <div class="flex items-start gap-3 flex-1 min-w-0">
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium leading-relaxed break-words">
                                {{ log.message }}
                            </p>
                        </div>
                    </div>

                    <div class="flex-shrink-0">
                        <p class="text-xs opacity-70 bg-white/50 px-2 py-1 rounded-full">
                            {{ formatTime(log.timestamp) }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="logAI.length === 0" class="text-center py-12 text-gray-500">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-2xl">📝</span>
                </div>
                <h4 class="text-lg font-medium text-gray-700 mb-2">Aucun log disponible</h4>
                <p class="text-sm text-gray-500 mb-1">Les actions de l'IA apparaîtront ici</p>
                <p class="text-xs text-gray-400">Commencez une partie pour voir l'activité</p>
            </div>
        </div>

        <!-- Footer -->
        <div class="mt-6 pt-4 border-t border-gray-100">
            <div class="flex items-center justify-between text-xs text-gray-500">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Système actif</span>
                </div>
                <span v-if="logAI.length > 0">
                    Dernière mise à jour: {{ formatTime(logAI[logAI.length - 1].timestamp) }}
                </span>
                <span v-else>En attente d'activité...</span>
            </div>
        </div>
    </div>
</template>
