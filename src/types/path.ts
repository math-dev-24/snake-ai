export type PathNode = {
  x: number
  y: number
  cost: number
  heuristic: number
  total: number
  parent?: PathNode
}
