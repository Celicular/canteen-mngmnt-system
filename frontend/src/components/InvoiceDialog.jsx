import { useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { updateSalePaymentStatusApi } from '../api/sales'

function formatDateTime(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

function InvoiceDialog({
  open,
  onClose,
  sale = null,
  patientData = null,
  onStatusUpdated = null,
}) {
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [localStatus, setLocalStatus] = useState(null)

  if (!open) return null

  const isPatientConsolidated = Boolean(patientData && !sale)

  const currentStatus =
    localStatus ||
    (sale ? (sale.payment_status || 'Paid') : (patientData?.unpaid_amount > 0 ? 'Unpaid' : 'Paid'))

  const isPaid = currentStatus === 'Paid'

  const invoiceNumber = sale
    ? `INV-${sale.receipt_no}`
    : `INV-PAT-${patientData?.patient?.id || '00'}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`

  const orderReceiptNo = sale ? sale.receipt_no : `CONSOLIDATED-${patientData?.patient?.id || '00'}`

  const invoiceDate = sale ? formatDateTime(sale.created_at) : formatDateTime(new Date().toISOString())

  const customerName = sale
    ? (sale.customer_name || 'Walk-in Customer')
    : (patientData?.patient?.name || 'Walk-in Customer')

  const patientIdVal = sale?.patient_id || patientData?.patient?.id || '-'

  const customerPhone = sale
    ? sale.customer_phone
    : patientData?.patient?.mobile_number

  const wardNumber = sale
    ? sale.ward_number
    : patientData?.patient?.ward_number

  const mealType = sale ? sale.meal_type : 'Consolidated Sessions'

  const cashierName = sale?.creator_name || sale?.created_by || 'Admin User'

  const items = isPatientConsolidated
    ? (patientData?.consolidated_items || [])
    : (sale?.items || [])

  const totalAmount = isPatientConsolidated
    ? Number(patientData?.total_amount || 0)
    : Number(sale?.total_amount || 0)

  const paidAmount = isPatientConsolidated
    ? Number(patientData?.paid_amount || 0)
    : (isPaid ? totalAmount : 0)

  const unpaidAmount = isPatientConsolidated
    ? Number(patientData?.unpaid_amount || 0)
    : (!isPaid ? totalAmount : 0)

  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0)

  const handleToggleStatus = async (newStatus) => {
    if (!sale) return
    try {
      setUpdatingStatus(true)
      const updated = await updateSalePaymentStatusApi(sale.id, newStatus)
      setLocalStatus(updated.payment_status)
      if (onStatusUpdated) {
        onStatusUpdated(updated)
      }
    } catch {
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handlePrint = () => {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow.document
    doc.open()

    const rowsHtml = items.map((it, idx) => `
      <tr style="background-color: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
        <td style="padding: 9px 12px; border: 1px solid #cbd5e1; text-align: center; font-size: 12px; color: #64748b; font-weight: 600;">${idx + 1}</td>
        <td style="padding: 9px 12px; border: 1px solid #cbd5e1; font-size: 13px; font-weight: 700; color: #0f172a;">${it.item_name}</td>
        <td style="padding: 9px 12px; border: 1px solid #cbd5e1; text-align: center; font-size: 12px; color: #475569;">Canteen Kitchen</td>
        <td style="padding: 9px 12px; border: 1px solid #cbd5e1; text-align: center; font-size: 13px; font-weight: 700; color: #0f172a;">${it.quantity}</td>
        <td style="padding: 9px 12px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px; color: #334155;">Rs. ${Number(it.unit_price).toFixed(2)}</td>
        <td style="padding: 9px 12px; border: 1px solid #cbd5e1; text-align: right; font-size: 13px; font-weight: 800; color: #0f172a;">Rs. ${Number(it.subtotal || it.total_amount || (it.quantity * it.unit_price)).toFixed(2)}</td>
      </tr>
    `).join('')

    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice - ${invoiceNumber}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .invoice-wrap {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #0f172a;
              border-radius: 6px;
              padding: 20px;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              border-bottom: 2.5px solid #0f172a;
              padding-bottom: 14px;
              margin-bottom: 16px;
            }
            .org-title {
              font-size: 19px;
              font-weight: 900;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .org-sub {
              font-size: 11px;
              font-weight: 700;
              color: #475569;
              margin-top: 2px;
            }
            .org-addr {
              font-size: 10px;
              color: #64748b;
              margin-top: 2px;
            }
            .doc-title {
              font-size: 16px;
              font-weight: 900;
              text-align: right;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .badge-box {
              display: inline-block;
              padding: 4px 14px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 5px;
            }
            .badge-paid {
              background-color: #dcfce7 !important;
              color: #15803d !important;
              border: 1.5px solid #86efac;
            }
            .badge-unpaid {
              background-color: #fef3c7 !important;
              color: #b45309 !important;
              border: 1.5px solid #fde68a;
            }
            .meta-grid-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 18px;
              border: 1px solid #cbd5e1;
            }
            .meta-grid-table th {
              background-color: #f1f5f9 !important;
              color: #334155 !important;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 7px 10px;
              border: 1px solid #cbd5e1;
              text-align: left;
            }
            .meta-grid-table td {
              padding: 7px 10px;
              border: 1px solid #cbd5e1;
              font-size: 12px;
            }
            .label-cell {
              background-color: #f8fafc;
              color: #64748b;
              font-weight: 700;
              width: 18%;
            }
            .value-cell {
              color: #0f172a;
              font-weight: 700;
              width: 32%;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 18px;
              border: 1.5px solid #0f172a;
            }
            .items-table th {
              background-color: #0f172a !important;
              color: #ffffff !important;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 9px 12px;
              border: 1px solid #0f172a;
            }
            .bottom-grid {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 18px;
            }
            .notes-table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #cbd5e1;
            }
            .notes-table th {
              background-color: #f1f5f9 !important;
              color: #334155 !important;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 6px 10px;
              border: 1px solid #cbd5e1;
              text-align: left;
            }
            .notes-table td {
              padding: 7px 10px;
              border: 1px solid #cbd5e1;
              font-size: 11px;
              color: #475569;
            }
            .totals-table {
              width: 100%;
              border-collapse: collapse;
              border: 1.5px solid #0f172a;
            }
            .totals-table td {
              padding: 6px 12px;
              border-bottom: 1px solid #cbd5e1;
              font-size: 12px;
            }
            .totals-table tr.grand-row td {
              background-color: #0f172a !important;
              color: #ffffff !important;
              font-weight: 900;
              font-size: 14px;
              border: none;
              padding: 9px 12px;
            }
            .sign-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 24px;
              border-top: 1px dashed #94a3b8;
              padding-top: 14px;
            }
            .sign-cell {
              width: 50%;
              vertical-align: top;
              text-align: center;
              font-size: 11px;
              color: #64748b;
              padding-top: 36px;
            }
            .sign-line {
              border-top: 1px solid #0f172a;
              width: 180px;
              margin: 0 auto 6px auto;
            }
            .footer-note {
              margin-top: 14px;
              padding-top: 10px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrap">
            <table class="header-table">
              <tr>
                <td style="vertical-align: top; width: 60%;">
                  <div class="org-title">Hospital Canteen Services</div>
                  <div class="org-sub">Department of Inpatient Nutrition & Food Services</div>
                  <div class="org-addr">Hospital Complex, Dietary Block, Ground Floor &bull; Ph: +91 98765 43210</div>
                </td>
                <td style="text-align: right; vertical-align: top; width: 40%;">
                  <div class="doc-title">Tax Invoice</div>
                  <div style="font-size: 11px; font-weight: 700; color: #475569; margin-top: 2px;">${invoiceNumber}</div>
                  <div>
                    <span class="badge-box ${isPaid ? 'badge-paid' : 'badge-unpaid'}">
                      ${currentStatus}
                    </span>
                  </div>
                </td>
              </tr>
            </table>

            <table class="meta-grid-table">
              <thead>
                <tr>
                  <th colspan="2">Patient / Customer Information</th>
                  <th colspan="2">Invoice & Order Particulars</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="label-cell">Patient Name:</td>
                  <td class="value-cell" style="font-size: 13px;">${customerName}</td>
                  <td class="label-cell">Invoice No:</td>
                  <td class="value-cell">${invoiceNumber}</td>
                </tr>
                <tr>
                  <td class="label-cell">Ward / Bed No:</td>
                  <td class="value-cell">${wardNumber ? `Ward ${wardNumber}` : 'General Counter'}</td>
                  <td class="label-cell">Order Receipt:</td>
                  <td class="value-cell">${orderReceiptNo}</td>
                </tr>
                <tr>
                  <td class="label-cell">Contact Phone:</td>
                  <td class="value-cell">${customerPhone || 'Not recorded'}</td>
                  <td class="label-cell">Meal Session:</td>
                  <td class="value-cell">${mealType}</td>
                </tr>
                <tr>
                  <td class="label-cell">Patient ID:</td>
                  <td class="value-cell">#${patientIdVal}</td>
                  <td class="label-cell">Date & Time:</td>
                  <td class="value-cell">${invoiceDate}</td>
                </tr>
              </tbody>
            </table>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">#</th>
                  <th style="text-align: left;">Item Description</th>
                  <th style="width: 120px; text-align: center;">Dietary Unit</th>
                  <th style="width: 65px; text-align: center;">Qty</th>
                  <th style="width: 105px; text-align: right;">Unit Rate</th>
                  <th style="width: 120px; text-align: right;">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <table class="bottom-grid">
              <tr>
                <td style="width: 52%; vertical-align: top; padding-right: 14px;">
                  <table class="notes-table">
                    <thead>
                      <tr>
                        <th colspan="2">Billing & Settlement Terms</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style="font-weight: 700; width: 38%;">Billing Mode:</td>
                        <td>Inpatient Meal Service / Bedside Delivery</td>
                      </tr>
                      <tr>
                        <td style="font-weight: 700;">Payment Status:</td>
                        <td style="font-weight: 800; color: ${isPaid ? '#15803d' : '#b45309'};">${currentStatus}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: 700;">Counter Staff:</td>
                        <td>${cashierName}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: 700;">Total Quantity:</td>
                        <td><strong>${totalQuantity}</strong> item units prepared</td>
                      </tr>
                    </tbody>
                  </table>
                </td>

                <td style="width: 48%; vertical-align: top;">
                  <table class="totals-table">
                    <tr>
                      <td style="color: #64748b; font-weight: 600;">Items Gross Subtotal:</td>
                      <td style="text-align: right; font-weight: 700; color: #0f172a;">Rs. ${totalAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style="color: #64748b; font-weight: 600;">Dietary Concession / Subsidy:</td>
                      <td style="text-align: right; font-weight: 700; color: #0f172a;">Rs. 0.00</td>
                    </tr>
                    <tr>
                      <td style="color: #64748b; font-weight: 600;">Statutory Canteen Levy:</td>
                      <td style="text-align: right; font-weight: 700; color: #0f172a;">Rs. 0.00 (Exempt)</td>
                    </tr>
                    <tr class="grand-row">
                      <td>NET PAYABLE TOTAL:</td>
                      <td style="text-align: right;">Rs. ${totalAmount.toFixed(2)}</td>
                    </tr>
                    ${isPatientConsolidated ? `
                      <tr>
                        <td style="color: #15803d; font-weight: 700;">Settled to Date:</td>
                        <td style="text-align: right; font-weight: 800; color: #15803d;">Rs. ${paidAmount.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="color: #b45309; font-weight: 700;">Outstanding Balance Due:</td>
                        <td style="text-align: right; font-weight: 800; color: #b45309;">Rs. ${unpaidAmount.toFixed(2)}</td>
                      </tr>
                    ` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <table class="sign-table">
              <tr>
                <td class="sign-cell">
                  <div class="sign-line"></div>
                  <div>Attendant / Patient Signature</div>
                </td>
                <td class="sign-cell">
                  <div class="sign-line"></div>
                  <div>Authorized Hospital Canteen Signatory</div>
                </td>
              </tr>
            </table>

            <div class="footer-note">
              Thank you for dining with Hospital Canteen Services. Wishing you a speedy recovery.<br />
              This is a computer-generated tax invoice under Hospital Dietary Services. No physical signature required.
            </div>
          </div>
        </body>
      </html>
    `)
    doc.close()

    iframe.contentWindow.focus()
    setTimeout(() => {
      iframe.contentWindow.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }, 400)
  }

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF('p', 'pt', 'a4')

      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, 595.28, 75, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('HOSPITAL CANTEEN SERVICES', 40, 36)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('PATIENT DIET & INPATIENT FOOD BILLING', 40, 52)

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(currentStatus.toUpperCase(), 555, 36, { align: 'right' })

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(invoiceNumber, 555, 52, { align: 'right' })

      autoTable(doc, {
        startY: 90,
        margin: { left: 40, right: 40 },
        head: [['Patient Information', '', 'Invoice Particulars', '']],
        body: [
          ['Patient Name:', customerName, 'Invoice No:', invoiceNumber],
          ['Ward / Bed No:', wardNumber ? `Ward ${wardNumber}` : 'General Counter', 'Order Receipt:', orderReceiptNo],
          ['Contact Phone:', customerPhone || 'Not recorded', 'Meal Session:', mealType],
          ['Patient ID:', `#${patientIdVal}`, 'Date & Time:', invoiceDate],
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [51, 65, 85],
          fontSize: 8,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 5,
          lineColor: [203, 213, 225],
          lineWidth: 0.5,
          textColor: [15, 23, 42],
        },
        columnStyles: {
          0: { cellWidth: 85, fontStyle: 'bold', textColor: [100, 116, 139] },
          1: { cellWidth: 172, fontStyle: 'bold' },
          2: { cellWidth: 85, fontStyle: 'bold', textColor: [100, 116, 139] },
          3: { cellWidth: 172, fontStyle: 'bold' },
        },
      })

      const tableData = items.map((it, idx) => [
        idx + 1,
        it.item_name,
        'Canteen Kitchen',
        it.quantity,
        `Rs. ${Number(it.unit_price).toFixed(2)}`,
        `Rs. ${Number(it.subtotal || it.total_amount || (it.quantity * it.unit_price)).toFixed(2)}`,
      ])

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 12,
        margin: { left: 40, right: 40 },
        head: [['#', 'Item Description', 'Dietary Unit', 'Qty', 'Unit Price', 'Amount']],
        body: tableData,
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'left',
        },
        columnStyles: {
          0: { cellWidth: 30, halign: 'center' },
          1: { cellWidth: 205 },
          2: { cellWidth: 85, halign: 'center' },
          3: { cellWidth: 45, halign: 'center' },
          4: { cellWidth: 75, halign: 'right' },
          5: { cellWidth: 75, halign: 'right' },
        },
        styles: {
          fontSize: 9,
          cellPadding: 6,
          lineColor: [203, 213, 225],
          lineWidth: 0.5,
          textColor: [15, 23, 42],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      })

      const finalY = doc.lastAutoTable.finalY + 12

      autoTable(doc, {
        startY: finalY,
        margin: { left: 40, right: 315 },
        head: [['Terms & Billing Info', '']],
        body: [
          ['Billing Mode:', 'Inpatient Meal Service'],
          ['Payment Status:', currentStatus],
          ['Counter Staff:', cashierName],
          ['Total Units:', `${totalQuantity} items`],
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [51, 65, 85],
          fontSize: 8,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 4,
          lineColor: [203, 213, 225],
          lineWidth: 0.5,
        },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 90 },
          1: { fontStyle: 'bold', textColor: [15, 23, 42] },
        },
      })

      autoTable(doc, {
        startY: finalY,
        margin: { left: 305, right: 40 },
        body: [
          ['Items Gross Subtotal:', `Rs. ${totalAmount.toFixed(2)}`],
          ['Dietary Subsidy / Concession:', 'Rs. 0.00'],
          ['Canteen Tax & Levies:', 'Rs. 0.00 (Exempt)'],
          ['NET PAYABLE TOTAL:', `Rs. ${totalAmount.toFixed(2)}`],
        ],
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 5,
          lineColor: [203, 213, 225],
          lineWidth: 0.5,
        },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [100, 116, 139] },
          1: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
        },
      })

      const bottomY = Math.max(doc.lastAutoTable.finalY, 750)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      doc.text('Thank you for dining with Hospital Canteen Services. Wishing you good health.', 297.64, bottomY + 25, { align: 'center' })

      doc.save(`${invoiceNumber}.pdf`)
    } catch {
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[94vh]">
        <div className="bg-slate-900 text-white px-5 py-3.5 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <LocalHospitalOutlinedIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight leading-tight">
                {isPatientConsolidated ? 'Consolidated Patient Statement' : 'Official Canteen Invoice'}
              </h3>
              <p className="text-slate-400 text-xs">
                {invoiceNumber} &bull; {invoiceDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrint}
              title="Print Invoice"
              className="p-2 text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <PrintOutlinedIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              title="Download PDF"
              className="p-2 text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <PictureAsPdfOutlinedIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Dialog"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Payment Status:
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold tracking-wide uppercase border ${
                isPaid
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              {isPaid ? (
                <CheckCircleOutlinedIcon sx={{ fontSize: 14 }} />
              ) : (
                <PendingActionsOutlinedIcon sx={{ fontSize: 14 }} />
              )}
              {currentStatus}
            </span>
          </div>

          {sale && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleToggleStatus('Paid')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isPaid
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50'
                } disabled:opacity-50`}
              >
                Mark as Paid
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleToggleStatus('Unpaid')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  !isPaid
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
                } disabled:opacity-50`}
              >
                Mark as Unpaid
              </button>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          <div className="border-2 border-slate-900 rounded-2xl p-5 sm:p-6 bg-white shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-slate-900 gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
                  Hospital Canteen Services
                </h2>
                <p className="text-xs font-bold text-slate-700">
                  Department of Inpatient Nutrition & Food Services
                </p>
                <p className="text-[11px] text-slate-500">
                  Hospital Complex, Dietary Block, Ground Floor &bull; Ph: +91 98765 43210
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-xs uppercase font-black text-slate-500 tracking-wider">
                  Tax Invoice
                </span>
                <p className="text-sm font-extrabold text-slate-900">
                  {invoiceNumber}
                </p>
                <div>
                  <span
                    className={`inline-block px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide border mt-1 ${
                      isPaid
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {currentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-300">
                    <th colSpan={2} className="py-2 px-3 border-r border-slate-300">
                      Patient / Customer Information
                    </th>
                    <th colSpan={2} className="py-2 px-3">
                      Invoice & Order Particulars
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-500 bg-slate-50 w-1/4 border-r border-slate-200">
                      Patient Name:
                    </td>
                    <td className="py-2 px-3 font-extrabold text-slate-900 w-1/4 border-r border-slate-300 text-sm">
                      {customerName}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-500 bg-slate-50 w-1/4 border-r border-slate-200">
                      Invoice No:
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 w-1/4">
                      {invoiceNumber}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-500 bg-slate-50 border-r border-slate-200">
                      Ward / Bed:
                    </td>
                    <td className="py-2 px-3 font-bold text-blue-700 border-r border-slate-300">
                      {wardNumber ? `Ward ${wardNumber}` : 'General Counter'}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-500 bg-slate-50 border-r border-slate-200">
                      Order Receipt:
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      {orderReceiptNo}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-500 bg-slate-50 border-r border-slate-200">
                      Contact Phone:
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-300">
                      {customerPhone || 'Not recorded'}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-500 bg-slate-50 border-r border-slate-200">
                      Meal Session:
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      {mealType}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-500 bg-slate-50 border-r border-slate-200">
                      Patient ID:
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-300">
                      #{patientIdVal}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-500 bg-slate-50 border-r border-slate-200">
                      Date & Time:
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      {invoiceDate}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-bold w-12 text-center border-r border-slate-800">#</th>
                    <th className="py-2.5 px-4 font-bold border-r border-slate-800">Item Description</th>
                    <th className="py-2.5 px-3 font-bold w-28 text-center border-r border-slate-800">Dietary Unit</th>
                    <th className="py-2.5 px-3 font-bold w-20 text-center border-r border-slate-800">Qty</th>
                    <th className="py-2.5 px-4 font-bold w-28 text-right border-r border-slate-800">Unit Rate</th>
                    <th className="py-2.5 px-4 font-bold w-32 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                        No items recorded in this invoice.
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}>
                        <td className="py-2.5 px-3 text-slate-500 text-center text-xs font-semibold border-r border-slate-200">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 text-xs sm:text-sm border-r border-slate-200">{it.item_name}</td>
                        <td className="py-2.5 px-3 text-slate-600 text-center text-xs border-r border-slate-200">Canteen Kitchen</td>
                        <td className="py-2.5 px-3 text-slate-800 text-center font-bold text-xs sm:text-sm border-r border-slate-200">{it.quantity}</td>
                        <td className="py-2.5 px-4 text-slate-600 text-right text-xs sm:text-sm border-r border-slate-200">
                          ₹{Number(it.unit_price).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 font-black text-slate-900 text-right text-xs sm:text-sm">
                          ₹{Number(it.subtotal || it.total_amount || (it.quantity * it.unit_price)).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-300">
                      <th colSpan={2} className="py-2 px-3">
                        Billing & Settlement Terms
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-1.5 px-3 font-bold text-slate-500 bg-slate-50 w-2/5">Billing Mode:</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-800">Inpatient Meal Service / Bedside Delivery</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-bold text-slate-500 bg-slate-50">Payment Status:</td>
                      <td className={`py-1.5 px-3 font-extrabold ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>{currentStatus}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-bold text-slate-500 bg-slate-50">Counter Staff:</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-800">{cashierName}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-bold text-slate-500 bg-slate-50">Total Quantity:</td>
                      <td className="py-1.5 px-3 font-bold text-slate-900">{totalQuantity} item units prepared</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border-2 border-slate-900 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2 px-3.5 font-bold text-slate-600 bg-slate-50">Items Gross Subtotal:</td>
                      <td className="py-2 px-3.5 text-right font-extrabold text-slate-900">₹{totalAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3.5 font-bold text-slate-600 bg-slate-50">Dietary Concession / Subsidy:</td>
                      <td className="py-2 px-3.5 text-right font-extrabold text-slate-900">₹0.00</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3.5 font-bold text-slate-600 bg-slate-50">Statutory Canteen Levy:</td>
                      <td className="py-2 px-3.5 text-right font-extrabold text-slate-900">₹0.00 (Exempt)</td>
                    </tr>
                    <tr className="bg-slate-900 text-white">
                      <td className="py-2.5 px-3.5 font-black text-sm uppercase">NET PAYABLE TOTAL:</td>
                      <td className="py-2.5 px-3.5 text-right font-black text-base">₹{totalAmount.toFixed(2)}</td>
                    </tr>
                    {isPatientConsolidated && (
                      <>
                        <tr>
                          <td className="py-2 px-3.5 font-bold text-emerald-800 bg-emerald-50">Settled to Date:</td>
                          <td className="py-2 px-3.5 text-right font-black text-emerald-800">₹{paidAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3.5 font-bold text-amber-800 bg-amber-50">Outstanding Balance Due:</td>
                          <td className="py-2 px-3.5 text-right font-black text-amber-800">₹{unpaidAmount.toFixed(2)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-6 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
              <div>
                <div className="w-40 border-t border-slate-900 mx-auto mb-1.5 pt-1"></div>
                <p className="font-semibold text-slate-700">Patient / Attendant Signature</p>
              </div>
              <div>
                <div className="w-40 border-t border-slate-900 mx-auto mb-1.5 pt-1"></div>
                <p className="font-semibold text-slate-700">Authorized Canteen Signatory</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-center text-[11px] text-slate-400">
              Thank you for dining with Hospital Canteen Services. Wishing you good health.<br />
              This is a computer-generated tax invoice under Hospital Dietary Services. No physical signature required.
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-slate-200 px-5 py-3 sm:px-6 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <PrintOutlinedIcon sx={{ fontSize: 18 }} />
            Print Invoice
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
          >
            <PictureAsPdfOutlinedIcon sx={{ fontSize: 18 }} />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default InvoiceDialog
