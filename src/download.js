import {HEADER_HEIGHT} from './constants';

let downloadBtn = null;
let cameraCanvas = null;
let drawingCanvas = null;
let saveCanvas = null;
let saveContext = null;

function download() {

  saveContext = saveCanvas.getContext('2d');
  saveContext.drawImage(drawingCanvas, 0, 0);

  let link = document.createElement('a');
  link.download = "snapwat-snapshot.png";
  link.href = saveCanvas.toDataURL('image/png'); //.replace('image/png', 'image/octet-stream');
  link.click();
}

function init() {

  cameraCanvas = document.getElementById('canvas-camera');
  drawingCanvas = document.getElementById('canvas-draw');
  saveCanvas = document.getElementById('canvas-save');

  saveCanvas.width  = window.innerWidth;
  saveCanvas.height = window.innerHeight - HEADER_HEIGHT;

  downloadBtn = document.getElementById('download');

  downloadBtn.addEventListener('click', () => {
    download();
  });

}

export default init;