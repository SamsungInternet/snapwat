/**
 * Previously I was using webrtc-adapter, but this was using up nearly half the JS bundle size!
 * This is a more lightweight shim based on the version here: 
 * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
 */
export default function() {

  // Some browsers partially implement mediaDevices. We can't just assign an object
  // with getUserMedia as it would overwrite existing properties.
  if (navigator.mediaDevices === undefined || navigator.mediaDevices.getUserMedia === undefined) {

    // First get hold of the legacy getUserMedia, if present
    var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    // If there is no legacy getUserMedia either, do not attempt to shim, we'll check if
    // navigator.mediaDevices.getUserMedia exists in order to display the button or not.
    if (getUserMedia) {

      if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
      }

      navigator.mediaDevices.getUserMedia = function (constraints) {
        // Wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise(function (resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      }

    }
  }
}