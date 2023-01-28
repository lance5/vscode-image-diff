// @ts-expect-error
const vscode = acquireVsCodeApi();

document.body.style.overflow = 'hidden';

const features = {
  reportTransform: false,
}

function showImage(message: any) {
  // TODO: Use the shared types...

  const scaleIndicator = document.createElement('div');
  scaleIndicator.style.position='absolute';
  scaleIndicator.style.right = '0';
  scaleIndicator.style.bottom = '0';
  scaleIndicator.style.zIndex = '10';
  scaleIndicator.style.mixBlendMode = 'difference';

  document.body.append(scaleIndicator);

  const d = message.data.image.data;

  const content = new Uint8Array(d);
  const blob = new Blob([content]);
  // TODO: Drop in the image through tht html
  const objectUrl = URL.createObjectURL(blob);

  const image = document.createElement('img');
  document.body.appendChild(image);
  image.src = objectUrl;
  image.style.cursor = 'grab';
  image.style.position = 'absolute';
  image.style.top = '0';
  image.style.left = '0';
  image.style.transformOrigin = 'top left';

  let drag = false;
  let initialX = 0;
  let initialY = 0;

  let dragStartX = 0;
  let dragStartY = 0;

  let scale = 1;

  scaleIndicator.innerText = `Scale: ${scale.toFixed(4)}`;
  const setTransform = (x: number, y: number, newScale: number, { silent = false } = {}) => {
    const onScreenWidth = image.clientWidth * newScale;
    const onScreenHeight = image.clientHeight * newScale;

    const minX = Math.min(0, window.innerWidth - onScreenWidth);
    const maxX = Math.max(0, window.innerWidth - onScreenWidth);
    const minY = Math.min(0, window.innerHeight - onScreenHeight);
    const maxY = Math.max(0, window.innerHeight - onScreenHeight);

    initialX = clamp(minX, maxX, x);
    initialY = clamp(minY, maxY, y);

    scale = newScale;
    scaleIndicator.innerText = `Scale: ${scale.toFixed(4)}`;

    image.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${initialX}, ${initialY})`;
    if (features.reportTransform && !silent) {
      vscode.postMessage({ type: 'transform', data: {x: initialX, y: initialY, scale }});
    }
  };

  const clamp = (min: number, max: number, target: number) => {
    return Math.min(Math.max(min, target), max);
  };

  const updateDrag = (dragX: number, dragY: number) => {
    const translateX = (initialX + dragX - dragStartX);
    const translateY = (initialY + dragY - dragStartY);
    dragStartX = dragX;
    dragStartY = dragY;
    setTransform(translateX, translateY, scale);
  };

  const startDrag = (x: number, y: number) => {
    drag = true;
    image.style.cursor = 'grabbing';
    dragStartX = x;
    dragStartY = y;
  };

  const stopDrag = (x: number, y: number) => {
    drag = false;
    image.style.cursor = 'grab';
    updateDrag(x, y);
  };

  document.body.addEventListener('mousedown', (event) => {
    startDrag(event.clientX, event.clientY);
  });

  document.body.addEventListener('mousemove', (event) => {
    if (!drag) {
      return;
    }
    event.preventDefault();
    updateDrag(event.clientX, event.clientY);
  });

  document.body.addEventListener('mouseup', (event) => {
    if (!drag) {
      return;
    }
    stopDrag(event.clientX, event.clientY);
  });

  document.body.addEventListener('mouseleave', (event) => {
    if (!drag) {
      return;
    }
    stopDrag(event.clientX, event.clientY);
  });

  const MIN_SCALE = 0.4;

  image.addEventListener('wheel', (event) => {
    const delta = event.deltaY * 0.01;
    const nextScale = scale - delta;

    if (Math.max(nextScale, MIN_SCALE) === MIN_SCALE) {
      return;
    }

    const s = nextScale / scale;
    const cx = event.clientX;
    const cy = event.clientY;
    const lx = -initialX;
    const ly = -initialY;

    const nextX = -((cx + lx) * s - cx);
    const nextY = -((cy + ly) * s - cy);

    setTransform(nextX, nextY, nextScale);
  });

  return { setTransform };
}

let imageApi: ReturnType<typeof showImage> | undefined;
window.addEventListener("message", (message) => {
  if (message.data.type === 'show_image') {
    imageApi = showImage(message);
  } else if (message.data.type === 'enable_transform_report') {
    features.reportTransform = true;
  } else if (message.data.type === 'transform') {
    if (!imageApi) {
      throw new Error('No setTransform');
    }
    imageApi.setTransform(message.data.data.x, message.data.data.y, message.data.data.scale, { silent: true });
  } else {
    throw new Error('Unsupported message');
  }
});

vscode.postMessage({ type: "ready" });
