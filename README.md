# Snake AI Training Visualizer

I wanted to actually understand reinforcement learning instead of just reading about it, so I built Snake, then built an AI from scratch to learn how to play it, in the browser, with no ML libraries. This repo is that project — you can play Snake yourself, or train a Q-learning agent and watch it play. I went with a lab-instrument look for the UI (`SPECIMEN 001 // AUTONOMOUS AGENT`, live status readouts, terminal-style monospace labels) because it fit the "watching an experiment run" feel I wanted.

## Status

✅ Working end to end — you can play manually, train an agent, watch it play, and save/reload past training runs.

## Stack

- **Frontend**: React 19 + Vite 6 + Tailwind CSS v4
- **Backend**: Express + PostgreSQL
- **AI**: Tabular Q-learning, written from scratch in JavaScript (no TensorFlow/PyTorch, just a Q-table and the Bellman equation)

## What it does

- **Manual mode** — play Snake yourself with arrow keys
- **AI mode** — swap to watch a trained agent play using what it learned, with a speed slider (ms/step) to slow it down or speed it up
- **Train an agent live** — one button, `TRAIN 20000 EPISODES`, runs thousands of episodes in the background across multiple Web Workers, so the tab doesn't freeze while it's learning
- **Save/load runs** — every finished training run (Q-table, episodes, best score, epsilon) gets saved to PostgreSQL, and the `Load past run` dropdown lets you pick any past run and watch that exact agent play again
- **Play manually while it trains** — training happens off the main thread, so I can keep playing while an agent trains in the background, and I can stop training early with `STOP` if I want

| | Manual mode | AI mode |
|---|---|---|
| Controls | Arrow keys | None — the Q-table decides every move |
| Runs on | Main thread | Trained in Web Workers, played back on main thread |
| Best score | Tracked separately per session | Tracked per training run, saved to the database |
| Can play while training? | Yes | N/A (it *is* the training) |

## How the AI actually works

I didn't want to just throw a neural net at this without understanding what was happening, so I started with plain tabular Q-learning. The agent never sees the raw grid — every step, its surroundings get packed into a state string of 17 booleans:

| Feature | What it tells the agent |
|---|---|
| `dangerStraight/Left/Right` | Will the very next cell in this direction kill it? |
| `dangerStraight2/Left2/Right2` | Same check, but 2 cells ahead |
| `trapStraight/Left/Right` | Flood-fill check — does this move seal it into a space too small for its own body? |
| `movingUp/Down/Left/Right` | Its current direction |
| `foodUp/Down/Left/Right` | Where the food is relative to its head |

That string is the key into the Q-table. Action choice is ε-greedy (random early on, exploiting what it's learned more as epsilon decays), and every step updates the table with the Bellman equation — no gradient descent, no layers, just a table getting filled in over thousands of episodes.

Reward isn't just "+10 for food, -10 for dying" either — I added distance-based shaping (small reward for moving closer to the food, small penalty for moving away), because without it the agent took forever to stumble onto its first food by pure chance.

## Results

Not a tuned-to-perfection agent, but a tabular Q-table genuinely learning to survive and hunt food over time, no hand-coded pathfinding:

| Run | Episodes | Best score | Final epsilon |
|---|---|---|---|
| #1 | 20,000 | 66 | 0.010 |
| #2 | 20,000 | 66 | 0.010 |
| #3 | 20,000 | 67 | 0.010 |
| Latest | 20,000 | **72** | 0.010 |

Best score ever hit: **72**. Average score over the last 100 training episodes on that run: **33.6** — meaning it's not just one lucky episode, it's consistently decent, not just occasionally good.

Every finished run shows two live charts side by side: **Score / Episode** (the actual learning curve — you can watch it climb from near-zero and level off as the agent gets better) and **Epsilon (Exploration)** (the decay curve showing it moving from mostly-random moves down to mostly using what it's learned).

## The build, roughly in order

This wasn't planned end to end, I built it feature by feature and fixed problems as they showed up:

1. Built the pure Snake game engine first, no AI, just game logic
2. Playable manual UI
3. Agent interface — turned the raw grid into relative actions (straight/left/right) and a compact encoded state
4. Basic Q-learning agent, toggle between manual and AI mode
5. Live training charts + speed control
6. Backend + API routes to save/list/load runs, wired it up to the frontend
7. The agent kept plateauing on score — turned out its state was too simple, it couldn't see two steps ahead. Added two-step lookahead and that unstuck it
8. It still trapped itself in dead ends sometimes even with lookahead, so I added flood-fill trap detection so it can tell if a move boxes it in
9. At 20k episodes training started freezing the UI — batched it async first, then moved training into a Web Worker, then parallelized it across multiple workers to actually use more CPU cores
10. Added stop/cancel so I'm not stuck waiting for a full run, and made manual play work while training runs in the background
11. Added distance-based reward shaping to speed up early learning
12. Bug fixes along the way — best score tracking in manual mode, JSON body size limit for bigger saved Q-tables

## Architecture
```
snake-ai-training-visualizer/
├── schema.sql                      # creates the training_runs table
├── backend/
│   ├── server.js                   # Express app entrypoint
│   ├── db.js                       # PostgreSQL connection pool
│   └── routes/
│       └── api.js                  # save / list / load training runs
└── frontend/
    └── src/
        ├── game/
        │   ├── gameEngine.js       # pure Snake step/state logic, no AI awareness
        │   └── agentInterface.js   # encodes raw game state into the agent's binary state string
        ├── ai/
        │   └── qlearning.js        # Q-table, epsilon-greedy action choice, Bellman update
        ├── workers/
        │   └── trainWorker.js      # runs training episodes off the main thread
        ├── api/
        │   └── runs.js             # talks to the backend (save/list/load runs)
        └── App.jsx                 # spawns workers, merges Q-tables, manual/AI play
```

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
cp .env.example .env   # edit DB credentials — make sure DB_NAME matches a real database you created

# create the database table (only needed once)
psql -U postgres -d your_db_name -f ../schema.sql

npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000/api/hello

You'll need a local PostgreSQL server running, with a database already created and `DB_NAME` in `.env` pointing at it. `schema.sql` at the repo root creates the one table this project needs (`training_runs`) — run it once against that database before starting the backend, or your first training save will fail.

## What's next

- [ ] Show the reward curve updating live during training, not just after it finishes
- [ ] Deploy a live demo
- [ ] Try swapping the Q-table for a small neural net (DQN) and compare how it does against tabular Q-learning
- [ ] Add tests for the state encoding and reward function

## Why I built this

I'm a student, and this is one of a few very different projects I build — I also work on security tooling, finance apps, and other stuff that has nothing to do with AI. I picked RL for this one because I wanted a project where I couldn't fake understanding — with a Q-table you can literally see every state the agent knows about and why it picked an action. Watching it go from a snake that dies immediately to one that clears the board just by tuning the state and rewards taught me more about RL than any tutorial did.
