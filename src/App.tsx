import { useState, useEffect } from 'react';
import { ProjectionCalculator } from './components/ProjectionCalculator';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  // Listen for dark mode changes via custom event
  useEffect(() => {
    const handleDarkModeChange = (e: CustomEvent) => {
      setDarkMode(e.detail);
    };

    window.addEventListener('darkModeChange', handleDarkModeChange as EventListener);

    return () => {
      window.removeEventListener('darkModeChange', handleDarkModeChange as EventListener);
    };
  }, []);

  return (
    <div
      className="min-h-screen flex items-start sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: darkMode ? "#020617" : "#f1f5f9" }}
    >
      <ProjectionCalculator />
    </div>
  );
}
