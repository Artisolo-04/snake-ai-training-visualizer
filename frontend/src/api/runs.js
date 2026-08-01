const API_BASE = 'http://localhost:4000/api';

export async function saveRun({ episodes, bestScore, finalEpsilon, qTable }) {
  const res = await fetch(`${API_BASE}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ episodes, bestScore, finalEpsilon, qTable }),
  });
  if (!res.ok) throw new Error('Failed to save run');
  return res.json();
}

export async function listRuns() {
  const res = await fetch(`${API_BASE}/runs`);
  if (!res.ok) throw new Error('Failed to list runs');
  return res.json();
}

export async function loadRun(id) {
  const res = await fetch(`${API_BASE}/runs/${id}`);
  if (!res.ok) throw new Error('Failed to load run');
  return res.json();
}
