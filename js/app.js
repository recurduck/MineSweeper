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
const BUTTON = '<button class="btn-field"> </button>';
const FLAGED_BUTTON = `<button class="btn-field">${FLAG}</button>`;

var gLevels = [
    { SIZE: 4, MINES: 2, LIVES: 1, HINTS: 1, SAFECLICK: 1 },
    { SIZE: 8, MINES: 12, LIVES: 2, HINTS: 2, SAFECLICK: 2 },
    { SIZE: 12, MINES: 30, LIVES: 3, HINTS: 3, SAFECLICK: 3 },
    { SIZE: 0, MINES: 0, LIVES: 3, HINTS: 3, SAFECLICK: 3 }  // Editable! for costom board
];

var gGame = {
    manualMineIsOn: false,
    GameIsOn: false,
    hintIsOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: 0,
    hints: 0,
    safes: 0,
    history: [] // [{board, shownCount, markedCount, lives, hints,safes}, ...]
}

// Dark mode variable
var gDarkModeIsOn = false

var gBoard; //[{ minesAroundCount: 4, isShown: true,isMine: false, isMarked: true}];
var gBestScore;

// render Best Score on the app - if reached new best score render confetti
function renderBestScore(level = 0, reached = false) {
    gBestScore = localStorage.getItem(`bestScore${level.id}`);
    var elBestScore = document.querySelector('.best-score');
    var strHTML = `Best Score for ${level.id}: `
    strHTML += (!gBestScore) ? '-' : `${gBestScore} sec`;
    elBestScore.innerText = strHTML;
    if (reached) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

// This is called when page loads
function initGame(el = undefined, custom = false) {
    el = (!el) ? document.querySelector('.radio-label > input:checked') : el;
    if(el.value !== 3) closeCustomMenu();
    resetGameValues(el.value);
    gBoard = (custom) ? buildBoard(el.value, custom) : buildBoard(el.value);
    renderBestScore(el);
    renderLives();
    renderHints();
    renderSafeButton();
    document.querySelector('.status').innerText = NORMAL;
    renderBoard(gBoard, '.board-container');
}

// Create costom board
function createCustomBoard() {
    gLevels[3].SIZE = +document.querySelector('#rowsNum').value;
    var elInputCols = +document.querySelector('#colsNum').value;
    gLevels[3].MINES = +document.querySelector('#minesNum').value;
    initGame(undefined, elInputCols)
}
function checkMaxMines(){
    console.log('check?')
}
// Clear Mines on the board
function clearMinesOnBoard() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            gBoard[i][j].isMine = false
        }
    }
    setMinesNegsCount(gBoard)
}

// Builds the board Set mines at random locations Call setMinesNegsCount() 
// Return the created board setMinesNegsCount(board)
function buildBoard(level = 0, size = gLevels[level].SIZE) {
    var board = [];
    for (var i = 0; i < gLevels[level].SIZE; i++) {
        board[i] = []
        for (var j = 0; j < size; j++) {
            board[i][j] = { minesAroundCount: 0, isShown: false, isMine: false, isMarked: false };
        }
    }
    setMinesOnBoard(board, gLevels[level].MINES);
    setMinesNegsCount(board);
    return board;
}

// Get a Fild that its safe to click on him (call the function blinkField() )
function showSafeClick(elSafeButton) {
    if (gGame.GameIsOn && gGame.safes > 0) {
        var i = getRandomInt(0, gBoard.length)
        var j = getRandomInt(0, gBoard[0].length)
        if (!gBoard[i][j].isMine && !gBoard[i][j].isShown) {
            blinkField(i, j);
            gGame.safes--;
            if (gGame.safes > 0)
                elSafeButton.innerText = `Safe-Button x ${gGame.safes}`;
            else {
                elSafeButton.innerText = 'Safe-Button';
                elSafeButton.style.backgroundColor = 'red';
                elSafeButton.classList.add('disabled');
            }
        }
        else showSafeClick(elSafeButton);
    }
}

// Make a cell blink 3 times with green color
function blinkField(cellI, cellJ) {
    var elCell = document.querySelector(`.cell${cellI}-${cellJ} .btn-field`)
    var count = 0;
    var blink = setInterval(() => {
        elCell.style.backgroundColor = 'limegreen';
        setTimeout(() => { elCell.style.backgroundColor = 'grey' }, 150)
        if (++count === 3) clearInterval(blink);
    }, 300)
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
            var cell = (board[i][j].isMarked) ? 
                    FLAGED_BUTTON : 
                    (!board[i][j].isShown) ? BUTTON : 
                    (board[i][j].isMine) ? MINE : (board[i][j].minesAroundCount === 0)?
                    EMPTY : board[i][j].minesAroundCount;
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

// Render how many lives have the user
function renderLives() {
    var elLives = document.querySelector('.lives');
    var strHTML = LIVE.repeat(gGame.lives);
    elLives.innerText = 'LIVES:' + strHTML;
}

// Render how many lives have the user
function renderHints() {
    var elLives = document.querySelector('.hints');
    var strHTML = `<button class="btn hint" onClick="toggleHint(this)">${HINT}</button>`.repeat(gGame.hints);
    elLives.innerHTML = `HINTS: ${strHTML}`
}

// render Safe Button
function renderSafeButton() {
    document.querySelector('.safe').classList.remove('disabled')
    document.querySelector('.safe').innerText = `Safe-button x ${gGame.safes}`
    document.querySelector('.safe').style.backgroundColor = (gDarkModeIsOn) ? "#0000004d" : "darkolivegreen"
}

// toggle Hint Element and Modal ON / OFF
function toggleHint(elHint) {
    if (elHint.innerText === HINT && !gGame.hintIsOn && gGame.GameIsOn) {
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
    if (gGame.GameIsOn) {
        var elHints = document.querySelectorAll('.hint')
        var elHint = getHintElementIsOn(elHints);
        var cell = {
            i: parseInt(elCell.dataset.i),
            j: parseInt(elCell.dataset.j)
        }
        var board = gBoard[cell.i][cell.j];
        var value = (board.isMine) ? MINE : (board.minesAroundCount > 0) ? board.minesAroundCount : EMPTY;
        renderCell(cell, value);
        renderNeighbors(cell.i, cell.j, gBoard, false)
        setTimeout(() => {
            renderCell(cell, BUTTON);
            renderNeighbors(cell.i, cell.j, gBoard, false, true)
        }, 500)
        elHint.remove();
        gGame.hintIsOn = false;
    }
}

// Called on click to show the value under the cell
function cellClicked(elCell) {
    if (!gGame.GameIsOn && gGame.shownCount > 0) return;
    var cell = {
        i: parseInt(elCell.dataset.i),
        j: parseInt(elCell.dataset.j)
    }
    var modalCell = gBoard[cell.i][cell.j]
    if (!modalCell.isShown && !modalCell.isMarked) {
        // Click as Hint
        if (gGame.hintIsOn) {
            hintAroundCell(elCell)
            return;
        }
        // Click as Set Mine
        if (gGame.manualMineIsOn) {
            modalCell.isMine = true

            setMinesNegsCount(gBoard);
            return;
        }
        // Add Game Step
        gGame.history.push(addGameStep());
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
            expandShown(gBoard, cell.i, cell.j);
        }
    }
    if (!gGame.GameIsOn && gGame.shownCount >= 1 && gGame.lives > 0) {
        gGame.GameIsOn = true;
        document.querySelector('.set-mines').classList.add('btn-disabled');
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
    gGame.history.push(addGameStep());
    var modalCell = gBoard[cell.i][cell.j]
    if (!modalCell.isShown) {
        if (modalCell.isMarked) {
            elCell.innerHTML = BUTTON
            modalCell.isMarked = false
            gGame.cellMarked--;
        } else {
            elCell.innerHTML = `<button class="btn-field">${FLAG}</button>`
            modalCell.isMarked = true
            gGame.cellMarked++;
        }
    }
}

// Change Mine position if its first click
function onFirstClickMine(cell, modalCell) {
    modalCell.isMine = false
    setMinesOnBoard(gBoard, 1);
    setMinesNegsCount(gBoard);
    expandShown(gBoard, cell.i, cell.j)
    gGame.shownCount++;
}

// Game ends when all mines are marked, and all the other cells are shown
function checkGameOver(isOver = false) {
    if (isOver) {
        document.querySelector('.status').innerText = DEAD;
        stopTimer();
        gGame.GameIsOn = false;
        return true;
    } else if (gGame.GameIsOn) {
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard[i].length; j++) {
                if (!gBoard[i][j].isShown && !gBoard[i][j].isMine)
                    return false;
            }
        }
        document.querySelector('.status').innerText = WIN;
        var level = document.querySelector('.radio-label > input:checked');
        // Update Best Score if Win and its a best score
        stopTimer();
        renderFlags();
        gGame.GameIsOn = false;
        if (gGame.secsPassed < localStorage.getItem(`bestScore${level.id}`) || !localStorage.getItem(`bestScore${level.id}`)) {
            localStorage.setItem(`bestScore${level.id}`, gGame.secsPassed);
            renderBestScore(level, true)
        }
    }
    return true;
}

// Render Flags on all Mines if they are not showen
function renderFlags() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (!gBoard[i][j].isShown && gBoard[i][j].isMine) {
                var cell = document.querySelector(`.cell${i}-${j}`)
                cell.innerHTML = `<button class="btn-field">${FLAG}</button>`
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

// "Click" on all the Neighbors of Cell
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
                var value = (hide) ? (board[i][j].isShown) ? (board[i][j].isMine) ? MINE : board[i][j].minesAroundCount : BUTTON : (board[i][j].isMine) ? MINE :
                    (board[i][j].minesAroundCount > 0) ? board[i][j].minesAroundCount : EMPTY;
                renderCell({ i, j }, value);
            }
        }
    }
}

// Get the last step in the History list and render it
function undoStep() {
    if (gGame.history.length > 0 && gGame.GameIsOn) {
        var backStep = gGame.history.pop();
        gBoard = backStep.board;
        gGame.shownCount = backStep.shownCount;
        gGame.markedCount = backStep.markedCount;
        gGame.lives = backStep.lives;
        gGame.hints = backStep.hints;
        renderBoard(gBoard, '.board-container');
        if (gGame.history.length === 0)
            initGame();
    }
}

// resetting Game values
function resetGameValues(level = 0) {
    gGame.GameIsOn = false;
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.secsPassed = 0;
    gGame.lives = gLevels[level].LIVES;
    gGame.hints = gLevels[level].HINTS;
    gGame.safes = gLevels[level].SAFECLICK;
    gGame.hintIsOn = false
    gGame.history = [];
    document.querySelector('.set-mines').classList.remove('btn-disabled')
    resetTimer()
}

// toggle Manual Mine ON / OFF
function toggleManualMine() {
    var button = document.querySelector('.set-mines');
    if (!gGame.manualMineIsOn && !gGame.GameIsOn && gGame.shownCount === 0) {
        button.style.backgroundColor = ('lightgreen');
        gGame.manualMineIsOn = true;
        clearMinesOnBoard()
        
    }
    else if (gGame.manualMineIsOn && !gGame.GameIsOn) {
        button.style.backgroundColor = ((gDarkModeIsOn) ? '#0000004d' : 'darkolivegreen');
        gGame.manualMineIsOn = false;
    }
}

// toggle Dark mode ON / OFF
function toggleDarkMode() {
    gDarkModeIsOn = !gDarkModeIsOn;
    var elBody = document.querySelector('body');
    var elButtons = document.querySelectorAll('.btn');
    var elDetails = document.querySelectorAll('.details')
    var eltable = document.querySelector('table')
    elBody.classList.toggle('dark-mode');
    for (var i = 0; i < elButtons.length; i++)
        elButtons[i].classList.toggle('btn-dark');
    renderSafeButton();
    for (var i = 0; i < elDetails.length; i++)
        elDetails[i].classList.toggle('details-dark');
    renderBestScore(document.querySelector('.radio-label > input:checked'));
    eltable.classList.toggle('table-dark');
}

// Show Custom menu 
function openCustomMenu() {
    var elCustom = document.querySelector('.custom')
    elCustom.style.display = 'block';
}

// Hide Custom menu
function closeCustomMenu() {
    var elCustom = document.querySelector('.custom')
    elCustom.style.display = 'none';
}
