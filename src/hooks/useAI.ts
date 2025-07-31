import { ref, computed } from 'vue'
import { AIService } from '@/services/aiService'
import { GridService } from '@/services/gridService'
import type { GameState, AIDecision, AIPerformance } from '@/types/ai'
import type { Position, Direction } from '@/types'
import type { AITrainingConfig } from '@/types/ai'
import { directionKeys } from '@/shared/constants'

export const useAI = () => {
  const aiService = new AIService()

  const isAIPlaying = ref<boolean>(false)
  const isTraining = ref<boolean>(false)
  const aiDecision = ref<AIDecision | null>(null)
  const aiConfidence = ref<number>(0)
  const trainingProgress = ref<number>(0)

  const performance = ref<AIPerformance>({
    gamesPlayed: 0,
    averageScore: 0,
    bestScore: 0,
    winRate: 0,
    trainingLoss: [],
  })

  const trainingConfig = ref<AITrainingConfig>({
    learningRate: 0.001,
    batchSize: 32,
    epochs: 1000,
    memorySize: 10000,
    epsilon: 0.1,
    gamma: 0.95,
  })

  const getGameState = (
    snakeBody: Position[],
    apple: Position,
    direction: Direction,
    gridSize: number,
  ): GameState => {
    return {
      snakeHead: snakeBody[0],
      snakeBody: snakeBody.slice(1),
      apple,
      direction,
      gridSize,
    }
  }

  const makeAIDecision = async (
    snakeBody: Position[],
    apple: Position,
    direction: Direction,
    gridSize: number,
  ): Promise<Direction> => {
    try {
      const gameState = getGameState(snakeBody, apple, direction, gridSize)
      const decision = await aiService.makeDecision(gameState)

      aiDecision.value = decision
      aiConfidence.value = decision.confidence

      if (decision.confidence < 0.5) {
        return directionKeys[Math.floor(Math.random() * directionKeys.length)]
      }

      return decision.direction
    } catch (error) {
      console.error('Erreur lors de la prise de décision IA:', error)
      return directionKeys[Math.floor(Math.random() * directionKeys.length)]
    }
  }
  const trainAI = async (
    gridService: GridService,
    updateReactiveState: () => void,
    onProgress?: (progress: number) => void,
  ) => {
    isTraining.value = true
    trainingProgress.value = 0

    try {
      aiService.resetMemory()

      performance.value = {
        gamesPlayed: 0,
        averageScore: 0,
        bestScore: 0,
        winRate: 0,
        trainingLoss: [],
      }

      console.log("🚀 Début de l'entraînement IA...")

      for (let episode = 0; episode < 1000; episode++) {
        console.log(`📊 Épisode ${episode + 1}/1000`)
        await simulateTrainingEpisodeWithVisibleGrid(gridService, updateReactiveState)

        const progress = ((episode + 1) / 1000) * 100
        trainingProgress.value = progress
        onProgress?.(progress)

        if (episode % 10 === 0) {
          console.log(`🧠 Entraînement du modèle (épisode ${episode})`)
          await aiService.trainModel()
        }
      }

      await aiService.saveModel()

      performance.value = aiService.getPerformance()
      console.log('✅ Entraînement terminé. Performances:', performance.value)
    } catch (error) {
      console.error("❌ Erreur lors de l'entraînement:", error)
    } finally {
      isTraining.value = false
    }
  }

  const simulateTrainingEpisodeWithVisibleGrid = async (
    gridService: GridService,
    updateReactiveState: () => void,
  ) => {
    gridService.reset()
    updateReactiveState()

    let steps = 0
    const maxSteps = 1000

    console.log(`🎮 Début d'un nouvel épisode d'entraînement`)

    while (steps < maxSteps) {
      const currentSnake = gridService.getSnake()
      const currentApple = gridService.getApple()
      const currentDirection = gridService.getCurrentDirection()
      const gameState = gridService.getGameState()

      let aiDirection: Direction

      if (Math.random() < 0.8) {
        aiDirection = await makeAIDecision(
          currentSnake.body,
          currentApple,
          currentDirection,
          20, // GRID_SIZE
        )
      } else {
        aiDirection = directionKeys[Math.floor(Math.random() * directionKeys.length)]
      }

      if (steps % 10 === 0) {
        console.log(`Step ${steps}: IA direction = ${aiDirection}, Score = ${gameState.score}`)
      }

      gridService.changeDirection(aiDirection)
      const result = gridService.moveSnake()
      updateReactiveState()

      const currentState = aiService.encodeGameState(
        getGameState(currentSnake.body, currentApple, currentDirection, 20),
      )

      let reward = 1
      let done = false

      if (result.gameOver) {
        console.log(`💀 Game Over à l'étape ${steps}, score final: ${gameState.score}`)
        reward = -10
        done = true
      } else if (result.scoreIncreased) {
        console.log(`🍎 Pomme mangée! Score: ${gameState.score}`)
        reward = 10
      }

      const newSnake = gridService.getSnake()
      const newApple = gridService.getApple()
      const newDirection = gridService.getCurrentDirection()
      const nextState = aiService.encodeGameState(
        getGameState(newSnake.body, newApple, newDirection, 20),
      )

      aiService.addToMemory({
        state: currentState,
        action: getDirectionIndex(aiDirection),
        reward,
        nextState,
        done,
      })

      if (done) {
        break
      }

      steps++

      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    console.log(`🏁 Épisode terminé: ${steps} pas, score: ${gridService.getGameState().score}`)
    aiService.updatePerformance(gridService.getGameState().score, steps >= maxSteps)
  }

  const getDirectionIndex = (direction: Direction): number => {
    return directionKeys.indexOf(direction)
  }

  const loadSavedModel = async () => {
    try {
      await aiService.loadModel()
      performance.value = aiService.getPerformance()
      console.log('Modèle IA chargé avec succès')
    } catch (error) {
      console.error('Erreur lors du chargement du modèle:', error)
    }
  }

  const isAIReady = computed(() => {
    return performance.value.gamesPlayed > 0 || aiService.getPerformance().gamesPlayed > 0
  })

  // Démarrer/arrêter le mode IA
  const toggleAIMode = () => {
    isAIPlaying.value = !isAIPlaying.value
    if (!isAIPlaying.value) {
      aiDecision.value = null
      aiConfidence.value = 0
    }
  }

  // Réinitialiser les performances
  const resetAIPerformance = () => {
    aiService.resetPerformance()
    performance.value = aiService.getPerformance()
  }

  // Mettre à jour la configuration d'entraînement
  const updateTrainingConfig = (config: Partial<typeof trainingConfig.value>) => {
    Object.assign(trainingConfig.value, config)
    aiService.updateConfig(config)
  }

  // Computed properties
  const isAIAvailable = computed(() => !isTraining.value)
  const trainingStatus = computed(() => {
    if (isTraining.value) {
      return `Entraînement en cours: ${Math.round(trainingProgress.value)}%`
    }
    return 'IA prête'
  })

  return {
    // État
    isAIPlaying,
    isTraining,
    aiDecision,
    aiConfidence,
    trainingProgress,
    performance,
    trainingConfig,

    // Computed
    isAIAvailable,
    trainingStatus,
    isAIReady,

    // Méthodes
    makeAIDecision,
    trainAI,
    toggleAIMode,
    loadSavedModel,
    resetAIPerformance,
    updateTrainingConfig,
    getGameState,
  }
}
