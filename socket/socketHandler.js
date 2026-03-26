const Room = require("../models/Room");
const Match = require("../models/Match");
const User = require("../models/User");

const winningCombos = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const checkWinner = (board) => {
  for (let combo of winningCombos) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combo };
    }
  }
  if (!board.includes(null)) return { winner: "draw", combo: [] };
  return null;
};

module.exports = (io) => {

  const activeGames = {};

  io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    /* ===================== */
    /* JOIN ROOM */
    /* ===================== */
    socket.on("joinRoom", async ({ roomCode, userId }) => {
      try {
        const room = await Room.findOne({ roomCode })
          .populate("players", "username");

        if (!room) {
          socket.emit("errorMessage", "Room not found");
          return;
        }

        socket.join(roomCode);

        if (!activeGames[roomCode]) {
          activeGames[roomCode] = {
            board: Array(9).fill(null),
            turn: "X",
            players: [],
            moves: []
          };
        }

        // Always sync players from DB
        activeGames[roomCode].players = room.players;

        const game = activeGames[roomCode];

        io.to(roomCode).emit("gameState", {
          board: game.board,
          turn: game.turn,
          players: game.players,
          lastMove: game.moves.at(-1) ?? null
        });
      } catch (error) {
        socket.emit("errorMessage", "Unable to join room");
      }
    });

    /* ===================== */
    /* MAKE MOVE */
    /* ===================== */
    socket.on("makeMove", async ({ roomCode, index, userId }) => {
      try {
        const game = activeGames[roomCode];
        if (!game) return;
        if (!game.players || game.players.length < 2) return;
        if (index < 0 || index > 8 || game.board[index]) return;

        const playerSymbol =
          game.players[0]?._id.toString() === userId
            ? "X"
            : game.players[1]?._id.toString() === userId
              ? "O"
              : null;

        if (!playerSymbol) return;
        if (game.turn !== playerSymbol) return;

        game.board[index] = playerSymbol;
        game.moves.push(index);

        const result = checkWinner(game.board);

        /* ===== WINNER ===== */
        if (result && result.winner !== "draw") {

          const winnerId =
            result.winner === "X"
              ? game.players[0]?._id
              : game.players[1]?._id;

          const loserId =
            result.winner === "X"
              ? game.players[1]?._id
              : game.players[0]?._id;

          if (!winnerId || !loserId) return;

          await Match.create({
            player1: game.players[0]._id,
            player2: game.players[1]._id,
            winner: winnerId,
            moves: game.moves
          });

          await User.findByIdAndUpdate(winnerId, { $inc: { wins: 1 } });
          await User.findByIdAndUpdate(loserId, { $inc: { losses: 1 } });

          await Room.deleteOne({ roomCode });

          io.to(roomCode).emit("gameOver", {
            winner: result.winner,
            combo: result.combo,
            players: game.players,
            lastMove: index
          });

          delete activeGames[roomCode];
          return;
        }

        /* ===== DRAW ===== */
        if (result && result.winner === "draw") {

          await Match.create({
            player1: game.players[0]._id,
            player2: game.players[1]._id,
            winner: null,
            moves: game.moves
          });

          await User.updateMany(
            { _id: { $in: game.players.map((p) => p._id) } },
            { $inc: { draws: 1 } }
          );

          await Room.deleteOne({ roomCode });

          io.to(roomCode).emit("gameOver", {
            winner: "draw",
            combo: [],
            players: game.players,
            lastMove: index
          });

          delete activeGames[roomCode];
          return;
        }

        /* ===== CONTINUE ===== */
        game.turn = game.turn === "X" ? "O" : "X";

        io.to(roomCode).emit("gameState", {
          board: game.board,
          turn: game.turn,
          players: game.players,
          lastMove: index
        });
      } catch (error) {
        socket.emit("errorMessage", "Unable to process move");
      }
    });

    /* ===================== */
    /* CHAT */
    /* ===================== */
    socket.on("sendMessage", ({ roomCode, user, message }) => {
      io.to(roomCode).emit("receiveMessage", {
        user,
        message,
        time: new Date()
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });

  });

};
