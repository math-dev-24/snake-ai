<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    logAI: {
        message: string
        type: 'info' | 'error' | 'success'
        date: Date
    }[]
}>()

const getTypeColor = (type: 'info' | 'error' | 'success') => {
    switch (type) {
        case 'info':
            return 'text-blue-600'
        case 'error':
            return 'text-red-600'
        case 'success':
            return 'text-green-600'
        default:
            return 'text-gray-600'
    }
}

const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date)
}

const sortedLogAI = computed(() => {
    return [...props.logAI].sort((a, b) => b.date.getTime() - a.date.getTime())
})

</script>

<template>
    <div class="w-full mx-auto p-4 col-span-2 border-t border-gray-200 drop-shadow-sm bg-white">
        <!-- Logs Container -->
        <div class="space-y-1 max-h-96 overflow-y-auto">
            <div v-for="(log, index) in sortedLogAI" :key="index"
                class="flex items-center justify-between gap-3 px-1 py-0.5 rounded-lg transition-all duration-200"
                :class="getTypeColor(log.type)">
                <div class="flex-shrink-0 mt-0.5 flex items-center gap-2">
                    <p class="text-xs font-medium leading-relaxed">
                        {{ log.message }}
                    </p>
                </div>

                <p class="text-xs opacity-70 mt-1">
                    {{ formatTime(log.date) }}
                </p>
            </div>

            <!-- Empty State -->
            <div v-if="logAI.length === 0" class="text-center py-8 text-gray-500">
                <div class="text-4xl mb-2">📝</div>
                <p class="text-sm">Aucun log disponible</p>
                <p class="text-xs opacity-70">Les actions de l'IA apparaîtront ici</p>
            </div>
        </div>

        <!-- Footer -->
        <div class="mt-0.5 pt-1">
            <div class="flex items-center justify-between text-xs text-gray-500">
                <span>{{ logAI.length }} entrée{{ logAI.length > 1 ? 's' : '' }}</span>
                <span>Dernière mise à jour: {{ logAI.length > 0 ? formatTime(logAI[logAI.length - 1].date) : '--'
                }}</span>
            </div>
        </div>
    </div>
</template>