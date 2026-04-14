import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getTrips, getFuelCharges } from '../services/firebaseService';
import { Trip, FuelCharge } from '../types';

interface UserStats {
  name: string;
  totalKm: number;
  totalFuel: number;
  tripCount: number;
  fuelCount: number;
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

export default function Dashboard() {
  const { theme, headerColor } = useTheme();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fuelCharges, setFuelCharges] = useState<FuelCharge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, f] = await Promise.all([getTrips(), getFuelCharges()]);
        setTrips(t);
        setFuelCharges(f);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalKm = trips.reduce((sum, t) => sum + t.km, 0);
  const totalFuel = fuelCharges.reduce((sum, f) => sum + f.amount, 0);
  const costPerKm = totalKm > 0 ? totalFuel / totalKm : 0;

  const userStatsMap: Record<string, UserStats> = {};
  for (const trip of trips) {
    const key = trip.userId;
    if (!userStatsMap[key]) {
      userStatsMap[key] = { name: trip.userDisplayName || 'Sin nombre', totalKm: 0, totalFuel: 0, tripCount: 0, fuelCount: 0 };
    }
    userStatsMap[key].totalKm += trip.km;
    userStatsMap[key].tripCount++;
    if (trip.userDisplayName) userStatsMap[key].name = trip.userDisplayName;
  }
  for (const charge of fuelCharges) {
    const key = charge.userId;
    if (!userStatsMap[key]) {
      userStatsMap[key] = { name: charge.userDisplayName || 'Sin nombre', totalKm: 0, totalFuel: 0, tripCount: 0, fuelCount: 0 };
    }
    userStatsMap[key].totalFuel += charge.amount;
    userStatsMap[key].fuelCount++;
    if (charge.userDisplayName) userStatsMap[key].name = charge.userDisplayName;
  }
  const userStats = Object.values(userStatsMap).sort((a, b) => b.totalKm - a.totalKm);

  const recentTrips = trips.slice(0, 5);
  const recentFuel = fuelCharges.slice(0, 5);

  const cardClass = `rounded-xl shadow-lg p-4 sm:p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`;
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const textMuted = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className={`text-lg ${textSecondary}`}>Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={cardClass}>
          <div className={`text-xs font-medium uppercase tracking-wider ${textSecondary}`}>KM Totales</div>
          <div className={`text-3xl font-bold mt-1 ${textPrimary}`}>{totalKm.toLocaleString('es-AR')}</div>
          <div className={`text-xs mt-1 ${textSecondary}`}>{trips.length} viajes registrados</div>
        </div>
        <div className={cardClass}>
          <div className={`text-xs font-medium uppercase tracking-wider ${textSecondary}`}>Gastado en Nafta</div>
          <div className={`text-3xl font-bold mt-1 ${textPrimary}`}>${totalFuel.toLocaleString('es-AR')}</div>
          <div className={`text-xs mt-1 ${textSecondary}`}>{fuelCharges.length} cargas registradas</div>
        </div>
        <div className={cardClass}>
          <div className={`text-xs font-medium uppercase tracking-wider ${textSecondary}`}>Costo por KM</div>
          <div className={`text-3xl font-bold mt-1 ${textPrimary}`}>${costPerKm.toFixed(2)}</div>
          <div className={`text-xs mt-1 ${textSecondary}`}>promedio general</div>
        </div>
      </div>

      {userStats.length > 0 && (
        <div className={cardClass}>
          <h2 className={`text-lg font-bold mb-4 ${textPrimary}`}>Estadísticas por Persona</h2>
          <div className="space-y-4">
            {userStats.map((u) => {
              const pctKm = totalKm > 0 ? (u.totalKm / totalKm) * 100 : 0;
              return (
                <div key={u.name} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold text-sm ${textPrimary}`}>{u.name}</span>
                    <span className={`text-xs ${textSecondary}`}>{pctKm.toFixed(1)}% del uso</span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'} mb-2`}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pctKm}%`, backgroundColor: headerColor }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={textMuted}>{u.totalKm.toLocaleString('es-AR')} km · {u.tripCount} viajes</span>
                    <span className={textMuted}>${u.totalFuel.toLocaleString('es-AR')} en nafta · {u.fuelCount} cargas</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={cardClass}>
          <h2 className={`text-lg font-bold mb-3 ${textPrimary}`}>Últimos Viajes</h2>
          {recentTrips.length === 0 ? (
            <p className={`text-sm ${textSecondary}`}>No hay viajes registrados aún.</p>
          ) : (
            <div className="space-y-2">
              {recentTrips.map((trip) => (
                <div key={trip.id} className={`flex items-center justify-between p-2.5 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
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
          )}
        </div>

        <div className={cardClass}>
          <h2 className={`text-lg font-bold mb-3 ${textPrimary}`}>Últimas Cargas</h2>
          {recentFuel.length === 0 ? (
            <p className={`text-sm ${textSecondary}`}>No hay cargas registradas aún.</p>
          ) : (
            <div className="space-y-2">
              {recentFuel.map((charge) => (
                <div key={charge.id} className={`flex items-center justify-between p-2.5 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
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
          )}
        </div>
      </div>
    </div>
  );
}
