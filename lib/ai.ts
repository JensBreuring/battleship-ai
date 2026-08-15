import { Board, Position, fireAt, getRandomEmptyCell, getUnfiredAdjacentPositions, isGameOver, createBoard, placeShipsRandomly } from './game';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AI {
  getNextMove: (board: Board) => Position;
  reset: () => void;
}

export class EasyAI implements AI {
  reset(): void {
    // No state to reset for easy AI
  }

  getNextMove(board: Board): Position {
    return getRandomEmptyCell(board);
  }
}

export class MediumAI implements AI {
  private hits: Position[] = [];
  private huntingTargets: Position[] = [];

  reset(): void {
    this.hits = [];
    this.huntingTargets = [];
  }

  getNextMove(board: Board): Position {
    // If we have hunting targets, use them
    if (this.huntingTargets.length > 0) {
      const target = this.huntingTargets.pop()!;
      return target;
    }

    // Find adjacent positions to our hits
    for (const hit of this.hits) {
      const adjacent = getUnfiredAdjacentPositions(hit, board);
      for (const pos of adjacent) {
        // Only add if not already in hunting targets
        if (!this.huntingTargets.some(t => t.row === pos.row && t.col === pos.col)) {
          this.huntingTargets.push(pos);
        }
      }
    }

    // If we found hunting targets, use one
    if (this.huntingTargets.length > 0) {
      const target = this.huntingTargets.pop()!;
      return target;
    }

    // Otherwise, fire randomly
    return getRandomEmptyCell(board);
  }

  recordHit(position: Position): void {
    this.hits.push(position);
  }

  recordMiss(position: Position): void {
    // Remove from hunting targets if present
    this.huntingTargets = this.huntingTargets.filter(
      t => t.row !== position.row || t.col !== position.col
    );
  }
}

export class HardAI implements AI {
  private hits: Position[] = [];
  private huntingTargets: Position[] = [];
  private currentShipHits: Position[] = [];
  private lastHit: Position | null = null;

  reset(): void {
    this.hits = [];
    this.huntingTargets = [];
    this.currentShipHits = [];
    this.lastHit = null;
  }

  getNextMove(board: Board): Position {
    // If we have hunting targets, use them
    if (this.huntingTargets.length > 0) {
      const target = this.huntingTargets.shift()!;
      return target;
    }

    // If we have a partially hit ship, focus on it
    if (this.currentShipHits.length > 0) {
      this.generateHuntingTargetsForCurrentShip(board);
      if (this.huntingTargets.length > 0) {
        const target = this.huntingTargets.shift()!;
        return target;
      }
    }

    // Use probability-based targeting for first shot
    return this.getProbabilisticMove(board);
  }

  private generateHuntingTargetsForCurrentShip(board: Board): void {
    if (this.currentShipHits.length === 0) return;

    // If we have only one hit, try all adjacent positions
    if (this.currentShipHits.length === 1) {
      const hit = this.currentShipHits[0];
      const adjacent = getUnfiredAdjacentPositions(hit, board);
      this.huntingTargets = adjacent;
      return;
    }

    // If we have multiple hits, determine the ship orientation
    const firstHit = this.currentShipHits[0];
    const secondHit = this.currentShipHits[1];
    
    const isHorizontal = firstHit.row === secondHit.row;
    
    // Generate targets in the same direction
    const targets: Position[] = [];
    
    // Find min and max positions
    const positions = [...this.currentShipHits].sort((a, b) => 
      isHorizontal ? a.col - b.col : a.row - b.row
    );
    
    const minPos = positions[0];
    const maxPos = positions[positions.length - 1];
    
    if (isHorizontal) {
      // Try left of min
      const left = { row: minPos.row, col: minPos.col - 1 };
      if (this.isValidTarget(left, board)) targets.push(left);
      
      // Try right of max
      const right = { row: maxPos.row, col: maxPos.col + 1 };
      if (this.isValidTarget(right, board)) targets.push(right);
    } else {
      // Try above min
      const above = { row: minPos.row - 1, col: minPos.col };
      if (this.isValidTarget(above, board)) targets.push(above);
      
      // Try below max
      const below = { row: maxPos.row + 1, col: maxPos.col };
      if (this.isValidTarget(below, board)) targets.push(below);
    }
    
    this.huntingTargets = targets;
  }

  private isValidTarget(position: Position, board: Board): boolean {
    const cell = board.cells[position.row]?.[position.col];
    return cell !== undefined && cell !== 'hit' && cell !== 'miss';
  }

  private getProbabilisticMove(board: Board): Position {
    // Use a checkerboard pattern for initial targeting
    // This maximizes the chance of hitting ships since ships are at least 2 cells long
    const bestCells: Position[] = [];
    let maxScore = -1;
    
    for (let row = 0; row < board.height; row++) {
      for (let col = 0; col < board.width; col++) {
        if (board.cells[row][col] !== 'hit' && board.cells[row][col] !== 'miss') {
          // Checkerboard pattern: target cells where (row + col) is even
          const isCheckerboard = (row + col) % 2 === 0;
          const score = isCheckerboard ? 2 : 1;
          
          if (score > maxScore) {
            maxScore = score;
            bestCells.length = 0;
            bestCells.push({ row, col });
          } else if (score === maxScore) {
            bestCells.push({ row, col });
          }
        }
      }
    }
    
    // Randomly choose among best cells
    return bestCells[Math.floor(Math.random() * bestCells.length)];
  }

  recordHit(position: Position): void {
    this.hits.push(position);
    this.currentShipHits.push(position);
    this.lastHit = position;
  }

  recordMiss(position: Position): void {
    // Remove from hunting targets if present
    this.huntingTargets = this.huntingTargets.filter(
      t => t.row !== position.row || t.col !== position.col
    );
    
    // If we miss while hunting, we might need to reset current ship hits
    // if the miss indicates the ship is fully found
    if (this.currentShipHits.length > 0 && this.huntingTargets.length === 0) {
      this.currentShipHits = [];
    }
  }

  recordSunk(): void {
    // Reset current ship tracking when a ship is sunk
    this.currentShipHits = [];
    this.huntingTargets = [];
  }
}

export function createAI(difficulty: Difficulty): AI {
  switch (difficulty) {
    case 'easy':
      return new EasyAI();
    case 'medium':
      return new MediumAI();
    case 'hard':
      return new HardAI();
    default:
      return new EasyAI();
  }
}

export function simulateGame(ai: AI, opponentShots: Position[]): number {
  let playerBoard = createBoard();
  playerBoard = placeShipsRandomly(playerBoard);
  
  let opponentBoard = createBoard();
  opponentBoard = placeShipsRandomly(opponentBoard);
  
  ai.reset();
  let turns = 0;
  
  while (!isGameOver(playerBoard) && !isGameOver(opponentBoard)) {
    turns++;
    
    // AI fires at opponent
    const aiMove = ai.getNextMove(opponentBoard);
    const aiResult = fireAt(opponentBoard, aiMove);
    opponentBoard = aiResult.board;
    
    if (aiResult.hit) {
      if ('recordHit' in ai) {
        (ai as MediumAI | HardAI).recordHit(aiMove);
        if (aiResult.sunk && 'recordSunk' in ai) {
          (ai as HardAI).recordSunk();
        }
      }
    } else {
      if ('recordMiss' in ai) {
        (ai as MediumAI | HardAI).recordMiss(aiMove);
      }
    }
    
    // Opponent fires at AI (random)
    const opponentMove = opponentShots[turns - 1] || getRandomEmptyCell(playerBoard);
    const playerResult = fireAt(playerBoard, opponentMove);
    playerBoard = playerResult.board;
    
    // Safety limit to prevent infinite loops
    if (turns > 200) {
      console.warn(`Game exceeded 200 turns, stopping`);
      break;
    }
  }
  
  return turns;
}