import { GameProvider, useGameState } from './state/GameContext';
import { NetworkProvider } from './network/NetworkProvider';
import { HomeScreen } from './screens/HomeScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { GameScreen } from './screens/GameScreen';

function Router() {
  const state = useGameState();
  switch (state.phase) {
    case 'lobby':
      return <LobbyScreen />;
    case 'game':
      return <GameScreen />;
    case 'setup':
    case 'home':
    default:
      return <HomeScreen />;
  }
}

function App() {
  return (
    <GameProvider>
      <NetworkProvider>
        <Router />
      </NetworkProvider>
    </GameProvider>
  );
}

export default App;
