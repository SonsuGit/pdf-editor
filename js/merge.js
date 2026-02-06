(function () {
  const fileList = document.getElementById('merge-file-list');
  const thumbsContainer = document.getElementById('merge-thumbnails');
  const mergeBtn = document.getElementById('merge-btn');
  let pdfFiles = []; // { name, bytes }

  setupUploadArea('merge-upload', async (files) => {
    for (const file of files) {
      const bytes = new Uint8Array(await readFileAsArrayBuffer(file));
      pdfFiles.push({ name: file.name, bytes });
    }
    renderFileList();
    renderThumbnails();
    updateBtn();
  });

  function updateBtn() {
    mergeBtn.disabled = pdfFiles.length < 2;
  }

  function renderFileList() {
    fileList.innerHTML = '';
    pdfFiles.forEach((pf, idx) => {
      const item = document.createElement('div');
      item.className = 'file-item';
      item.draggable = true;
      item.dataset.index = idx;

      item.innerHTML =
        '<span class="file-name">' + escapeHtml(pf.name) + '</span>' +
        '<button class="remove-btn" title="Remove">&times;</button>';

      item.querySelector('.remove-btn').addEventListener('click', () => {
        pdfFiles.splice(idx, 1);
        renderFileList();
        renderThumbnails();
        updateBtn();
      });

      // Drag reorder
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', idx);
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
      item.addEventListener('dragover', (e) => e.preventDefault());
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const from = parseInt(e.dataTransfer.getData('text/plain'));
        const to = idx;
        if (from === to) return;
        const [moved] = pdfFiles.splice(from, 1);
        pdfFiles.splice(to, 0, moved);
        renderFileList();
        renderThumbnails();
      });

      fileList.appendChild(item);
    });
  }

  async function renderThumbnails() {
    thumbsContainer.innerHTML = '';
    for (const pf of pdfFiles) {
      const sep = document.createElement('div');
      sep.className = 'file-separator';
      sep.textContent = pf.name;
      thumbsContainer.appendChild(sep);
      await renderAllThumbs(pf.bytes, thumbsContainer);
    }
  }

  mergeBtn.addEventListener('click', async () => {
    if (pdfFiles.length < 2) return;
    mergeBtn.disabled = true;
    mergeBtn.textContent = 'Merging...';
    try {
      const merged = await PDFLib.PDFDocument.create();
      for (const pf of pdfFiles) {
        const src = await PDFLib.PDFDocument.load(pf.bytes);
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const bytes = await merged.save();
      downloadPdf(bytes, 'merged.pdf');
    } catch (err) {
      alert('Error merging PDFs: ' + err.message);
    }
    mergeBtn.disabled = false;
    mergeBtn.textContent = 'Merge & Download';
  });

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
})();
