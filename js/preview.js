// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Render a single page thumbnail onto a canvas
async function renderPageThumb(pdfBytes, pageNum, canvas) {
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 0.3 });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({
    canvasContext: canvas.getContext('2d'),
    viewport,
  }).promise;
}

// Render all page thumbnails for a PDF into a container
// Returns the number of pages
async function renderAllThumbs(pdfBytes, container, options = {}) {
  const { onClick, labelPrefix, startSelected } = options;
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
  const numPages = pdf.numPages;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 0.3 });

    const wrapper = document.createElement('div');
    wrapper.className = 'thumb-wrapper';
    wrapper.dataset.page = i;
    if (startSelected) wrapper.classList.add('selected');

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({
      canvasContext: canvas.getContext('2d'),
      viewport,
    }).promise;

    const label = document.createElement('div');
    label.className = 'thumb-label';
    label.textContent = (labelPrefix || 'Page ') + i;

    wrapper.appendChild(canvas);
    wrapper.appendChild(label);

    if (onClick) {
      wrapper.addEventListener('click', () => onClick(wrapper, i));
    }

    container.appendChild(wrapper);
  }

  return numPages;
}
