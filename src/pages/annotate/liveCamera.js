import webrtcAdapter from 'webrtc-adapter';
import {HEADER_HEIGHT} from '../../shared/constants';
import {showPrompt} from '../../shared/helpers';

let video = document.querySelector('video');
let canvas = document.getElementById('canvas-camera');
let context = context = canvas.getContext('2d');

function copyVideoToCanvas() {

  /**
   * Should hopefully be same as our canvas size, if our constraints were obeyed.
   * But fixes video being potentially stretched (e.g. Samsung Internet in standalone mode).
   */
  const width = video.videoWidth;
  const height = video.videoHeight;

  canvas.width = width;
  canvas.height = height;

  context.fillRect(0, 0, width, height);
  context.drawImage(video, 0, 0, width, height);

  requestAnimationFrame(copyVideoToCanvas);
}

function showUnsupported() {
  showPrompt('webrtc-unsupported');
}

function initCamera() {

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showUnsupported();
    return;
  }

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
