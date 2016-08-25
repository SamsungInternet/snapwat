import webrtcAdapter from 'webrtc-adapter';
import {HEADER_HEIGHT} from '../../shared/constants';

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

function initCanvas() {
  setCanvasSize();
  window.addEventListener('resize', setCanvasSize, false);
}

function alertUnsupported() {
  alert('Oh no! Your browser does not appear to have camera support (getUserMedia)' +
        'or there was a problem initiating it. Maybe try another browser? =)');
}

function initCameraStream() {

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alertUnsupported();
    return;
  }

  navigator.mediaDevices.getUserMedia({audio: false, video: true})
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
      alertUnsupported();
    });

}

export default function init() {
  initCanvas();
  initCameraStream();
}
