import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  addFuelCharge,
  addTrip,
  deleteFuelCharge,
  deleteTrip,
  getFuelCharges,
  getTrips,
  updateFuelCharge,
  updateTrip,
} from '../services/firebaseService';
import { FuelCharge, Trip } from '../types';

type Tab = 'trips' | 'fuel';

type EditState = {
  id: string;
  userDisplayName: string;
  date: string;
  valueA: string;
  valueB: string;
  note: string;
} | null;

type ImportPayload = {
  version?: string;
  exportedAt?: string;
  trips?: Array<{
    userId?: string;
    userDisplayName?: string;
    km?: number;
    date?: string;
    note?: string;
  }>;
  fuelCharges?: Array<{
    userId?: string;
    userDisplayName?: string;
    amount?: number;
    liters?: number | null;
    date?: string;
    note?: string;
  }>;
};

function toInputDate(value: string): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function parseDecimal(raw: string): number {
  return parseFloat(raw.trim().replace(',', '.'));
}

function formatDateForDisplay(value: string): string {
  if (!value) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

function MenuIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

export default function DataManager() {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('trips');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fuelCharges, setFuelCharges] = useState<FuelCharge[]>([]);
  const [filterUser, setFilterUser] = useState('all');
  const [filterText, setFilterText] = useState('');
  const [editState, setEditState] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const textMuted = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';
  const panelClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const rowEvenClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const rowOddClass = theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50';
  const tableHeadClass = theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';
  const filterFieldClass = `w-full h-8 sm:h-7 px-2 py-0.5 rounded border text-[11px] sm:text-xs ${
    theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
  }`;
  const iconBtnBase = 'px-2 py-1 rounded transition-colors text-xs flex items-center gap-1';

  const loadData = async () => {
    setLoading(true);
    try {
      const [tripsData, fuelData] = await Promise.all([getTrips(), getFuelCharges()]);
      setTrips(tripsData);
      setFuelCharges(fuelData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showToast('Error al cargar datos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!menuOpen) return;
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menuOpen]);

  const exportData = () => {
    try {
      const payload: ImportPayload = {
        version: 'km-suran-export-v1',
        exportedAt: new Date().toISOString(),
        trips: trips.map((trip) => ({
          userId: trip.userId,
          userDisplayName: trip.userDisplayName,
          km: trip.km,
          date: toInputDate(trip.date),
          note: trip.note,
        })),
        fuelCharges: fuelCharges.map((charge) => ({
          userId: charge.userId,
          userDisplayName: charge.userDisplayName,
          amount: charge.amount,
          liters: charge.liters,
          date: toInputDate(charge.date),
          note: charge.note,
        })),
      };

      const fileContent = JSON.stringify(payload, null, 2);
      const blob = new Blob([fileContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const filename = `km-suran-backup-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')}.json`;

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      showToast('Datos exportados correctamente.', 'success');
    } catch (error) {
      console.error('Error al exportar datos:', error);
      showToast('No se pudo exportar.', 'error');
    } finally {
      setMenuOpen(false);
    }
  };

  const openImportPicker = () => {
    importInputRef.current?.click();
    setMenuOpen(false);
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as ImportPayload;
      const importTrips = Array.isArray(parsed.trips) ? parsed.trips : [];
      const importFuel = Array.isArray(parsed.fuelCharges) ? parsed.fuelCharges : [];

      if (importTrips.length === 0 && importFuel.length === 0) {
        showToast('El archivo no contiene viajes ni cargas.', 'warning');
        return;
      }

      const confirmed = confirm(
        `Se importarán ${importTrips.length} viajes y ${importFuel.length} cargas.\n\nEsto agrega datos (no reemplaza). ¿Continuar?`
      );
      if (!confirmed) return;

      setImporting(true);

      let tripsImported = 0;
      let fuelImported = 0;

      for (const trip of importTrips) {
        const userId = String(trip.userId || '').trim();
        const userDisplayName = String(trip.userDisplayName || '').trim();
        const km = Number(trip.km);
        const date = String(trip.date || '').trim();
        const note = String(trip.note || '').trim();

        if (!userId || !userDisplayName || Number.isNaN(km) || km <= 0 || !date) continue;

        await addTrip({
          userId,
          userDisplayName,
          km,
          date,
          note,
        });
        tripsImported += 1;
      }

      for (const charge of importFuel) {
        const userId = String(charge.userId || '').trim();
        const userDisplayName = String(charge.userDisplayName || '').trim();
        const amount = Number(charge.amount);
        const litersRaw = charge.liters;
        const liters =
          litersRaw == null
            ? null
            : Number.isNaN(Number(litersRaw)) || Number(litersRaw) <= 0
            ? null
            : Number(litersRaw);
        const date = String(charge.date || '').trim();
        const note = String(charge.note || '').trim();

        if (!userId || !userDisplayName || Number.isNaN(amount) || amount <= 0 || !date) continue;

        await addFuelCharge({
          userId,
          userDisplayName,
          amount,
          liters,
          date,
          note,
        });
        fuelImported += 1;
      }

      await loadData();
      showToast(`Importación lista: ${tripsImported} viajes y ${fuelImported} cargas.`, 'success');
    } catch (error) {
      console.error('Error al importar datos:', error);
      showToast('Archivo inválido o error al importar.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const userOptions = useMemo(() => {
    const map = new Map<string, string>();
    trips.forEach((item) => map.set(item.userId, item.userDisplayName || 'Sin nombre'));
    fuelCharges.forEach((item) => map.set(item.userId, item.userDisplayName || 'Sin nombre'));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [trips, fuelCharges]);

  const filteredTrips = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return trips.filter((item) => {
      const matchesUser = filterUser === 'all' || item.userId === filterUser;
      const matchesText =
        !q ||
        item.userDisplayName.toLowerCase().includes(q) ||
        item.note.toLowerCase().includes(q) ||
        String(item.km).includes(q);
      return matchesUser && matchesText;
    });
  }, [trips, filterUser, filterText]);

  const filteredFuel = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return fuelCharges.filter((item) => {
      const matchesUser = filterUser === 'all' || item.userId === filterUser;
      const matchesText =
        !q ||
        item.userDisplayName.toLowerCase().includes(q) ||
        item.note.toLowerCase().includes(q) ||
        String(item.amount).includes(q);
      return matchesUser && matchesText;
    });
  }, [fuelCharges, filterUser, filterText]);

  const startEditTrip = (trip: Trip) => {
    setEditState({
      id: trip.id,
      userDisplayName: trip.userDisplayName,
      date: toInputDate(trip.date),
      valueA: String(trip.km).replace('.', ','),
      valueB: '',
      note: trip.note,
    });
  };

  const startEditFuel = (fuel: FuelCharge) => {
    setEditState({
      id: fuel.id,
      userDisplayName: fuel.userDisplayName,
      date: toInputDate(fuel.date),
      valueA: String(fuel.amount).replace('.', ','),
      valueB: fuel.liters != null ? String(fuel.liters).replace('.', ',') : '',
      note: fuel.note,
    });
  };

  const cancelEdit = () => {
    setEditState(null);
  };

  const saveEdit = async () => {
    if (!editState) return;
    const name = editState.userDisplayName.trim();
    if (!name) {
      showToast('El nombre no puede estar vacío.', 'warning');
      return;
    }
    if (!editState.date) {
      showToast('La fecha es obligatoria.', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (tab === 'trips') {
        const km = parseDecimal(editState.valueA);
        if (Number.isNaN(km) || km <= 0) {
          showToast('KM inválidos.', 'warning');
          setSaving(false);
          return;
        }
        await updateTrip(editState.id, {
          userDisplayName: name,
          date: editState.date,
          km,
          note: editState.note,
        });
        showToast('Viaje actualizado.', 'success');
      } else {
        const amount = parseDecimal(editState.valueA);
        const liters = editState.valueB.trim() ? parseDecimal(editState.valueB) : null;
        if (Number.isNaN(amount) || amount <= 0) {
          showToast('Monto inválido.', 'warning');
          setSaving(false);
          return;
        }
        if (liters !== null && (Number.isNaN(liters) || liters <= 0)) {
          showToast('Litros inválidos.', 'warning');
          setSaving(false);
          return;
        }
        await updateFuelCharge(editState.id, {
          userDisplayName: name,
          date: editState.date,
          amount,
          liters,
          note: editState.note,
        });
        showToast('Carga actualizada.', 'success');
      }
      setEditState(null);
      await loadData();
    } catch (error) {
      console.error('Error al actualizar:', error);
      showToast('No se pudo actualizar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (id: string) => {
    const label = tab === 'trips' ? 'viaje' : 'carga';
    if (!confirm(`¿Seguro que querés borrar este ${label}?`)) return;
    try {
      if (tab === 'trips') {
        await deleteTrip(id);
      } else {
        await deleteFuelCharge(id);
      }
      showToast(`${label[0].toUpperCase()}${label.slice(1)} eliminada/o.`, 'info');
      await loadData();
    } catch (error) {
      console.error('Error al borrar:', error);
      showToast('No se pudo borrar.', 'error');
    }
  };

  const formatDate = (value: string) => {
    return formatDateForDisplay(value);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className={`text-xl sm:text-3xl font-bold ${textPrimary}`}>Datos</h1>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`px-2 sm:px-3 py-1.5 rounded transition-colors text-xs flex items-center gap-1.5 ${
              theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            title="Opciones de datos"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            disabled={importing}
          >
            <MenuIcon />
          </button>
          {menuOpen && (
            <div
              className={`absolute right-0 mt-2 w-44 rounded-md border shadow-lg z-20 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}
              role="menu"
            >
              <button
                type="button"
                onClick={exportData}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'
                }`}
                role="menuitem"
              >
                Exportar JSON
              </button>
              <button
                type="button"
                onClick={openImportPicker}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'
                }`}
                role="menuitem"
                disabled={importing}
              >
                {importing ? 'Importando...' : 'Importar JSON'}
              </button>
              <button
                type="button"
                onClick={() => {
                  loadData();
                  setMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'
                }`}
                role="menuitem"
              >
                Recargar datos
              </button>
            </div>
          )}
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={importData}
        />
      </div>

      <div className={`flex gap-1 sm:gap-2 border-b overflow-x-auto ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          type="button"
          onClick={() => {
            setTab('trips');
            setEditState(null);
          }}
          className={`px-2 sm:px-4 py-2 rounded-t-lg font-medium transition-colors text-xs sm:text-sm whitespace-nowrap ${
            tab === 'trips'
              ? 'bg-gray-800 text-white border-b-2 border-rose-500'
              : `${textSecondary} hover:text-white hover:bg-gray-800/50`
          }`}
        >
          Viajes ({trips.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('fuel');
            setEditState(null);
          }}
          className={`px-2 sm:px-4 py-2 rounded-t-lg font-medium transition-colors text-xs sm:text-sm whitespace-nowrap ${
            tab === 'fuel'
              ? 'bg-gray-800 text-white border-b-2 border-emerald-500'
              : `${textSecondary} hover:text-white hover:bg-gray-800/50`
          }`}
        >
          Nafta ({fuelCharges.length})
        </button>
      </div>

      <div className={`rounded-lg shadow-md p-2 sm:p-4 lg:p-6 border ${panelClass}`}>
        <h2 className={`text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-3 lg:mb-4 ${textPrimary}`}>
          {tab === 'trips' ? 'Viajes' : 'Nafta'}
        </h2>

        {loading ? (
          <p className={`text-sm p-4 ${textSecondary}`}>Cargando datos...</p>
        ) : tab === 'trips' ? (
          <div
            dir="ltr"
            className={`overflow-x-auto overscroll-x-contain w-full min-w-0 max-w-full rounded-lg border ${
              theme === 'dark' ? 'border-gray-600/90' : 'border-gray-200/90'
            } [-webkit-overflow-scrolling:touch]`}
          >
            <div className="overflow-x-auto">
              <table className="min-w-[800px] sm:min-w-[720px] w-full divide-y text-xs sm:text-sm divide-gray-700">
                <thead>
                  <tr className={tableHeadClass}>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-bold uppercase">Fecha</th>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-bold uppercase">Usuario</th>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-bold uppercase">Km</th>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-bold uppercase">Item</th>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-bold uppercase">Acciones</th>
                  </tr>
                  <tr className={tableHeadClass}>
                    <th className="px-1 sm:px-3 py-0.5 sm:py-1 align-middle w-0 whitespace-nowrap text-left">
                      <button
                        type="button"
                        className={`shrink-0 inline-flex items-center justify-center h-8 sm:h-7 w-8 sm:w-9 rounded border transition-colors ${
                          theme === 'dark'
                            ? 'border-gray-500 bg-gray-600 text-white sm:hover:bg-gray-500'
                            : 'border-gray-300 bg-white text-gray-700 sm:hover:bg-gray-100'
                        }`}
                        title="Filtro de fecha"
                      >
                        <MenuIcon />
                      </button>
                    </th>
                    <th className="px-1 sm:px-3 py-0.5 sm:py-1 align-middle">
                      <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className={filterFieldClass}>
                        <option value="all">Todos</option>
                        {userOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="px-1 sm:px-3 py-0.5 sm:py-1 align-middle">
                      <input
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        placeholder="Filtrar item..."
                        className={filterFieldClass}
                      />
                    </th>
                    <th className="px-1 sm:px-3 py-0.5 sm:py-1 align-middle" />
                    <th className="px-1 sm:px-3 py-0.5 sm:py-1 align-middle" />
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-gray-700">
                  {filteredTrips.map((item, idx) => {
                  const editing = editState?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      className={`${idx % 2 === 0 ? rowEvenClass : rowOddClass} border-t ${
                        theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
                      }`}
                    >
                      <td className="px-2 sm:px-3 py-1.5 sm:py-2 align-top text-[10px] sm:text-xs lg:text-sm">
                        {editing ? (
                          <input
                            type="date"
                            value={editState.date}
                            onChange={(e) => setEditState((prev) => (prev ? { ...prev, date: e.target.value } : prev))}
                            className={filterFieldClass}
                          />
                        ) : (
                          <span className={textMuted}>{formatDate(item.date)}</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 sm:py-2 align-top text-[10px] sm:text-xs lg:text-sm">
                        {editing ? (
                          <input
                            value={editState.userDisplayName}
                            onChange={(e) =>
                              setEditState((prev) => (prev ? { ...prev, userDisplayName: e.target.value } : prev))
                            }
                            className={filterFieldClass}
                          />
                        ) : (
                          <span className={textPrimary}>{item.userDisplayName}</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 sm:py-2 align-top text-[10px] sm:text-xs lg:text-sm">
                        {editing ? (
                          <input
                            value={editState.valueA}
                            onChange={(e) => setEditState((prev) => (prev ? { ...prev, valueA: e.target.value } : prev))}
                            className={filterFieldClass}
                          />
                        ) : (
                          <span className="text-rose-400 font-medium">{item.km.toLocaleString('es-AR')} km</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 sm:py-2 align-top text-[10px] sm:text-xs lg:text-sm">
                        {editing ? (
                          <input
                            value={editState.note}
                            onChange={(e) => setEditState((prev) => (prev ? { ...prev, note: e.target.value } : prev))}
                            className={filterFieldClass}
                            placeholder="Descripción (opcional)"
                          />
                        ) : (
                          <span className={textMuted}>{item.note || '—'}</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 sm:py-2 align-top text-[10px] sm:text-xs lg:text-sm text-center">
                        {editing ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={saving}
                              className={`${iconBtnBase} text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20`}
                              title="Guardar"
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className={`${iconBtnBase} ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-500/20' : 'text-gray-600 hover:bg-gray-200'}`}
                              title="Cancelar"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              onClick={() => startEditTrip(item)}
                              className={`${iconBtnBase} text-blue-400 hover:text-blue-300 hover:bg-blue-500/20`}
                              title="Editar"
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className={`${iconBtnBase} text-red-400 hover:text-red-300 hover:bg-red-500/20`}
                              title="Eliminar"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>
          ) : (
            <div
              dir="ltr"
              className={`overflow-x-auto overscroll-x-contain w-full min-w-0 max-w-full rounded-lg border ${
                theme === 'dark' ? 'border-gray-600/90' : 'border-gray-200/90'
              } [-webkit-overflow-scrolling:touch]`}
            >
              <table className="min-w-[920px] sm:min-w-[780px] w-full divide-y text-xs sm:text-sm divide-gray-700">
                <thead>
                  <tr className={tableHeadClass}>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-bold uppercase">Fecha</th>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-bold uppercase">Usuario</th>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[10px] sm:text-xs font-bold uppercase">Monto</th>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-bold uppercase">Litros</th>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-bold uppercase">Item</th>
                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-bold uppercase">Acciones</th>
                  </tr>
                  <tr className={tableHeadClass}>
                    <th className="px-1 sm:px-3 py-0.5 sm:py-1 align-middle w-0 whitespace-nowrap text-left">
                      <button
                        type="button"
                        className={`shrink-0 inline-flex items-center justify-center h-8 sm:h-7 w-8 sm:w-9 rounded border transition-colors ${
                          theme === 'dark'
                            ? 'border-gray-500 bg-gray-600 text-white sm:hover:bg-gray-500'
                            : 'border-gray-300 bg-white text-gray-700 sm:hover:bg-gray-100'
                        }`}
                        title="Filtro de fecha"
                      >
                        <MenuIcon />
                      </button>
                    </th>
                    <th className="px-1 sm:px-3 py-0.5 sm:py-1 align-middle">
                      <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className={filterFieldClass}>
                        <option value="all">Todos</option>
                        {userOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="px-1 sm:px-3 py-0.5 sm:py-1 align-middle">
                      <input
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        placeholder="Filtrar item..."
                        className={filterFieldClass}
                      />
                    </th>
                    <th className="px-1 sm:px-3 py-0.5 sm:py-1 align-middle" />
                    <th className="px-1 sm:px-3 py-0.5 sm:py-1 align-middle" />
                    <th className="px-1 sm:px-3 py-0.5 sm:py-1 align-middle" />
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-gray-700">
                  {filteredFuel.map((item, idx) => {
                  const editing = editState?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      className={`${idx % 2 === 0 ? rowEvenClass : rowOddClass} border-t ${
                        theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
                      }`}
                    >
                      <td className="px-2 sm:px-3 py-1.5 sm:py-2 align-top text-[10px] sm:text-xs lg:text-sm">
                        {editing ? (
                          <input
                            type="date"
                            value={editState.date}
                            onChange={(e) => setEditState((prev) => (prev ? { ...prev, date: e.target.value } : prev))}
                            className={filterFieldClass}
                          />
                        ) : (
                          <span className={textMuted}>{formatDate(item.date)}</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 sm:py-2 align-top text-[10px] sm:text-xs lg:text-sm">
                        {editing ? (
                          <input
                            value={editState.userDisplayName}
                            onChange={(e) =>
                              setEditState((prev) => (prev ? { ...prev, userDisplayName: e.target.value } : prev))
                            }
                            className={filterFieldClass}
                          />
                        ) : (
                          <span className={textPrimary}>{item.userDisplayName}</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 sm:py-2 align-top text-[10px] sm:text-xs lg:text-sm text-right">
                        {editing ? (
                          <input
                            value={editState.valueA}
                            onChange={(e) => setEditState((prev) => (prev ? { ...prev, valueA: e.target.value } : prev))}
                            className={filterFieldClass}
                          />
                        ) : (
                          <span className="text-emerald-400 font-medium">
                            ${item.amount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 sm:py-2 align-top text-[10px] sm:text-xs lg:text-sm">
                        {editing ? (
                          <input
                            value={editState.valueB}
                            onChange={(e) => setEditState((prev) => (prev ? { ...prev, valueB: e.target.value } : prev))}
                            className={filterFieldClass}
                            placeholder="Opcional"
                          />
                        ) : (
                          <span className={textMuted}>{item.liters != null ? `${item.liters} L` : '—'}</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 sm:py-2 align-top text-[10px] sm:text-xs lg:text-sm">
                        {editing ? (
                          <input
                            value={editState.note}
                            onChange={(e) => setEditState((prev) => (prev ? { ...prev, note: e.target.value } : prev))}
                            className={filterFieldClass}
                            placeholder="Descripción (opcional)"
                          />
                        ) : (
                          <span className={textMuted}>{item.note || '—'}</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-1.5 sm:py-2 align-top text-[10px] sm:text-xs lg:text-sm text-center">
                        {editing ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={saving}
                              className={`${iconBtnBase} text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20`}
                              title="Guardar"
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className={`${iconBtnBase} ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-500/20' : 'text-gray-600 hover:bg-gray-200'}`}
                              title="Cancelar"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              onClick={() => startEditFuel(item)}
                              className={`${iconBtnBase} text-blue-400 hover:text-blue-300 hover:bg-blue-500/20`}
                              title="Editar"
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className={`${iconBtnBase} text-red-400 hover:text-red-300 hover:bg-red-500/20`}
                              title="Eliminar"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          )}

        {!loading && tab === 'trips' && filteredTrips.length === 0 && (
          <p className={`text-sm mt-3 ${textSecondary}`}>No hay viajes con ese filtro.</p>
        )}
        {!loading && tab === 'fuel' && filteredFuel.length === 0 && (
          <p className={`text-sm mt-3 ${textSecondary}`}>No hay cargas con ese filtro.</p>
        )}
      </div>
    </div>
  );
}
