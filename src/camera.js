import webrtcAdapter from 'webrtc-adapter';
import {HEADER_HEIGHT} from './constants';

let video = null;
let canvas = null;
let context = null;

function init() {

  video = document.querySelector('video');

  canvas = document.getElementById('canvas-camera');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight - HEADER_HEIGHT;

  context = canvas.getContext('2d');

  navigator.mediaDevices.getUserMedia({audio: false, video: true})
    .then((stream) => {

      let videoTracks = stream.getVideoTracks();
      
      console.log('Using video device: ' + videoTracks[0].label);
      
      stream.oninactive = function() {
        console.log('Stream inactive');
      };

      video.srcObject = stream;

      // Every 33ms copy video to canvas (30 FPS). Is there a smarter way to do this...?
      setInterval(function() {

        const width = canvas.width;
        const height = canvas.height;
        
        context.fillRect(0, 0, width, height);
        context.drawImage(video, 0, 0, width, height);

      }, 33);

    })
    .catch((err) => {

      console.error('getUserMedia error', err);

    });

}

export default init;
