'use strict'
console.log('Util.js Loaded');

var gHour = 0;
var gMin = 0;
var gSec = 0;
var gStopTime = true;

function countNeighbors(cellI, cellJ, mat) {
  var neighborsCount = 0;
  for (var i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= mat.length) continue;
    for (var j = cellJ - 1; j <= cellJ + 1; j++) {
      if (i === cellI && j === cellJ) continue;
      if (j < 0 || j >= mat[i].length) continue;
      if (mat[i][j].isMine) neighborsCount++;
    }
  }
  return neighborsCount;
}


function renderCell(location, value) {
  // Select the elCell and set the value
  var elCell = document.querySelector(`.cell${location.i}-${location.j}`);
  elCell.innerHTML = value;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

function startTimer() {
  if (gStopTime) {
    gStopTime = false;
    timerCycle();
  }
}

function stopTimer() {
  if (gStopTime == false) {
    gStopTime = true;
  }
}

function resetTimer() {
  document.querySelector('.time').innerText = '00:00';
  gStopTime = true;
  gSec = 0;
  gMin = 0;
}

function timerCycle() {
  if (gStopTime == false) {
      gGame.secsPassed++;
      gSec = parseInt(gSec);
      gMin = parseInt(gMin);
      gSec = gSec + 1;  
      if (gSec == 60) {
          gMin = gMin + 1;
          gSec = 0;
      }
      if (gMin == 99) checkGameOver(true);
      if (gSec < 10 || gSec == 0) gSec = '0' + gSec;
      if (gMin < 10 || gMin == 0) gMin = '0' + gMin;
      document.querySelector('.time').innerText = gMin + ':' + gSec;
      setTimeout("timerCycle()", 1000);
  }
}

function copyMat(mat) {
  var board = [];
  for(var i = 0; i < mat.length; i++) {
    board[i] = [];
    for(var j = 0; j < mat[i].length; j++) {
      board[i][j] = {
        minesAroundCount: mat[i][j].minesAroundCount,
        isShown: mat[i][j].isShown,
        isMine: mat[i][j].isMine,
        isMarked: mat[i][j].isMarked
      }
    }
  }
  return board;
}

function addGameStep() {
  var board = copyMat(gBoardMatrix);
  var step = {
    board,
    shownCount: gGame.shownCount,
    markedCount: gGame.markedCount,
    lives: gGame.lives,
    hints: gGame.hints,
    safes: gGame.safes
  }
  return step;
}
// Dont show the contextmenu od right click
window.document.oncontextmenu = function(){ 
  return false;
} 