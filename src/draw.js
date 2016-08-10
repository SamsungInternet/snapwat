const HEADER_HEIGHT = 72;
let canvas = null;
let ctx = null;
let drawing = false;

class Draw {

  init() {
    
    canvas = document.getElementById('canvas');
    
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight - HEADER_HEIGHT;

    canvas.addEventListener('touchstart', this.onTouchStart, false);
    canvas.addEventListener('touchmove', this.onTouchMove, false);
    canvas.addEventListener('touchend', this.onTouchEnd, false);
    canvas.addEventListener('mousedown', this.onMouseDown, false);
    canvas.addEventListener('mousemove', this.onMouseMove, false);
    canvas.addEventListener('mouseup', this.onMouseUp, false);

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
    drawing = true;
  }

  onMouseDown(e) {
    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY - HEADER_HEIGHT);
    drawing = true;
  }

  onTouchMove(e) {
    if (drawing) {
      e.preventDefault();
      let touch = e.changedTouches[0];
      let x = touch.pageX;
      let y = touch.pageY - HEADER_HEIGHT;
      ctx.lineTo(x, y);
      ctx.stroke();
    }    
  }

  onMouseMove(e) {
    if (drawing) {
      e.preventDefault();
      ctx.lineTo(e.clientX, e.clientY - HEADER_HEIGHT);
      ctx.stroke();
    }    
  }

  onTouchEnd() {
    drawing = false;
  }

  onMouseUp() {
    drawing = false;
  }

}

export default new Draw();
