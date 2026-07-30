import { useEffect, useState } from "react";

export default function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:4000/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Backend not running yet — start it with: cd backend && npm run dev"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Snake AI Training Visualizer</h1>
        <p className="text-gray-400">Generated automatically. Edit src/App.jsx to start building.</p>
        <p className="text-green-400">{message}</p>
      </div>
    </div>
  );
}
