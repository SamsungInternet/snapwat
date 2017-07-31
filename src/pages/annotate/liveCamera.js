import {HEADER_HEIGHT} from '../../shared/constants';
import {showPrompt} from '../../shared/helpers';

let video = document.querySelector('video');
let canvas = document.getElementById('canvas-camera');
let context = context = canvas.getContext('2d');
let isCanvasResized = false;

function copyVideoToCanvas() {

  // It takes a while for the video dimensions to be established, so keep checking until they have
  if (!isCanvasResized && video.videoWidth) {
    resizeCanvasToVideo();
  }

  context.fillRect(0, 0, video.videoWidth, video.videoHeight);
  context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

  requestAnimationFrame(copyVideoToCanvas);
}

function showUnsupported() {
  showPrompt('webrtc-unsupported');
}

/**
 * The video should hopefully be the same as our canvas size, if our constraints were obeyed.
 * But this fixes video being potentially stretched (e.g. Samsung Internet in standalone mode).
 */
function resizeCanvasToVideo() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  isCanvasResized = true;
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

      // Older browsers may not have srcObject
      if ('srcObject' in video) {
        video.srcObject = stream;
      } else {
        // Avoid using this in new browsers, as it is going away.
        video.src = window.URL.createObjectURL(stream);
      }

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
