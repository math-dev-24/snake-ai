import type { Position, Direction } from './index'

export interface GameState {
  snakeHead: Position
  snakeBody: Position[]
  apple: Position
  direction: Direction
  gridSize: number
}

export interface AIDecision {
  direction: Direction
  confidence: number
}

export interface TrainingData {
  state: number[]
  action: number
  reward: number
  nextState: number[]
  done: boolean
}

export interface AITrainingConfig {
  learningRate: number
  batchSize: number
  epochs: number
  memorySize: number
  epsilon: number
  gamma: number
}

export interface AIPerformance {
  gamesPlayed: number
  averageScore: number
  bestScore: number
  winRate: number
  trainingLoss: number[]
}
