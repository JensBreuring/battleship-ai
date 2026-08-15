import { createAI, Difficulty, simulateGame } from './ai';
import { createBoard, placeShipsRandomly, getRandomEmptyCell, Position } from './game';

const GAMES_PER_DIFFICULTY = 200;

function generateRandomOpponentShots(): Position[] {
  const board = createBoard();
  placeShipsRandomly(board);
  const shots: Position[] = [];
  
  // Generate all possible shots in random order
  const allPositions: Position[] = [];
  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      allPositions.push({ row, col });
    }
  }
  
  // Shuffle
  for (let i = allPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
  }
  
  return allPositions;
}

function runSimulation(difficulty: Difficulty): number[] {
  const ai = createAI(difficulty);
  const results: number[] = [];
  
  console.log(`Running ${GAMES_PER_DIFFICULTY} games for ${difficulty} AI...`);
  
  for (let i = 0; i < GAMES_PER_DIFFICULTY; i++) {
    try {
      const opponentShots = generateRandomOpponentShots();
      const turns = simulateGame(ai, opponentShots);
      results.push(turns);
      
      if ((i + 1) % 50 === 0) {
        console.log(`  Completed ${i + 1}/${GAMES_PER_DIFFICULTY} games`);
      }
    } catch (error) {
      console.error(`Error in game ${i + 1}:`, error);
      // Use a fallback value if simulation fails
      results.push(100); // Maximum turns as fallback
    }
  }
  
  return results;
}

function calculateStats(results: number[]) {
  const sorted = [...results].sort((a, b) => a - b);
  const sum = results.reduce((acc, val) => acc + val, 0);
  const mean = sum / results.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  
  // Calculate standard deviation
  const squaredDiffs = results.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / results.length;
  const stdDev = Math.sqrt(avgSquaredDiff);
  
  return { mean, median, min, max, stdDev };
}

function compareDifficulties(easy: number[], medium: number[], hard: number[]) {
  const easyStats = calculateStats(easy);
  const mediumStats = calculateStats(medium);
  const hardStats = calculateStats(hard);
  
  console.log('\n=== AI Difficulty Performance Comparison ===\n');
  
  console.log('Easy AI (Random Firing):');
  console.log(`  Mean turns: ${easyStats.mean.toFixed(2)}`);
  console.log(`  Median turns: ${easyStats.median}`);
  console.log(`  Min turns: ${easyStats.min}`);
  console.log(`  Max turns: ${easyStats.max}`);
  console.log(`  Std deviation: ${easyStats.stdDev.toFixed(2)}`);
  
  console.log('\nMedium AI (Intelligent Hunting):');
  console.log(`  Mean turns: ${mediumStats.mean.toFixed(2)}`);
  console.log(`  Median turns: ${mediumStats.median}`);
  console.log(`  Min turns: ${mediumStats.min}`);
  console.log(`  Max turns: ${mediumStats.max}`);
  console.log(`  Std deviation: ${mediumStats.stdDev.toFixed(2)}`);
  
  console.log('\nHard AI (Smart Hunting with Probability):');
  console.log(`  Mean turns: ${hardStats.mean.toFixed(2)}`);
  console.log(`  Median turns: ${hardStats.median}`);
  console.log(`  Min turns: ${hardStats.min}`);
  console.log(`  Max turns: ${hardStats.max}`);
  console.log(`  Std deviation: ${hardStats.stdDev.toFixed(2)}`);
  
  console.log('\n=== Performance Comparison ===\n');
  
  const easyToMedium = ((easyStats.mean - mediumStats.mean) / easyStats.mean * 100).toFixed(1);
  const mediumToHard = ((mediumStats.mean - hardStats.mean) / mediumStats.mean * 100).toFixed(1);
  const easyToHard = ((easyStats.mean - hardStats.mean) / easyStats.mean * 100).toFixed(1);
  
  console.log(`Medium AI is ${easyToMedium}% faster than Easy AI on average`);
  console.log(`Hard AI is ${mediumToHard}% faster than Medium AI on average`);
  console.log(`Hard AI is ${easyToHard}% faster than Easy AI on average`);
  
  console.log('\n=== Statistical Verification ===\n');
  
  // Verify that Hard is better than Medium, and Medium is better than Easy
  const hardBetterThanMedium = hardStats.mean < mediumStats.mean;
  const mediumBetterThanEasy = mediumStats.mean < easyStats.mean;
  const hardBetterThanEasy = hardStats.mean < easyStats.mean;
  
  console.log(`Hard AI faster than Medium AI: ${hardBetterThanMedium ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Medium AI faster than Easy AI: ${mediumBetterThanEasy ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Hard AI faster than Easy AI: ${hardBetterThanEasy ? '✓ PASS' : '✗ FAIL'}`);
  
  if (hardBetterThanMedium && mediumBetterThanEasy && hardBetterThanEasy) {
    console.log('\n✓ All performance requirements met!');
  } else {
    console.log('\n✗ Some performance requirements not met.');
  }
  
  return {
    easy: easyStats,
    medium: mediumStats,
    hard: hardStats,
    testsPassed: hardBetterThanMedium && mediumBetterThanEasy && hardBetterThanEasy
  };
}

function main() {
  console.log('=== AI Difficulty Testing ===');
  console.log(`Testing ${GAMES_PER_DIFFICULTY} games per difficulty level\n`);
  
  const easyResults = runSimulation('easy');
  const mediumResults = runSimulation('medium');
  const hardResults = runSimulation('hard');
  
  const results = compareDifficulties(easyResults, mediumResults, hardResults);
  
  if (!results.testsPassed) {
    process.exit(1);
  }
}

main();