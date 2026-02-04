import { useState } from 'react';
import Game from './components/Game';
import AuthScreen from './components/AuthScreen';
import ErrorBoundary from './components/ErrorBoundary';


function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="w-full h-screen flex justify-center items-center bg-gray-950">
      <div className="relative w-full max-w-md aspect-[9/16] bg-gray-800 shadow-2xl overflow-hidden rounded-lg">
        {!user ? (
          <AuthScreen onLogin={setUser} />
        ) : (
          <ErrorBoundary>
            <Game user={user} onLogout={() => setUser(null)} />
          </ErrorBoundary>

        )}
      </div>
    </div>
  );
}

export default App;
