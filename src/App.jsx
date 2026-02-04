import { useState } from 'react';
import Game from './components/Game';
import AuthScreen from './components/AuthScreen';

function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="w-full h-screen flex justify-center items-center bg-gray-950">
      <div className="relative w-full max-w-md aspect-[9/16] bg-gray-800 shadow-2xl overflow-hidden border-4 border-gray-700 rounded-lg">
        {!user ? (
          <AuthScreen onLogin={setUser} />
        ) : (
          <Game user={user} onLogout={() => setUser(null)} />
        )}
      </div>
    </div>
  );
}

export default App;
