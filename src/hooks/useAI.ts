import { ref, computed } from 'vue'
import { AIService } from '@/services/aiService'
import { GridService } from '@/services/gridService'
import type { GameState, AIDecision, AIPerformance } from '@/types/ai'
import type { Position, Direction } from '@/types'
import type { AITrainingConfig } from '@/types/ai'

export const useAI = () => {
  const aiService = new AIService()

  // État de l'IA
  const isAIPlaying = ref(false)
  const isTraining = ref(false)
  const aiDecision = ref<AIDecision | null>(null)
  const aiConfidence = ref(0)
  const trainingProgress = ref(0)
  const performance = ref<AIPerformance>({
    gamesPlayed: 0,
    averageScore: 0,
    bestScore: 0,
    winRate: 0,
    trainingLoss: [],
  })

  // Configuration d'entraînement
  const trainingConfig = ref<AITrainingConfig>({
    learningRate: 0.001,
    batchSize: 32,
    epochs: 1000,
    memorySize: 10000,
    epsilon: 0.1,
    gamma: 0.95,
  })

  // Calculer l'état du jeu pour l'IA
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

  // Faire une décision avec l'IA
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

      if (decision.confidence < 0.1) {
        console.log('Confiance faible, utilisation direction aléatoire')
        const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT']
        return directions[Math.floor(Math.random() * directions.length)]
      }

      return decision.direction
    } catch (error) {
      console.error('Erreur lors de la prise de décision IA:', error)
      // Retourner une direction aléatoire en cas d'erreur
      const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT']
      return directions[Math.floor(Math.random() * directions.length)]
    }
  }

  // Entraîner l'IA avec le vrai GridService visible
  const trainAI = async (
    gridService: GridService,
    updateReactiveState: () => void,
    onProgress?: (progress: number) => void,
  ) => {
    isTraining.value = true
    trainingProgress.value = 0

    try {
      // Vider la mémoire avant l'entraînement pour éviter les incohérences
      aiService.resetMemory()

      // Réinitialiser les performances
      performance.value = {
        gamesPlayed: 0,
        averageScore: 0,
        bestScore: 0,
        winRate: 0,
        trainingLoss: [],
      }

      console.log("🚀 Début de l'entraînement IA...")

      // Simulation d'entraînement avec le vrai GridService visible
      for (let episode = 0; episode < 1000; episode++) {
        console.log(`📊 Épisode ${episode + 1}/1000`)

        await simulateTrainingEpisodeWithVisibleGrid(gridService, updateReactiveState)

        // Mettre à jour le progrès
        const progress = ((episode + 1) / 1000) * 100
        trainingProgress.value = progress
        onProgress?.(progress)

        // Entraîner le modèle périodiquement
        if (episode % 10 === 0) {
          console.log(`🧠 Entraînement du modèle (épisode ${episode})`)
          await aiService.trainModel()
        }
      }

      // Sauvegarder le modèle entraîné
      await aiService.saveModel()

      // Mettre à jour les performances
      performance.value = aiService.getPerformance()
      console.log('✅ Entraînement terminé. Performances:', performance.value)
    } catch (error) {
      console.error("❌ Erreur lors de l'entraînement:", error)
    } finally {
      isTraining.value = false
    }
  }

  // Simuler une partie d'entraînement avec le vrai GridService visible
  const simulateTrainingEpisodeWithVisibleGrid = async (
    gridService: GridService,
    updateReactiveState: () => void,
  ) => {
    // Réinitialisation explicite pour s'assurer que l'état est propre
    gridService.reset()
    updateReactiveState() // Mettre à jour l'interface

    let steps = 0
    const maxSteps = 1000 // Nombre fixe de pas maximum

    console.log(`🎮 Début d'un nouvel épisode d'entraînement`)

    while (steps < maxSteps) {
      const currentSnake = gridService.getSnake()
      const currentApple = gridService.getApple()
      const currentDirection = gridService.getCurrentDirection()
      const gameState = gridService.getGameState()

      // Pendant l'entraînement, utiliser plus d'exploration
      let aiDirection: Direction

      // 80% de chance d'utiliser l'IA, 20% de chance d'action aléatoire pour l'exploration
      if (Math.random() < 0.8) {
        aiDirection = await makeAIDecision(
          currentSnake.body,
          currentApple,
          currentDirection,
          20, // GRID_SIZE
        )
      } else {
        // Action aléatoire pour l'exploration
        const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT']
        aiDirection = directions[Math.floor(Math.random() * directions.length)]
      }

      if (steps % 10 === 0) {
        // Log moins fréquent pour éviter le spam
        console.log(`Step ${steps}: IA direction = ${aiDirection}, Score = ${gameState.score}`)
      }

      // Appliquer la décision au GridService
      gridService.changeDirection(aiDirection)
      const result = gridService.moveSnake()
      updateReactiveState() // Mettre à jour l'interface en temps réel

      // Ajouter l'expérience à la mémoire
      const currentState = aiService.encodeGameState(
        getGameState(currentSnake.body, currentApple, currentDirection, 20),
      )

      let reward = 1 // Récompense de base pour survivre
      let done = false

      if (result.gameOver) {
        console.log(`💀 Game Over à l'étape ${steps}, score final: ${gameState.score}`)
        reward = -10 // Récompense négative pour la collision
        done = true
      } else if (result.scoreIncreased) {
        console.log(`🍎 Pomme mangée! Score: ${gameState.score}`)
        reward = 10 // Récompense positive pour manger la pomme
      }

      // Obtenir le nouvel état après le mouvement
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

      // Délai pour voir l'animation (plus rapide pendant l'entraînement)
      await new Promise((resolve) => setTimeout(resolve, 50)) // 50ms entre chaque mouvement
    }

    console.log(`🏁 Épisode terminé: ${steps} pas, score: ${gridService.getGameState().score}`)
    // Mettre à jour les performances
    aiService.updatePerformance(gridService.getGameState().score, steps >= maxSteps)
  }

  // Fonctions utilitaires
  const getDirectionIndex = (direction: Direction): number => {
    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT']
    return directions.indexOf(direction)
  }

  // Charger le modèle sauvegardé
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
