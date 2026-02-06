(function () {
  const thumbsContainer = document.getElementById('rotate-thumbnails');
  const controls = document.getElementById('rotate-controls');
  const rotateBtn = document.getElementById('rotate-btn');
  const selectAllBtn = document.getElementById('rotate-select-all');
  const rotateCwBtn = document.getElementById('rotate-cw');
  const rotate180Btn = document.getElementById('rotate-180');
  const rotateCcwBtn = document.getElementById('rotate-ccw');

  let pdfBytes = null;
  let pageRotations = []; // rotation in degrees per page (0-indexed)
  let selectedPages = new Set();

  setupUploadArea('rotate-upload', async (files) => {
    const file = files[0];
    pdfBytes = new Uint8Array(await readFileAsArrayBuffer(file));
    selectedPages.clear();
    controls.hidden = false;
    rotateBtn.disabled = false;
    await loadThumbnails();
  });

  async function loadThumbnails() {
    thumbsContainer.innerHTML = '';
    const numPages = await renderAllThumbs(pdfBytes, thumbsContainer, {
      onClick: (wrapper, pageNum) => {
        const idx = pageNum - 1;
        if (selectedPages.has(idx)) {
          selectedPages.delete(idx);
          wrapper.classList.remove('selected');
        } else {
          selectedPages.add(idx);
          wrapper.classList.add('selected');
        }
      },
    });
    pageRotations = new Array(numPages).fill(0);
  }

  selectAllBtn.addEventListener('click', () => {
    const wrappers = thumbsContainer.querySelectorAll('.thumb-wrapper');
    const allSelected = selectedPages.size === wrappers.length;
    wrappers.forEach((w, i) => {
      if (allSelected) {
        selectedPages.delete(i);
        w.classList.remove('selected');
      } else {
        selectedPages.add(i);
        w.classList.add('selected');
      }
    });
  });

  function applyRotation(degrees) {
    if (selectedPages.size === 0) return;
    selectedPages.forEach(idx => {
      pageRotations[idx] = (pageRotations[idx] + degrees) % 360;
    });
    updateRotationLabels();
  }

  function updateRotationLabels() {
    const wrappers = thumbsContainer.querySelectorAll('.thumb-wrapper');
    wrappers.forEach((w, i) => {
      let rotLabel = w.querySelector('.thumb-rotation');
      if (pageRotations[i] !== 0) {
        if (!rotLabel) {
          rotLabel = document.createElement('div');
          rotLabel.className = 'thumb-rotation';
          w.appendChild(rotLabel);
        }
        rotLabel.textContent = pageRotations[i] + '°';
      } else if (rotLabel) {
        rotLabel.remove();
      }
    });
  }

  rotateCwBtn.addEventListener('click', () => applyRotation(90));
  rotate180Btn.addEventListener('click', () => applyRotation(180));
  rotateCcwBtn.addEventListener('click', () => applyRotation(270));

  rotateBtn.addEventListener('click', async () => {
    if (!pdfBytes) return;
    rotateBtn.disabled = true;
    rotateBtn.textContent = 'Processing...';
    try {
      const doc = await PDFLib.PDFDocument.load(pdfBytes);
      const pages = doc.getPages();
      pages.forEach((page, i) => {
        if (pageRotations[i]) {
          page.setRotation(PDFLib.degrees(page.getRotation().angle + pageRotations[i]));
        }
      });
      const bytes = await doc.save();
      downloadPdf(bytes, 'rotated.pdf');
    } catch (err) {
      alert('Error rotating PDF: ' + err.message);
    }
    rotateBtn.disabled = false;
    rotateBtn.textContent = 'Apply & Download';
  });
})();
