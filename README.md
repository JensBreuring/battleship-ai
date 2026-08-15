# Battleship AI

A single-player Battleship game played against an AI opponent, built with Next.js, TypeScript, and Tailwind CSS.

## Project Setup

This project was initialized with the following configuration:

- **Framework**: Next.js 16.3.1 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Linting**: ESLint with Next.js configuration
- **Package Manager**: npm

## Tech Stack

- **Next.js**: React framework with server components and App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React 19**: Latest React version

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## CI/CD

This project uses GitHub Actions for continuous integration. The CI workflow runs on every push and pull request to the main branch:

- Installs dependencies
- Runs ESLint
- Builds the project

This ensures code quality and catches build errors early.

## Development

The project is ready for game development. The basic Next.js structure is in place with TypeScript and Tailwind CSS configured.

## Game Status

✅ **AI Implementation Complete** - Computer-controlled opponents with three difficulty levels have been implemented.

### AI Opponents

The game includes three AI difficulty levels:

- **Easy**: Fires at random squares
- **Medium**: Intelligent hunting - once it hits a ship, it targets adjacent squares to find the rest
- **Hard**: Smarter hunting - uses checkerboard pattern for initial targeting and focused hunting for partially hit ships

### Test Results

Based on 200 simulated games per difficulty level against a random opponent:

- **Easy AI**: Mean 92.83 turns (random firing)
- **Medium AI**: Mean 66.27 turns (28.6% faster than Easy)
- **Hard AI**: Mean 63.57 turns (4.1% faster than Medium, 31.5% faster than Easy)

The tests confirm that Hard AI performs better than Medium AI, and Medium AI performs better than Easy AI as required.
