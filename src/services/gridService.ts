import type { Position, Snake, Direction, PathNode } from '@/types'
import { directionValues } from '@/shared/constants'

export class GridService {
  private readonly GRID_SIZE = 20
  private snake: Snake
  private apple: Position
  private gameOver: boolean = false
  private score: number = 0
  private highScore: number = 0
  private currentPath: Position[] = []

  constructor() {
    this.snake = this.createInitialSnake()
    this.apple = this.generateRandomApple()
    this.updatePath()
  }

  private createInitialSnake(): Snake {
    return {
      body: [
        { x: 10, y: 10 },
        { x: 11, y: 10 },
        { x: 12, y: 10 },
      ],
      direction: 'LEFT',
      speed: 200,
      isEating: false,
    }
  }

  private generateRandomApple(): Position {
    const x = Math.floor(Math.random() * this.GRID_SIZE)
    const y = Math.floor(Math.random() * this.GRID_SIZE)

    if (
      x === 0 ||
      y === 0 ||
      x === this.GRID_SIZE - 1 ||
      y === this.GRID_SIZE - 1 ||
      this.snake.body.some((segment) => segment.x === x && segment.y === y)
    ) {
      return this.generateRandomApple()
    }
    return { x, y }
  }

  private manhattanDistance(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
  }

  private updatePath(): void {
    this.currentPath = this.calculatePath(this.getSnakeHead(), this.apple, this.getObstacles())
  }

  private calculatePath(start: Position, target: Position, obstacles: Position[]): Position[] {
    const openList: PathNode[] = []
    const closedList: PathNode[] = []

    const startNode: PathNode = {
      x: start.x,
      y: start.y,
      cost: 0,
      heuristic: this.manhattanDistance(start, target),
      total: 0,
    }

    startNode.total = startNode.cost + startNode.heuristic
    openList.push(startNode)

    while (openList.length > 0) {
      let currentIndex = 0
      for (let i = 0; i < openList.length; i++) {
        if (openList[i].total < openList[currentIndex].total) {
          currentIndex = i
        }
      }

      const currentNode = openList[currentIndex]
      openList.splice(currentIndex, 1)
      closedList.push(currentNode)

      if (currentNode.x === target.x && currentNode.y === target.y) {
        const calculatedPath: Position[] = []
        let node: PathNode | undefined = currentNode
        while (node) {
          calculatedPath.unshift({ x: node.x, y: node.y })
          node = node.parent
        }
        return calculatedPath
      }

      for (const dir of directionValues) {
        const neighborX = currentNode.x + dir.x
        const neighborY = currentNode.y + dir.y

        if (
          neighborX < 0 ||
          neighborX >= this.GRID_SIZE ||
          neighborY < 0 ||
          neighborY >= this.GRID_SIZE
        ) {
          continue
        }

        if (obstacles.some((obs) => obs.x === neighborX && obs.y === neighborY)) {
          continue
        }

        if (closedList.some((node) => node.x === neighborX && node.y === neighborY)) {
          continue
        }

        const gScore = currentNode.cost + 1
        const hScore = this.manhattanDistance({ x: neighborX, y: neighborY }, target)
        const fScore = gScore + hScore

        const existingNode = openList.find((node) => node.x === neighborX && node.y === neighborY)
        if (!existingNode) {
          openList.push({
            x: neighborX,
            y: neighborY,
            cost: gScore,
            heuristic: hScore,
            total: fScore,
            parent: currentNode,
          })
        } else if (gScore < existingNode.cost) {
          existingNode.cost = gScore
          existingNode.total = fScore
          existingNode.parent = currentNode
        }
      }
    }
    return []
  }

  getSnake(): Snake {
    return { ...this.snake }
  }

  getApple(): Position {
    return { ...this.apple }
  }

  getPath(): Position[] {
    return [...this.currentPath]
  }

  getGameState() {
    return {
      gameOver: this.gameOver,
      score: this.score,
      highScore: this.highScore,
      gridSize: this.GRID_SIZE,
    }
  }

  changeDirection(newDirection: Direction): boolean {
    const currentDir = this.snake.direction
    const isOpposite =
      (currentDir === 'UP' && newDirection === 'DOWN') ||
      (currentDir === 'DOWN' && newDirection === 'UP') ||
      (currentDir === 'LEFT' && newDirection === 'RIGHT') ||
      (currentDir === 'RIGHT' && newDirection === 'LEFT')

    if (!isOpposite) {
      this.snake.direction = newDirection
      return true
    }
    return false
  }

  moveSnake(): { success: boolean; gameOver: boolean; scoreIncreased: boolean } {
    if (this.gameOver) {
      return { success: false, gameOver: true, scoreIncreased: false }
    }

    const head = { ...this.snake.body[0] }

    switch (this.snake.direction) {
      case 'UP':
        head.y -= 1
        break
      case 'DOWN':
        head.y += 1
        break
      case 'LEFT':
        head.x -= 1
        break
      case 'RIGHT':
        head.x += 1
        break
    }

    if (head.x < 0 || head.x >= this.GRID_SIZE || head.y < 0 || head.y >= this.GRID_SIZE) {
      this.gameOver = true
      return { success: false, gameOver: true, scoreIncreased: false }
    }

    const bodyWithoutHead = this.snake.body.slice(1)
    if (bodyWithoutHead.some((segment) => segment.x === head.x && segment.y === head.y)) {
      this.gameOver = true
      return { success: false, gameOver: true, scoreIncreased: false }
    }

    const isEating = head.x === this.apple.x && head.y === this.apple.y

    const newBody = [head, ...this.snake.body]
    if (!isEating) {
      newBody.pop()
    } else {
      this.apple = this.generateRandomApple()
      this.score += 10
      if (this.score > this.highScore) {
        this.highScore = this.score
      }
    }

    this.snake = {
      ...this.snake,
      body: newBody,
      isEating,
    }

    this.updatePath()

    return { success: true, gameOver: false, scoreIncreased: isEating }
  }

  reset(): void {
    this.snake = this.createInitialSnake()
    this.apple = this.generateRandomApple()
    this.gameOver = false
    this.score = 0
    this.updatePath()
  }

  getObstacles(): Position[] {
    return this.snake.body.slice(1)
  }

  getSnakeHead(): Position {
    return { ...this.snake.body[0] }
  }

  getCurrentDirection(): Direction {
    return this.snake.direction
  }

  setSpeed(speed: number): void {
    this.snake.speed = speed
  }

  getSpeed(): number {
    return this.snake.speed
  }
}
