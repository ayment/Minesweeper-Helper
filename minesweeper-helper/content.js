function getSquare(row, col) {
  return document.getElementById(`${row}_${col}`);
}

function getNeighbors(row, col) {
  const res = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const n = getSquare(row + dr, col + dc);
      if (n) res.push(n);
    }
  }
  return res;
}

function getSquareState(square) {
  if (!square) return null;

  if (square.classList.contains("bombflagged")) {
    return { type: "flag" };
  }

  for (let i = 0; i <= 8; i++) {
    if (square.classList.contains(`open${i}`)) {
      return { type: "number", value: i };
    }
  }

  if (square.classList.contains("blank")) {
    return { type: "unknown" };
  }

  return null;
}

function analyzeLogic() {
  document.querySelectorAll(".ms-safe")
    .forEach(el => el.classList.remove("ms-safe"));

  let changed;
  const assumedMines = new Set();

  do {
    changed = false;

    document.querySelectorAll(".square").forEach(square => {
      if (!square.id.includes("_")) return;

      const [r, c] = square.id.split("_").map(Number);
      const state = getSquareState(square);
      if (!state || state.type !== "number") return;

      const neighbors = getNeighbors(r, c);
      let flags = 0;
      let unknowns = [];

      neighbors.forEach(n => {
        const s = getSquareState(n);
        if (!s) return;
        if (s.type === "flag" || assumedMines.has(n)) flags++;
        else if (s.type === "unknown") unknowns.push(n);
      });
      if (flags === state.value) {
        unknowns.forEach(n => {
          if (!n.classList.contains("ms-safe")) {
            n.classList.add("ms-safe");
            changed = true;
          }
        });
      }
      if (flags + unknowns.length === state.value) {
        unknowns.forEach(n => {
          if (!assumedMines.has(n)) {
            assumedMines.add(n);
            changed = true;
          }
        });
      }
    });

  } while (changed);
}

function getConstraints() {
  const frontier = new Set();
  const constraints = [];

  document.querySelectorAll(".square").forEach(square => {
    if (!square.id.includes("_")) return;

    const [r, c] = square.id.split("_").map(Number);
    const state = getSquareState(square);
    if (!state || state.type !== "number") return;

    const neighbors = getNeighbors(r, c);
    let unknowns = [];
    let flags = 0;

    neighbors.forEach(n => {
      const s = getSquareState(n);
      if (!s) return;
      if (s.type === "flag") flags++;
      if (s.type === "unknown") unknowns.push(n);
    });

    if (unknowns.length > 0) {
      unknowns.forEach(n => frontier.add(n));
      constraints.push({
        cells: unknowns,
        mines: state.value - flags
      });
    }
  });

  return { frontier: [...frontier], constraints };
}

function satisfies(assign, constraints) {
  for (const c of constraints) {
    let count = 0;
    for (const cell of c.cells) {
      if (assign.get(cell)) count++;
    }
    if (count !== c.mines) return false;
  }
  return true;
}

function findSafe(frontier, constraints) {
  const mineCount = new Map();
  frontier.forEach(c => mineCount.set(c, 0));
  let total = 0;

  function backtrack(i, assign) {
    if (i === frontier.length) {
      if (satisfies(assign, constraints)) {
        total++;
        frontier.forEach(c => {
          if (assign.get(c)) mineCount.set(c, mineCount.get(c) + 1);
        });
      }
      return;
    }

    const cell = frontier[i];

    assign.set(cell, false);
    backtrack(i + 1, assign);

    assign.set(cell, true);
    backtrack(i + 1, assign);

    assign.delete(cell);
  }

  backtrack(0, new Map());

  if (total === 0) return [];

  return frontier.filter(c => mineCount.get(c) === 0);
}

function Probability() {
  const { frontier, constraints } = getConstraints();

  if (frontier.length === 0 || frontier.length > 15) return;

  const safeCells = findSafe(frontier, constraints);
  safeCells.forEach(c => c.classList.add("ms-safe"));
}

document.addEventListener("mouseup", () => {
  setTimeout(() => {
    analyzeLogic();
    if (document.querySelectorAll(".ms-safe").length === 0) {
      Probability();
    }
  }, 60);
});
