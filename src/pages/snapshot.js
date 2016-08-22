import {HEADER_HEIGHT} from '../shared/constants';
import {playCameraSound} from '../shared/audio';
import {showPage} from '../shared/helpers';

let backBtn = document.getElementById('btn-back-snapshot');
let snapshotBtn = document.getElementById('btn-snapshot');
let cameraCanvas = document.getElementById('canvas-camera');
let drawingCanvas = document.getElementById('canvas-draw');
let saveCanvas = document.getElementById('canvas-save');
let saveImage = document.getElementById('image-save');
let saveCtx = saveCanvas.getContext('2d');


function showSnapshotPage() {

  playCameraSound();

  // Copy the other canvases onto a single canvas for saving
  saveCtx.drawImage(cameraCanvas, 0, 0);
  saveCtx.drawImage(drawingCanvas, 0, 0);

  // Add the URL at the bottom
  saveCtx.fillText('snapw.at', saveCanvas.width - 72, saveCanvas.height - 15);

  saveImage.src = saveCanvas.toDataURL('image/png');
  saveImage.style.display = 'block';

  showPage('snapshot');

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

  snapshotBtn.addEventListener('click', () => {
    showSnapshotPage();
  });

  backBtn.addEventListener('click', () => {
    showPage('home');
  });

}

export default function init() {
  initSave();
  initControls();
}
