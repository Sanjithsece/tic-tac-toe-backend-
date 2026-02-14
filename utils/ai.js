const winningCombos = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

const checkWinner = (board, player) => {
  return winningCombos.some(combo =>
    combo.every(index => board[index] === player)
  );
};

const emptyIndexes = (board) =>
  board.map((v, i) => (v === null ? i : null)).filter(v => v !== null);

exports.easyAI = (board) => {
  const available = emptyIndexes(board);
  return available[Math.floor(Math.random() * available.length)];
};

exports.mediumAI = (board, ai, human) => {
  const available = emptyIndexes(board);

  for (let i of available) {
    const copy = [...board];
    copy[i] = ai;
    if (checkWinner(copy, ai)) return i;
  }

  for (let i of available) {
    const copy = [...board];
    copy[i] = human;
    if (checkWinner(copy, human)) return i;
  }

  return exports.easyAI(board);
};

const minimax = (board, player, ai, human) => {
  const available = emptyIndexes(board);

  if (checkWinner(board, human)) return { score: -10 };
  if (checkWinner(board, ai)) return { score: 10 };
  if (available.length === 0) return { score: 0 };

  const moves = [];

  for (let i of available) {
    const move = {};
    move.index = i;
    board[i] = player;

    if (player === ai) {
      move.score = minimax(board, human, ai, human).score;
    } else {
      move.score = minimax(board, ai, ai, human).score;
    }

    board[i] = null;
    moves.push(move);
  }

  let bestMove;
  if (player === ai) {
    let bestScore = -Infinity;
    moves.forEach((move, i) => {
      if (move.score > bestScore) {
        bestScore = move.score;
        bestMove = i;
      }
    });
  } else {
    let bestScore = Infinity;
    moves.forEach((move, i) => {
      if (move.score < bestScore) {
        bestScore = move.score;
        bestMove = i;
      }
    });
  }

  return moves[bestMove];
};

exports.hardAI = (board, ai = "O", human = "X") => {
  return minimax(board, ai, ai, human).index;
};
