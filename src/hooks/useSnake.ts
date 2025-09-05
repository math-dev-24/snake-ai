import { ref, watch, onUnmounted, computed } from 'vue'
import type { Position, Snake, Direction } from '@/types'
import { GridService, ControlService, AIService, LoggerService } from '@/services'
import type { AIDecision, AIPerformance, AITrainingConfig } from '@/types/ai'
import { directionKeys } from '@/shared/constants'

export const useSnake = () => {
  const gridService = new GridService()
  const controlService = new ControlService()
  const aiService = new AIService()
  const loggerService = new LoggerService()

  // États réactifs pour l'IA
  const isAIPlaying = ref<boolean>(false)
  const isTraining = ref<boolean>(false)
  const shouldStopTraining = ref<boolean>(false)
  const aiDecision = ref<AIDecision | null>(null)
  const aiConfidence = ref<number>(0)
  const trainingProgress = ref<number>(0)

  const aiPerformance = ref<AIPerformance>({
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
    epsilonDecay: 0.995,
    epsilonMin: 0.01,
    gamma: 0.95,
  })

  // États du jeu
  const game_speed = ref<number>(100)
  const game_over = ref<boolean>(false)
  const score = ref<number>(0)
  const is_playing = ref<boolean>(false)
  const show_path = ref<boolean>(true)
  const high_score = ref<number>(0)
  const is_ai_mode = ref<boolean>(false)
  const ai_speed = ref<number>(0)

  const snake = ref<Snake>(gridService.getSnake())
  const apple = ref<Position>(gridService.getApple())
  const path = ref<Position[]>(gridService.getPath())

  let gameInterval: number | null = null

  const getNextHeadPosition = (currentHead: Position, direction: Direction): Position => {
    switch (direction) {
      case 'UP':
        return { x: currentHead.x, y: currentHead.y - 1 }
      case 'DOWN':
        return { x: currentHead.x, y: currentHead.y + 1 }
      case 'LEFT':
        return { x: currentHead.x - 1, y: currentHead.y }
      case 'RIGHT':
        return { x: currentHead.x + 1, y: currentHead.y }
    }
  }

  const getGameState = (
    snakeBody: Position[],
    apple: Position,
    direction: Direction,
    gridSize: number,
  ) => {
    return {
      snakeHead: snakeBody[0],
      snakeBody: snakeBody.slice(1),
      apple,
      direction,
      gridSize,
    }
  }

  const getDirectionIndex = (direction: Direction): number => {
    return directionKeys.indexOf(direction)
  }

  const syncPerformanceWithService = () => {
    const servicePerformance = aiService.getPerformance()
    aiPerformance.value = { ...servicePerformance }
  }

  syncPerformanceWithService()

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
      loggerService.log(`🎮 Partie terminée - Score: ${score.value}`, 'info')
    }

    if (is_ai_mode.value && isAIPlaying.value) {
      if (score.value > aiPerformance.value.bestScore) {
        aiPerformance.value.bestScore = score.value
      }

      const currentAvg = aiPerformance.value.averageScore
      const totalGames = aiPerformance.value.gamesPlayed
      aiPerformance.value.averageScore = (currentAvg * (totalGames - 1) + score.value) / totalGames

      aiService.setPerformance(aiPerformance.value)

      loggerService.log(
        `🎮 Partie IA terminée - Score: ${score.value}, Parties totales: ${aiPerformance.value.gamesPlayed}, Meilleur score: ${aiPerformance.value.bestScore}`,
        'info',
      )

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

      if (decision.confidence < 0.35) {
        return directionKeys[Math.floor(Math.random() * directionKeys.length)]
      }

      return decision.direction
    } catch (error) {
      loggerService.log(`❌ Erreur lors de la prise de décision IA: ${error}`, 'error')
      return directionKeys[Math.floor(Math.random() * directionKeys.length)]
    }
  }

  const handleAIDecision = async () => {
    if (!isAIPlaying.value || !is_playing.value || game_over.value) return

    try {
      const currentSnake = gridService.getSnake()
      const currentApple = gridService.getApple()
      const currentDirection = gridService.getCurrentDirection()

      const aiDirection = await makeAIDecision(
        currentSnake.body,
        currentApple,
        currentDirection,
        gridService.GRID_SIZE
      )
      loggerService.log(
        `IA Decision: ${aiDirection}, Current direction: ${currentDirection}`,
        'info',
      )

      // Calculer la nouvelle position pour la récompense
      const newHead = getNextHeadPosition(currentSnake.body[0], aiDirection)
      const hitWall = newHead.x < 0 || newHead.x >= gridService.GRID_SIZE || newHead.y < 0 || newHead.y >= gridService.GRID_SIZE
      const hitSelf = currentSnake.body.some(
        (segment) => segment.x === newHead.x && segment.y === newHead.y,
      )

      gridService.changeDirection(aiDirection)
      const result = gridService.moveSnake()
      updateReactiveState()

      // Calculer et afficher la récompense
      const reward = aiService.calculateReward(
        currentSnake.body[0],
        newHead,
        currentApple,
        result.scoreIncreased,
        result.gameOver,
        hitWall,
        hitSelf,
      )

      if (reward !== 0) {
        loggerService.log(`🎯 Récompense IA: ${reward > 0 ? '+' : ''}${reward}`, 'info')
      }
    } catch (error) {
      loggerService.log(`❌ Erreur lors de la décision IA: ${error}`, 'error')
    }
  }

  watch([isAIPlaying, is_playing], ([aiPlaying, playing]) => {
    if (aiPlaying && playing && !game_over.value) {
      setTimeout(handleAIDecision, 100)
    }
  })

  const resetGame = (): void => {
    gridService.reset()
    game_over.value = false
    is_playing.value = false
    if (gameInterval) {
      clearInterval(gameInterval)
      gameInterval = null
    }
    updateReactiveState()
    loggerService.log(`🎮 Partie terminée - Score: ${score.value}`, 'info')
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
      gridService.changeDirection(newDirection)
      updateReactiveState()
    } else {
      handleManualDirectionChange(newDirection)
    }
  }

  // Fonctions d'entraînement IA
  const simulateTrainingEpisodeWithVisibleGrid = async (
    gridService: GridService,
    updateReactiveState: () => void,
  ) => {
    gridService.reset()
    updateReactiveState()

    let steps = 0
    const maxSteps = 1000

    loggerService.log(`🎮 Début d'un nouvel épisode d'entraînement`, 'info')

    while (steps < maxSteps) {
      if (shouldStopTraining.value) {
        loggerService.log("⏹️ Arrêt de l'épisode d'entraînement", 'info')
        break
      }

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
          gameState.gridSize
        )
      } else {
        aiDirection = directionKeys[Math.floor(Math.random() * directionKeys.length)]
      }

      if (steps % 10 === 0) {
        loggerService.log(
          `Step ${steps}: IA direction = ${aiDirection}, Score = ${gameState.score}`,
          'info',
        )
      }

      gridService.changeDirection(aiDirection)
      const result = gridService.moveSnake()
      updateReactiveState()

      const currentState = aiService.encodeGameState(
        getGameState(currentSnake.body, currentApple, currentDirection, gridService.GRID_SIZE),
      )

      const newHead = getNextHeadPosition(currentSnake.body[0], aiDirection)

      const hitWall = newHead.x < 0 || newHead.x >= gridService.GRID_SIZE || newHead.y < 0 || newHead.y >= gridService.GRID_SIZE
      const hitSelf = currentSnake.body.some(
        (segment) => segment.x === newHead.x && segment.y === newHead.y,
      )

      const reward = aiService.calculateReward(
        currentSnake.body[0],
        newHead,
        currentApple,
        result.scoreIncreased,
        result.gameOver,
        hitWall,
        hitSelf,
      )

      let done = false
      if (result.gameOver) {
        loggerService.log(
          `💀 Game Over à l'étape ${steps}, score final: ${gameState.score}`,
          'info',
        )
        done = true
      } else if (result.scoreIncreased) {
        loggerService.log(`🍎 Pomme mangée! Score: ${gameState.score}`, 'info')
      }

      const newSnake = gridService.getSnake()
      const newApple = gridService.getApple()
      const newDirection = gridService.getCurrentDirection()
      const nextState = aiService.encodeGameState(
        getGameState(newSnake.body, newApple, newDirection, gridService.GRID_SIZE),
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

    loggerService.log(
      `🏁 Épisode terminé: ${steps} pas, score: ${gridService.getGameState().score}`,
      'info',
    )
    aiService.updatePerformance(gridService.getGameState().score, steps >= maxSteps)

    syncPerformanceWithService()
  }

  const trainAI = async (onProgress?: (progress: number) => void) => {
    isTraining.value = true
    shouldStopTraining.value = false
    trainingProgress.value = 0

    try {
      aiService.resetMemory()

      aiPerformance.value = {
        gamesPlayed: 0,
        averageScore: 0,
        bestScore: 0,
        winRate: 0,
        trainingLoss: [],
      }

      loggerService.log("🚀 Début de l'entraînement IA...", 'info')

      for (let episode = 0; episode < 1000; episode++) {
        if (shouldStopTraining.value) {
          loggerService.log("⏹️ Arrêt de l'entraînement demandé", 'info')
          break
        }

        loggerService.log(`📊 Épisode ${episode + 1}/1000`, 'info')
        await simulateTrainingEpisodeWithVisibleGrid(gridService, updateReactiveState)

        const progress = ((episode + 1) / 1000) * 100
        trainingProgress.value = progress
        onProgress?.(progress)

        if (episode % 10 === 0) {
          loggerService.log(`🧠 Entraînement du modèle (épisode ${episode})`, 'info')
          await aiService.trainModel()
        }
      }

      if (!shouldStopTraining.value) {
        await aiService.saveModel()
        loggerService.log(`✅ Entraînement terminé. Performances: ${aiPerformance.value}`, 'info')
      } else {
        loggerService.log("⏹️ Entraînement arrêté par l'utilisateur", 'info')
      }

      syncPerformanceWithService()
    } catch (error) {
      loggerService.log(`❌ Erreur lors de l'entraînement: ${error}`, 'error')
    } finally {
      isTraining.value = false
      shouldStopTraining.value = false
    }
  }

  const loadSavedModel = async () => {
    try {
      await aiService.loadModel()
      syncPerformanceWithService()
      loggerService.log('Modèle IA chargé avec succès', 'info')
      loggerService.log(`Performances chargées: ${aiPerformance.value}`, 'info')
    } catch (error) {
      loggerService.log(`Erreur lors du chargement du modèle: ${error}`, 'error')
    }
  }

  const toggleAIMode = () => {
    isAIPlaying.value = !isAIPlaying.value
    if (!isAIPlaying.value) {
      aiDecision.value = null
      aiConfidence.value = 0
    }
  }

  const stopTraining = () => {
    shouldStopTraining.value = true
    loggerService.log("🛑 Demande d'arrêt de l'entraînement", 'info')
  }

  const resetAIPerformance = () => {
    aiService.resetPerformance()
    syncPerformanceWithService()
  }

  const updateTrainingConfig = (config: Partial<typeof trainingConfig.value>) => {
    Object.assign(trainingConfig.value, config)
    aiService.updateConfig(config)
  }

  // Computed properties
  const isAIReady = computed(() => {
    return aiPerformance.value.gamesPlayed > 0 || aiService.getPerformance().gamesPlayed > 0
  })

  const isAIAvailable = computed(() => !isTraining.value)

  const trainingStatus = computed(() => {
    if (isTraining.value) {
      return `Entraînement en cours: ${Math.round(trainingProgress.value)}%`
    }
    return 'IA prête'
  })

  onUnmounted(() => {
    if (gameInterval) {
      clearInterval(gameInterval)
    }
    controlService.stopListening()
  })

  return {
    // États du jeu
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
    grid_size: gridService.GRID_SIZE,

    // États IA
    isAIPlaying,
    isTraining,
    shouldStopTraining,
    aiDecision,
    aiConfidence,
    aiPerformance,
    trainingConfig,
    trainingProgress,
    loggerService,

    // Computed IA
    isAIReady,
    isAIAvailable,
    trainingStatus,

    // Méthodes IA
    trainAI,
    toggleAIMode,
    stopTraining,
    loadSavedModel,
    resetAIPerformance,
    updateTrainingConfig,
    handleAIDecision,

    // États supplémentaires
    is_ai_mode,
    ai_speed,
  }
}
