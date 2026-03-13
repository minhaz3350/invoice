const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

const elements = {
  fromName: document.getElementById('fromName'),
  fromEmail: document.getElementById('fromEmail'),
  fromPhone: document.getElementById('fromPhone'),
  fromAddress: document.getElementById('fromAddress'),
  clientName: document.getElementById('clientName'),
  clientEmail: document.getElementById('clientEmail'),
  clientAddress: document.getElementById('clientAddress'),
  invoiceNo: document.getElementById('invoiceNo'),
  invoiceDate: document.getElementById('invoiceDate'),
  dueDate: document.getElementById('dueDate'),
  taxRate: document.getElementById('taxRate'),
  discount: document.getElementById('discount'),
  shipping: document.getElementById('shipping'),
  notes: document.getElementById('notes'),
  itemsContainer: document.getElementById('itemsContainer'),
  invoicePreview: document.getElementById('invoicePreview'),
  subtotalValue: document.getElementById('subtotalValue'),
  taxValue: document.getElementById('taxValue'),
  discountValue: document.getElementById('discountValue'),
  shippingValue: document.getElementById('shippingValue'),
  totalValue: document.getElementById('totalValue'),
  addItemBtn: document.getElementById('addItemBtn'),
  downloadPdfBtn: document.getElementById('downloadPdfBtn')
};

const state = {
  items: []
};

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setDefaultDates() {
  const today = new Date();
  const due = new Date();
  due.setDate(today.getDate() + 7);

  elements.invoiceDate.value = today.toISOString().split('T')[0];
  elements.dueDate.value = due.toISOString().split('T')[0];
}

function createItem(item = { description: '', qty: 1, price: 0 }) {
  state.items.push({
    id: crypto.randomUUID(),
    description: item.description,
    qty: item.qty,
    price: item.price
  });
  renderItems();
  updateInvoice();
}

function removeItem(id) {
  if (state.items.length === 1) {
    alert('At least one product is required.');
    return;
  }

  state.items = state.items.filter(item => item.id !== id);
  renderItems();
  updateInvoice();
}

function updateItem(id, field, value) {
  const item = state.items.find(entry => entry.id === id);
  if (!item) return;

  if (field === 'description') {
    item.description = value;
  } else {
    item[field] = Number(value) || 0;
  }

  renderItemsTotals();
  updateInvoice();
}

function renderItems() {
  elements.itemsContainer.innerHTML = state.items.map(item => `
    <div class="item-row" data-id="${item.id}">
      <label class="field">
        <span>Product / Service</span>
        <input type="text" data-field="description" value="${escapeHtml(item.description)}" placeholder="Item description" />
      </label>

      <label class="field">
        <span>Qty</span>
        <input type="number" data-field="qty" min="0" step="1" value="${item.qty}" />
      </label>

      <label class="field">
        <span>Price</span>
        <input type="number" data-field="price" min="0" step="0.01" value="${item.price}" />
      </label>

      <div class="field">
        <span>Total</span>
        <div class="item-total-box">${formatCurrency(item.qty * item.price)}</div>
      </div>

      <button class="remove-btn" data-remove="${item.id}" title="Remove item">×</button>
    </div>
  `).join('');

  elements.itemsContainer.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', event => {
      const row = event.target.closest('.item-row');
      const id = row.dataset.id;
      updateItem(id, event.target.dataset.field, event.target.value);
    });
  });

  elements.itemsContainer.querySelectorAll('[data-remove]').forEach(button => {
    button.addEventListener('click', () => removeItem(button.dataset.remove));
  });
}

function renderItemsTotals() {
  elements.itemsContainer.querySelectorAll('.item-row').forEach(row => {
    const item = state.items.find(entry => entry.id === row.dataset.id);
    if (!item) return;
    row.querySelector('.item-total-box').textContent = formatCurrency(item.qty * item.price);
  });
}

function getSubtotal() {
  return state.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
}

function calculateSummary() {
  const subtotal = getSubtotal();
  const taxRate = Number(elements.taxRate.value) || 0;
  const tax = subtotal * (taxRate / 100);
  const discount = Number(elements.discount.value) || 0;
  const shipping = Number(elements.shipping.value) || 0;
  const total = Math.max(subtotal + tax + shipping - discount, 0);

  return { subtotal, taxRate, tax, discount, shipping, total };
}

function updateSummaryBox(summary) {
  elements.subtotalValue.textContent = formatCurrency(summary.subtotal);
  elements.taxValue.textContent = formatCurrency(summary.tax);
  elements.discountValue.textContent = formatCurrency(summary.discount);
  elements.shippingValue.textContent = formatCurrency(summary.shipping);
  elements.totalValue.textContent = formatCurrency(summary.total);
}

function renderPreview(summary) {
  const itemRows = state.items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.description || 'Item')}</td>
      <td>${item.qty}</td>
      <td>${formatCurrency(item.price)}</td>
      <td>${formatCurrency(item.qty * item.price)}</td>
    </tr>
  `).join('');

  elements.invoicePreview.innerHTML = `
    <div class="invoice-paper">
      <div class="preview-header">
        <div>
          <h1 class="invoice-title">INVOICE</h1>
          <div class="invoice-badge">${escapeHtml(elements.invoiceNo.value || 'INV-0001')}</div>
        </div>
        <div style="text-align:right;">
          <h3>${escapeHtml(elements.fromName.value || 'Business Name')}</h3>
          <p class="muted">${escapeHtml(elements.fromEmail.value || '')}</p>
          <p class="muted">${escapeHtml(elements.fromPhone.value || '')}</p>
        </div>
      </div>

      <div class="preview-grid">
        <div class="preview-block">
          <h3>From</h3>
          <p><strong>${escapeHtml(elements.fromName.value || '')}</strong></p>
          <p>${escapeHtml(elements.fromAddress.value || '')}</p>
        </div>
        <div class="preview-block">
          <h3>Bill To</h3>
          <p><strong>${escapeHtml(elements.clientName.value || '')}</strong></p>
          <p>${escapeHtml(elements.clientEmail.value || '')}</p>
          <p>${escapeHtml(elements.clientAddress.value || '')}</p>
        </div>
      </div>

      <div class="preview-grid">
        <div class="preview-block">
          <h3>Invoice Details</h3>
          <p><strong>Invoice No:</strong> ${escapeHtml(elements.invoiceNo.value || '')}</p>
          <p><strong>Invoice Date:</strong> ${formatDate(elements.invoiceDate.value)}</p>
          <p><strong>Due Date:</strong> ${formatDate(elements.dueDate.value)}</p>
        </div>
        <div class="preview-block">
          <h3>Payment Summary</h3>
          <p><strong>Tax Rate:</strong> ${summary.taxRate}%</p>
          <p><strong>Shipping:</strong> ${formatCurrency(summary.shipping)}</p>
          <p><strong>Discount:</strong> ${formatCurrency(summary.discount)}</p>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>

      <div class="totals-box">
        <div class="totals-line"><span>Subtotal</span><strong>${formatCurrency(summary.subtotal)}</strong></div>
        <div class="totals-line"><span>Tax</span><strong>${formatCurrency(summary.tax)}</strong></div>
        <div class="totals-line"><span>Shipping</span><strong>${formatCurrency(summary.shipping)}</strong></div>
        <div class="totals-line"><span>Discount</span><strong>- ${formatCurrency(summary.discount)}</strong></div>
        <div class="totals-line grand"><span>Total Due</span><strong>${formatCurrency(summary.total)}</strong></div>
      </div>

      <div class="notes-box">
        <h3>Notes / Terms</h3>
        <p class="muted">${escapeHtml(elements.notes.value || 'Thank you for your business.')}</p>
      </div>

      <div class="footer-note">Generated with Professional Invoice Generator</div>
    </div>
  `;
}

function updateInvoice() {
  const summary = calculateSummary();
  updateSummaryBox(summary);
  renderPreview(summary);
}

async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const summary = calculateSummary();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = 52;

  const leftText = (text, x, yPos = y) => doc.text(String(text), x, yPos);
  const rightText = (text, x, yPos = y) => doc.text(String(text), x, yPos, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  leftText('INVOICE', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  rightText(`Invoice No: ${elements.invoiceNo.value || ''}`, pageWidth - margin, y - 8);
  rightText(`Invoice Date: ${formatDate(elements.invoiceDate.value)}`, pageWidth - margin, y + 10);
  rightText(`Due Date: ${formatDate(elements.dueDate.value)}`, pageWidth - margin, y + 28);
  y += 44;

  doc.setDrawColor(220, 226, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 26;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  leftText('From', margin, y);
  leftText('Bill To', pageWidth / 2 + 10, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);

  const fromLines = [
    elements.fromName.value,
    elements.fromEmail.value,
    elements.fromPhone.value,
    elements.fromAddress.value
  ].filter(Boolean);

  const clientLines = [
    elements.clientName.value,
    elements.clientEmail.value,
    elements.clientAddress.value
  ].filter(Boolean);

  function writeMultiline(lines, x, startY, maxWidth) {
    let currentY = startY;
    lines.forEach(line => {
      const split = doc.splitTextToSize(String(line), maxWidth);
      doc.text(split, x, currentY);
      currentY += split.length * 14;
    });
    return currentY;
  }

  const fromEndY = writeMultiline(fromLines, margin, y, 220);
  const clientEndY = writeMultiline(clientLines, pageWidth / 2 + 10, y, 220);
  y = Math.max(fromEndY, clientEndY) + 22;

  const tableX = margin;
  const widths = [34, 220, 70, 90, 90];
  const tableWidth = widths.reduce((a, b) => a + b, 0);
  const headers = ['#', 'Description', 'Qty', 'Price', 'Total'];

  doc.setFillColor(245, 247, 250);
  doc.rect(tableX, y, tableWidth, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  let x = tableX;
  headers.forEach((header, index) => {
    if (index >= 2) {
      rightText(header, x + widths[index] - 8, y + 16);
    } else {
      leftText(header, x + 8, y + 16);
    }
    x += widths[index];
  });

  y += 24;
  doc.setFont('helvetica', 'normal');

  state.items.forEach((item, index) => {
    const descLines = doc.splitTextToSize(item.description || 'Item', widths[1] - 16);
    const rowHeight = Math.max(24, descLines.length * 14 + 10);

    if (y + rowHeight > pageHeight - 180) {
      doc.addPage();
      y = 50;
    }

    let cellX = tableX;
    doc.rect(tableX, y, tableWidth, rowHeight);
    doc.text(String(index + 1), cellX + 8, y + 16);
    cellX += widths[0];
    doc.text(descLines, cellX + 8, y + 16);
    cellX += widths[1];
    rightText(String(item.qty), cellX + widths[2] - 8, y + 16);
    cellX += widths[2];
    rightText(formatCurrency(item.price), cellX + widths[3] - 8, y + 16);
    cellX += widths[3];
    rightText(formatCurrency(item.qty * item.price), cellX + widths[4] - 8, y + 16);
    y += rowHeight;
  });

  y += 24;
  const boxX = pageWidth - margin - 220;
  const totalLines = [
    ['Subtotal', formatCurrency(summary.subtotal)],
    ['Tax', formatCurrency(summary.tax)],
    ['Shipping', formatCurrency(summary.shipping)],
    ['Discount', `- ${formatCurrency(summary.discount)}`],
    ['Total Due', formatCurrency(summary.total)]
  ];

  totalLines.forEach((line, index) => {
    doc.setFont('helvetica', index === totalLines.length - 1 ? 'bold' : 'normal');
    doc.setFontSize(index === totalLines.length - 1 ? 12 : 10.5);
    leftText(line[0], boxX, y);
    rightText(line[1], pageWidth - margin, y);
    y += 18;
  });

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  leftText('Notes / Terms', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const noteLines = doc.splitTextToSize(elements.notes.value || 'Thank you for your business.', pageWidth - margin * 2);
  doc.text(noteLines, margin, y);

  doc.save(`${(elements.invoiceNo.value || 'invoice').replace(/\s+/g, '_')}.pdf`);
}

elements.addItemBtn.addEventListener('click', () => createItem());
elements.downloadPdfBtn.addEventListener('click', downloadPDF);

[
  elements.fromName,
  elements.fromEmail,
  elements.fromPhone,
  elements.fromAddress,
  elements.clientName,
  elements.clientEmail,
  elements.clientAddress,
  elements.invoiceNo,
  elements.invoiceDate,
  elements.dueDate,
  elements.taxRate,
  elements.discount,
  elements.shipping,
  elements.notes
].forEach(element => {
  element.addEventListener('input', updateInvoice);
});

setDefaultDates();
createItem({ description: 'Web Design Service', qty: 1, price: 250 });
createItem({ description: 'Hosting & Maintenance', qty: 1, price: 80 });
