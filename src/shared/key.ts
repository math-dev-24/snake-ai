import type { Direction, Snake } from '@/types'
import type { Ref } from 'vue'

export const handleKeydown = (
  event: KeyboardEvent,
  is_playing: Ref<boolean>,
  isAIPlaying: Ref<boolean>,
  snake: Ref<Snake>,
  changeDirection: (direction: Direction) => void,
): void => {
  if (!is_playing.value && !isAIPlaying.value) return

  switch (event.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
    case 'z':
    case 'Z':
      if (snake.value.direction === 'DOWN') return
      changeDirection('UP')
      break
    case 'ArrowDown':
    case 's':
    case 'S':
      if (snake.value.direction === 'UP') return
      changeDirection('DOWN')
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
    case 'q':
    case 'Q':
      if (snake.value.direction === 'RIGHT') return
      changeDirection('LEFT')
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      if (snake.value.direction === 'LEFT') return
      changeDirection('RIGHT')
      break
  }
}
