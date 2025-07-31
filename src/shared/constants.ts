import type { Direction, Position } from '@/types'

export const directions: Record<Direction, Position> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

export const directionKeys: Direction[] = Object.keys(directions) as Direction[]

export const directionValues: Position[] = Object.values(directions)
