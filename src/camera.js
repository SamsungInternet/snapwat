import webrtcAdapter from 'webrtc-adapter';
import {HEADER_HEIGHT} from './constants';

let video = null;
let canvas = null;
let context = null;

function copyVideoToCanvas() {
  const width = canvas.width;
  const height = canvas.height;
        
  context.fillRect(0, 0, width, height);
  context.drawImage(video, 0, 0, width, height);

  requestAnimationFrame(copyVideoToCanvas);
}

function initCanvas() {

  canvas = document.getElementById('canvas-camera');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight - HEADER_HEIGHT;

  context = canvas.getContext('2d');
}

function initCameraStream() {

  video = document.querySelector('video');

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
      alert('Oh no! Your browser does not appear to have camera support (getUserMedia)' + 
        'or there was a problem initiating it. Maybe try another browser? ;)');
    });

}

export default function() {
  initCanvas();
  initCameraStream();
}