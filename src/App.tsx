import { Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import GameIntroPage from './components/GameIntroPage';
import StagePlayPage from './components/StagePlayPage';
import NotFound from './components/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/:gameId" element={<GameIntroPage />} />
      <Route path="/:gameId/stage/:stage" element={<StagePlayPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
