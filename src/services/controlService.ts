import type { Direction } from '@/types'

export class ControlService {
  private isListening: boolean = false
  private onDirectionChange?: (direction: Direction) => void

  startListening(onDirectionChange: (direction: Direction) => void): void {
    this.onDirectionChange = onDirectionChange
    this.isListening = true
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
  }

  stopListening(): void {
    this.isListening = false
    this.onDirectionChange = undefined
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isListening || !this.onDirectionChange) return

    let direction: Direction | null = null

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        direction = 'UP'
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        direction = 'DOWN'
        break
      case 'ArrowLeft':
      case 'a':
      case 'A':
        direction = 'LEFT'
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        direction = 'RIGHT'
        break
    }

    if (direction) {
      event.preventDefault()
      this.onDirectionChange(direction)
    }
  }
}
