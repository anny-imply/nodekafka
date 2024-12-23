const postEvent = async (message) => {
  const body = getEventJson(message);
  // Fetch options
  const options = {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch(`/event`, options);
  const json = await response.json();

  // Use json response
  console.log(json);
};

const getRandomIntInclusive = (min, max) => {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
};
const getGameId = () => {
  return getRandomIntInclusive(1000, 9000).toString();
};

let gameId = getGameId();

const getEventJson = (message) => {
  return {
    game: "minesweeper",
    gameId,
    time: new Date().toISOString(),
    message,
  };
};
document.getElementById("again").addEventListener("click", () => {
  // TODO: send JSON to kafka
  postEvent("play again");
  window.location.reload();
});

const container = document.getElementById("grid");
const gameOverTextElem = document.getElementById("gameOver");
const BOMB_INT = 1;

const getNormalOrBomb = () => getRandomIntInclusive(0, BOMB_INT);
const showCell = (cell) => {
  cell.classList.remove("covered");
  if (!cell.textContent) {
    cell.classList.add("bomb");
  } else {
    cell.classList.add("expose");
    if (cell.textContent === "0") {
      // hide 0
      cell.style.color = "lightgreen";
    }
  }
};
// num is positive for bomb, or 0 to negative for normal
const checkCell = (cell) => {
  // do nothing if cell has already been clicked
  if (!cell.classList.contains("covered")) return;
  if (cell.textContent === "0") {
    floodNormalCell(cell);
  } else {
    cell.classList.remove("covered");
    showCell(cell);
  }

  if (!cell.textContent) {
    return endGame(false);
  }

  // win iff when the covered cells are all bombs
  if (
    Array.from(document.querySelectorAll(".covered")).every(
      (c) => c.textContent === ""
    )
  ) {
    endGame(true);
  }
};

const getUpdatedNum = ({ num, grid, rowIndex, colIndex }) => {
  if (num === BOMB_INT) return num;
  // regular
  num = 0;
  // compute nearby bombs
  if (rowIndex > 0 && grid[rowIndex - 1][colIndex] === BOMB_INT) {
    num -= 1;
  }

  if (rowIndex + 1 < grid.length && grid[rowIndex + 1][colIndex] === BOMB_INT) {
    num -= 1;
  }

  if (colIndex > 0 && grid[rowIndex][colIndex - 1] === BOMB_INT) {
    num -= 1;
  }

  if (
    colIndex + 1 < grid[0].length &&
    grid[rowIndex][colIndex + 1] === BOMB_INT
  ) {
    num -= 1;
  }

  // diagonals
  if (
    rowIndex > 0 &&
    colIndex > 0 &&
    grid[rowIndex - 1][colIndex - 1] === BOMB_INT
  ) {
    num -= 1;
  }

  if (
    colIndex + 1 < grid[0].length &&
    rowIndex + 1 < grid.length &&
    grid[rowIndex + 1][colIndex + 1] === BOMB_INT
  ) {
    num -= 1;
  }

  if (
    colIndex + 1 < grid[0].length &&
    rowIndex > 0 &&
    grid[rowIndex - 1][colIndex + 1] === BOMB_INT
  ) {
    num -= 1;
  }

  if (
    rowIndex + 1 < grid.length &&
    colIndex > 0 &&
    grid[rowIndex + 1][colIndex - 1] === BOMB_INT
  ) {
    num -= 1;
  }
  return num;
};

const floodNormalCell = (cell) => {
  if (!cell || !cell.classList.contains("covered")) {
    return;
  }
  // cell facing down
  showCell(cell);
  if (cell.textContent !== "0") return;
  // only recurse for normal cells
  if (cell.nextSibling) {
    floodNormalCell(cell.nextSibling);
  }
  if (cell.previousSibling) {
    floodNormalCell(cell.previousSibling);
  }
  const index = Array.from(cell.parentElement.children).indexOf(cell);
  if (cell.parentElement.previousSibling) {
    floodNormalCell(
      Array.from(cell.parentElement.previousSibling.children)[index]
    );
  }
  if (cell.parentElement.nextSibling) {
    floodNormalCell(Array.from(cell.parentElement.nextSibling.children)[index]);
  }
};
const createBoard = () => {
  container.innerHTML = "";
  const grid = new Array(5).fill(0).map(() => new Array(5).fill(0));
  const values = new Set();
  grid.forEach((row, index) => {
    row.forEach(() => {
      let newVal = getNormalOrBomb();
      while (values.has(newVal)) {
        newVal = getNormalOrBomb();
      }
      row[index] = newVal;
    });
  });
  grid.forEach((row, rowIndex) => {
    const rowElem = document.createElement("div");
    rowElem.classList.add("row");
    row.forEach((num, colIndex) => {
      const cellElem = document.createElement("div");
      const updatedNum = getUpdatedNum({
        num,
        grid,
        rowIndex,
        colIndex,
      });
      // normal cells have number, bomb does not
      if (updatedNum !== BOMB_INT) {
        cellElem.textContent = Math.abs(updatedNum);
        grid[rowIndex][colIndex] = updatedNum;
      }
      cellElem.addEventListener("click", (e) => {
        // TODO: send JSON to kafka
        postEvent("clicked cell");
        checkCell(e.target);
      });
      cellElem.classList.add("cell");

      cellElem.classList.add("covered");
      rowElem.appendChild(cellElem);
    });
    container.appendChild(rowElem);
  });
};

const endGame = (didWin) => {
  // TODO: send JSON to kafka
  container.classList.add("disable");
  gameOverTextElem.parentElement.classList.remove("hide");
  gameOverTextElem.textContent = didWin ? "YOU WON :)" : "YOU LOST :(";
  postEvent(didWin ? "win" : "lost");
  for (let e of document.querySelectorAll(".covered")) {
    showCell(e);
  }
};

createBoard();
