import * as tf from '@tensorflow/tfjs'
import type {
  GameState,
  AIDecision,
  TrainingData,
  AITrainingConfig,
  AIPerformance,
} from '@/types/ai'
import type { Position, Direction } from '@/types'

export class AIService {
  private model: tf.Sequential | null = null
  private memory: TrainingData[] = []
  private performance: AIPerformance = {
    gamesPlayed: 0,
    averageScore: 0,
    bestScore: 0,
    winRate: 0,
    trainingLoss: [],
  }

  private config: AITrainingConfig = {
    learningRate: 0.001,
    batchSize: 32,
    epochs: 10,
    memorySize: 10000,
    epsilon: 0.1,
    epsilonDecay: 0.995,
    epsilonMin: 0.01,
    gamma: 0.95,
  }

  private stepsSurvived = 0

  constructor() {
    this.initializeModel()
  }

  private initializeModel(): void {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [20],
          units: 128,
          activation: 'relu',
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu',
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
        }),
        tf.layers.dense({
          units: 4,
          activation: 'softmax',
        }),
      ],
    })

    this.model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    })
  }

  public encodeGameState(gameState: GameState): number[] {
    const { snakeHead, snakeBody, apple, direction, gridSize } = gameState

    // Calculer la distance à la pomme
    const distanceToApple = this.calculateDistance(snakeHead, apple)

    // Distance Manhattan à la pomme
    const manhattanDistance = Math.abs(snakeHead.x - apple.x) + Math.abs(snakeHead.y - apple.y)

    // Calculer l'espace libre dans chaque direction
    const freeSpaces = this.calculateFreeSpacesInDirections(snakeHead, snakeBody, gridSize)
    
    // Détecter les pièges potentiels
    const trapRisk = this.calculateTrapRisk(snakeHead, snakeBody, gridSize)

    // Encodage de l'état du jeu en 20 valeurs
    return [
      // Position relative de la tête du serpent (normalisée)
      snakeHead.x / gridSize,
      snakeHead.y / gridSize,
      // Position relative de la pomme (normalisée)
      apple.x / gridSize,
      apple.y / gridSize,

      // Distance euclidienne à la pomme (normalisée)
      distanceToApple / (gridSize * Math.sqrt(2)),
      // Distance Manhattan à la pomme (normalisée)
      manhattanDistance / (gridSize * 2),

      // Direction actuelle (one-hot encoding)
      direction === 'UP' ? 1 : 0,
      direction === 'DOWN' ? 1 : 0,
      direction === 'LEFT' ? 1 : 0,
      direction === 'RIGHT' ? 1 : 0,

      // Danger immédiat dans les 4 directions (0 = sûr, 1 = danger)
      this.checkDangerInDirection(snakeHead, snakeBody, 'UP', gridSize) ? 1 : 0,
      this.checkDangerInDirection(snakeHead, snakeBody, 'DOWN', gridSize) ? 1 : 0,
      this.checkDangerInDirection(snakeHead, snakeBody, 'LEFT', gridSize) ? 1 : 0,
      this.checkDangerInDirection(snakeHead, snakeBody, 'RIGHT', gridSize) ? 1 : 0,

      // Espace libre dans chaque direction (normalisé)
      freeSpaces.UP / gridSize,
      freeSpaces.DOWN / gridSize,
      freeSpaces.LEFT / gridSize,
      freeSpaces.RIGHT / gridSize,

      // Risque de piège (0-1)
      trapRisk,
      // Longueur du serpent (normalisée)
      snakeBody.length / (gridSize * gridSize),
    ]
  }

  private calculateDistance(pos1: Position, pos2: Position): number {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2))
  }

  public calculateReward(
    currentHead: Position,
    newHead: Position,
    apple: Position,
    scoreIncreased: boolean,
    gameOver: boolean,
    hitWall: boolean,
    hitSelf: boolean,
  ): number {
    let reward = 0

    if (scoreIncreased) {
      reward += 10
      this.stepsSurvived = 0
    } else {
      this.stepsSurvived++
      reward += 0.05 // Petite récompense de survie
    }

    if (gameOver) {
      if (hitWall) {
        reward -= 8
      } else if (hitSelf) {
        reward -= 15
      }
    } else {
      // Récompense basée sur le chemin Manhattan optimal
      const currentManhattan = Math.abs(currentHead.x - apple.x) + Math.abs(currentHead.y - apple.y)
      const newManhattan = Math.abs(newHead.x - apple.x) + Math.abs(newHead.y - apple.y)

      if (newManhattan < currentManhattan) {
        // Se rapproche sur le chemin Manhattan optimal
        reward += 2
      } else if (newManhattan > currentManhattan) {
        // S'éloigne du chemin optimal
        reward -= 1
      }

      // Bonus si le mouvement est exactement sur la direction optimale
      if (this.isOnOptimalManhattanPath(currentHead, newHead, apple)) {
        reward += 1
      }

      // Pénalité progressive si trop lent
      if (this.stepsSurvived > 30) {
        reward -= 0.2
      }
    }

    return reward
  }

  private checkDangerInDirection(
    head: Position,
    body: Position[],
    direction: Direction,
    gridSize: number,
  ): boolean {
    const nextPosition = this.getNextPosition(head, direction)

    // Vérifier les murs
    if (
      nextPosition.x < 0 ||
      nextPosition.x >= gridSize ||
      nextPosition.y < 0 ||
      nextPosition.y >= gridSize
    ) {
      return true
    }

    // Vérifier la collision avec le corps
    return body.some((segment) => segment.x === nextPosition.x && segment.y === nextPosition.y)
  }

  private getNextPosition(position: Position, direction: Direction): Position {
    switch (direction) {
      case 'UP':
        return { x: position.x, y: position.y - 1 }
      case 'DOWN':
        return { x: position.x, y: position.y + 1 }
      case 'LEFT':
        return { x: position.x - 1, y: position.y }
      case 'RIGHT':
        return { x: position.x + 1, y: position.y }
    }
  }

  public async makeDecision(gameState: GameState): Promise<AIDecision> {
    if (!this.model) {
      throw new Error('Model not initialized')
    }

    const state = this.encodeGameState(gameState)
    const stateTensor = tf.tensor2d([state])

    const prediction = this.model.predict(stateTensor) as tf.Tensor
    const actionProbs = (await prediction.array()) as number[][]

    // Exploration vs exploitation avec epsilon decay
    const shouldExplore = Math.random() < this.config.epsilon
    let actionIndex: number

    if (shouldExplore) {
      actionIndex = Math.floor(Math.random() * 4)
    } else {
      actionIndex = actionProbs[0].indexOf(Math.max(...actionProbs[0]))
    }

    // Decay epsilon après chaque décision
    if (this.config.epsilon > this.config.epsilonMin) {
      this.config.epsilon *= this.config.epsilonDecay
    }

    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT']
    const direction = directions[actionIndex]
    const confidence = actionProbs[0][actionIndex]

    // Nettoyer les tensors
    stateTensor.dispose()
    prediction.dispose()

    return { direction, confidence }
  }

  public addToMemory(trainingData: TrainingData): void {
    this.memory.push(trainingData)

    // Limiter la taille de la mémoire
    if (this.memory.length > this.config.memorySize) {
      this.memory.shift()
    }
  }

  public async trainModel(): Promise<void> {
    if (!this.model || this.memory.length < this.config.batchSize) {
      return
    }

    // Préparer les données d'entraînement
    const batch = this.getRandomBatch(this.config.batchSize)
    const states = batch.map((data) => data.state)
    const actions = batch.map((data) => data.action)
    const rewards = batch.map((data) => data.reward)
    const nextStates = batch.map((data) => data.nextState)

    // Calculer les Q-values cibles
    const targets = await this.calculateTargets(states, actions, rewards, nextStates)

    // Entraîner le modèle
    const history = await this.model.fit(tf.tensor2d(states), tf.tensor2d(targets), {
      epochs: this.config.epochs,
      batchSize: this.config.batchSize,
      verbose: 0,
    })

    // Mettre à jour les métriques
    this.performance.trainingLoss.push(history.history.loss[0] as number)
  }

  private getRandomBatch(size: number): TrainingData[] {
    const batch: TrainingData[] = []
    for (let i = 0; i < size; i++) {
      const randomIndex = Math.floor(Math.random() * this.memory.length)
      batch.push(this.memory[randomIndex])
    }
    return batch
  }

  private async calculateTargets(
    states: number[][],
    actions: number[],
    rewards: number[],
    nextStates: number[][],
  ): Promise<number[][]> {
    if (!this.model) return []

    const targets = states.map((_, index) => {
      const target = new Array(4).fill(0)
      target[actions[index]] = rewards[index]
      return target
    })

    // Améliorer avec Q-learning
    const nextStateTensor = tf.tensor2d(nextStates)
    const nextPredictions = this.model.predict(nextStateTensor) as tf.Tensor
    const nextQValues = (await nextPredictions.array()) as number[][]

    for (let i = 0; i < states.length; i++) {
      const maxNextQ = Math.max(...nextQValues[i])
      targets[i][actions[i]] = rewards[i] + this.config.gamma * maxNextQ
    }

    nextStateTensor.dispose()
    nextPredictions.dispose()

    return targets
  }

  public updatePerformance(score: number, gameWon: boolean): void {
    this.performance.gamesPlayed++
    this.performance.averageScore =
      (this.performance.averageScore * (this.performance.gamesPlayed - 1) + score) /
      this.performance.gamesPlayed

    if (score > this.performance.bestScore) {
      this.performance.bestScore = score
    }

    if (gameWon) {
      this.performance.winRate =
        (this.performance.winRate * (this.performance.gamesPlayed - 1) + 1) /
        this.performance.gamesPlayed
    }
  }

  public setPerformance(performance: AIPerformance): void {
    this.performance = { ...performance }
  }

  public getPerformance(): AIPerformance {
    return { ...this.performance }
  }

  public async saveModel(): Promise<void> {
    if (this.model) {
      await this.model.save('localstorage://snake-ai-model')
    }
  }

  public async loadModel(): Promise<void> {
    try {
      this.model = (await tf.loadLayersModel('localstorage://snake-ai-model')) as tf.Sequential
      this.model.compile({
        optimizer: tf.train.adam(this.config.learningRate),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
      })
    } catch (e) {
      console.error(e)
      console.log('No saved model found, using new model')
      this.initializeModel()
    }
  }

  public resetPerformance(): void {
    this.performance = {
      gamesPlayed: 0,
      averageScore: 0,
      bestScore: 0,
      winRate: 0,
      trainingLoss: [],
    }
  }

  public resetMemory(): void {
    this.memory = []
  }

  public updateConfig(newConfig: Partial<AITrainingConfig>): void {
    Object.assign(this.config, newConfig)
  }

  private calculateFreeSpacesInDirections(
    head: Position,
    body: Position[],
    gridSize: number,
  ): Record<Direction, number> {
    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT']
    const freeSpaces: Record<Direction, number> = {
      UP: 0,
      DOWN: 0,
      LEFT: 0,
      RIGHT: 0,
    }

    directions.forEach((direction) => {
      let count = 0
      let currentPos = this.getNextPosition(head, direction)

      while (
        currentPos.x >= 0 &&
        currentPos.x < gridSize &&
        currentPos.y >= 0 &&
        currentPos.y < gridSize &&
        !body.some((segment) => segment.x === currentPos.x && segment.y === currentPos.y)
      ) {
        count++
        currentPos = this.getNextPosition(currentPos, direction)
        if (count > 10) break // Éviter les boucles infinies
      }

      freeSpaces[direction] = count
    })

    return freeSpaces
  }

  private calculateTrapRisk(head: Position, body: Position[], gridSize: number): number {
    const freeSpaces = this.calculateFreeSpacesInDirections(head, body, gridSize)
    const totalFreeSpaces = Object.values(freeSpaces).reduce((sum, spaces) => sum + spaces, 0)
    
    // Plus l'espace libre total est faible, plus le risque de piège est élevé
    const maxPossibleSpaces = gridSize * 4 // Approximation
    return 1 - Math.min(totalFreeSpaces / maxPossibleSpaces, 1)
  }

  private isOnOptimalManhattanPath(currentHead: Position, newHead: Position, apple: Position): boolean {
    // Vérifie si le mouvement va dans la direction optimale vers la pomme
    const deltaX = apple.x - currentHead.x
    const deltaY = apple.y - currentHead.y
    
    const moveX = newHead.x - currentHead.x
    const moveY = newHead.y - currentHead.y
    
    // Le mouvement est optimal s'il réduit la distance sur l'axe le plus éloigné
    if (Math.abs(deltaX) >= Math.abs(deltaY)) {
      // Priorité à l'axe X
      return (deltaX > 0 && moveX > 0) || (deltaX < 0 && moveX < 0)
    } else {
      // Priorité à l'axe Y
      return (deltaY > 0 && moveY > 0) || (deltaY < 0 && moveY < 0)
    }
  }
}
