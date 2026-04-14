import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getTrips, getFuelCharges } from '../services/firebaseService';
import { Trip, FuelCharge } from '../types';

interface UserBalance {
  userId: string;
  name: string;
  totalKm: number;
  totalPaid: number;
  fairShare: number;
  balance: number;
}

interface Debt {
  from: string;
  to: string;
  amount: number;
}

interface ChargeUserShare {
  userId: string;
  name: string;
  km: number;
  assignedCost: number;
}

interface ChargeDetail {
  id: string;
  date: string;
  payerName: string;
  amount: number;
  segmentKm: number;
  costPerKm: number;
  shares: ChargeUserShare[];
}

function getEventTimestamp(value: { createdAt?: string; date?: string }): number {
  const dateMs = value.date ? Date.parse(value.date) : NaN;
  if (!Number.isNaN(dateMs)) {
    // Usamos el dia cargado por el usuario como criterio principal
    // para que el calculo historico coincida con la cronologia visible.
    return dateMs;
  }

  const createdAtMs = value.createdAt ? Date.parse(value.createdAt) : NaN;
  if (!Number.isNaN(createdAtMs)) return createdAtMs;

  return 0;
}

function formatDateForDisplay(dateStr: string): string {
  if (!dateStr) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

export default function Balance() {
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

  const sortedTrips = [...trips].sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b));
  const sortedFuelCharges = [...fuelCharges].sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b));
  const costPerKm = totalKm > 0 ? totalFuel / totalKm : 0;

  const userMap: Record<string, { name: string; km: number; paid: number; shouldPay: number }> = {};

  for (const trip of trips) {
    if (!userMap[trip.userId]) {
      userMap[trip.userId] = { name: trip.userDisplayName || 'Sin nombre', km: 0, paid: 0, shouldPay: 0 };
    }
    userMap[trip.userId].km += trip.km;
    if (trip.userDisplayName) userMap[trip.userId].name = trip.userDisplayName;
  }
  for (const charge of fuelCharges) {
    if (!userMap[charge.userId]) {
      userMap[charge.userId] = { name: charge.userDisplayName || 'Sin nombre', km: 0, paid: 0, shouldPay: 0 };
    }
    userMap[charge.userId].paid += charge.amount;
    if (charge.userDisplayName) userMap[charge.userId].name = charge.userDisplayName;
  }

  const chargeDetails: ChargeDetail[] = [];

  // Reparte cada carga de nafta por el uso (km) del tramo que rindio esa carga:
  // desde esa carga hasta la siguiente (o infinito si es la ultima).
  for (let index = 0; index < sortedFuelCharges.length; index += 1) {
    const currentCharge = sortedFuelCharges[index];
    const currentChargeTime = getEventTimestamp(currentCharge);
    const nextCharge = sortedFuelCharges[index + 1];
    const nextChargeTime = nextCharge ? getEventTimestamp(nextCharge) : Number.POSITIVE_INFINITY;

    const tripsInSegment = sortedTrips.filter((trip) => {
      const tripTime = getEventTimestamp(trip);
      return tripTime >= currentChargeTime && tripTime < nextChargeTime;
    });

    const kmByUser: Record<string, number> = {};
    for (const trip of tripsInSegment) {
      kmByUser[trip.userId] = (kmByUser[trip.userId] || 0) + trip.km;
    }

    const segmentKm = Object.values(kmByUser).reduce((sum, km) => sum + km, 0);
    const costPerKmInSegment = segmentKm > 0 ? currentCharge.amount / segmentKm : 0;

    const shares: ChargeUserShare[] = Object.entries(kmByUser)
      .map(([userId, userKm]) => {
        const assignedCost = userKm * costPerKmInSegment;
        if (userMap[userId]) {
          userMap[userId].shouldPay += assignedCost;
        }
        return {
          userId,
          name: userMap[userId]?.name || 'Sin nombre',
          km: userKm,
          assignedCost,
        };
      })
      .sort((a, b) => b.assignedCost - a.assignedCost);

    chargeDetails.push({
      id: currentCharge.id,
      date: currentCharge.date,
      payerName: currentCharge.userDisplayName || userMap[currentCharge.userId]?.name || 'Sin nombre',
      amount: currentCharge.amount,
      segmentKm,
      costPerKm: costPerKmInSegment,
      shares,
    });
  }

  const balances: UserBalance[] = Object.entries(userMap).map(([userId, data]) => {
    const fairShare = data.shouldPay;
    return {
      userId,
      name: data.name,
      totalKm: data.km,
      totalPaid: data.paid,
      fairShare,
      balance: data.paid - fairShare,
    };
  }).sort((a, b) => b.balance - a.balance);

  const debts: Debt[] = [];
  if (balances.length >= 2) {
    const debtors = balances.filter((b) => b.balance < 0).map((b) => ({ name: b.name, amount: -b.balance }));
    const creditors = balances.filter((b) => b.balance > 0).map((b) => ({ name: b.name, amount: b.balance }));

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const transfer = Math.min(debtors[i].amount, creditors[j].amount);
      if (transfer > 0.01) {
        debts.push({ from: debtors[i].name, to: creditors[j].name, amount: transfer });
      }
      debtors[i].amount -= transfer;
      creditors[j].amount -= transfer;
      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }
  }

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const textMuted = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';
  const cardClass = `rounded-xl shadow-lg p-4 sm:p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className={`text-lg ${textSecondary}`}>Cargando balance...</div>
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className={cardClass}>
        <div className="text-center py-8">
          <div className="text-5xl mb-4">💰</div>
          <h2 className={`text-xl font-bold mb-2 ${textPrimary}`}>Sin datos aún</h2>
          <p className={`${textSecondary}`}>Registrá viajes y cargas de nafta para ver el balance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={cardClass}>
          <div className={`text-xs font-medium uppercase tracking-wider ${textSecondary}`}>Total Gastado</div>
          <div className={`text-3xl font-bold mt-1 ${textPrimary}`}>${totalFuel.toLocaleString('es-AR')}</div>
        </div>
        <div className={cardClass}>
          <div className={`text-xs font-medium uppercase tracking-wider ${textSecondary}`}>Costo por KM</div>
          <div className={`text-3xl font-bold mt-1 ${textPrimary}`}>${costPerKm.toFixed(2)}</div>
        </div>
      </div>

      {debts.length > 0 && (
        <div className={cardClass} style={{ borderLeft: `4px solid ${headerColor}` }}>
          <h2 className={`text-lg font-bold mb-4 ${textPrimary}`}>Resumen de Deudas</h2>
          <div className="space-y-3">
            {debts.map((debt, idx) => (
              <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 flex-1">
                  <span className={`font-semibold text-sm ${textPrimary}`}>{debt.from}</span>
                  <svg className={`w-5 h-5 flex-shrink-0 ${textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <span className={`font-semibold text-sm ${textPrimary}`}>{debt.to}</span>
                </div>
                <span className="font-bold text-lg" style={{ color: headerColor }}>
                  ${debt.amount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cardClass}>
        <h2 className={`text-lg font-bold mb-4 ${textPrimary}`}>Balance por Persona</h2>
        <div className="space-y-4">
          {balances.map((b) => {
            const isPositive = b.balance >= 0;
            return (
              <div key={b.userId} className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-bold text-base ${textPrimary}`}>{b.name}</span>
                  <span className={`font-bold text-lg ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}${b.balance.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs ${textMuted}`}>
                  <div>
                    <div className={`font-medium ${textSecondary}`}>KM usados</div>
                    <div className={`font-semibold ${textPrimary}`}>{b.totalKm.toLocaleString('es-AR')}</div>
                  </div>
                  <div>
                    <div className={`font-medium ${textSecondary}`}>Cargas registradas</div>
                    <div className={`font-semibold ${textPrimary}`}>{fuelCharges.length}</div>
                  </div>
                  <div>
                    <div className={`font-medium ${textSecondary}`}>Pagó en nafta</div>
                    <div className="font-semibold text-green-500">${b.totalPaid.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div>
                    <div className={`font-medium ${textSecondary}`}>Debería pagar</div>
                    <div className={`font-semibold ${textPrimary}`}>${b.fairShare.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive
                      ? `A favor: pagó $${Math.abs(b.balance).toLocaleString('es-AR', { maximumFractionDigits: 0 })} más de lo que le corresponde`
                      : `En contra: debería haber pagado $${Math.abs(b.balance).toLocaleString('es-AR', { maximumFractionDigits: 0 })} más`
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {chargeDetails.length > 0 && (
        <div className={cardClass}>
          <h2 className={`text-lg font-bold mb-4 ${textPrimary}`}>Detalle por Carga</h2>
          <div className="space-y-3">
            {chargeDetails.map((detail) => (
              <div
                key={detail.id}
                className={`rounded-lg p-3 border ${theme === 'dark' ? 'bg-gray-700/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${textPrimary}`}>{formatDateForDisplay(detail.date)}</span>
                    <span className={`text-xs ${textSecondary}`}>· pagó {detail.payerName}</span>
                  </div>
                  <span className="text-sm font-bold text-green-500">
                    ${detail.amount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </span>
                </div>

                {detail.segmentKm > 0 ? (
                  <>
                    <div className={`grid grid-cols-2 gap-2 text-xs mb-2 ${textMuted}`}>
                      <div>
                        <span className={textSecondary}>KM del tramo: </span>
                        <span className={`font-semibold ${textPrimary}`}>
                          {detail.segmentKm.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className={textSecondary}>Costo por KM: </span>
                        <span className={`font-semibold ${textPrimary}`}>
                          ${detail.costPerKm.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {detail.shares.map((share) => (
                        <div
                          key={`${detail.id}-${share.userId}`}
                          className={`flex items-center justify-between text-xs p-2 rounded ${theme === 'dark' ? 'bg-gray-800/70' : 'bg-white'}`}
                        >
                          <span className={textPrimary}>
                            {share.name} · {share.km.toLocaleString('es-AR', { maximumFractionDigits: 2 })} km
                          </span>
                          <span className={`font-semibold ${textPrimary}`}>
                            ${share.assignedCost.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className={`text-xs ${textSecondary}`}>
                    Esta carga todavía no tiene km posteriores para repartir.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`${cardClass} ${theme === 'dark' ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
        <h3 className={`text-sm font-semibold mb-2 ${textPrimary}`}>¿Cómo funciona?</h3>
        <ul className={`text-xs space-y-1 ${textSecondary}`}>
          <li>• Cada persona usa el auto y registra los km recorridos.</li>
          <li>• Cada persona carga nafta y registra cuánto pagó.</li>
          <li>• Cada carga se reparte por km del tramo que rindió esa carga (hasta la siguiente carga).</li>
          <li>• Si en una carga alguien hizo más km en ese tramo, le corresponde más de esa carga puntual.</li>
          <li>• <span className="text-green-500 font-medium">A favor</span>: pagó más nafta de la que le corresponde por su uso.</li>
          <li>• <span className="text-red-500 font-medium">En contra</span>: usó más el auto de lo que pagó en nafta.</li>
        </ul>
      </div>
    </div>
  );
}
