<script setup lang="ts">

defineProps<{
    score: number
    gameOver: boolean
    highScore: number
    inPlay: boolean
    showPath: boolean
}>()

const emit = defineEmits<{
    (e: 'play'): void
    (e: 'restart'): void
    (e: 'showPath'): void
}>()

</script>

<template>
    <div
        class="flex flex-col items-center justify-center gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-100">
        <div class="flex gap-4 w-full justify-between">
            <button @click="emit('play')"
                class="flex-1 group relative overflow-hidden bg-gradient-to-br from-rose-100 to-pink-100 hover:from-rose-200 hover:to-pink-200 text-rose-700 hover:text-rose-800 px-6 py-4 rounded-2xl font-medium text-base transition-all duration-300 transform hover:scale-102 hover:shadow-md shadow-sm border border-rose-200/50 focus:outline-none focus:ring-2 focus:ring-rose-300/30"
                :class="{ 'opacity-60 cursor-not-allowed': inPlay }" :disabled="inPlay">
                <span class="relative z-10 flex items-center gap-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653Z">
                        </path>
                    </svg>
                    {{ inPlay ? 'Playing...' : 'Play' }}
                </span>
            </button>

            <!-- Bouton Restart -->
            <button @click="emit('restart')"
                class="flex-1 group relative overflow-hidden bg-gradient-to-br from-sky-100 to-blue-100 hover:from-sky-200 hover:to-blue-200 text-sky-700 hover:text-sky-800 px-6 py-4 rounded-2xl font-medium text-base transition-all duration-300 transform hover:scale-102 hover:shadow-md shadow-sm border border-sky-200/50 focus:outline-none focus:ring-2 focus:ring-sky-300/30">
                <span class="relative z-10 flex items-center gap-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99">
                        </path>
                    </svg>
                    Restart
                </span>
            </button>

            <!-- Bouton Show Path -->
            <button @click="emit('showPath')"
                class="flex-1 group relative overflow-hidden bg-gradient-to-br from-amber-100 to-yellow-100 hover:from-amber-200 hover:to-yellow-200 text-amber-700 hover:text-amber-800 px-6 py-4 rounded-2xl font-medium text-base transition-all duration-300 transform hover:scale-102 hover:shadow-md shadow-sm border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-300/30">
                <span class="relative z-10 flex items-center gap-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z">
                        </path>
                    </svg>
                    {{ showPath ? 'Hide Path' : 'Show Path' }}
                </span>
            </button>
        </div>

        <!-- Scores -->
        <div class="grid grid-cols-2 gap-4 w-full">
            <!-- Score actuel -->
            <div
                class="flex items-center gap-3 px-6 py-4 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl border border-emerald-200/50 shadow-sm">
                <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z">
                    </path>
                </svg>
                <div class="text-center">
                    <p class="text-sm font-medium text-emerald-700 opacity-80">Score</p>
                    <p class="text-2xl font-bold text-emerald-800">{{ score }}</p>
                </div>
            </div>

            <!-- High Score -->
            <div
                class="flex items-center gap-3 px-6 py-4 bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl border border-purple-200/50 shadow-sm">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0-.981 3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V6.5c0 2.485 2.011 4.5 4.5 4.5s4.5-2.015 4.5-4.5V4.236M13.5 9.728a6.003 6.003 0 0 0 5.396-4.972c-.962-.203-1.934-.377-2.916-.52">
                    </path>
                </svg>
                <div class="text-center">
                    <p class="text-sm font-medium text-purple-700 opacity-80">High Score</p>
                    <p class="text-2xl font-bold text-purple-800">{{ highScore }}</p>
                </div>
            </div>
        </div>

        <!-- Message Game Over -->
        <div v-if="gameOver"
            class="w-full flex items-center gap-3 px-6 py-4 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl border border-rose-200/50 shadow-sm">
            <svg class="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z">
                </path>
            </svg>
            <p class="text-lg font-medium text-rose-800">Vous avez perdu ! Votre score est de {{ score }}</p>
        </div>
    </div>
</template>