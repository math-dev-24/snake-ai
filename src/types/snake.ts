export type Position = {
  x: number
  y: number
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

export type Snake = {
  body: Position[]
  direction: Direction
  speed: number
  isEating: boolean
}
