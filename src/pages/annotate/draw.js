import emojiImages from '\0emoji-images';
import {HEADER_HEIGHT} from '../../shared/constants';

// Time to wait before treating single touch events as a separate intention
const DEFAULT_COLOUR = '#000000';
const DEFAULT_EMOJI_SIZE = 120;
const DEFAULT_EMOJI_FONT = 'arial';
const DEFAULT_LINE_WIDTH = 2;

const TOOL_PENCIL = 0;
const TOOL_BRUSH = 1;
const TOOL_EMOJI = 2;

let canvasDraw = document.getElementById('canvas-draw');
let canvasEmoji = document.getElementById('canvas-emoji');
let ctxDraw = canvasDraw.getContext('2d');
let ctxEmoji = canvasEmoji.getContext('2d');

let chosenTool = TOOL_PENCIL;
let toolsMenuButton = document.getElementById('btn-tools');
let toolsModal = document.getElementById('modal-tools');
let pencilButton = document.getElementById('btn-pencil');
let brushButton = document.getElementById('btn-brush');
let emojiMenuButton = document.getElementById('btn-emoji');
let emojiModal = document.getElementById('modal-emoji');
let optionsMenuButton = document.getElementById('btn-options');
let optionsModal = document.getElementById('modal-options');
let colourInputContainer = document.getElementById('input-colour-container');
let colourInput = document.getElementById('input-colour');
let sizeInput = document.getElementById('input-size');
let sizeOutput = document.getElementById('size-output');
let trashButton = document.getElementById('btn-trash');

let touchedEmojiIndex = -1;
let chosenEmoji = null;
let resizeTouchDelta = null;
let moveTouchDelta = null;
let isDrawing = false;
let isRedrawing = false;
let isResizing = false;

// Store emoji details so we can redraw them when moved/resized
let stampedEmojis = [];

/**
 * Returns index of touched emoji in the stampedEmojis, or -1 if none touched.
 */
function indexOfSelectedEmoji(coords) {

  for (let i=0; i < stampedEmojis.length; i++) {

    let emoji = stampedEmojis[i];

    if (coords.x >= emoji.x - (emoji.width / 2) &&
        coords.x <= emoji.x + (emoji.width / 2) &&
        coords.y >= emoji.y - (emoji.height / 2) &&
        coords.y <= emoji.y + (emoji.height / 2)) {
      return i;
    }

  }

  return -1;

}

function drawEmoji(emoji, coords, width, height, isSelected) {

  // Centre the image around tap/click coords
  const x = coords.x - width / 2;
  const y = coords.y - height / 2;

  ctxEmoji.drawImage(emoji, x, y, width, height);

  if (isSelected) {
    // Highlight with a border
    const prevStrokeStyle = ctxEmoji.strokeStyle;
    const prevLineWidth = ctxEmoji.lineWidth;
    ctxEmoji.strokeStyle = '#10f9e6';
    ctxEmoji.lineWidth = 2;
    ctxEmoji.setLineDash([5, 2]);
    ctxEmoji.strokeRect(x-2, y-2, width+4, height+4);
    ctxEmoji.strokeStyle = prevStrokeStyle;
    ctxEmoji.lineWidth = prevLineWidth;
    ctxEmoji.setLineDash([]);
  }

}

function onDrawingMouseDown(coords) {

  const x = coords.x;
  const y = coords.y;

  ctxDraw.beginPath();
  ctxDraw.moveTo(x, y);

  isDrawing = true;

}

function closeModals() {
  optionsModal.classList.remove('show');
  toolsModal.classList.remove('show');
  emojiModal.classList.remove('show');
}

function onTouchStartOrMouseDown(e) {

  e.preventDefault();

  closeModals();

  let touch = e.changedTouches && e.changedTouches.length ?
    e.changedTouches[0] : null;

  let coords = touch ? {x: touch.pageX - canvasEmoji.offsetLeft, y: touch.pageY - canvasEmoji.offsetTop - HEADER_HEIGHT} :
    {x: e.clientX - canvasEmoji.offsetLeft, y: e.clientY - canvasEmoji.offsetTop - HEADER_HEIGHT};

  touchedEmojiIndex = indexOfSelectedEmoji(coords);

  if (touchedEmojiIndex > -1) {
    // Selected an existing emoji - fall through
    return;
  }

  if (chosenTool === TOOL_EMOJI) {

    // Add new emoji
    // Increase default SVG size
    const width = chosenEmoji.width * 2.5;
    const height = chosenEmoji.height * 2.5;

    stampedEmojis.push({
      image: chosenEmoji,
      x: coords.x,
      y: coords.y,
      width: width,
      height: height
    });

    redrawEmojisOnNextFrame();

  } else {
    onDrawingMouseDown(coords);
  }

}

function onTouchMoveOrMouseMove(e) {

  e.preventDefault();

  let touches = e.changedTouches || [];
  let touch1 = touches.length ? touches[0] : null;
  let touch2 = touches.length > 1 ? touches[1] : null;

  let coords1 = touch1 ? {x: touch1.pageX - canvasEmoji.offsetLeft, y: touch1.pageY - canvasEmoji.offsetTop - HEADER_HEIGHT} :
    {x: e.clientX - canvasEmoji.offsetLeft, y: e.clientY - canvasEmoji.offsetTop - HEADER_HEIGHT};

  if (touchedEmojiIndex >= 0) {

    let emoji = stampedEmojis[touchedEmojiIndex];

    if (touch2) {

      // Resize emoji
      isResizing = true;

      let coords2 = {x: touch2.pageX - canvasEmoji.offsetLeft, y: touch2.pageY - canvasEmoji.offsetTop - HEADER_HEIGHT};
      let newResizeTouchDelta = {x: Math.abs(coords2.x - coords1.x),
        y: Math.abs(coords2.y - coords1.y)};

      if (resizeTouchDelta) {

        emoji.width += newResizeTouchDelta.x - resizeTouchDelta.x;
        emoji.height += newResizeTouchDelta.y - resizeTouchDelta.y;

        redrawEmojisOnNextFrame();

      }

      resizeTouchDelta = newResizeTouchDelta;

    } else if (!isResizing) {

      if (moveTouchDelta) {

        // Single touch - moving the emoji - update its position
        emoji.x = coords1.x - moveTouchDelta.x;
        emoji.y = coords1.y - moveTouchDelta.y;

        redrawEmojisOnNextFrame();

      } else {

        moveTouchDelta = {x: coords1.x - emoji.x, y: coords1.y - emoji.y};

      }

    }

  } else if (isDrawing) {

    ctxDraw.lineTo(coords1.x, coords1.y);
    ctxDraw.stroke();

  }
}

function onTouchEndOrMouseUp(e) {
  isDrawing = false;
  isResizing = false;
  touchedEmojiIndex = -1;
  resizeTouchDelta = null;
  moveTouchDelta = null;
}

function highlightSelectedTool(selectedButton) {
  var toolButtons = toolsModal.getElementsByTagName('button');
  for (var i=0; i < toolButtons.length; i++) {
    var button = toolButtons[i];
    if (button === selectedButton) {
      button.classList.add('selected');
    } else {
      button.classList.remove('selected');
    }
  }
}

function onNewEmojiClick(event) {

  chosenTool = TOOL_EMOJI;
  chosenEmoji = event.currentTarget;

  emojiModal.classList.remove('show');

  highlightSelectedTool(emojiMenuButton);

}

function redrawEmojisOnNextFrame() {
  if (!isRedrawing) {
    isRedrawing = true;
    requestAnimationFrame(redrawEmojis);
  }
}

function redrawEmojis() {

  console.log('start redraw', performance.now());

  ctxEmoji.clearRect(0, 0, canvasEmoji.width, canvasEmoji.height);

  for (let i=0; i < stampedEmojis.length; i++) {
    let emoji = stampedEmojis[i];
    drawEmoji(emoji.image, {x: emoji.x, y: emoji.y}, emoji.width, emoji.height, i === touchedEmojiIndex);
  }

  console.log('finish redraw', performance.now());

  isRedrawing = false;

}

function clearDrawing() {
  ctxDraw.clearRect(0, 0, canvasDraw.width, canvasDraw.height);
}

function clearEmojis() {
  stampedEmojis = [];
  redrawEmojis();
}

function clearCanvases() {
  clearDrawing();
  clearEmojis();
}

function onColourClickOrChange() {
  updateCanvasDrawContext();
  colourInputContainer.classList.add('selected');
  emojiMenuButton.classList.remove('selected');
}

function onSizeChange(event) {
  updateCanvasDrawContext();
  sizeOutput.innerHTML = event.target.value;
}

function initCanvases() {

  /*
  const width = window.innerWidth;
  const height = window.innerHeight - HEADER_HEIGHT;
  
  canvasDraw.width = width; 
  canvasDraw.height = height;
  canvasEmoji.width = width;
  canvasEmoji.height = height;
  */

  // Emoji canvas is on top so will receive the interaction events
  canvasEmoji.addEventListener('touchstart', onTouchStartOrMouseDown, false);
  canvasEmoji.addEventListener('touchmove', onTouchMoveOrMouseMove, false);
  canvasEmoji.addEventListener('touchend', onTouchEndOrMouseUp, false);

  canvasEmoji.addEventListener('mousedown', onTouchStartOrMouseDown, false);
  canvasEmoji.addEventListener('mousemove', onTouchMoveOrMouseMove, false);
  canvasEmoji.addEventListener('mouseup', onTouchEndOrMouseUp, false);

  ctxDraw.strokeStyle = DEFAULT_COLOUR;
  ctxDraw.lineWidth = DEFAULT_LINE_WIDTH;
  ctxDraw.lineJoin = 'round';
  ctxDraw.lineCap = 'round';
  ctxDraw.shadowColor = DEFAULT_COLOUR;
}

function updateCanvasDrawContext() {
  ctxDraw.strokeStyle = colourInput.value;
  ctxDraw.lineWidth = sizeInput.value;
  ctxDraw.shadowBlur = chosenTool === TOOL_BRUSH ? 2 : 0;
  ctxDraw.shadowColor = colourInput.value;
}

function initEmojis() {

  let html = '';

  for (let i=0; i < emojiImages.length; i++) {
    const path = emojiImages[i];
    html += `<img src="${path}" alt="Emoji"/>`;
  }

  emojiModal.innerHTML = html;

}

function initControls() {

  toolsMenuButton.addEventListener('click', () => {
    toolsModal.classList.toggle('show');
    emojiModal.classList.remove('show');
    optionsModal.classList.remove('show');
  });

  // Add click handlers to emojis so you can select one
  let availableEmojis = document.querySelectorAll('#modal-emoji img');
  for (let i=0; i < availableEmojis.length; i++) {
    let emoji = availableEmojis[i];
    emoji.addEventListener('click', onNewEmojiClick);
  }

  emojiMenuButton.addEventListener('click', () => {
    emojiModal.classList.toggle('show');
    toolsModal.classList.toggle('show');
  });

  pencilButton.addEventListener('click', () => {
    chosenTool = TOOL_PENCIL;
    updateCanvasDrawContext();
    toolsModal.classList.remove('show');
    highlightSelectedTool(pencilButton);
  });

  brushButton.addEventListener('click', () => {
    chosenTool = TOOL_BRUSH;
    updateCanvasDrawContext();
    toolsModal.classList.remove('show');
    highlightSelectedTool(brushButton);
  });

  optionsMenuButton.addEventListener('click', () => {
    optionsModal.classList.toggle('show');
    toolsModal.classList.remove('show');
    emojiModal.classList.remove('show');
  });

  colourInput.addEventListener('input', onColourClickOrChange);
  colourInput.addEventListener('click', onColourClickOrChange);

  sizeInput.addEventListener('change', onSizeChange);
  sizeInput.value = DEFAULT_LINE_WIDTH;
  sizeOutput.innerHTML = DEFAULT_LINE_WIDTH;

  trashButton.addEventListener('click', () => {
    // TODO introduce confirmation prompt!
    clearCanvases();
  })

}

export default {

  init: function () {
    initCanvases();
    initEmojis();
    initControls();
  },

  snapshot: function () {
    // Remove highlights ready to snapshot the canvas
    touchedEmojiIndex = -1;
    redrawEmojis();
  }

};
