import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { addTrip, getTrips, deleteTrip } from '../services/firebaseService';
import { Trip } from '../types';

function getTodayLocalISODate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(dateStr: string): string {
  if (!dateStr) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year.slice(-2)}`;
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' });
}

export default function RegisterTrip() {
  const { user } = useAuth();
  const { theme, displayName, headerColor } = useTheme();
  const { showToast } = useToast();

  const [km, setKm] = useState('');
  const [date, setDate] = useState(() => getTodayLocalISODate());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const resetForm = () => {
    setKm('');
    setNote('');
    setDate(getTodayLocalISODate());
  };

  const loadTrips = async () => {
    try {
      const data = await getTrips();
      setTrips(data);
    } catch (error) {
      console.error('Error al cargar viajes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrips(); }, []);

  const parseDecimalInput = (raw: string): number => {
    const normalized = raw.trim().replace(',', '.');
    return parseFloat(normalized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) {
      showToast('Configurá tu nombre en el perfil antes de registrar un viaje.', 'warning');
      return;
    }
    const kmNum = parseDecimalInput(km);
    if (isNaN(kmNum) || kmNum <= 0) {
      showToast('Ingresá una cantidad de KM válida.', 'error');
      return;
    }

    setSaving(true);
    try {
      await addTrip({
        userId: user.uid,
        userDisplayName: displayName,
        km: kmNum,
        date,
        note,
      });
      resetForm();
      showToast(`Viaje de ${kmNum} km registrado.`, 'success');
      await loadTrips();
    } catch (error) {
      console.error('Error al guardar viaje:', error);
      showToast('Error al guardar el viaje.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm('¿Seguro que querés eliminar este viaje?')) return;
    try {
      await deleteTrip(tripId);
      showToast('Viaje eliminado.', 'info');
      await loadTrips();
    } catch (error) {
      console.error('Error al eliminar viaje:', error);
      showToast('Error al eliminar.', 'error');
    }
  };

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const cardClass = `rounded-xl shadow-lg p-4 sm:p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`;
  const inputClass = `w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus-ring-header ${
    theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
  }`;
  const labelClass = `block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`;

  const myTrips = trips.filter((t) => t.userId === user?.uid);
  const othersTrips = trips.filter((t) => t.userId !== user?.uid);

  return (
    <div className="space-y-6">
      <div className={cardClass}>
        <h2 className="text-4xl font-bold mb-1 text-rose-500">Viaje</h2>
        <p className={`text-sm mb-5 ${textSecondary}`}>
          <span className="text-rose-500 font-medium">*</span> Campo obligatorio
        </p>
        {!displayName.trim() && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-yellow-900/40 text-yellow-200' : 'bg-yellow-50 text-yellow-800'} border ${theme === 'dark' ? 'border-yellow-700' : 'border-yellow-300'}`}>
            Antes de registrar viajes, configurá tu nombre en el perfil (icono de usuario arriba).
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Día <span className="text-rose-500">*</span></label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Kilómetros recorridos <span className="text-rose-500">*</span></label>
            <input
              type="text"
              inputMode="decimal"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              className={inputClass}
              placeholder="Ej. 45,6"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Descripción (opcional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              className={inputClass} placeholder="Ej. Ida y vuelta al trabajo" maxLength={100} />
          </div>
          <div className="flex items-center justify-between pt-2">
            <button type="submit" disabled={saving || !displayName.trim()}
              className="px-6 py-2.5 rounded-lg font-medium text-sm bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Guardando...' : 'Enviar'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-rose-500 hover:text-rose-400 transition-colors"
            >
              Borrar formulario
            </button>
          </div>
        </form>
      </div>

      <div className={cardClass}>
        <h2 className={`text-lg font-bold mb-3 ${textPrimary}`}>Mis Viajes</h2>
        {loading ? (
          <p className={`text-sm ${textSecondary}`}>Cargando...</p>
        ) : myTrips.length === 0 ? (
          <p className={`text-sm ${textSecondary}`}>No registraste viajes aún.</p>
        ) : (
          <div className="space-y-2">
            {myTrips.map((trip) => (
              <div key={trip.id} className={`flex items-center justify-between p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex-1">
                  <span className="font-semibold" style={{ color: headerColor }}>{trip.km} km</span>
                  <span className={`ml-2 ${textSecondary}`}>{formatDateForDisplay(trip.date)}</span>
                  {trip.note && <span className={`ml-2 ${textSecondary}`}>· {trip.note}</span>}
                </div>
                <button onClick={() => handleDelete(trip.id)}
                  className={`ml-2 p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                  title="Eliminar">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {othersTrips.length > 0 && (
        <div className={cardClass}>
          <h2 className={`text-lg font-bold mb-3 ${textPrimary}`}>Viajes de Otros</h2>
          <div className="space-y-2">
            {othersTrips.map((trip) => (
              <div key={trip.id} className={`flex items-center justify-between p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div>
                  <span className={`font-medium ${textPrimary}`}>{trip.userDisplayName}</span>
                  {trip.note && <span className={`ml-2 ${textSecondary}`}>· {trip.note}</span>}
                </div>
                <div className="text-right">
                  <span className="font-semibold" style={{ color: headerColor }}>{trip.km} km</span>
                  <div className={`text-xs ${textSecondary}`}>{formatDateForDisplay(trip.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
