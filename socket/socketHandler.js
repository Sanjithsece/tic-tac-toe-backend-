const Room = require("../models/Room");
const Match = require("../models/Match");
const User = require("../models/User");

const winningCombos = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

const checkWinner = (board) => {
  for (let combo of winningCombos) {
    const [a,b,c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

module.exports = (io) => {

  const activeGames = {}; 
  // roomCode => { board, turn, players, moves }

  io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    // JOIN ROOM
    socket.on("joinRoom", async ({ roomCode, userId }) => {
      const room = await Room.findOne({ roomCode }).populate("players");

      if (!room) {
        socket.emit("errorMessage", "Room not found");
        return;
      }

      socket.join(roomCode);

      if (!activeGames[roomCode]) {
        activeGames[roomCode] = {
          board: Array(9).fill(null),
          turn: "X",
          players: room.players.map(p => p._id.toString()),
          moves: []
        };
      }

      io.to(roomCode).emit("playerJoined", {
        message: "Player joined room",
        players: activeGames[roomCode].players
      });

      io.to(roomCode).emit("gameState", activeGames[roomCode]);
    });

    // MAKE MOVE
    socket.on("makeMove", async ({ roomCode, index, userId }) => {

      const game = activeGames[roomCode];
      if (!game) return;

      if (game.board[index]) return;

      const playerSymbol =
        game.players[0] === userId ? "X" : "O";

      if (game.turn !== playerSymbol) return;

      game.board[index] = playerSymbol;
      game.moves.push(index);

      const winner = checkWinner(game.board);

      if (winner) {
        const winnerId =
          winner === "X" ? game.players[0] : game.players[1];

        await Match.create({
          player1: game.players[0],
          player2: game.players[1],
          winner: winnerId,
          moves: game.moves,
          roomId: null
        });

        await User.findByIdAndUpdate(winnerId, {
          $inc: { wins: 1, rating: 20 }
        });

        const loserId =
          winner === "X" ? game.players[1] : game.players[0];

        await User.findByIdAndUpdate(loserId, {
          $inc: { losses: 1, rating: -10 }
        });

        io.to(roomCode).emit("gameOver", {
          winner
        });

        delete activeGames[roomCode];
        return;
      }

      if (!game.board.includes(null)) {

        await Match.create({
          player1: game.players[0],
          player2: game.players[1],
          winner: null,
          moves: game.moves
        });

        await User.updateMany(
          { _id: { $in: game.players } },
          { $inc: { draws: 1 } }
        );

        io.to(roomCode).emit("gameOver", {
          winner: null
        });

        delete activeGames[roomCode];
        return;
      }

      game.turn = game.turn === "X" ? "O" : "X";

      io.to(roomCode).emit("gameState", game);
    });

    // CHAT
    socket.on("sendMessage", ({ roomCode, user, message }) => {
      io.to(roomCode).emit("receiveMessage", {
        user,
        message,
        time: new Date()
      });
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });

  });
};
