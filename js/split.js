(function () {
  const thumbsContainer = document.getElementById('split-thumbnails');
  const controls = document.getElementById('split-controls');
  const rangeInput = document.getElementById('split-range');
  const splitBtn = document.getElementById('split-btn');

  let pdfBytes = null;
  let totalPages = 0;
  let selectedPages = new Set();

  setupUploadArea('split-upload', async (files) => {
    const file = files[0];
    pdfBytes = new Uint8Array(await readFileAsArrayBuffer(file));
    selectedPages.clear();
    controls.hidden = false;
    rangeInput.value = '';
    await loadThumbnails();
  });

  async function loadThumbnails() {
    thumbsContainer.innerHTML = '';
    totalPages = await renderAllThumbs(pdfBytes, thumbsContainer, {
      onClick: (wrapper, pageNum) => {
        if (selectedPages.has(pageNum)) {
          selectedPages.delete(pageNum);
          wrapper.classList.remove('selected');
        } else {
          selectedPages.add(pageNum);
          wrapper.classList.add('selected');
        }
        syncRangeInput();
        updateBtn();
      },
    });
    updateBtn();
  }

  function syncRangeInput() {
    const sorted = Array.from(selectedPages).sort((a, b) => a - b);
    if (sorted.length === 0) {
      rangeInput.value = '';
      return;
    }
    // Compress into ranges
    const parts = [];
    let start = sorted[0], end = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        parts.push(start === end ? '' + start : start + '-' + end);
        start = end = sorted[i];
      }
    }
    parts.push(start === end ? '' + start : start + '-' + end);
    rangeInput.value = parts.join(', ');
  }

  rangeInput.addEventListener('input', () => {
    selectedPages.clear();
    parseRange(rangeInput.value).forEach(p => selectedPages.add(p));
    // Update thumbnail selection visuals
    thumbsContainer.querySelectorAll('.thumb-wrapper').forEach(w => {
      const p = parseInt(w.dataset.page);
      w.classList.toggle('selected', selectedPages.has(p));
    });
    updateBtn();
  });

  function parseRange(str) {
    const pages = new Set();
    str.split(',').forEach(part => {
      part = part.trim();
      if (!part) return;
      const match = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (match) {
        const a = parseInt(match[1]), b = parseInt(match[2]);
        for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
          if (i >= 1 && i <= totalPages) pages.add(i);
        }
      } else {
        const n = parseInt(part);
        if (n >= 1 && n <= totalPages) pages.add(n);
      }
    });
    return pages;
  }

  function updateBtn() {
    splitBtn.disabled = selectedPages.size === 0;
  }

  splitBtn.addEventListener('click', async () => {
    if (!pdfBytes || selectedPages.size === 0) return;
    splitBtn.disabled = true;
    splitBtn.textContent = 'Processing...';
    try {
      const src = await PDFLib.PDFDocument.load(pdfBytes);
      const dest = await PDFLib.PDFDocument.create();
      const indices = Array.from(selectedPages).sort((a, b) => a - b).map(p => p - 1);
      const pages = await dest.copyPages(src, indices);
      pages.forEach(p => dest.addPage(p));
      const bytes = await dest.save();
      downloadPdf(bytes, 'split.pdf');
    } catch (err) {
      alert('Error splitting PDF: ' + err.message);
    }
    splitBtn.disabled = false;
    splitBtn.textContent = 'Split & Download';
  });
})();
