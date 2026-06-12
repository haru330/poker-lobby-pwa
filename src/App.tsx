import { GameProvider, useGameState } from './state/GameContext';
import { NetworkProvider } from './network/NetworkProvider';
import { SetupScreen } from './screens/SetupScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { GameScreen } from './screens/GameScreen';

function Router() {
  const state = useGameState();
  switch (state.phase) {
    case 'setup':
      return <SetupScreen />;
    case 'home':
      return <HomeScreen />;
    case 'lobby':
      return <LobbyScreen />;
    case 'game':
      return <GameScreen />;
    default:
      return <SetupScreen />;
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
