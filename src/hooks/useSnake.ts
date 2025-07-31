import type { Position, Snake, Direction } from '@/types'
import { ref, watch, onUnmounted } from 'vue'
import { useAI } from './useAI'
import { GridService } from '@/services/gridService'
import { ControlService } from '@/services/controlService'

export const useSnake = () => {
  const {
    isAIPlaying,
    isTraining,
    aiDecision,
    aiConfidence,
    makeAIDecision,
    trainAI,
    toggleAIMode,
    loadSavedModel,
    performance: aiPerformance,
    trainingConfig,
    updateTrainingConfig,
  } = useAI()

  // Services
  const gridService = new GridService()
  const controlService = new ControlService()

  // State réactif
  const game_speed = ref<number>(200)
  const game_over = ref<boolean>(false)
  const score = ref<number>(0)
  const is_playing = ref<boolean>(false)
  const show_path = ref<boolean>(true)
  const high_score = ref<number>(0)
  const is_ai_mode = ref<boolean>(false)
  const ai_speed = ref<number>(0)
  const ai_games_played = ref<number>(0)

  // État réactif pour Vue
  const snake = ref<Snake>(gridService.getSnake())
  const apple = ref<Position>(gridService.getApple())
  const path = ref<Position[]>(gridService.getPath())

  let gameInterval: number | null = null

  // Mettre à jour l'état réactif depuis le service
  const updateReactiveState = () => {
    const gameState = gridService.getGameState()
    snake.value = gridService.getSnake()
    apple.value = gridService.getApple()
    path.value = gridService.getPath()
    game_over.value = gameState.gameOver
    score.value = gameState.score
    high_score.value = gameState.highScore
  }

  const moveSnake = (): void => {
    const result = gridService.moveSnake()
    updateReactiveState()

    if (result.gameOver) {
      endGame()
    }
  }

  const endGame = (): void => {
    game_over.value = true
    is_playing.value = false
    if (gameInterval) {
      clearInterval(gameInterval)
      gameInterval = null
    }

    // Redémarrer automatiquement en mode IA
    if (is_ai_mode.value && isAIPlaying.value) {
      ai_games_played.value++
      aiPerformance.value.gamesPlayed = ai_games_played.value
      if (score.value > aiPerformance.value.bestScore) {
        aiPerformance.value.bestScore = score.value
      }

      setTimeout(() => {
        resetGame()
        startGameLoop()
      }, 50)
    }
  }

  const startGameLoop = (): void => {
    if (gameInterval) {
      clearInterval(gameInterval)
    }

    const currentSpeed = is_ai_mode.value ? ai_speed.value : game_speed.value
    gridService.setSpeed(currentSpeed)

    gameInterval = setInterval(() => {
      if (is_playing.value && !game_over.value) {
        moveSnake()
      } else if (game_over.value) {
        if (gameInterval) {
          clearInterval(gameInterval)
          gameInterval = null
        }
      }
    }, currentSpeed)
  }

  // Gestion des contrôles manuels
  const handleManualDirectionChange = (direction: Direction): void => {
    if (!is_ai_mode.value && is_playing.value && !game_over.value) {
      gridService.changeDirection(direction)
      updateReactiveState()
    }
  }

  // Gestion de l'IA
  const handleAIDecision = async () => {
    if (!isAIPlaying.value || !is_playing.value || game_over.value) return

    try {
      const aiDirection = await makeAIDecision(
        gridService.getSnake().body,
        gridService.getApple(),
        gridService.getCurrentDirection(),
        20, // GRID_SIZE
      )
      console.log(
        'IA Decision:',
        aiDirection,
        'Current direction:',
        gridService.getCurrentDirection(),
      )
      gridService.changeDirection(aiDirection)
      updateReactiveState()
    } catch (error) {
      console.error('Erreur lors de la décision IA:', error)
    }
  }

  // Surveiller les changements pour l'IA
  watch([isAIPlaying, is_playing], ([aiPlaying, playing]) => {
    if (aiPlaying && playing && !game_over.value) {
      setTimeout(handleAIDecision, 100)
    }
  })

  // Actions de jeu
  const resetGame = (): void => {
    gridService.reset()
    updateReactiveState()
  }

  const startNormalGame = (): void => {
    if (is_playing.value) return

    is_ai_mode.value = false
    isAIPlaying.value = false
    controlService.stopListening()
    controlService.startListening(handleManualDirectionChange)

    resetGame()
    is_playing.value = true
    startGameLoop()
  }

  const startAIGame = (): void => {
    if (is_playing.value) return

    is_ai_mode.value = true
    isAIPlaying.value = true
    controlService.stopListening()

    resetGame()
    is_playing.value = true
    startGameLoop()
  }

  const startGame = (): void => {
    startNormalGame()
  }

  const restartGame = (): void => {
    if (gameInterval) {
      clearInterval(gameInterval)
      gameInterval = null
    }

    resetGame()
  }

  const changeDirection = (newDirection: Direction): void => {
    if (is_ai_mode.value) {
      // En mode IA, on peut forcer un changement de direction
      gridService.changeDirection(newDirection)
      updateReactiveState()
    } else {
      // En mode manuel, on utilise le service de contrôle
      handleManualDirectionChange(newDirection)
    }
  }

  // Wrapper pour trainAI avec les bonnes références
  const trainAIWithGrid = async (onProgress?: (progress: number) => void) => {
    await trainAI(gridService, updateReactiveState, onProgress)
  }

  // Nettoyage
  onUnmounted(() => {
    if (gameInterval) {
      clearInterval(gameInterval)
    }
    controlService.stopListening()
  })

  return {
    apple,
    snake,
    score,
    is_playing,
    show_path,
    high_score,
    game_over,
    game_speed,
    path,
    startGame,
    startAIGame,
    restartGame,
    changeDirection,
    // IA
    isAIPlaying,
    isTraining,
    aiDecision,
    aiConfidence,
    trainAI: trainAIWithGrid,
    toggleAIMode,
    loadSavedModel,
    aiPerformance,
    trainingConfig,
    handleAIDecision,
    updateTrainingConfig,
    is_ai_mode,
    ai_speed,
    ai_games_played,
  }
}
