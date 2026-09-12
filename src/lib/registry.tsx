import { ComponentType, LazyExoticComponent, lazy } from 'react';
import { GameComponentProps, GameId } from './types';

export const GAME_COMPONENTS: Record<GameId, LazyExoticComponent<ComponentType<GameComponentProps>>> = {
  math: lazy(() => import('../games/math/MathGame')),
  geography: lazy(() => import('../games/geography/GeographyGame')),
  map: lazy(() => import('../games/map/MapGame')),
  logic: lazy(() => import('../games/logic/LogicGame')),
  coding: lazy(() => import('../games/coding/CodingGame')),
  chess: lazy(() => import('../games/chess/ChessGame')),
  snake: lazy(() => import('../games/snake/SnakeGame')),
  blaster: lazy(() => import('../games/blaster/BlasterGame')),
  dino: lazy(() => import('../games/dino/DinoChaosGame')),
};
