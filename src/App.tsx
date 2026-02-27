import React, { useState } from 'react';
import BiometricAuth from './components/BiometricAuth';
import TodoApp from './components/TodoApp';
import './App.css';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return <BiometricAuth onAuthenticated={() => setAuthenticated(true)} />;
  }

  return <TodoApp onLock={() => setAuthenticated(false)} />;
}
