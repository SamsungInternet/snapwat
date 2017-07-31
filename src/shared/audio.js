import BufferLoader from './bufferLoader';

let context;
let bufferLoader;
let bufferList = null;

export function playCameraSound() {

  if (!bufferList || bufferList.length < 1) {
    // Not ready to play yet
    return false;
  }

  try {

    let source = context.createBufferSource();
    source.buffer = bufferList[0];
    source.connect(context.destination);
    source.start(0);

  } catch(ex) {
    console.warn('Unable to play camera sound', ex);
    return false;
  }

  return true;

}

export default function init() {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  try {
    context = new AudioContext();
    bufferLoader = new BufferLoader(context, ['/sounds/camera.wav'], (list) => {
      bufferList = list;});
    bufferLoader.load();
  } catch(ex) {
    console.warn('Unable to initialise audio bufferLoader', ex);
  }
}
