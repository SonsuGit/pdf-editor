// Tab navigation
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Shared: set up drag-and-drop on an upload area
function setupUploadArea(areaId, onFiles) {
  const area = document.getElementById(areaId);
  const input = area.querySelector('input[type="file"]');

  input.addEventListener('change', () => {
    if (input.files.length) {
      onFiles(Array.from(input.files));
      input.value = '';
    }
  });

  area.addEventListener('dragover', e => {
    e.preventDefault();
    area.classList.add('dragover');
  });

  area.addEventListener('dragleave', () => {
    area.classList.remove('dragover');
  });

  area.addEventListener('drop', e => {
    e.preventDefault();
    area.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (files.length) onFiles(files);
  });
}

// Shared: read a File as ArrayBuffer
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Shared: trigger download of a Uint8Array as PDF
function downloadPdf(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
