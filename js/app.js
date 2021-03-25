'use strict'
console.log('app.js Loaded');

const MINE = '💣';
const FLAG = '🚩';
const LIVE = '❤️';
const EMPTY = ' ';
const NORMAL = '😃';
const DEAD = '🤯';
const WIN = '😎';
const BUTTON = '<button class="field"> </button>';

var gLevels = [
    { SIZE: 4, MINES: 2, LIVES: 1 },
    { SIZE: 8, MINES: 12, LIVES: 2 },
    { SIZE: 12, MINES: 30, LIVES: 3 }
];

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: 0
}

// Modal
var gBoardMatrix; //[{ minesAroundCount: 4, isShown: true,isMine: false, isMarked: true}];
var elStatus = document.querySelector('.status')

// This is called when page loads
function initGame(el = undefined) {
    el = (!el) ? document.querySelector('.level > input:checked') : el;
    resetGameValues(el.value);
    gBoardMatrix = buildBoard(el.value);
    renderLives()
    elStatus.innerText = `${NORMAL}`
    renderBoard(gBoardMatrix, '.board-container')
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

// Called on click to show the value under the cell
function cellClicked(elCell) {
    if (!gGame.isOn && gGame.shownCount > 0) return;
    var cell = {
        i: parseInt(elCell.dataset.i),
        j: parseInt(elCell.dataset.j)
    }
    var modalCell = gBoardMatrix[cell.i][cell.j]
    if (!modalCell.isShown) {
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
    if (!gGame.isOn && gGame.shownCount >= 1) gGame.isOn = true;
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
    renderCell(cell, (modalCell.minesAroundCount === 0) ? EMPTY : modalCell.minesAroundCount);
    gGame.shownCount++;
}

// Game ends when all mines are marked, and all the other cells are shown
function checkGameOver(isOver = false) {
    if (isOver) {
        elStatus.innerText = DEAD;
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
        renderFlags();
    } 
    return true;
}

// Render Flags on all Mines if they are not showen
function renderFlags() {
    for (var i = 0; i < gBoardMatrix.length; i++) {
        for (var j = 0; j < gBoardMatrix[i].length; j++) {
            if (!gBoardMatrix[i][j].isShown && gBoardMatrix[i][j].isMine)
                elCell.innerHTML = `<button class="field">${FLAG}</button>`
        }
    }
}

// When user clicks a cell with no mines around, we need to open not only that cell, 
// but also its neighbors. NOTE: start with a basic implementation that only opens the non-mine 1st degree neighbors BONUS:
// if you have the time later, try to work more like the real algorithm (see description at the Bonuses section below)
function expandShown(board, i, j) {
    var cell = { i, j, }
    if (board[i][j].minesAroundCount === 0 && !board[i][j].isShown && !board[i][j].isMine) {
        console.log(i, j);
        board[i][j].isShown = true
        renderCell(cell, EMPTY);
        gGame.shownCount++
        renderNeighbors(i, j, board)
    } else if (board[i][j].minesAroundCount > 0 && !board[i][j].isShown) {
        console.log(i, j);
        board[i][j].isShown = true
        renderCell(cell, board[i][j].minesAroundCount);
        gGame.shownCount++
    }
}

function renderNeighbors(cellI, cellJ, board) {
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ)
            continue;
            if (j < 0 || j >= board[i].length)
                continue;
            if (board[i][j].minesAroundCount >= 0 && !board[i][j].isShown) {
                expandShown(board, i, j)
            }
        }
    }
}


// resetting Game values
function resetGameValues(level = 0) {
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.secsPassed = 0;
    gGame.lives = gLevels[level].LIVES;
}