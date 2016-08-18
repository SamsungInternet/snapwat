import {HEADER_HEIGHT} from './constants';
import {playCameraSound} from './audio';

let homeHeader = document.getElementById('header-home');
let snapshotHeader = document.getElementById('header-snapshot');
let backBtn = document.getElementById('btn-back');
let downloadBtn = document.getElementById('btn-download');
let cameraCanvas = document.getElementById('canvas-camera');
let drawingCanvas = document.getElementById('canvas-draw');
let saveCanvas = document.getElementById('canvas-save');
let saveImage = document.getElementById('image-save');
let saveCtx = saveCanvas.getContext('2d');


function openSnapshot() {

  playCameraSound();

  // Copy the other canvases onto a single canvas for saving
  saveCtx.drawImage(cameraCanvas, 0, 0);
  saveCtx.drawImage(drawingCanvas, 0, 0);

  // Add the URL at the bottom
  saveCtx.fillText('snapw.at', saveCanvas.width - 72, saveCanvas.height - 15);

  saveImage.src = saveCanvas.toDataURL('image/png');
  saveImage.style.display = 'block';

  homeHeader.style.display = 'none';
  snapshotHeader.style.display = 'block';

}

function initSave() {

  saveCanvas.width  = window.innerWidth;
  saveCanvas.height = window.innerHeight - HEADER_HEIGHT;

  saveCtx.font = '16px Arial';
  saveCtx.fillStyle = '#fff';

  saveImage.width  = window.innerWidth;
  saveImage.height = window.innerHeight - HEADER_HEIGHT;

}

function initControls() {

  downloadBtn.addEventListener('click', () => {
    openSnapshot();
  });

  backBtn.addEventListener('click', () => {
    homeHeader.style.display = 'block';
    snapshotHeader.style.display = 'none';
    saveImage.style.display = 'none';
  });

}

export default function() {

  initSave();
  initControls();

}
