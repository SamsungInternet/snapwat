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

      // Older browsers may not have srcObject
      if ('srcObject' in video) {
        video.srcObject = stream;
      } else {
        // Avoid using this in new browsers, as it is going away.
        video.src = window.URL.createObjectURL(stream);
      }

      requestAnimationFrame(copyVideoToCanvas);

      initFaceTracking();

    })
    .catch((err) => {
      console.error('getUserMedia error', err);
      showUnsupported();
    });

}

function initFaceTracking() {

  var tracker = new tracking.ObjectTracker(['face']);
  tracker.setStepSize(1.7);

  tracking.track(canvas, tracker);

  tracker.on('track', function(event) {
    event.data.forEach(function(rect) {
      console.log('Tracked', rect.x, rect.y, rect.width, rect.height);
      context.strokeStyle = '#10f9e6';
      context.lineWidth = 2;
      context.setLineDash([5, 2]);
      context.rect(x, y, w, h);
    });
  });

}

export default function init() {
  initCamera();
}
