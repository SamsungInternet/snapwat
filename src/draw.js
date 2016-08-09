const HEADER_HEIGHT = 67;
let canvas = null;
let ctx = null;

class Draw {

  init() {
    
    canvas = document.getElementById('canvas');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight - HEADER_HEIGHT;
    canvas.addEventListener('touchstart', this.onTouchStart, false);
    canvas.addEventListener('touchmove', this.onTouchMove, false);

    ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
  }

  onTouchStart(e) {
    ctx.beginPath();
    let touch = e.changedTouches[0];
    let x = touch.pageX;
    let y = touch.pageY - HEADER_HEIGHT;
    ctx.moveTo(x, y);
  }

  onTouchMove(e) {
    e.preventDefault();
    let touch = e.changedTouches[0];
    let x = touch.pageX;
    let y = touch.pageY - HEADER_HEIGHT;
    ctx.lineTo(x, y);
    ctx.stroke();
  }

}

export default new Draw();
