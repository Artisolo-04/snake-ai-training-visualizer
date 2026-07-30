# Snake AI Training Visualizer

A live, visual dashboard for watching a reinforcement learning agent learn to play Snake in real time — game on one side, the agent's "brain" (reward curve, epsilon decay, Q-values) on the other.

## Status
🚧 Work in progress — scaffold is set up, RL agent + live training visualization coming next.

## Stack
- **Frontend**: React 19 + Vite 6 + Tailwind CSS v4
- **Backend**: Express + PostgreSQL
- **AI**: Python (Q-learning / DQN agent, trained live and streamed to the frontend)

## Run it locally

**Terminal 1 — Frontend**
```bash
cd frontend
npm install
npm run dev
```

**Terminal 2 — Backend**
```bash
cd backend
npm install
cp .env.example .env   # edit DB credentials if needed
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000/api/hello

## Roadmap
- [ ] Snake game engine
- [ ] Q-learning agent (from-scratch neural net)
- [ ] WebSocket streaming of live training state
- [ ] Split-screen visualizer: gameplay + reward curve + Q-values
