import { useState, useEffect, useMemo } from 'react'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined'
import InvoiceDialog from '../components/InvoiceDialog'
import { fetchPatientsApi } from '../api/patients'
import { fetchPatientInvoiceApi, updateSalePaymentStatusApi } from '../api/sales'

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

function InvoicesPage() {
  const [patients, setPatients] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [patientData, setPatientData] = useState(null)
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeSaleForInvoice, setActiveSaleForInvoice] = useState(null)
  const [activePatientDataForInvoice, setActivePatientDataForInvoice] = useState(null)
  const [statusTogglingId, setStatusTogglingId] = useState(null)

  const loadPatients = async () => {
    try {
      setLoadingPatients(true)
      setError('')
      const data = await fetchPatientsApi()
      setPatients(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load patients list')
    } finally {
      setLoadingPatients(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatientInvoices = async (patId) => {
    if (!patId) {
      setPatientData(null)
      return
    }
    try {
      setLoadingInvoice(true)
      setError('')
      const data = await fetchPatientInvoiceApi(patId)
      setPatientData(data)
    } catch (err) {
      setError(err.message || 'Failed to load patient invoices')
      setPatientData(null)
    } finally {
      setLoadingInvoice(false)
    }
  }

  const handlePatientSelect = (patId) => {
    setSelectedPatientId(patId)
    if (patId) {
      loadPatientInvoices(patId)
    } else {
      setPatientData(null)
    }
  }

  const handleTogglePaymentStatus = async (sale) => {
    try {
      setStatusTogglingId(sale.id)
      const nextStatus = (sale.payment_status || 'Paid') === 'Paid' ? 'Unpaid' : 'Paid'
      await updateSalePaymentStatusApi(sale.id, nextStatus)
      if (selectedPatientId) {
        await loadPatientInvoices(selectedPatientId)
      }
    } catch (err) {
      setError(err.message || 'Failed to update payment status')
    } finally {
      setStatusTogglingId(null)
    }
  }

  const handleOpenSaleInvoice = (sale) => {
    setActiveSaleForInvoice(sale)
    setActivePatientDataForInvoice(null)
    setDialogOpen(true)
  }

  const handleOpenConsolidatedInvoice = () => {
    if (!patientData) return
    setActiveSaleForInvoice(null)
    setActivePatientDataForInvoice(patientData)
    setDialogOpen(true)
  }

  const handleDialogStatusUpdated = () => {
    if (selectedPatientId) {
      loadPatientInvoices(selectedPatientId)
    }
  }

  const filteredSales = useMemo(() => {
    if (!patientData?.sales) return []
    return patientData.sales.filter((s) => {
      const currentStat = s.payment_status || 'Paid'
      if (statusFilter !== 'All' && currentStat !== statusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchReceipt = s.receipt_no?.toLowerCase().includes(query)
        const matchMeal = s.meal_type?.toLowerCase().includes(query)
        const matchItems = s.items?.some((it) => it.item_name.toLowerCase().includes(query))
        return matchReceipt || matchMeal || matchItems
      }
      return true
    })
  }, [patientData, statusFilter, searchQuery])

  const filteredPatientsList = useMemo(() => {
    if (!searchQuery.trim()) return patients
    const q = searchQuery.toLowerCase()
    return patients.filter((p) =>
      p.name?.toLowerCase().includes(q) ||
      p.ward_number?.toLowerCase().includes(q) ||
      p.mobile_number?.toLowerCase().includes(q)
    )
  }, [patients, searchQuery])

  const selectedPatient = useMemo(() => {
    return patients.find((p) => String(p.id) === String(selectedPatientId))
  }, [patients, selectedPatientId])

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Patient Invoices & Billing
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Generate official invoices for registered hospital patients, track payments, and manage dues.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            title="Refresh"
            onClick={() => {
              loadPatients()
              if (selectedPatientId) loadPatientInvoices(selectedPatientId)
            }}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <RefreshOutlinedIcon className="w-5 h-5" />
          </button>

          {patientData && patientData.sales?.length > 0 && (
            <button
              type="button"
              onClick={handleOpenConsolidatedInvoice}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              <DescriptionOutlinedIcon className="w-4 h-4" />
              Consolidated Invoice
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="font-bold ml-4">
            &times;
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="flex-1">
          <label htmlFor="patient-selector" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Select Patient
          </label>
          <select
            id="patient-selector"
            value={selectedPatientId}
            onChange={(e) => handlePatientSelect(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-colors cursor-pointer"
          >
            <option value="">-- Choose a patient to view or generate invoice --</option>
            {patients.map((pat) => (
              <option key={pat.id} value={pat.id}>
                {pat.name} {pat.ward_number ? `(Ward: ${pat.ward_number})` : ''} {pat.mobile_number ? `- ${pat.mobile_number}` : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedPatient && (
          <div className="flex items-center gap-3 p-3 px-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <PersonOutlineOutlinedIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                {selectedPatient.name}
              </h4>
              <p className="text-xs text-slate-500">
                {selectedPatient.ward_number ? `Ward ${selectedPatient.ward_number}` : 'No Ward'} &bull; {selectedPatient.mobile_number || 'No contact phone'}
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedPatientId && patientData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
              Total Orders
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {patientData.sales?.length || 0}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              All recorded sessions
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
              Total Billed
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              ₹{Number(patientData.total_amount || 0).toFixed(2)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Lifetime patient orders
            </p>
          </div>

          <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-5 shadow-xs">
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-800">
              Total Paid
            </span>
            <h3 className="text-2xl font-extrabold text-emerald-800 mt-1">
              ₹{Number(patientData.paid_amount || 0).toFixed(2)}
            </h3>
            <p className="text-xs text-emerald-600 mt-1">
              Settled payments
            </p>
          </div>

          <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-5 shadow-xs">
            <span className="text-xs uppercase tracking-wider font-bold text-amber-800">
              Unpaid Dues
            </span>
            <h3 className="text-2xl font-extrabold text-amber-800 mt-1">
              ₹{Number(patientData.unpaid_amount || 0).toFixed(2)}
            </h3>
            <p className="text-xs text-amber-600 mt-1">
              Pending clearance
            </p>
          </div>
        </div>
      )}

      {selectedPatientId && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <SearchOutlinedIcon className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search by receipt # or item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {['All', 'Paid', 'Unpaid'].map((status) => {
              const isSelected = statusFilter === status
              return (
                <button
                  type="button"
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {selectedPatientId ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {loadingInvoice ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Loading patient invoice details...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <DescriptionOutlinedIcon className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No orders found for this patient
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                {searchQuery || statusFilter !== 'All'
                  ? 'No sales records match your current filter settings.'
                  : 'This patient has no registered canteen meal orders yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Meal Session</th>
                    <th className="py-3 px-4">Items Breakdown</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-center">Invoice Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredSales.map((sale) => {
                    const isPaid = (sale.payment_status || 'Paid') === 'Paid'
                    const isUpdating = statusTogglingId === sale.id

                    return (
                      <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 text-xs sm:text-sm">
                          {sale.receipt_no}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs">
                          {formatDateTime(sale.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs">
                            {sale.meal_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate">
                          {sale.items?.map((it) => `${it.quantity}x ${it.item_name}`).join(', ') || '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-xs sm:text-sm">
                          ₹{Number(sale.total_amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            title="Click to toggle Paid / Unpaid"
                            onClick={() => handleTogglePaymentStatus(sale)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border cursor-pointer transition-all ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                            }`}
                          >
                            {isUpdating ? (
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isPaid ? (
                              <CheckCircleOutlinedIcon sx={{ fontSize: 14 }} />
                            ) : (
                              <PendingActionsOutlinedIcon sx={{ fontSize: 14 }} />
                            )}
                            {sale.payment_status || 'Paid'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenSaleInvoice(sale)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            <DescriptionOutlinedIcon sx={{ fontSize: 16 }} />
                            Generate Invoice
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Patients Directory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select a patient below to inspect bill history, toggle payment status, and produce invoices.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <SearchOutlinedIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search by patient name or ward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:outline-hidden transition-colors"
              />
            </div>
          </div>

          {loadingPatients ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredPatientsList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No patients registered matching your search query.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredPatientsList.map((pat) => (
                <div
                  key={pat.id}
                  onClick={() => handlePatientSelect(pat.id)}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-900 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <LocalHospitalOutlinedIcon className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-extrabold text-slate-900 text-sm truncate">
                          {pat.name}
                        </h4>
                        <p className="text-xs text-slate-500">
                          ID #{pat.id} &bull; Added {pat.created_at ? pat.created_at.slice(0, 10) : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {pat.ward_number ? (
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">
                          Ward: {pat.ward_number}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          No Ward
                        </span>
                      )}
                      {pat.mobile_number && (
                        <span className="text-xs text-slate-500">
                          {pat.mobile_number}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-slate-800 text-xs font-bold group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all cursor-pointer shadow-xs"
                  >
                    <DescriptionOutlinedIcon sx={{ fontSize: 16 }} />
                    View & Generate Invoices
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <InvoiceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        sale={activeSaleForInvoice}
        patientData={activePatientDataForInvoice}
        onStatusUpdated={handleDialogStatusUpdated}
      />
    </div>
  )
}

export default InvoicesPage
