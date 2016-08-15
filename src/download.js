import {HEADER_HEIGHT} from './constants';

let downloadBtn = null;
let cameraCanvas = null;
let drawingCanvas = null;
let saveCanvas = null;
let saveContext = null;

function download() {

  saveContext = saveCanvas.getContext('2d');
  saveContext.drawImage(cameraCanvas, 0, 0);
  saveContext.drawImage(drawingCanvas, 0, 0);

  const imageBlob = saveCanvas.toDataURL('image/png');

  let link = document.createElement('a');
  //link.download = 'snapshot.png';
  link.href = `/snapshot/${imageBlob}`;
  link.click();
  link.remove();

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