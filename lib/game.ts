export type CellState = 'empty' | 'ship' | 'hit' | 'miss';
export type ShipOrientation = 'horizontal' | 'vertical';

export interface Position {
  row: number;
  col: number;
}

export interface Ship {
  id: string;
  name: string;
  size: number;
  positions: Position[];
  hits: Position[];
}

export interface Board {
  cells: CellState[][];
  ships: Ship[];
  width: number;
  height: number;
}

export interface GameResult {
  winner: 'player' | 'opponent';
  totalTurns: number;
  shotsFired: number;
}

export const BOARD_SIZE = 10;
export const SHIPS = [
  { id: 'carrier', name: 'Carrier', size: 5 },
  { id: 'battleship', name: 'Battleship', size: 4 },
  { id: 'destroyer', name: 'Destroyer', size: 3 },
  { id: 'submarine', name: 'Submarine', size: 3 },
  { id: 'patrol', name: 'Patrol Boat', size: 2 },
];

export function createBoard(width: number = BOARD_SIZE, height: number = BOARD_SIZE): Board {
  return {
    cells: Array(height).fill(null).map(() => Array(width).fill('empty')),
    ships: [] as Ship[],
    width,
    height,
  };
}

export function isValidPosition(board: Board, pos: Position): boolean {
  return pos.row >= 0 && pos.row < board.height && pos.col >= 0 && pos.col < board.width;
}

export function canPlaceShip(board: Board, ship: { size: number }, position: Position, orientation: ShipOrientation): boolean {
  const positions = getShipPositions(position, ship.size, orientation);
  
  // Check if all positions are valid and empty
  for (const pos of positions) {
    if (!isValidPosition(board, pos)) return false;
    if (board.cells[pos.row][pos.col] !== 'empty') return false;
  }
  
  return true;
}

export function getShipPositions(start: Position, size: number, orientation: ShipOrientation): Position[] {
  const positions: Position[] = [];
  for (let i = 0; i < size; i++) {
    if (orientation === 'horizontal') {
      positions.push({ row: start.row, col: start.col + i });
    } else {
      positions.push({ row: start.row + i, col: start.col });
    }
  }
  return positions;
}

export function placeShip(board: Board, ship: { id: string; name: string; size: number }, position: Position, orientation: ShipOrientation): Board {
  const positions = getShipPositions(position, ship.size, orientation);
  
  const newBoard: Board = { 
    ...board, 
    cells: board.cells.map(row => [...row]), 
    ships: board.ships.map(s => ({ ...s, hits: [...s.hits] }))
  };
  
  // Mark cells as having ships
  for (const pos of positions) {
    newBoard.cells[pos.row][pos.col] = 'ship';
  }
  
  // Add ship to board
  newBoard.ships.push({
    id: ship.id,
    name: ship.name,
    size: ship.size,
    positions,
    hits: [],
  });
  
  return newBoard;
}

export function placeShipsRandomly(board: Board): Board {
  const newBoard: Board = {
    width: board.width,
    height: board.height,
    cells: board.cells.map(row => [...row]),
    ships: [] as Ship[]
  };
  
  for (const shipConfig of SHIPS) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!placed && attempts < maxAttempts) {
      const orientation: ShipOrientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      const row = Math.floor(Math.random() * board.height);
      const col = Math.floor(Math.random() * board.width);
      
      if (canPlaceShip(newBoard, shipConfig, { row, col }, orientation)) {
        const updatedBoard = placeShip(newBoard, shipConfig, { row, col }, orientation);
        newBoard.cells = updatedBoard.cells;
        newBoard.ships = updatedBoard.ships;
        placed = true;
      }
      attempts++;
    }
    
    if (!placed) {
      throw new Error(`Failed to place ${shipConfig.name} after ${maxAttempts} attempts`);
    }
  }
  
  return newBoard;
}

export function fireAt(board: Board, position: Position): { board: Board; hit: boolean; sunk: boolean } {
  if (!isValidPosition(board, position)) {
    throw new Error('Invalid position');
  }
  
  const cell = board.cells[position.row][position.col];
  
  if (cell === 'hit' || cell === 'miss') {
    throw new Error('Position already fired upon');
  }
  
  const newBoard: Board = { ...board, cells: board.cells.map(row => [...row]), ships: board.ships.map(ship => ({ ...ship, hits: [...ship.hits] })) };
  
  if (cell === 'ship') {
    newBoard.cells[position.row][position.col] = 'hit';
    
    // Find the ship that was hit and record the hit
    const ship = newBoard.ships.find(s => 
      s.positions.some(p => p.row === position.row && p.col === position.col)
    );
    
    if (ship) {
      ship.hits.push(position);
    }
    
    const sunk = ship !== undefined && ship.hits.length === ship.size;
    return { board: newBoard, hit: true, sunk };
  } else {
    newBoard.cells[position.row][position.col] = 'miss';
    return { board: newBoard, hit: false, sunk: false };
  }
}

export function isGameOver(board: Board): boolean {
  return board.ships.every(ship => ship.hits.length === ship.size);
}

export function getRandomEmptyCell(board: Board): Position {
  const emptyCells: Position[] = [];
  
  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      if (board.cells[row][col] === 'empty' || board.cells[row][col] === 'ship') {
        emptyCells.push({ row, col });
      }
    }
  }
  
  if (emptyCells.length === 0) {
    throw new Error('No empty cells available');
  }
  
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

export function getAdjacentPositions(position: Position, board: Board): Position[] {
  const adjacent: Position[] = [
    { row: position.row - 1, col: position.col },
    { row: position.row + 1, col: position.col },
    { row: position.row, col: position.col - 1 },
    { row: position.row, col: position.col + 1 },
  ];
  
  return adjacent.filter(pos => isValidPosition(board, pos));
}

export function getUnfiredAdjacentPositions(position: Position, board: Board): Position[] {
  const adjacent = getAdjacentPositions(position, board);
  return adjacent.filter(pos => {
    const cell = board.cells[pos.row][pos.col];
    return cell !== 'hit' && cell !== 'miss';
  });
}