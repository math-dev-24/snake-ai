<script setup lang="ts">
import type { Direction, Position } from '@/types';

defineProps<{
    gridSize: number,
    snake: ReadonlyArray<Position>,
    apple: Readonly<Position>,
    path: ReadonlyArray<Position>,
    showPath: boolean,
    direction: Direction
}>()

const isSnakeBody = (x: number, y: number, snake: ReadonlyArray<Position>) => {
    return snake.some(segment => segment.x === x && segment.y === y)
}

const isSnakeHead = (x: number, y: number, snake: ReadonlyArray<Position>) => {
    return snake.length > 0 && snake[0].x === x && snake[0].y === y
}

const isSnakeTail = (x: number, y: number, snake: ReadonlyArray<Position>) => {
    return snake.length > 0 && snake[snake.length - 1].x === x && snake[snake.length - 1].y === y
}

const isApple = (x: number, y: number, apple: Readonly<Position>) => {
    return apple.x === x && apple.y === y
}

const isPath = (x: number, y: number, path: ReadonlyArray<Position>, snake: ReadonlyArray<Position>, apple: Readonly<Position>) => {
    return path.some(segment => segment.x === x && segment.y === y) && !isSnakeBody(x, y, snake) && !isApple(x, y, apple)
}

// Styles directionnels pour la tête du serpent
const getHeadStyles = (direction: Direction) => {
    const baseStyles = 'bg-gradient-to-br from-emerald-600 to-green-700 shadow-lg'

    switch (direction) {
        case 'UP':
            return `${baseStyles} rounded-t-lg border-b-2 border-emerald-800`
        case 'DOWN':
            return `${baseStyles} rounded-b-lg border-t-2 border-emerald-800`
        case 'LEFT':
            return `${baseStyles} rounded-l-lg border-r-2 border-emerald-800`
        case 'RIGHT':
            return `${baseStyles} rounded-r-lg border-l-2 border-emerald-800`
    }
}

const getTailStyles = (snake: ReadonlyArray<Position>) => {
    if (snake.length < 2) return 'bg-emerald-500 rounded-full'

    const tail = snake[snake.length - 1]
    const beforeTail = snake[snake.length - 2]

    if (beforeTail.x > tail.x) {
        return 'bg-emerald-500 rounded-l-lg border-r-2 border-emerald-600'
    } else if (beforeTail.x < tail.x) {
        return 'bg-emerald-500 rounded-r-lg border-l-2 border-emerald-600'
    } else if (beforeTail.y > tail.y) {
        return 'bg-emerald-500 rounded-t-lg border-b-2 border-emerald-600'
    } else {
        return 'bg-emerald-500 rounded-b-lg border-t-2 border-emerald-600'
    }
}

const getBodyStyles = (x: number, y: number, snake: ReadonlyArray<Position>) => {
    const index = snake.findIndex(segment => segment.x === x && segment.y === y)
    if (index === -1) return ''
    return `bg-emerald-400 shadow-sm`
}

const getEyesPosition = (direction: Direction) => {
    switch (direction) {
        case 'UP':
            return 'flex-row space-x-1'
        case 'DOWN':
            return 'flex-row space-x-1'
        case 'LEFT':
            return 'flex-col space-y-1'
        case 'RIGHT':
            return 'flex-col space-y-1'
    }
}

const getEyesContainerPosition = (direction: Direction) => {
    switch (direction) {
        case 'UP':
            return 'items-center justify-center pt-1'
        case 'DOWN':
            return 'items-center justify-center pb-1'
        case 'LEFT':
            return 'items-center justify-center pl-1'
        case 'RIGHT':
            return 'items-center justify-center pr-1'
    }
}

</script>

<template>
    <div class="flex justify-center items-center p-4">
        <div class="bg-green-100 p-6 rounded-lg shadow-lg">
            <div class="grid gap-0 bg-green-100 p-2" :style="{
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                width: 'min(80vw, 500px)',
                height: 'min(80vw, 500px)'
            }">
                <div v-for="y in gridSize" :key="`row-${y}`" class="contents">
                    <div v-for="x in gridSize" :key="`cell-${x}-${y}`"
                        class="w-full h-full border-1 border-gray-200 transition-all duration-200 relative" :class="{
                            [getHeadStyles(direction)]: isSnakeHead(x - 1, y - 1, snake),
                            [getTailStyles(snake)]: isSnakeTail(x - 1, y - 1, snake),
                            [getBodyStyles(x - 1, y - 1, snake)]: isSnakeBody(x - 1, y - 1, snake) && !isSnakeHead(x - 1, y - 1, snake) && !isSnakeTail(x - 1, y - 1, snake),
                            'bg-red-500 rounded-full shadow-lg animate-pulse': isApple(x - 1, y - 1, apple),
                            'bg-yellow-100': showPath && isPath(x - 1, y - 1, path, snake, apple),
                            'bg-green-50': !isSnakeBody(x - 1, y - 1, snake) && !isApple(x - 1, y - 1, apple) && !(showPath && isPath(x - 1, y - 1, path, snake, apple)),
                        }">

                        <div v-if="isSnakeHead(x - 1, y - 1, snake)" class="w-full h-full flex"
                            :class="getEyesContainerPosition(direction)">
                            <div class="flex" :class="getEyesPosition(direction)">
                                <div class="w-1.5 h-1.5 bg-white rounded-full shadow-sm animate-pulse"></div>
                                <div class="w-1.5 h-1.5 bg-white rounded-full shadow-sm animate-pulse"></div>
                            </div>
                        </div>

                        <div v-if="isSnakeHead(x - 1, y - 1, snake)" class="absolute w-1 h-1 bg-red-400 rounded-full"
                            :class="{
                                'top-1/2 left-0 -translate-y-1/2 -translate-x-1': direction === 'LEFT',
                                'top-1/2 right-0 -translate-y-1/2 translate-x-1': direction === 'RIGHT',
                                'left-1/2 top-0 -translate-x-1/2 -translate-y-1': direction === 'UP',
                                'left-1/2 bottom-0 -translate-x-1/2 translate-y-1': direction === 'DOWN'
                            }" :style="{
                                'z-index': '10'
                            }">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>