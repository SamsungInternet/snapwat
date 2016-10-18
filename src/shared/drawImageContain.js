export default function drawImageContain(ctx, img) {

    var canvasWidth = ctx.canvas.width,
        canvasHeight = ctx.canvas.height,
        offsetX = 0.5,
        offsetY = 0.5,
        imgWidth = img.width,
        imgHeight = img.height,
        ratio = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight),
        newWidth = imgWidth * ratio,
        newHeight = imgHeight * ratio,
        newX = (canvasWidth - newWidth) / 2,
        newY = (canvasHeight - newHeight) / 2;

    ctx.drawImage(img, 0, 0, imgWidth, imgHeight, newX, newY, newWidth, newHeight);
}
