import webrtcAdapter from 'webrtc-adapter';
import {HEADER_HEIGHT} from '../../shared/constants';
import {showPrompt} from '../../shared/helpers';

let video = document.querySelector('video');
let canvas = document.getElementById('canvas-camera');
let context = context = canvas.getContext('2d');

function copyVideoToCanvas() {
  const width = canvas.width;
  const height = canvas.height;

  context.fillRect(0, 0, width, height);
  context.drawImage(video, 0, 0, width, height);

  requestAnimationFrame(copyVideoToCanvas);
}

function setCanvasSize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight - HEADER_HEIGHT;
}

function showUnsupported() {
  showPrompt('webrtc-unsupported');
}

function initCamera() {

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showUnsupported();
    return;
  }

  setCanvasSize();
  window.addEventListener('resize', setCanvasSize, false);
  video.style.display = 'block';

  const maxWidth = canvas.clientWidth;
  const maxHeight = canvas.clientHeight;

  const constraints = {
   width: {ideal: maxWidth, max: maxWidth},
   height: {ideal: maxHeight, max: maxHeight}
  };

  navigator.mediaDevices.getUserMedia({audio: false, video: constraints})
    .then((stream) => {

      let videoTracks = stream.getVideoTracks();

      console.log('Using video device: ' + videoTracks[0].label);

      stream.oninactive = function() {
        console.log('Stream inactive');
      };

      video.srcObject = stream;

      requestAnimationFrame(copyVideoToCanvas);

    })
    .catch((err) => {
      console.error('getUserMedia error', err);
      showUnsupported();
    });

}

export default function init() {
  initCamera();
}
