const pdfCanvas = document.getElementById('pdfCanvas');
const ctx = pdfCanvas.getContext('2d');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageNumSpan = document.getElementById('pageNum');
const pageCountSpan = document.getElementById('pageCount');

let pdfDoc = null;
let pageNum = 1;

// Load the PDF document
async function loadPDF() {
  const url = 'ppt_vcod_airbnb.pdf';
  pdfDoc = await pdfjsLib.getDocument(url).promise;
  pageCountSpan.textContent = pdfDoc.numPages;
  pageNum = 1;
  renderPage(pageNum);
}

// Render a specific page of the PDF
function renderPage(num) {
  pdfDoc.getPage(num).then((page) => {
    const viewport = page.getViewport({ scale: 1.5 });
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };
    page.render(renderContext);
    pageNumSpan.textContent = num;
  });
}

// Event listeners for navigation buttons
prevPageBtn.addEventListener('click', () => {
  if (pageNum <= 1) return;
  pageNum--;
  renderPage(pageNum);
});

nextPageBtn.addEventListener('click', () => {
  if (pageNum >= pdfDoc.numPages) return;
  pageNum++;
  renderPage(pageNum);
});

// Keyboard navigation
document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    if (pageNum > 1) {
      pageNum--;
      renderPage(pageNum);
    }
  } else if (event.key === 'ArrowRight') {
    if (pageNum < pdfDoc.numPages) {
      pageNum++;
      renderPage(pageNum);
    }
  }
});

// Load the PDF on page load
loadPDF();