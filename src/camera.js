let video = null;
let canvas = null;
let context = null;

function init() {

  video = document.querySelector('video');
  canvas = document.querySelector('canvas');
  context = canvas.getContext('2d');
  
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || 
    navigator.mozGetUserMedia;
  
  if (!navigator.getUserMedia) {
    console.log('Get user media not supported');
    return false;
  }

  navigator.getUserMedia({audio: false, video: {facingMode: 'user'}},
    (mediaStream) => {
      video.srcObject = mediaStream;

      // Every 33ms copy video to canvas - TODO check if there's a better way!
      setInterval(function() {
        
        if (video.paused || video.ended) {
          return;
        }

        const width = canvas.width;
        const height = canvas.height;
        
        context.fillRect(0, 0, width, height);
        context.drawImage(video, 0, 0, width, height);

      }, 33);

    },
    (err) => {
      console.error('Unable to get user media', err);
    });
}

export default init;
