'use strict'
console.log('app.js Loaded');

const MINE = '💣';
const FLAG = '🚩';
const LIVE = '❤️';
const EMPTY = ' ';
const NORMAL = '😃';
const DEAD = '🤯';
const WIN = '😎';
const HINT = '❔';
const HINT_ON = '❓';
const BUTTON = '<button class="field"> </button>';

var gLevels = [
    { SIZE: 4, MINES: 2, LIVES: 1, HINTS: 1 },
    { SIZE: 8, MINES: 12, LIVES: 2, HINTS: 2 },
    { SIZE: 12, MINES: 30, LIVES: 3, HINTS: 3 }
];

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: 0,
    hints: 0,
    hintIsOn: false
}

//var gHistoryActions = {${step}: {board,lives,hints}

// todo:
/*
1. UI
2. safe click button 1 2 3, for few second show how naby safe clicks remained
3. flags remaining
4. Manually positioned mines
5.Best Score Keep the best score in local storage (per level) and show it on the page
Create a “manually create” mode in which user first positions the mines (by clicking cells) and then plays.
6. Undo Add an “UNDO” button, each click on that button takes the game back by one step (can go all the way back to game start).
*/

// Modal
var gBoardMatrix; //[{ minesAroundCount: 4, isShown: true,isMine: false, isMarked: true}];
var elStatus = document.querySelector('.status')

// This is called when page loads
function initGame(el = undefined) {
    el = (!el) ? document.querySelector('.level > input:checked') : el;
    resetGameValues(el.value);
    gBoardMatrix = buildBoard(el.value);
    renderLives();
    renderHints();
    elStatus.innerText = NORMAL;
    renderBoard(gBoardMatrix, '.board-container');
    console.log(gBoardMatrix);
}

// Builds the board Set mines at random locations Call setMinesNegsCount() 
// Return the created board setMinesNegsCount(board)
function buildBoard(level = 0) {
    var board = [];
    for (var i = 0; i < gLevels[level].SIZE; i++) {
        board[i] = []
        for (var j = 0; j < gLevels[level].SIZE; j++) {
            board[i][j] = { minesAroundCount: 0, isShown: false, isMine: false, isMarked: false };
        }
    }
    setMinesOnBoard(board, gLevels[level].MINES);
    setMinesNegsCount(board);
    return board;
}

// Setting on Random location mines on the board
function setMinesOnBoard(board, mines) {
    for (var count = 0; count < mines; count++) {
        var i = getRandomInt(0, board.length)
        var j = getRandomInt(0, board[0].length)
        if (board[i][j].isMine && (!board[i][j].isShown)) setMinesOnBoard(board, 1); else board[i][j].isMine = true;
    }
}

// Count mines around each cell and set the cell's minesAroundCount.
function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            board[i][j].minesAroundCount = countNeighbors(i, j, board)
        }
    }
}

// Render the board as a <table> to the page
function renderBoard(board, selector) {
    var strHTML = '<table border="0"><tbody>';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var cell = (!board[i][j].isShown) ? BUTTON : (board[i][j].isMine) ? MINE : board[i][j].minesAroundCount;
            var className = 'cell cell' + i + '-' + j;
            var dataId = `data-i="${i}" data-j="${j}"`;
            strHTML += `<td ${dataId} class="${className}" onClick="cellClicked(this)" oncontextmenu="cellMarked(this)"> ${cell} </td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>';
    var elContainer = document.querySelector(selector);
    elContainer.innerHTML = strHTML;
}

function renderLives() {
    var elLives = document.querySelector('.lives');
    var strHTML = '';
    for (var i = 0; i < gGame.lives; i++) {
        strHTML += LIVE;
    }
    elLives.innerText = 'LIVES:' + strHTML;

}

function renderHints() {
    var elLives = document.querySelector('.hints');
    var strHTML = '';
    for (var i = 0; i < gGame.lives; i++) {
        strHTML += `<button class="hint" onClick="hintOn(this)">${HINT}</button>`;
    }
    elLives.innerHTML = `HINTS: ${strHTML}`
}


function hintOn(elHint) {
    if (elHint.innerText === HINT && !gGame.hintIsOn) {
        elHint.innerText = HINT_ON;
        gGame.hintIsOn = true;
    } else if (elHint.innerText === HINT_ON && gGame.hintIsOn) {
        elHint.innerText = HINT;
        gGame.hintIsOn = false;
    }
}

// return an Hint element that is On 
function getHintElementIsOn(elHints) {
    for (var i = 0; i < elHints.length; i++) {
        if (elHints[i].innerText === HINT_ON) return elHints[i];
    }
}

// show a clicked cell and all the 8 around for 0.5s;
function hintAroundCell(elCell) {
    if (gGame.isOn) {
        var elHints = document.querySelectorAll('.hint')
        var elHint = getHintElementIsOn(elHints);
        var cell = {
            i: parseInt(elCell.dataset.i),
            j: parseInt(elCell.dataset.j)
        }
        var board = gBoardMatrix[cell.i][cell.j];
        var value = (board.isMine) ? MINE : (board.minesAroundCount > 0) ? board.minesAroundCount : EMPTY;
        renderCell(cell, value);
        renderNeighbors(cell.i, cell.j, gBoardMatrix, false)
        setTimeout(()=>{
            renderCell(cell, BUTTON);
            renderNeighbors(cell.i, cell.j, gBoardMatrix, false, true)
        } , 500)
        elHint.remove();
        gGame.hintIsOn = false;
    }
}

// Called on click to show the value under the cell
function cellClicked(elCell) {
    if (!gGame.isOn && gGame.shownCount > 0) return;
    var cell = {
        i: parseInt(elCell.dataset.i),
        j: parseInt(elCell.dataset.j)
    }
    var modalCell = gBoardMatrix[cell.i][cell.j]
    if (!modalCell.isShown) {
        // Click as Hint
        if (gGame.hintIsOn) {
            hintAroundCell(elCell)
            return;
        }
        // Clicked on Mine
        if (modalCell.isMine) {
            if (gGame.shownCount > 0) {
                modalCell.isShown = true
                renderCell(cell, MINE);
                gGame.lives--;
                renderLives()
                if (gGame.lives === 0) checkGameOver(true);
            } else {
                onFirstClickMine(cell, modalCell);
            }
            // Clicked on non Mine around or have mine around
        } else if (modalCell.minesAroundCount >= 0) {
            expandShown(gBoardMatrix, cell.i, cell.j);
        }
    }
    if (!gGame.isOn && gGame.shownCount >= 1 && gGame.lives > 0) {
        gGame.isOn = true;
        startTimer();
    }
    checkGameOver();
}

// Called on right click to mark a cell (suspected to be a mine) Search the web (and implement) how to hide the context menu on right click
function cellMarked(elCell) {
    var cell = {
        i: elCell.dataset.i,
        j: elCell.dataset.j
    }
    var modalCell = gBoardMatrix[cell.i][cell.j]
    if (!modalCell.isShown) {
        if (modalCell.isMarked) {
            elCell.innerHTML = BUTTON
            modalCell.isMarked = false
            gGame.cellMarked--;
        } else {
            elCell.innerHTML = `<button class="field">${FLAG}</button>`
            modalCell.isMarked = true
            gGame.cellMarked++;
        }
    }
}

// Change Mine position if its first click
function onFirstClickMine(cell, modalCell) {
    modalCell.isMine = false
    setMinesOnBoard(gBoardMatrix, 1);
    setMinesNegsCount(gBoardMatrix);
    expandShown(gBoardMatrix, cell.i, cell.j)
    gGame.shownCount++;
}

// Game ends when all mines are marked, and all the other cells are shown
function checkGameOver(isOver = false) {
    if (isOver) {
        elStatus.innerText = DEAD;
        stopTimer();
        gGame.isOn = false;
        return true;
    } else if (gGame.isOn) {
        for (var i = 0; i < gBoardMatrix.length; i++) {
            for (var j = 0; j < gBoardMatrix[i].length; j++) {
                if (!gBoardMatrix[i][j].isShown && !gBoardMatrix[i][j].isMine)
                    return false;
            }
        }
        elStatus.innerText = WIN;
        stopTimer();
        renderFlags();
        gGame.isOn = false;
    }
    return true;
}

// Render Flags on all Mines if they are not showen
function renderFlags() {
    for (var i = 0; i < gBoardMatrix.length; i++) {
        for (var j = 0; j < gBoardMatrix[i].length; j++) {
            if (!gBoardMatrix[i][j].isShown && gBoardMatrix[i][j].isMine) {
                var cell = document.querySelector(`.cell${i}-${j}`)
                cell.innerHTML = `<button class="field">${FLAG}</button>`
            }
        }
    }
}

// When user clicks a cell with no mines around, we need to open not only that cell, 
// but also its neighbors. NOTE: start with a basic implementation that only opens the non-mine 1st degree neighbors BONUS:
// if you have the time later, try to work more like the real algorithm (see description at the Bonuses section below)
function expandShown(board, i, j) {
    var cell = { i, j, }
    if (board[i][j].minesAroundCount === 0 && !board[i][j].isShown && !board[i][j].isMine) {
        board[i][j].isShown = true
        renderCell(cell, EMPTY);
        gGame.shownCount++
        renderNeighbors(i, j, board)
    } else if (board[i][j].minesAroundCount > 0 && !board[i][j].isShown) {
        board[i][j].isShown = true
        renderCell(cell, board[i][j].minesAroundCount);
        gGame.shownCount++
    }
}

function renderNeighbors(cellI, cellJ, board, expand = true, hide = false) {
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ)
                continue;
            if (j < 0 || j >= board[i].length)
                continue;
            if (board[i][j].minesAroundCount >= 0 && !board[i][j].isShown && expand) {
                expandShown(board, i, j)
            } else if (!expand) {
                var value = (hide) ? (board[i][j].isShown) ? board[i][j].minesAroundCount : BUTTON : 
                (board[i][j].isMine) ? MINE :
                (board[i][j].minesAroundCount > 0) ? board[i][j].minesAroundCount : EMPTY;
                renderCell({ i, j }, value);
            }
        }
    }
}


// resetting Game values
function resetGameValues(level = 0) {
    gGame.isOn = false;
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.secsPassed = 0;
    gGame.lives = gLevels[level].LIVES;
    gGame.hints = gLevels[level].HINTS;
    gGame.hintIsOn = false
    resetTimer()
}