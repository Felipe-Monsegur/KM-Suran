import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { addFuelCharge, getFuelCharges, deleteFuelCharge } from '../services/firebaseService';
import { FuelCharge } from '../types';

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

export default function RegisterFuel() {
  const { user } = useAuth();
  const { theme, displayName } = useTheme();
  const { showToast } = useToast();

  const [amount, setAmount] = useState('');
  const [liters, setLiters] = useState('');
  const [date, setDate] = useState(() => getTodayLocalISODate());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [charges, setCharges] = useState<FuelCharge[]>([]);
  const [loading, setLoading] = useState(true);

  const resetForm = () => {
    setAmount('');
    setLiters('');
    setNote('');
    setDate(getTodayLocalISODate());
  };

  const loadCharges = async () => {
    try {
      const data = await getFuelCharges();
      setCharges(data);
    } catch (error) {
      console.error('Error al cargar cargas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCharges(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) {
      showToast('Configurá tu nombre en el perfil antes de cargar nafta.', 'warning');
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Ingresá un monto válido.', 'error');
      return;
    }
    const litersNum = liters ? parseFloat(liters) : null;
    if (litersNum !== null && (isNaN(litersNum) || litersNum <= 0)) {
      showToast('Ingresá una cantidad de litros válida o dejá el campo vacío.', 'error');
      return;
    }

    setSaving(true);
    try {
      await addFuelCharge({
        userId: user.uid,
        userDisplayName: displayName,
        amount: amountNum,
        liters: litersNum,
        date,
        note,
      });
      resetForm();
      showToast(`Carga de $${amountNum.toLocaleString('es-AR')} registrada.`, 'success');
      await loadCharges();
    } catch (error) {
      console.error('Error al guardar carga:', error);
      showToast('Error al guardar la carga.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (chargeId: string) => {
    if (!confirm('¿Seguro que querés eliminar esta carga?')) return;
    try {
      await deleteFuelCharge(chargeId);
      showToast('Carga eliminada.', 'info');
      await loadCharges();
    } catch (error) {
      console.error('Error al eliminar carga:', error);
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

  const myCharges = charges.filter((c) => c.userId === user?.uid);
  const othersCharges = charges.filter((c) => c.userId !== user?.uid);

  return (
    <div className="space-y-6">
      <div className={cardClass}>
        <h2 className="text-4xl font-bold mb-1 text-emerald-500">Nafta</h2>
        <p className={`text-sm mb-5 ${textSecondary}`}>
          <span className="text-rose-500 font-medium">*</span> Campo obligatorio
        </p>
        {!displayName.trim() && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-yellow-900/40 text-yellow-200' : 'bg-yellow-50 text-yellow-800'} border ${theme === 'dark' ? 'border-yellow-700' : 'border-yellow-300'}`}>
            Antes de cargar nafta, configurá tu nombre en el perfil (icono de usuario arriba).
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Día <span className="text-rose-500">*</span></label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Monto ($) <span className="text-rose-500">*</span></label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              className={inputClass} placeholder="Ej. 15000" step="1" min="1" required />
          </div>
          <div>
            <label className={labelClass}>Litros (opcional)</label>
            <input type="number" value={liters} onChange={(e) => setLiters(e.target.value)}
              className={inputClass} placeholder="Ej. 25" step="0.1" min="0.1" />
          </div>
          <div>
            <label className={labelClass}>Descripción (opcional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              className={inputClass} placeholder="Ej. YPF Infinia" maxLength={100} />
          </div>
          <div className="flex items-center justify-between pt-2">
            <button type="submit" disabled={saving || !displayName.trim()}
              className="px-6 py-2.5 rounded-lg font-medium text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Guardando...' : 'Enviar'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              Borrar formulario
            </button>
          </div>
        </form>
      </div>

      <div className={cardClass}>
        <h2 className={`text-lg font-bold mb-3 ${textPrimary}`}>Mis Cargas</h2>
        {loading ? (
          <p className={`text-sm ${textSecondary}`}>Cargando...</p>
        ) : myCharges.length === 0 ? (
          <p className={`text-sm ${textSecondary}`}>No registraste cargas aún.</p>
        ) : (
          <div className="space-y-2">
            {myCharges.map((charge) => (
              <div key={charge.id} className={`flex items-center justify-between p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex-1">
                  <span className="font-semibold text-green-500">${charge.amount.toLocaleString('es-AR')}</span>
                  {charge.liters && <span className={`ml-2 ${textSecondary}`}>· {charge.liters}L</span>}
                  <span className={`ml-2 ${textSecondary}`}>{formatDateForDisplay(charge.date)}</span>
                  {charge.note && <span className={`ml-2 ${textSecondary}`}>· {charge.note}</span>}
                </div>
                <button onClick={() => handleDelete(charge.id)}
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

      {othersCharges.length > 0 && (
        <div className={cardClass}>
          <h2 className={`text-lg font-bold mb-3 ${textPrimary}`}>Cargas de Otros</h2>
          <div className="space-y-2">
            {othersCharges.map((charge) => (
              <div key={charge.id} className={`flex items-center justify-between p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div>
                  <span className={`font-medium ${textPrimary}`}>{charge.userDisplayName}</span>
                  {charge.liters && <span className={`ml-2 ${textSecondary}`}>· {charge.liters}L</span>}
                  {charge.note && <span className={`ml-2 ${textSecondary}`}>· {charge.note}</span>}
                </div>
                <div className="text-right">
                  <span className="font-semibold text-green-500">${charge.amount.toLocaleString('es-AR')}</span>
                  <div className={`text-xs ${textSecondary}`}>{formatDateForDisplay(charge.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
