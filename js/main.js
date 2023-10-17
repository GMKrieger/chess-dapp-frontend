/*
 * The code is adapted from chessboard.js examples #5000 through #5005:
 * https://chessboardjs.com/examples#5000
 */

var board = null;
var $board = $('#myBoard');
var game = new Chess();
var whiteSquareGrey = '#a9a9a9';
var blackSquareGrey = '#696969';

var squareClass = 'square-55d63';
var squareToHighlight = null;
var colorToHighlight = null;
var positionCount;

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd,
};
board = Chessboard('myBoard', config);

timer = null;

function updateStatus() {
  const whosTurn = game.turn() === 'w' ? 'White' : 'Black'

  if (game.in_checkmate()) {
    $('#status').html(`<b>Checkmate!</b> Oops, <b>${whosTurn}</b> lost.`);
  } else if (game.insufficient_material()) {
    $('#status').html(`It's a <b>draw!</b> (Insufficient Material)`);
  } else if (game.in_threefold_repetition()) {
    $('#status').html(`It's a <b>draw!</b> (Threefold Repetition)`);
  } else if (game.in_stalemate()) {
    $('#status').html(`It's a <b>draw!</b> (Stalemate)`);
  } else if (game.in_draw()) {
    $('#status').html(`It's a <b>draw!</b> (50-move Rule)`);
  } else if (game.in_check()) {
    $('#status').html(`Oops, <b>${whosTurn}</b> is in <b>check!</b>`);
  } else {
    $('#status').html(`No check, checkmate, or draw.`);
  }
}

function removeGreySquares() {
  $('#myBoard .square-55d63').css('background', '');
}

function greySquare(square) {
  var $square = $('#myBoard .square-' + square);

  var background = whiteSquareGrey;
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey;
  }

  $square.css('background', background);
}

function onDragStart(source, piece) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false;

  // or if it's not that side's turn
  if (
    (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
    (game.turn() === 'b' && piece.search(/^w/) !== -1)
  ) {
    return false;
  }
}

function onDrop(source, target) {
  undo_stack = [];
  removeGreySquares();

  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q', // NOTE: always promote to a queen for example simplicity
  });

  // Illegal move
  if (move === null) return 'snapback';

  // Highlight latest move
  $board.find('.' + squareClass).removeClass('highlight-white');

  $board.find('.square-' + move.from).addClass('highlight-white');
  squareToHighlight = move.to;
  colorToHighlight = 'white';

  $board
    .find('.square-' + squareToHighlight)
    .addClass('highlight-' + colorToHighlight);

  updateStatus();
}

function onMouseoverSquare(square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true,
  });

  // exit if there are no moves available for this square
  if (moves.length === 0) return;

  // highlight the square they moused over
  greySquare(square);

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to);
  }
}

function onMouseoutSquare(square, piece) {
  removeGreySquares();
}

function onSnapEnd() {
  board.position(game.fen());
}
