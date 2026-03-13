const itemsContainer = document.getElementById('itemsContainer');
const currencyEl = document.getElementById('currency');
const invoiceEl = document.getElementById('invoice');

const fields = {
  invoiceNumber: document.getElementById('invoiceNumber'),
  invoiceStatus: document.getElementById('invoiceStatus'),
  invoiceDate: document.getElementById('invoiceDate'),
  dueDate: document.getElementById('dueDate'),
  fromName: document.getElementById('fromName'),
  fromEmail: document.getElementById('fromEmail'),
  fromPhone: document.getElementById('fromPhone'),
  fromAddress: document.getElementById('fromAddress'),
  clientName: document.getElementById('clientName'),
  clientEmail: document.getElementById('clientEmail'),
  clientPhone: document.getElementById('clientPhone'),
  clientAddress: document.getElementById('clientAddress'),
  paymentMethod: document.getElementById('paymentMethod'),
  paymentDetails: document.getElementById('paymentDetails'),
  taxRate: document.getElementById('taxRate'),
  discount: document.getElementById('discount'),
  notes: document.getElementById('notes')
};

const display = {
  subtotal: document.getElementById('subtotalDisplay'),
  tax: document.getElementById('taxDisplay'),
  discount: document.getElementById('discountDisplay'),
  grandTotal: document.getElementById('grandTotalDisplay')
};

const preview = {
  fromName: document.getElementById('previewFromName'),
  fromAddress: document.getElementById('previewFromAddress'),
  fromContact: document.getElementById('previewFromContact'),
  status: document.getElementById('previewStatus'),
  fromBlock: document.getElementById('prevFromBlock'),
  clientBlock: document.getElementById('prevClientBlock'),
  invoiceNumber: document.getElementById('previewInvoiceNumber'),
  invoiceDate: document.getElementById('previewInvoiceDate'),
  dueDate: document.getElementById('previewDueDate'),
  currency: document.getElementById('previewCurrency'),
  itemsBody: document.getElementById('previewItemsBody'),
  subtotal: document.getElementById('previewSubtotal'),
  tax: document.getElementById('previewTax'),
  discount: document.getElementById('previewDiscount'),
  grandTotal: document.getElementById('previewGrandTotal'),
  notes: document.getElementById('previewNotes'),
  paymentMethod: document.getElementById('previewPaymentMethod'),
  paymentDetails: document.getElementById('previewPaymentDetails')
};

function getCurrencySymbol() {
  return currencyEl.value === 'USD' ? '$' : '৳';
}

function formatMoney(value) {
  const symbol = getCurrencySymbol();
  return `${symbol}${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value + 'T00:00:00');
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[char]));
}

function blockContent(name, email, phone, address) {
  const parts = [name, email, phone, address]
    .filter(Boolean)
    .map(v => `<div>${escapeHtml(v).replace(/\n/g, '<br>')}</div>`);

  return parts.length
    ? parts.join('')
    : '<div class="empty-state">No details added yet.</div>';
}

function createItemRow(data = {}) {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <div class="field">
      <label>Description</label>
      <input type="text" class="item-description" placeholder="Product or service name" value="${escapeHtml(data.description || '')}" />
    </div>
    <div class="field">
      <label>Qty</label>
      <input type="number" class="item-qty" min="0" step="1" value="${data.qty ?? 1}" />
    </div>
    <div class="field">
      <label>Rate</label>
      <input type="number" class="item-rate" min="0" step="0.01" value="${data.rate ?? 0}" />
    </div>
    <div class="field">
      <label>Amount</label>
      <input type="text" class="item-amount" value="${formatMoney((data.qty ?? 1) * (data.rate ?? 0))}" readonly />
    </div>
    <button type="button" class="remove-btn" title="Remove item">×</button>
  `;

  row.querySelectorAll('input').forEach(input => input.addEventListener('input', updateInvoice));
  row.querySelector('.remove-btn').addEventListener('click', () => {
    row.remove();
    if (!document.querySelector('.item-row')) createItemRow();
    updateInvoice();
  });

  itemsContainer.appendChild(row);
}

function collectItems() {
  return [...document.querySelectorAll('.item-row')].map(row => {
    const description = row.querySelector('.item-description').value.trim();
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
    const amount = qty * rate;

    row.querySelector('.item-amount').value = formatMoney(amount);
    return { description, qty, rate, amount };
  });
}

function updateInvoice() {
  const items = collectItems();
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = parseFloat(fields.taxRate.value) || 0;
  const discount = parseFloat(fields.discount.value) || 0;
  const tax = subtotal * (taxRate / 100);
  const grandTotal = Math.max(0, subtotal + tax - discount);

  display.subtotal.textContent = formatMoney(subtotal);
  display.tax.textContent = formatMoney(tax);
  display.discount.textContent = formatMoney(discount);
  display.grandTotal.textContent = formatMoney(grandTotal);

  preview.fromName.textContent = fields.fromName.value.trim() || 'Your Company Name';
  preview.fromAddress.textContent = fields.fromAddress.value.trim() || 'Business address';

  const contactParts = [fields.fromEmail.value.trim(), fields.fromPhone.value.trim()].filter(Boolean);
  preview.fromContact.textContent = contactParts.length
    ? contactParts.join(' · ')
    : 'hello@company.com · +8801XXXXXXXXX';

  preview.status.textContent = (fields.invoiceStatus.value || 'Unpaid').toUpperCase();
  preview.fromBlock.innerHTML = blockContent(
    fields.fromName.value.trim(),
    fields.fromEmail.value.trim(),
    fields.fromPhone.value.trim(),
    fields.fromAddress.value.trim()
  );

  preview.clientBlock.innerHTML = blockContent(
    fields.clientName.value.trim(),
    fields.clientEmail.value.trim(),
    fields.clientPhone.value.trim(),
    fields.clientAddress.value.trim()
  );

  preview.invoiceNumber.textContent = fields.invoiceNumber.value.trim() || 'INV-1001';
  preview.invoiceDate.textContent = formatDate(fields.invoiceDate.value);
  preview.dueDate.textContent = formatDate(fields.dueDate.value);
  preview.currency.textContent = currencyEl.value;
  preview.notes.textContent = fields.notes.value.trim() || 'Thank you for your business.';
  preview.paymentMethod.textContent = fields.paymentMethod.value.trim() || 'Bank Transfer';
  preview.paymentDetails.textContent = fields.paymentDetails.value.trim() || 'Add payment or bank details here.';
  preview.subtotal.textContent = formatMoney(subtotal);
  preview.tax.textContent = `${formatMoney(tax)}${taxRate ? ` (${taxRate}%)` : ''}`;
  preview.discount.textContent = formatMoney(discount);
  preview.grandTotal.textContent = formatMoney(grandTotal);

  if (!items.length || items.every(item => !item.description && !item.qty && !item.rate)) {
    preview.itemsBody.innerHTML = `<tr><td colspan="4" class="empty-state">No items added yet.</td></tr>`;
  } else {
    preview.itemsBody.innerHTML = items.map(item => `
      <tr>
        <td>${escapeHtml(item.description || 'Item')}</td>
        <td>${item.qty}</td>
        <td>${formatMoney(item.rate)}</td>
        <td>${formatMoney(item.amount)}</td>
      </tr>
    `).join('');
  }

  saveDraft();
}

function saveDraft() {
  const payload = {
    currency: currencyEl.value,
    fields: Object.fromEntries(Object.entries(fields).map(([key, el]) => [key, el.value])),
    items: collectItems()
  };

  localStorage.setItem('professionalInvoiceDraft', JSON.stringify(payload));
}

function loadDraft() {
  const saved = localStorage.getItem('professionalInvoiceDraft');
  if (!saved) return false;

  try {
    const payload = JSON.parse(saved);
    currencyEl.value = payload.currency || 'BDT';

    Object.entries(payload.fields || {}).forEach(([key, value]) => {
      if (fields[key]) fields[key].value = value;
    });

    itemsContainer.innerHTML = '';
    (payload.items?.length ? payload.items : [{ description: '', qty: 1, rate: 0 }]).forEach(createItemRow);
    return true;
  } catch {
    return false;
  }
}

function setDefaultData() {
  const today = new Date();
  const due = new Date();
  due.setDate(today.getDate() + 7);

  fields.invoiceNumber.value = 'INV-' + Math.floor(1000 + Math.random() * 9000);
  fields.invoiceDate.value = today.toISOString().split('T')[0];
  fields.dueDate.value = due.toISOString().split('T')[0];
  fields.fromName.value = 'Your Company Name';
  fields.fromEmail.value = 'hello@company.com';
  fields.fromPhone.value = '+8801XXXXXXXXX';
  fields.fromAddress.value = 'Dhaka, Bangladesh';
  fields.clientName.value = 'Client Name';
  fields.clientEmail.value = 'client@example.com';
  fields.paymentMethod.value = 'Bank Transfer';
  fields.paymentDetails.value = 'Bank Name: Example Bank\nAccount Name: Your Company Name\nAccount Number: 1234567890';
  fields.notes.value = 'Thank you for your business. Please complete payment within the due date.';
}

async function downloadPDF() {
  const btn = document.getElementById('downloadPdfBtn');
  const original = btn.textContent;
  btn.textContent = 'Generating PDF...';
  btn.disabled = true;

  try {
    const canvas = await html2canvas(invoiceEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const fileName = `${(fields.invoiceNumber.value || 'invoice').replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    alert('Failed to generate PDF. Please try again.');
    console.error(error);
  } finally {
    btn.textContent = original;
    btn.disabled = false;
  }
}

document.getElementById('addItemBtn').addEventListener('click', () => {
  createItemRow({ description: '', qty: 1, rate: 0 });
  updateInvoice();
});

document.getElementById('downloadPdfBtn').addEventListener('click', downloadPDF);
document.getElementById('printBtn').addEventListener('click', () => window.print());
document.getElementById('newInvoiceBtn').addEventListener('click', () => {
  localStorage.removeItem('professionalInvoiceDraft');
  location.reload();
});

currencyEl.addEventListener('change', updateInvoice);
Object.values(fields).forEach(el => el.addEventListener('input', updateInvoice));

if (!loadDraft()) {
  setDefaultData();
  createItemRow({ description: 'Website Design Service', qty: 1, rate: 15000 });
  createItemRow({ description: 'Hosting & Maintenance', qty: 1, rate: 3000 });
}

updateInvoice();
