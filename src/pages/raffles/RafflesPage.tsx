import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, 
  TicketIcon, 
  TrashIcon, 
  XMarkIcon, 
  UsersIcon, 
  TrophyIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  PlayIcon,
  GiftIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { MonthlyRaffle, WeeklyRaffle, RaffleWinner, ProductRaffle } from '../../types';
import RafflesService, { ApiRaffle, mapProductToDbPayload } from '../../services/rafflesService';
import { 
  useRafflesList, 
  useCreateRaffle, 
  useUpdateRaffle, 
  useDeleteRaffle, 
  useDrawRaffle 
} from '../../hooks/useRaffles';
import MonthlyRaffleFormModal from '../../components/raffles/MonthlyRaffleFormModal';
import CreateWeeklyRafflesModal from '../../components/raffles/CreateWeeklyRafflesModal';
import RaffleDrawModal from '../../components/raffles/RaffleDrawModal';
import CreateProductRaffleModal from '../../components/raffles/CreateProductRaffleModal';
import EditWeeklyRaffleModal from '../../components/raffles/EditWeeklyRaffleModal';
import ProductRaffleDrawModal from '../../components/raffles/ProductRaffleDrawModal';
import ProductRaffleResultsModal from '../../components/raffles/ProductRaffleResultsModal';
import PaymentManagementModal from '../../components/raffles/PaymentManagementModal';

const RafflesPage: React.FC = () => {
  // Helper para formatear fechas sin conversión de timezone
  const formatDateWithoutTimezone = (dateString: string): string => {
    if (!dateString) return '—';
    // Extraer solo la parte de la fecha YYYY-MM-DD sin conversión de timezone
    const dateOnly = dateString.split('T')[0]; // "2025-11-10"
    const [year, month, day] = dateOnly.split('-');
    return `${day}/${month}/${year}`; // "10/11/2025"
  };

  // Estados principales
  const [monthlyRaffles, setMonthlyRaffles] = useState<MonthlyRaffle[]>([]);
  const [productRaffles, setProductRaffles] = useState<ProductRaffle[]>([]);
  const [activeTab, setActiveTab] = useState<'monthly' | 'weekly' | 'products' | 'payments'>('monthly');
  
  // Estados de modales
  const [showCreateMonthlyModal, setShowCreateMonthlyModal] = useState(false);
  const [showCreateWeeklyModal, setShowCreateWeeklyModal] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [showVisualizeModal, setShowVisualizeModal] = useState(false);
  const [showWeeklyRaffleModal, setShowWeeklyRaffleModal] = useState(false);
  const [showEditWeeklyModal, setShowEditWeeklyModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [showProductDrawModal, setShowProductDrawModal] = useState(false);
  const [showProductResultsModal, setShowProductResultsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExcludedWinnersModal, setShowExcludedWinnersModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Estados de selección
  const [selectedRaffle, setSelectedRaffle] = useState<WeeklyRaffle | null>(null);
  const [selectedMonthlyRaffle, setSelectedMonthlyRaffle] = useState<MonthlyRaffle | null>(null);
  const [selectedProductRaffle, setSelectedProductRaffle] = useState<ProductRaffle | null>(null);
  const [selectedProductWinner, setSelectedProductWinner] = useState<RaffleWinner | null>(null);
  const [raffleToDelete, setRaffleToDelete] = useState<{ id: string; name: string; type: 'monthly' | 'weekly' | 'product' } | null>(null);
  // Conteo de participantes por sorteo (tickets y usuarios únicos)
  const [participantsCountById, setParticipantsCountById] = useState<Record<string, { tickets: number; users: number }>>({});
  
  // Estados para ganadores cargados
  const [loadedWinners, setLoadedWinners] = useState<Record<string, RaffleWinner[]>>({});
  const [loadedProductWinners, setLoadedProductWinners] = useState<Record<string, RaffleWinner>>({});

  // Hooks de React Query para persistencia
  const { data: rafflesData, isLoading: isLoadingRaffles, refetch: refetchRaffles } = useRafflesList({ page: 1, limit: 200 });
  const createRaffleMutation = useCreateRaffle();
  const updateRaffleMutation = useUpdateRaffle();
  const deleteRaffleMutation = useDeleteRaffle();
  const drawRaffleMutation = useDrawRaffle();

  // Extraer datos de generalInfo de la respuesta de la API
  const generalInfo = (rafflesData as any)?.generalInfo || {};
  
  const {
    totalFundMonthly = 0,
    totalWeeklyRaffles = 0,
    totalPremiumUsers = 0,
    totalProductRaffles = 0,
    totalMonthlyRaffles = 0,
  } = generalInfo;

  // Transformar datos de React Query a formato local usando useMemo
  const processedData = useMemo(() => {
    if (!rafflesData) return { monthlyRaffles: [], productRaffles: [] };
    
    try {
      const raffles = (rafflesData?.data ?? []) as ApiRaffle[];
      const monthliesApi = raffles.filter(r => r.raffle_type === 'monthly');
      const weekliesApi  = raffles.filter(r => r.raffle_type === 'weekly');
      const productsApi  = raffles.filter(r => r.raffle_type === 'product');

      let products: ProductRaffle[] = productsApi.map((r: any) => ({
        id: r.raffle_id,
        name: r.name,
        description: r.description || '',
        product: r.product || '',
        productValue: Number(r.product_value ?? r.ticket_cost ?? 0),
        pointsRequired: Number(r.points_required ?? 0),
        imageUrl: r.url_image,
        imageFile: undefined,
        maxParticipants: Number(r.max_participants ?? r.max_tickets ?? 0),
        currentParticipants: Number(r.current_participants ?? r.total_tickets_sold ?? 0),
        participants: [],
        winner: undefined,
        prizeDistribution: { specificPositions: { firstPlace: 100, secondPlace: 0, thirdPlace: 0 }, prizeRanges: [] },
        drawDate: r.draw_date || '',
        registrationStartDate: r.registration_start_date || '',
        registrationEndDate: r.registration_end_date || '',
        status: r.status, // Pasar el status del backend directamente
        isActive: Boolean(r.is_active ?? (r.status ? r.status === 'active' : true)),
        isCompleted: Boolean(r.is_completed ?? false),
        isRegistrationOpen: Boolean(r.is_registration_open ?? false),
        isDrawn: Boolean(r.is_drawn ?? false),
        createdAt: r.created_at || new Date().toISOString(),
        updatedAt: r.updated_at || new Date().toISOString(),
      }));

      // Construir mensual/semanal agrupando por raffle_type del backend
      const monthlyMap = new Map<string, MonthlyRaffle>();
      const idToKey = new Map<string, string>();

      // Crear contenedores mensuales usando month/year si existen
      monthliesApi.forEach((m: any) => {
        const year = Number(m.year ?? (m.start_date ? new Date(m.start_date).getFullYear() : new Date().getFullYear()));
        const month = Number(m.month ?? (m.start_date ? new Date(m.start_date).getMonth() + 1 : new Date().getMonth() + 1));
        const key = m.raffle_id; // Usar raffle_id único en lugar de month/year
        idToKey.set(m.raffle_id, key);
          monthlyMap.set(key, {
            id: m.raffle_id,
            name: m.name,
            month,
            year,
            totalFund: Number(m.total_fund ?? m.fund ?? 0),
            weeklyRaffles: [],
            participants: [],
            weeklyDistribution: {
              week1: Number(m.weekly_dist_week1 ?? 25),
              week2: Number(m.weekly_dist_week2 ?? 25),
              week3: Number(m.weekly_dist_week3 ?? 25),
              week4: Number(m.weekly_dist_week4 ?? 25),
              ...(m.weekly_dist_week5 != null ? { week5: Number(m.weekly_dist_week5) } : {})
            },
            participantDistribution: {
              week1: Number(m.participant_dist_week1 ?? 25),
              week2: Number(m.participant_dist_week2 ?? 25),
              week3: Number(m.participant_dist_week3 ?? 25),
              week4: Number(m.participant_dist_week4 ?? 25),
              ...(m.participant_dist_week5 != null ? { week5: Number(m.participant_dist_week5) } : {})
            },
            winnerExclusionSettings: { enabled: Boolean(m.exclusion_enabled ?? false), exclusionPeriod: (m.exclusion_period ?? 'next_month') as any, customPeriod: Number(m.exclusion_custom_period ?? 1) },
            isActive: Boolean(m.is_active ?? true),
            createdAt: m.created_at || new Date().toISOString(),
            updatedAt: m.updated_at || new Date().toISOString(),
          });
      });

      // Asociar semanales, priorizando monthly_raffle_id; fallback por mes/año
      weekliesApi.forEach((w: any) => {
        let key: string | undefined;
        if (w.monthly_raffle_id && idToKey.has(w.monthly_raffle_id)) {
          key = idToKey.get(w.monthly_raffle_id)!;
        } else {
          const y = w.year ?? (w.start_date ? new Date(w.start_date).getFullYear() : new Date().getFullYear());
          const m = w.month ?? (w.start_date ? new Date(w.start_date).getMonth() + 1 : new Date().getMonth() + 1);
          key = `${y}-${m}`;
        }
        if (!monthlyMap.has(key)) {
          const [yy, mm] = key.split('-').map(Number);
          monthlyMap.set(key, {
            id: `auto-${key}`,
            name: `Sorteo Mensual ${mm}/${yy}`,
            month: mm,
            year: yy,
            totalFund: 0,
            weeklyRaffles: [],
            participants: [],
            weeklyDistribution: { week1: 25, week2: 25, week3: 25, week4: 25 },
            participantDistribution: { week1: 25, week2: 25, week3: 25, week4: 25 },
            winnerExclusionSettings: { enabled: false, exclusionPeriod: 'next_month', customPeriod: 1 },
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        const container = monthlyMap.get(key)!;
        const wStart = w.start_date ? new Date(w.start_date) : new Date();
        container.weeklyRaffles.push({
          id: w.raffle_id,
          name: w.name,
          description: w.description || '',
          week: Number(w.week_number ?? 0),
          weekNumber: Number(w.week_number ?? 0),
          month: container.month,
          year: container.year,
          monthlyRaffleId: container.id,
          fund: Number(w.fund ?? 0),
          totalFund: Number(w.fund ?? 0),
          pointsRequired: Number(w.points_required ?? 0),
          maxParticipants: Number(w.max_participants ?? 0),
          currentParticipants: Number(w.current_participants ?? 0),
          participants: [],
          winners: [],
          prizeDistribution: { specificPositions: { firstPlace: 30, secondPlace: 20, thirdPlace: 15 }, prizeRanges: [] },
          drawDate: w.draw_date || '',
          startDate: wStart,
          endDate: w.end_date ? new Date(w.end_date) : wStart,
          registrationStartDate: w.registration_start_date || '',
          registrationEndDate: w.registration_end_date || '',
          imageUrl: w.url_image,
          isActive: Boolean(w.is_active ?? true),
          isCompleted: Boolean(w.is_completed ?? false),
          isRegistrationOpen: Boolean(w.is_registration_open ?? false),
          isDrawn: Boolean(w.is_drawn ?? false),
          excludedParticipants: [],
          createdAt: w.created_at || new Date().toISOString(),
          updatedAt: w.updated_at || new Date().toISOString(),
        });
      });

      let monthlyMapped = Array.from(monthlyMap.values());

      return { monthlyRaffles: monthlyMapped, productRaffles: products };
    } catch (_) {
      return { monthlyRaffles: [], productRaffles: [] };
    }
  }, [rafflesData]);

  // Actualizar estados cuando cambien los datos procesados
  // React Query maneja la invalidación automáticamente después de mutaciones
  useEffect(() => {
    setMonthlyRaffles(processedData.monthlyRaffles);
    setProductRaffles(processedData.productRaffles);
  }, [processedData]);

  // Cargar ganadores cuando cambien los datos procesados
  useEffect(() => {
    const loadWinners = async () => {
      // Cargar ganadores de sorteos semanales
      const drawnWeeklyIds = processedData.monthlyRaffles.flatMap(m => m.weeklyRaffles.filter(w => w.isDrawn).map(w => w.id));
      if (drawnWeeklyIds.length) {
        const winnersById: Record<string, RaffleWinner[]> = {};
        await Promise.all(drawnWeeklyIds.map(async (id) => {
          try {
            const rows = await RafflesService.getWinners(id);
            winnersById[id] = rows.map((w: any) => ({
              id: String(w.winner_id || `${id}-${w.user_id}`),
              name: String(w.name || 'Ganador'),
              email: String(w.email || ''),
              phone: w.phone ? String(w.phone) : undefined,
              position: Number(w.position || 0),
              prizeAmount: Number(w.prize_amount || 0),
              prizePercentage: Number(w.prize_percentage || 0),
              drawDate: String(w.awarded_at || new Date().toISOString()),
              isPaid: false,
              paymentStatus: 'pending' as const,
            })).sort((a, b) => a.position - b.position);
          } catch (_) {}
        }));
        setLoadedWinners(winnersById);
      }

      // Cargar ganadores de sorteos de productos
      const drawnProducts = processedData.productRaffles.filter(p => p.isDrawn);
      if (drawnProducts.length) {
        const winnersById: Record<string, RaffleWinner> = {};
        await Promise.all(drawnProducts.map(async (p) => {
          try {
            const rows = await RafflesService.getWinners(p.id);
            const top = rows.find(r => Number(r.position) === 1) || rows[0];
            if (top) {
              winnersById[p.id] = {
                id: String(top.winner_id || `${p.id}-${top.user_id}`),
                name: String(top.name || 'Ganador'),
                email: String(top.email || ''),
                phone: top.phone ? String(top.phone) : undefined,
                position: Number(top.position || 1),
                prizeAmount: Number(top.prize_amount || p.productValue || 0),
                prizePercentage: Number(top.prize_percentage || 100),
                drawDate: String(top.awarded_at || new Date().toISOString()),
                isPaid: false,
                paymentStatus: 'pending',
              } as RaffleWinner;
            }
          } catch (_) {}
        }));
        setLoadedProductWinners(winnersById);
      }
    };

    if (processedData.monthlyRaffles.length > 0 || processedData.productRaffles.length > 0) {
      loadWinners();
    }
  }, [processedData]);

  // Combinar ganadores con las rifas
  useEffect(() => {
    if (Object.keys(loadedWinners).length > 0) {
      setMonthlyRaffles(prev => prev.map(m => ({
        ...m,
        weeklyRaffles: m.weeklyRaffles.map(w => w.isDrawn && loadedWinners[w.id] ? ({ ...w, winners: loadedWinners[w.id] }) : w)
      })));
    }
  }, [loadedWinners]);

  useEffect(() => {
    if (Object.keys(loadedProductWinners).length > 0) {
      setProductRaffles(prev => prev.map(p => loadedProductWinners[p.id] ? { ...p, winner: loadedProductWinners[p.id] } : p));
    }
  }, [loadedProductWinners]);

  // Cargar conteos de participantes cuando cambien las rifas
  useEffect(() => {
    const loadParticipantsCount = async () => {
      const weeklyIds = monthlyRaffles.flatMap((m) => m.weeklyRaffles.map((w) => w.id));
      const productIds = productRaffles.map((p) => p.id);
      const allIds = Array.from(new Set([...weeklyIds, ...productIds]));
      
      if (allIds.length) {
        const updates: Record<string, { tickets: number; users: number }> = {};
        await Promise.all(
          allIds.map(async (id) => {
            try {
              const c = await RafflesService.getParticipantsCount(id);
              updates[id] = { tickets: c.total_tickets, users: c.unique_users };
            } catch (_) {
              // ignorar errores individuales
            }
          })
        );
        if (Object.keys(updates).length) {
          setParticipantsCountById((prev) => ({ ...prev, ...updates }));
        }
      }
    };
    
    if (monthlyRaffles.length > 0 || productRaffles.length > 0) {
      loadParticipantsCount();
    }
  }, [monthlyRaffles, productRaffles]);


  // Logs al cambiar los estados (para depuración visual)
  useEffect(() => {
  }, [productRaffles]);

  useEffect(() => {
    const weeklyCount = monthlyRaffles.reduce((acc, m) => acc + (m.weeklyRaffles?.length || 0), 0);
  }, [monthlyRaffles]);

  // Funciones de manejo
  const handleCreateMonthlyRaffle = () => {
    setSelectedMonthlyRaffle(null); // Limpiar datos de edición
    setShowCreateMonthlyModal(true);
  };

  // Función para visualizar sorteos semanales (no utilizada actualmente)

  const handleVisualizeMonthlyRaffle = (monthly: MonthlyRaffle) => {
    setSelectedMonthlyRaffle(monthly);
    setShowVisualizeModal(true);
  };

  const handleCreateWeeklyRaffles = () => {
    setShowCreateWeeklyModal(true);
  };

  const handleSaveWeeklyRaffles = async (weeklyRaffles: WeeklyRaffle[]) => {
    // Eliminamos la actualización optimista del estado local
    // React Query se encargará de actualizar los datos después de la mutación

    const toIso = (d?: Date | string) => {
      if (!d) return undefined;
      const date = typeof d === 'string' ? new Date(d) : d;
      return isNaN(date.getTime()) ? undefined : date.toISOString();
    };
    try {
      for (const w of weeklyRaffles) {
        const wc = Math.max(4, w.winnersCount ?? 10);
        const top = w.prizeDistribution?.specificPositions || (w.prizeDistribution as any) || {};
        const first = Number((top as any).firstPlace ?? 30);
        const second = Number((top as any).secondPlace ?? 20);
        const third = Number((top as any).thirdPlace ?? 15);
        const topSum = first + second + third;
        const othersTotal = Math.max(0, 100 - topSum);
        const perOther = wc > 3 ? Number((othersTotal / (wc - 3)).toFixed(6)) : 0;

        // No enviamos monthly_raffle_id si no es UUID válido; backend permite year+month+week_number
        const weekNum = Math.max(1, Math.min(5, Math.floor(Number(w.weekNumber ?? w.week ?? 0))));
        const monthlyIdToSend = (id?: string) => !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : undefined;

        // 🚨 AJUSTE CRÍTICO: Asegurar que max_participants >= winners_count
        const rawMaxParticipants = Math.max(1, Math.floor(Number(w.maxParticipants ?? 0)));
        const adjustedWinnersCount = Math.min(wc, rawMaxParticipants);
        const adjustedMaxParticipants = Math.max(rawMaxParticipants, adjustedWinnersCount);

        const payload: any = {
          raffle_type: 'weekly' as const,
          name: w.name,
          description: w.description,
          start_date: toIso(w.startDate || w.registrationStartDate),
          end_date: toIso(w.endDate || w.drawDate),
          week_number: weekNum,
          month: w.month,
          year: w.year,
          monthly_raffle_id: monthlyIdToSend(w.monthlyRaffleId),
          fund: w.totalFund ?? w.fund,
          max_participants: adjustedMaxParticipants,
          registration_start_date: toIso(w.registrationStartDate || w.startDate),
          registration_end_date: toIso(w.registrationEndDate || w.endDate),
          draw_date: toIso(w.drawDate),
          is_registration_open: w.isRegistrationOpen,
          points_required: (w as any)?.pointsRequired ?? 0,
          winners_count: adjustedWinnersCount,
          prize_pct_first: first,
          prize_pct_second: second,
          prize_pct_third: third,
          prize_distribution: adjustedWinnersCount > 3 ? {
            ranges: [
              { start: 4, end: 3 + adjustedWinnersCount, percentage: perOther }
            ]
          } : { ranges: [] }, // 🚨 Enviar objeto vacío en lugar de undefined
        };
        // Adjuntar imagen si viene desde el modal (activará FormData en el servicio)
        if ((w as any).imageFile instanceof File) {
          (payload as any).imageFile = (w as any).imageFile;
        }
        // Log de depuración del body final
        let done = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            await createRaffleMutation.mutateAsync(payload as any);
            done = true;
            break;
          } catch (e: any) {
            // Solo reintentar en errores de red o servidor (5xx), no en errores de validación (4xx)
            const isRetryable = !e?.response?.status || e?.response?.status >= 500;
            if (attempt < 3 && isRetryable) {
              await new Promise((r) => setTimeout(r, 400 * attempt));
            } else {
              // Si es un error de validación (4xx) o último intento, lanzar el error
              throw e;
            }
          }
        }
        // si falla, dejamos que el refetch posterior muestre estado real
        if (!done) {
          // opcional: log local
          // console.warn('Fallo al crear sorteo semanal', w.name);
        }
      }
      // No necesita refreshRaffles, las mutations invalidan automáticamente
    } catch (e) {
      
    }
  };




  const handleEditMonthlyRaffle = (monthly: MonthlyRaffle) => {
    setSelectedMonthlyRaffle(monthly);
    setShowCreateMonthlyModal(true);
  };

  const handleCreateProductRaffle = () => {
    setSelectedProductRaffle(null);
    setShowCreateProductModal(true);
  };

  const handleEditProductRaffle = (raffle: ProductRaffle) => {
    setSelectedProductRaffle(raffle);
    setShowCreateProductModal(true);
  };

  const handleSaveProductRaffle = async (raffleData: Omit<ProductRaffle, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (selectedProductRaffle) {
        const payload = mapProductToDbPayload(raffleData);
        await updateRaffleMutation.mutateAsync({ id: selectedProductRaffle.id, data: payload });
        // No necesita refreshRaffles, la mutation invalida automáticamente
      } else {
        const payload = mapProductToDbPayload(raffleData);
        await createRaffleMutation.mutateAsync(payload);
        // No necesita refreshRaffles, la mutation invalida automáticamente
      }
      // Cerrar modal solo si fue exitoso
      setShowCreateProductModal(false);
      setSelectedProductRaffle(null);
    } catch (error) {
      // Si hay error, el modal permanece abierto
      console.error('Error al guardar sorteo:', error);
    }
  };

  const handleStartProductDraw = (raffle: ProductRaffle) => {
    setSelectedProductRaffle(raffle);
    setShowProductDrawModal(true);
  };

  const handleCompleteProductDraw = (winner: RaffleWinner) => {
    if (selectedProductRaffle) {
      const updatedRaffle: ProductRaffle = {
        ...selectedProductRaffle,
        winner: winner,
        isDrawn: true,
        isCompleted: true,
        isActive: false,
        updatedAt: new Date().toISOString()
      };
      setProductRaffles(prev => prev.map(r => r.id === selectedProductRaffle.id ? updatedRaffle : r));
      setSelectedProductWinner(winner);
      setShowProductDrawModal(false);
      setShowProductResultsModal(true);
    }
  };

  const handleViewProductResults = (raffle: ProductRaffle) => {
    (async () => {
      try {
        // Si ya tenemos winner local, usarlo
        if (raffle.winner) {
          setSelectedProductRaffle(raffle);
          setSelectedProductWinner(raffle.winner);
          setShowProductResultsModal(true);
          return;
        }
        // Caso contrario, traer ganador desde API
        const rows = await RafflesService.getWinners(raffle.id);
        const top = rows.find(r => Number(r.position) === 1) || rows[0];
        if (!top) {
          alert('No hay resultados disponibles aún para este sorteo.');
          return;
        }
        const mapped: RaffleWinner = {
          id: String(top.winner_id || `${raffle.id}-${top.user_id}`),
          name: String(top.name || 'Ganador'),
          email: String(top.email || ''),
          phone: top.phone ? String(top.phone) : undefined,
          position: Number(top.position || 1),
          prizeAmount: Number(top.prize_amount || raffle.productValue || 0),
          prizePercentage: Number(top.prize_percentage || 100),
          drawDate: String(top.awarded_at || new Date().toISOString()),
          isPaid: false,
          paymentStatus: 'pending',
        };
        setSelectedProductRaffle({ ...raffle, winner: mapped });
        setSelectedProductWinner(mapped);
        setShowProductResultsModal(true);
      } catch (e) {
        alert('No se pudo cargar los resultados de este sorteo.');
      }
    })();
  };



  const handleOpenPaymentManagement = (raffle: WeeklyRaffle) => {
    setSelectedRaffle(raffle);
    setShowPaymentModal(true);
  };

  const handleUpdatePayment = (winnerId: string, paymentStatus: string, paymentMethod?: string) => {
    if (selectedRaffle) {
      const updatedRaffle = {
        ...selectedRaffle,
        winners: selectedRaffle.winners.map(winner => 
          winner.id === winnerId 
            ? { 
                ...winner, 
                paymentStatus: paymentStatus as any,
                paymentMethod: paymentMethod as any,
                isPaid: paymentStatus === 'completed'
              }
            : winner
        ),
        updatedAt: new Date().toISOString()
      };
      
      setMonthlyRaffles(prev => prev.map(monthly => ({
        ...monthly,
        weeklyRaffles: monthly.weeklyRaffles.map(weekly => 
          weekly.id === selectedRaffle.id ? updatedRaffle : weekly
        )
      })));
      
      setSelectedRaffle(updatedRaffle);
    }
  };

  const handleSaveMonthlyRaffle = async (monthlyRaffle: MonthlyRaffle) => {
    // Persistir mensual (entrada base con nombre y fechas derivadas)
    try {
      
      // Fechas del mes (inicio y fin) y sábados del mes calculados
      const monthStart = new Date(monthlyRaffle.year, monthlyRaffle.month - 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(monthlyRaffle.year, monthlyRaffle.month, 0, 23, 59, 59, 999);
      const getSaturdayDates = (month: number, year: number): Date[] => {
        const dates: Date[] = [];
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        let d = new Date(firstDay);
        while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
        while (d <= lastDay) {
          dates.push(new Date(d));
          d.setDate(d.getDate() + 7);
        }
        return dates;
      };

      const formatDate = (d?: Date | string) => {
        if (!d) return undefined;
        const date = typeof d === 'string' ? new Date(d) : d;
        return isNaN(date.getTime()) ? undefined : date.toISOString();
      };
      const payload: any = {
        raffle_type: 'monthly' as const,
        name: monthlyRaffle.name,
        start_date: monthStart.toISOString(),
        end_date: monthEnd.toISOString(),
        month: monthlyRaffle.month,
        year: monthlyRaffle.year,
        total_fund: monthlyRaffle.totalFund,
        fund: monthlyRaffle.totalFund,
        weekly_dist_week1: monthlyRaffle.weeklyDistribution?.week1 ?? 25,
        weekly_dist_week2: monthlyRaffle.weeklyDistribution?.week2 ?? 25,
        weekly_dist_week3: monthlyRaffle.weeklyDistribution?.week3 ?? 25,
        weekly_dist_week4: monthlyRaffle.weeklyDistribution?.week4 ?? 25,
        ...(monthlyRaffle.weeklyDistribution?.week5 != null ? { weekly_dist_week5: monthlyRaffle.weeklyDistribution?.week5 } : {}),
        participant_dist_week1: monthlyRaffle.participantDistribution?.week1 ?? 0,
        participant_dist_week2: monthlyRaffle.participantDistribution?.week2 ?? 0,
        participant_dist_week3: monthlyRaffle.participantDistribution?.week3 ?? 0,
        participant_dist_week4: monthlyRaffle.participantDistribution?.week4 ?? 0,
        ...(monthlyRaffle.participantDistribution?.week5 != null ? { participant_dist_week5: monthlyRaffle.participantDistribution?.week5 } : {}),
        // Sábados del mes garantizados (aunque no existan weeklyRaffles)
        ...(() => {
          const sats = getSaturdayDates(monthlyRaffle.month, monthlyRaffle.year);
          const out: any = {};
          if (sats[0]) out.saturday_date_week1 = formatDate(sats[0]);
          if (sats[1]) out.saturday_date_week2 = formatDate(sats[1]);
          if (sats[2]) out.saturday_date_week3 = formatDate(sats[2]);
          if (sats[3]) out.saturday_date_week4 = formatDate(sats[3]);
          if (sats[4]) out.saturday_date_week5 = formatDate(sats[4]);
          return out;
        })(),
        exclusion_enabled: monthlyRaffle.winnerExclusionSettings?.enabled ?? false,
        exclusion_period: monthlyRaffle.winnerExclusionSettings?.exclusionPeriod ?? 'next_month',
        exclusion_custom_period: monthlyRaffle.winnerExclusionSettings?.customPeriod ?? 1,
      };
      
      
      const isEdit = selectedMonthlyRaffle && !String(selectedMonthlyRaffle.id).startsWith('auto-');
      
      if (isEdit) {
        await updateRaffleMutation.mutateAsync({ id: selectedMonthlyRaffle!.id, data: payload });
      } else {
        await createRaffleMutation.mutateAsync(payload);
      }
      // No necesita refreshRaffles, las mutations invalidan automáticamente
    } catch (e) {
    }

    setShowCreateMonthlyModal(false);
    setSelectedMonthlyRaffle(null);
  };

  const handleCompleteDraw = async (winners: RaffleWinner[]) => {
    if (!selectedRaffle) return;

    try {
      // Preparar los ganadores para enviar al backend
      // El backend espera un array simple de UUIDs de usuarios: ["uuid1", "uuid2", "uuid3"]
      // El winner.id ya debería ser el user_id (se establece en confirmResults del modal)
      const winnersUserIds = winners
        .map(winner => {
          // Si el ID es temporal, intentar buscar el participante
          if (winner.id.startsWith('temp-')) {
            // Buscar el participante por nombre en los participantes del sorteo
            const participant = selectedRaffle.participants?.find(p => p.name === winner.name);
            return participant?.id || null;
          }
          // Si no es temporal, usar el ID directamente (debería ser el user_id)
          return winner.id;
        })
        .filter((id): id is string => {
          // Filtrar: debe ser un string válido, no null/undefined, no temporal, y debe parecer un UUID
          return id !== null && 
                 id !== undefined && 
                 typeof id === 'string' &&
                 !id.startsWith('temp-') &&
                 id.length > 0;
        });

      if (winnersUserIds.length === 0) {
        throw new Error('No se pudieron obtener los user_ids de los ganadores. Verifica que los participantes tengan user_id válido.');
      }

      // Enviar los ganadores seleccionados al backend (array de UUIDs)
      await RafflesService.draw(selectedRaffle.id, winnersUserIds);
      
      // Actualizar el sorteo con los ganadores y cambiar estado
      const updated: WeeklyRaffle = {
        ...selectedRaffle,
        winners,
        isDrawn: true,
        isCompleted: true,
        isActive: false
      };

      setMonthlyRaffles(prev => prev.map(monthly => ({
        ...monthly,
        weeklyRaffles: monthly.weeklyRaffles.map(weekly => 
          weekly.id === selectedRaffle.id ? updated : weekly
        )
      })));

      setShowDrawModal(false);
      setSelectedRaffle(null);
      setSelectedMonthlyRaffle(null);
      
      alert(`🎉 ¡Sorteo completado!\n\n` +
            `🏆 Ganadores seleccionados: ${winners.length}\n` +
            `💰 Premio total distribuido: $${winners.reduce((sum, w) => sum + w.prizeAmount, 0).toFixed(2)}\n` +
            `📊 Estado: Completado`);
    } catch (e) {
      alert('Error al guardar el sorteo en el backend. Los ganadores se mostraron pero no se guardaron.');
      console.error('Error al completar sorteo:', e);
    }
  };

  const handleStartDraw = (raffle: WeeklyRaffle) => {
    // Encontrar el sorteo mensual asociado
    const monthlyRaffle = monthlyRaffles.find(m => 
      m.weeklyRaffles.some(w => w.id === raffle.id) || 
      m.id === raffle.monthlyRaffleId
    );
    
    setSelectedRaffle(raffle);
    setSelectedMonthlyRaffle(monthlyRaffle || null);
    setShowDrawModal(true);
  };

  const handleViewWinners = (raffle: WeeklyRaffle) => {
    setSelectedRaffle(raffle);
    setShowWeeklyRaffleModal(true);
  };

  const handleEditWeekly = (raffle: WeeklyRaffle) => {
    setSelectedRaffle(raffle);
    setShowEditWeeklyModal(true);
  };

  const handleSaveWeekly = async (updated: WeeklyRaffle) => {
    const wc = Math.max(4, updated.winnersCount ?? 10);
    const sp = updated.prizeDistribution?.specificPositions || (updated.prizeDistribution as any) || {};
    const first = Number((sp as any).firstPlace ?? 30);
    const second = Number((sp as any).secondPlace ?? 20);
    const third = Number((sp as any).thirdPlace ?? 15);
    const topSum = first + second + third;
    const othersTotal = Math.max(0, 100 - topSum);
    const perOther = wc > 3 ? Number((othersTotal / (wc - 3)).toFixed(6)) : 0;

    const payload: any = {
      name: updated.name,
      description: updated.description,
      start_date: (updated.startDate instanceof Date ? updated.startDate.toISOString() : updated.registrationStartDate) || undefined,
      end_date: (updated.endDate instanceof Date ? updated.endDate.toISOString() : updated.registrationEndDate) || undefined,
      week_number: updated.weekNumber ?? updated.week,
      month: updated.month,
      year: updated.year,
      fund: updated.totalFund ?? updated.fund,
      max_participants: updated.maxParticipants,
      registration_start_date: updated.registrationStartDate,
      registration_end_date: updated.registrationEndDate,
      draw_date: updated.drawDate,
      is_registration_open: updated.isRegistrationOpen,
      points_required: (updated as any)?.pointsRequired ?? 0,
      winners_count: wc,
      prize_pct_first: first,
      prize_pct_second: second,
      prize_pct_third: third,
      prize_distribution: wc > 3 ? {
        ranges: [
          { start: 4, end: 3 + wc, percentage: perOther }
        ]
      } : undefined,
    };
    
    // Incluir imagen si se subió un nuevo archivo
    if ((updated as any).imageFile instanceof File) {
      payload.imageFile = (updated as any).imageFile;
    }
    
    try {
      await updateRaffleMutation.mutateAsync({ id: updated.id, data: payload });
      // Actualizar estado local solo después de que la operación sea exitosa
      setMonthlyRaffles(prev => prev.map(monthly => ({
        ...monthly,
        weeklyRaffles: monthly.weeklyRaffles.map(w => w.id === updated.id ? updated : w)
      })));
      setSelectedRaffle(null);
    } catch (error) {
      console.error('Error al actualizar sorteo semanal:', error);
      throw error;
    }
  };

  const handleDeleteRaffle = (raffleId: string, raffleName: string, type: 'monthly' | 'weekly' | 'product') => {
    setRaffleToDelete({ id: raffleId, name: raffleName, type });
    setShowDeleteModal(true);
  };

  const confirmDeleteRaffle = async () => {
    
    if (!raffleToDelete) {
      return;
    }
    
    try {
      const result = await deleteRaffleMutation.mutateAsync(raffleToDelete.id);
      
      // Cerrar modal
      setShowDeleteModal(false);
      setRaffleToDelete(null);
    } catch (error: any) {
      console.error({
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
      // Cerrar modal incluso si hay error
      setShowDeleteModal(false);
      setRaffleToDelete(null);
    }
  };

  // Función para obtener el conteo de ganadores excluidos
  const getExcludedWinnersCount = (monthly: MonthlyRaffle): number => {
    if (!monthly.winnerExclusionSettings.enabled) return 0;
    
    const now = new Date();
    let excludedCount = 0;
    
    monthly.weeklyRaffles.forEach(weekly => {
      weekly.winners.forEach(winner => {
        // Verificar si el ganador está excluido según la configuración
        const drawDate = new Date(winner.drawDate);
        const exclusionPeriod = monthly.winnerExclusionSettings.exclusionPeriod;
        const customPeriod = monthly.winnerExclusionSettings.customPeriod;
        
        let exclusionEndDate: Date;
        
        switch (exclusionPeriod) {
          case 'next_week':
            exclusionEndDate = new Date(drawDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'next_month':
            exclusionEndDate = new Date(drawDate.getFullYear(), drawDate.getMonth() + 1, drawDate.getDate());
            break;
          case 'custom_weeks':
            exclusionEndDate = new Date(drawDate.getTime() + customPeriod * 7 * 24 * 60 * 60 * 1000);
            break;
          case 'custom_months':
            exclusionEndDate = new Date(drawDate.getFullYear(), drawDate.getMonth() + customPeriod, drawDate.getDate());
            break;
          default:
            return;
        }
        
        if (now <= exclusionEndDate) {
          excludedCount++;
        }
      });
    });
    
    return excludedCount;
  };

  // Función para ver la lista de ganadores excluidos
  const handleViewExcludedWinners = (monthly: MonthlyRaffle) => {
    setSelectedMonthlyRaffle(monthly);
    setShowExcludedWinnersModal(true);
  };



  return (
    <div className="min-h-screen bg-gray-50 px-4 ">
        {/* Header */}
        <div>
        <h1 className="text-2xl font-bold text-gray-900 ">Sorteos</h1>
        <p className="text-gray-600 ">
          Gestiona sorteos mensuales, semanales y de productos
        </p>
        </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 ">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'monthly', name: 'Sorteos Mensuales', icon: CalendarIcon },
              { id: 'weekly', name: 'Sorteos Semanales', icon: TicketIcon },
              { id: 'products', name: 'Sorteos de Productos', icon: GiftIcon }
              // { id: 'payments', name: 'Pagos', icon: CurrencyDollarIcon } // Oculto temporalmente
            ].map((tab) => (
          <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 '
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
          </button>
            ))}
          </nav>
        </div>
      </div>


      {/* Contenido por tab */}
      {activeTab === 'monthly' && (
        <div>
           {/* Estadísticas en formato de cards */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
             {isLoadingRaffles ? (
               [...Array(4)].map((_, idx) => (
                 <div key={`skeleton-stat-${idx}`} className="card p-6">
                   <div className="flex items-center animate-pulse">
                     <div className="flex-shrink-0">
                       <div className="h-8 w-8 bg-gray-200 rounded"></div>
                     </div>
                     <div className="ml-4 flex-1 space-y-2">
                       <div className="h-4 bg-gray-200 rounded w-32"></div>
                       <div className="h-6 bg-gray-200 rounded w-24"></div>
                       <div className="h-3 bg-gray-200 rounded w-20"></div>
                     </div>
                   </div>
                 </div>
               ))
             ) : (
               <>
                <div className="card p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-500 ">Fondos Totales</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        ${totalFundMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500 ">Suma de fondos mensuales</p>
                    </div>
                  </div>
                </div>
                
                <div className="card p-6">
                  <div className="flex items-center">
                   <div className="flex-shrink-0">
                     <UsersIcon className="h-8 w-8 text-primary-600" />
                   </div>
                   <div className="ml-4 flex-1">
                     <p className="text-sm font-medium text-gray-500 ">Total Participantes</p>
                     <p className="text-2xl font-semibold text-gray-900">
                       {totalPremiumUsers}
                     </p>
                     <p className="text-xs text-gray-500 ">Usuarios suscritos</p>
                   </div>
                 </div>
               </div>
                
                <div className="card p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <GiftIcon className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-500 ">Sorteos de Producto</p>
                      <p className="text-2xl font-semibold text-gray-900">{totalProductRaffles}</p>
                      <p className="text-xs text-gray-500 ">Total sorteos producto</p>
                    </div>
                  </div>
                </div>
                
                <div className="card p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-500 ">Sorteos Semanales</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {totalWeeklyRaffles}
                      </p>
                      <p className="text-xs text-gray-500 ">Total sorteos semanales</p>
                    </div>
                  </div>
                </div>
               </>
             )}
           </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Sorteos Mensuales</h2>
              <button
                onClick={handleCreateMonthlyRaffle}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Crear Sorteo Mensual</span>
              </button>
            </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingRaffles ? (
                [...Array(6)].map((_, idx) => (
                  <div key={`skeleton-monthly-${idx}`} className="card p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center mb-4">
                        <div className="h-8 w-8 bg-gray-200 rounded mr-3"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                          <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <div className="h-8 w-24 bg-gray-200 rounded"></div>
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                monthlyRaffles.map((monthly) => (
                  <div key={monthly.id} className="card p-6">
                    <div className="flex items-center mb-4">
                      <CalendarIcon className="h-8 w-8 text-primary-600 mr-3" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{monthly.name}</h3>
                        <p className="text-sm text-gray-500 ">
                          {monthly.weeklyRaffles.length} sorteos semanales
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 ">Fondo total:</span>
                        <span className="text-sm font-medium text-gray-900 ">
                          ${monthly.totalFund.toFixed(2)} USD
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 ">Mes/Año:</span>
                        <span className="text-sm font-medium text-gray-900 ">
                          {monthly.month}/{monthly.year}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 ">Estado:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          monthly.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {monthly.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 ">Exclusión:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          monthly.winnerExclusionSettings?.enabled 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {monthly.winnerExclusionSettings?.enabled ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      {monthly.winnerExclusionSettings?.enabled && (
                        <div className="mt-2">
                          <button
                            onClick={() => handleViewExcludedWinners(monthly)}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Ver ganadores excluidos ({getExcludedWinnersCount(monthly)})
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleVisualizeMonthlyRaffle(monthly)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>Ver Detalles</span>
                        </button>
                        <button
                          onClick={() => handleEditMonthlyRaffle(monthly)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Editar</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteRaffle(monthly.id, monthly.name, 'monthly')}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          </div>
        </div>
      )}

      {activeTab === 'weekly' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Sorteos Semanales</h2>
            <button
              onClick={handleCreateWeeklyRaffles}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Crear Sorteos Semanales</span>
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {monthlyRaffles.flatMap(monthly => monthly.weeklyRaffles).filter(raffle => raffle).map((raffle) => (
                <div key={raffle.id} className="card p-6">
                  <div className="flex items-center mb-4">
                    <TicketIcon className="h-8 w-8 text-primary-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{raffle.name}</h3>
                      <p className="text-sm text-gray-500 ">{raffle.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 ">Semana:</span>
                      <span className="text-sm font-medium text-gray-900 ">
                        {raffle.weekNumber} - {raffle.month}/{raffle.year}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 ">Participantes:</span>
                      <span className="text-sm font-medium text-gray-900 ">
                        {(participantsCountById[raffle.id]?.users ?? raffle.currentParticipants)}/{raffle.maxParticipants}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 ">Puntos requeridos:</span>
                      <span className="text-sm font-medium text-gray-900 ">
                        {raffle.pointsRequired ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 ">Fondo:</span>
                      <span className="text-sm font-medium text-gray-900 ">
                        ${raffle.totalFund.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 ">Estado:</span>
                      <span className={`badge ${
                        raffle.isDrawn 
                          ? 'badge-success' 
                          : raffle.isActive 
                            ? 'badge-warning' 
                            : 'badge-secondary'
                      }`}>
                        {raffle.isDrawn ? 'Realizado' : raffle.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex flex-wrap gap-2">
                      {raffle.isDrawn ? (
                        <button 
                          onClick={() => handleViewWinners(raffle)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <TrophyIcon className="h-4 w-4" />
                          <span>Ver Resultados</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleStartDraw(raffle)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <PlayIcon className="h-4 w-4" />
                          <span>Sortear</span>
                        </button>
                      )}
                      {/* Editar sorteo semanal */}
                      <button 
                        onClick={() => handleEditWeekly(raffle)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Editar</span>
                      </button>

                      <button 
                        onClick={() => handleDeleteRaffle(raffle.id, raffle.name, 'weekly')}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Sorteos de Productos</h2>
            <button
              onClick={handleCreateProductRaffle}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Crear Sorteo de Producto</span>
            </button>
          </div>
              
          <div className="p-6">
            {productRaffles.length === 0 ? (
              <div className="text-center py-12">
                <GiftIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay sorteos de premio</h3>
                <p className="text-gray-500 mb-4">
                  Aún no se han creado sorteos de productos.
                </p>
                <button
                  onClick={handleCreateProductRaffle}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors inline-flex items-center space-x-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Crear Primer Sorteo</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productRaffles.map((raffle) => (
                <div key={raffle.id} className="card p-6">
                  {raffle.imageUrl && (
                    <div className="mb-4">
                      <img 
                        src={raffle.imageUrl} 
                        alt={raffle.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <GiftIcon className="h-6 w-6 text-primary-600 mr-2" />
                      <h3 className="text-lg font-bold text-gray-900">{raffle.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 ml-8">{raffle.description}</p>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 ">Participantes:</span>
                      <span className="text-sm font-medium text-gray-900 ">
                        {(participantsCountById[raffle.id]?.users ?? raffle.currentParticipants)}/{raffle.maxParticipants}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 ">Fecha inicio:</span>
                      <span className="text-sm font-medium text-gray-900 ">
                        {formatDateWithoutTimezone(raffle.registrationStartDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 ">Fecha fin registro:</span>
                      <span className="text-sm font-medium text-gray-900 ">
                        {formatDateWithoutTimezone(raffle.registrationEndDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 ">Fecha sorteo:</span>
                      <span className="text-sm font-medium text-gray-900 ">
                        {formatDateWithoutTimezone(raffle.drawDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 ">Estado:</span>
                      <span className={`badge ${
                        raffle.isDrawn 
                          ? 'badge-success' 
                          : raffle.status === 'pending'
                            ? 'badge-warning'
                            : raffle.status === 'active'
                              ? 'badge-success'
                              : raffle.status === 'finished'
                                ? 'badge-info'
                                : raffle.status === 'inactive'
                                  ? 'badge-secondary'
                                  : raffle.status === 'suspended'
                                    ? 'badge-danger'
                                    : raffle.isActive 
                                      ? 'badge-warning' 
                                      : 'badge-secondary'
                      }`}>
                        {raffle.isDrawn 
                          ? 'Realizado' 
                          : raffle.status === 'pending'
                            ? 'Pendiente'
                            : raffle.status === 'active'
                              ? 'Activo'
                              : raffle.status === 'finished'
                                ? 'Finalizado'
                                : raffle.status === 'inactive'
                                  ? 'Inactivo'
                                  : raffle.status === 'suspended'
                                    ? 'Suspendido'
                                    : raffle.isActive 
                                      ? 'Activo' 
                                      : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex flex-wrap gap-2">
                      {raffle.isDrawn ? (
                        <button 
                          onClick={() => handleViewProductResults(raffle)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <TrophyIcon className="h-4 w-4" />
                          <span>Ver Resultados</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleStartProductDraw(raffle)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <PlayIcon className="h-4 w-4" />
                          <span>Sortear</span>
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleEditProductRaffle(raffle)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Editar</span>
                      </button>
                      
                      <button 
                        onClick={() => handleDeleteRaffle(raffle.id, raffle.name, 'product')}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
      )}

      {false && activeTab === 'payments' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 ">
            <h2 className="text-lg font-semibold text-gray-900">Gestión de Pagos</h2>
          </div>
          
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-500 mr-3" />
              Gestión de Pagos de Sorteos
            </h2>
            
             {/* Resumen de pagos */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
               <div className="card p-6">
                 <div className="flex items-center">
                   <div className="flex-shrink-0">
                     <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />
                   </div>
                   <div className="ml-4 flex-1">
                     <p className="text-sm font-medium text-gray-500 ">Total Pagado</p>
                     <p className="text-2xl font-semibold text-gray-900">
                       ${monthlyRaffles.reduce((sum, monthly) => 
                         sum + monthly.weeklyRaffles.reduce((weeklySum, weekly) => 
                           weeklySum + weekly.winners.filter(w => w.paymentStatus === 'completed')
                             .reduce((winnerSum, winner) => winnerSum + winner.prizeAmount, 0), 0
                         ), 0
                       ).toFixed(2)}
                     </p>
                     <p className="text-xs text-gray-500 ">USD completados</p>
                   </div>
                 </div>
               </div>
               
               <div className="card p-6">
                 <div className="flex items-center">
                   <div className="flex-shrink-0">
                     <ClockIcon className="h-8 w-8 text-primary-600" />
                   </div>
                   <div className="ml-4 flex-1">
                     <p className="text-sm font-medium text-gray-500 ">Pendientes</p>
                     <p className="text-2xl font-semibold text-gray-900">
                       ${monthlyRaffles.reduce((sum, monthly) => 
                         sum + monthly.weeklyRaffles.reduce((weeklySum, weekly) => 
                           weeklySum + weekly.winners.filter(w => w.paymentStatus === 'pending')
                             .reduce((winnerSum, winner) => winnerSum + winner.prizeAmount, 0), 0
                         ), 0
                       ).toFixed(2)}
                     </p>
                     <p className="text-xs text-gray-500 ">USD por pagar</p>
                   </div>
                 </div>
               </div>
               
               <div className="card p-6">
                 <div className="flex items-center">
                   <div className="flex-shrink-0">
                     <UsersIcon className="h-8 w-8 text-primary-600" />
                   </div>
                   <div className="ml-4 flex-1">
                     <p className="text-sm font-medium text-gray-500 ">Ganadores Pagados</p>
                     <p className="text-2xl font-semibold text-gray-900">
                       {monthlyRaffles.reduce((sum, monthly) => 
                         sum + monthly.weeklyRaffles.reduce((weeklySum, weekly) => 
                           weeklySum + weekly.winners.filter(w => w.paymentStatus === 'completed').length, 0
                         ), 0
                       )}
                     </p>
                     <p className="text-xs text-gray-500 ">Usuarios pagados</p>
                   </div>
                 </div>
               </div>
               
               <div className="card p-6">
                 <div className="flex items-center">
                   <div className="flex-shrink-0">
                     <XMarkIcon className="h-8 w-8 text-primary-600" />
                   </div>
                   <div className="ml-4 flex-1">
                     <p className="text-sm font-medium text-gray-500 ">Pendientes de Pago</p>
                     <p className="text-2xl font-semibold text-gray-900">
                       {monthlyRaffles.reduce((sum, monthly) => 
                         sum + monthly.weeklyRaffles.reduce((weeklySum, weekly) => 
                           weeklySum + weekly.winners.filter(w => w.paymentStatus === 'pending').length, 0
                         ), 0
                       )}
                     </p>
                     <p className="text-xs text-gray-500 ">Usuarios pendientes</p>
                   </div>
                 </div>
               </div>
             </div>

            {/* Lista de sorteos con pagos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sorteos con Pagos Pendientes</h3>
                
              {monthlyRaffles.map(monthly => 
                monthly.weeklyRaffles
                  .filter(weekly => weekly.isDrawn && weekly.winners.length > 0)
                  .map(weekly => {
                    const paidCount = weekly.winners.filter(w => w.paymentStatus === 'completed').length;
                    const totalCount = weekly.winners.length;
                    const paidAmount = weekly.winners.filter(w => w.paymentStatus === 'completed').reduce((sum, w) => sum + w.prizeAmount, 0);
                    const totalAmount = weekly.winners.reduce((sum, w) => sum + w.prizeAmount, 0);
                    
                    return (
                      <div key={weekly.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                           onClick={() => handleOpenPaymentManagement(weekly)}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">{weekly.name}</h4>
                            <p className="text-sm text-gray-600">Semana {weekly.weekNumber} - {weekly.month}/{weekly.year}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm text-gray-500 ">
                                {paidCount}/{totalCount} pagos completados
                              </span>
                              <span className="text-sm text-gray-500 ">
                                ${paidAmount.toFixed(2)} / ${totalAmount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            {/* Barra de progreso */}
                            <div className="w-24">
                              <div className="bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${(paidCount / totalCount) * 100}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 text-center">
                                {Math.round((paidCount / totalCount) * 100)}%
                              </p>
                            </div>
                            
                            {/* Estado */}
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                paidCount === totalCount 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {paidCount === totalCount ? 'Completado' : 'Pendiente'}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {totalCount - paidCount} pendientes
                              </p>
                            </div>
                            
                            {/* Botón de gestión */}
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                              Gestionar Pagos
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <MonthlyRaffleFormModal
        isOpen={showCreateMonthlyModal}
        onClose={() => setShowCreateMonthlyModal(false)}
        onSave={handleSaveMonthlyRaffle}
        monthlyRaffle={selectedMonthlyRaffle}
        totalPremiumUsers={totalPremiumUsers}
        isLoading={createRaffleMutation.isPending || updateRaffleMutation.isPending}
      />

      <RaffleDrawModal
        isOpen={showDrawModal}
        onClose={() => {
          setShowDrawModal(false);
          setSelectedRaffle(null);
          setSelectedMonthlyRaffle(null);
        }}
        raffle={selectedRaffle}
        monthlyRaffle={selectedMonthlyRaffle || (selectedRaffle ? monthlyRaffles.find(m => 
          m.weeklyRaffles.some(w => w.id === selectedRaffle.id) || 
          m.id === selectedRaffle.monthlyRaffleId
        ) : null)}
        onComplete={handleCompleteDraw}
      />
      <EditWeeklyRaffleModal
        isOpen={showEditWeeklyModal}
        onClose={() => setShowEditWeeklyModal(false)}
        raffle={selectedRaffle}
        onSave={handleSaveWeekly}
      />


      {/* Modal de Creación de Sorteos Semanales */}
      <CreateWeeklyRafflesModal
        isOpen={showCreateWeeklyModal}
        onClose={() => setShowCreateWeeklyModal(false)}
        onSave={handleSaveWeeklyRaffles}
        monthlyRaffles={monthlyRaffles}
      />

      {/* Modal de Edición de Sorteo Semanal - (unificado usando EditWeeklyRaffleModal) */}

      {/* Modal de Visualización de Sorteo Semanal */}
      {showWeeklyRaffleModal && selectedRaffle && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowWeeklyRaffleModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 ">{selectedRaffle.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Semana {selectedRaffle.weekNumber} - {selectedRaffle.month}/{selectedRaffle.year}</p>
                  </div>
                  <button
                    onClick={() => setShowWeeklyRaffleModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Información General */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Información General</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Nombre:</span>
                        <p className="text-sm text-gray-900">{selectedRaffle.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Semana:</span>
                        <p className="text-sm text-gray-900">Semana {selectedRaffle.weekNumber} - {selectedRaffle.month}/{selectedRaffle.year}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Fondo Total:</span>
                        <p className="text-sm text-gray-900">${selectedRaffle.totalFund.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Participantes:</span>
                        <p className="text-sm text-gray-900">{selectedRaffle.currentParticipants}/{selectedRaffle.maxParticipants}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Estado:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedRaffle.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedRaffle.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Sorteo:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedRaffle.isDrawn 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedRaffle.isDrawn ? 'Realizado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Distribución de Premios */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Distribución de Premios</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">1er Lugar:</span>
                        <span className="text-sm font-medium text-gray-900 ">{selectedRaffle.prizeDistribution.specificPositions.firstPlace}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">2do Lugar:</span>
                        <span className="text-sm font-medium text-gray-900 ">{selectedRaffle.prizeDistribution.specificPositions.secondPlace}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">3er Lugar:</span>
                        <span className="text-sm font-medium text-gray-900 ">{selectedRaffle.prizeDistribution.specificPositions.thirdPlace}%</span>
                      </div>
                      {selectedRaffle.prizeDistribution.prizeRanges.map((range, index) => (
                        <div key={range.id} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Puestos {range.startPosition}-{range.endPosition}:</span>
                          <span className="text-sm font-medium text-gray-900 ">{range.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ganadores Detallados */}
                  {selectedRaffle.winners.length > 0 ? (
                    <div className="bg-green-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xl font-bold text-gray-900 flex items-center">
                          <TrophyIcon className="h-6 w-6 text-yellow-500 mr-2" />
                          Ganadores del Sorteo
                        </h4>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {selectedRaffle.winners.length} ganadores
                        </span>
                      </div>
                      
                      {/* Top 3 Ganadores */}
                      {selectedRaffle.winners.filter((_, index) => index < 3).length > 0 && (
                        <div className="mb-6">
                          <h5 className="text-lg font-semibold text-gray-800 mb-4">🏆 Top 3 Ganadores</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {selectedRaffle.winners.filter((_, index) => index < 3).map((winner, index) => (
                              <div key={winner.id} className={`p-4 rounded-xl border-2 shadow-lg ${
                                index === 0 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300' :
                                index === 1 ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 ' :
                                'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300'
                              }`}>
                                <div className="text-center">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3 ${
                                    index === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                    index === 1 ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
                                    'bg-gradient-to-r from-orange-500 to-orange-600'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <h6 className="font-bold text-gray-900 text-lg">{winner.name}</h6>
                                  <p className="text-sm text-gray-600 mb-2">{winner.email}</p>
                                  <div className="text-2xl font-bold text-green-600 mb-2">
                                    ${winner.prizeAmount.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {winner.prizePercentage}% del fondo
                                  </div>
                                  <div className={`mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                                    winner.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                    winner.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {winner.paymentStatus === 'completed' ? '✅ Pagado' :
                                     winner.paymentStatus === 'pending' ? '⏳ Pendiente' :
                                     '❌ Rechazado'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Demás Ganadores */}
                      {selectedRaffle.winners.filter((_, index) => index >= 3).length > 0 && (
                        <div>
                          <h5 className="text-lg font-semibold text-gray-800 mb-4">🎁 Demás Ganadores</h5>
                          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1">
                              {selectedRaffle.winners.filter((_, index) => index >= 3).map((winner, index) => (
                                <div key={winner.id} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                      {index + 4}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-medium text-gray-900 truncate">{winner.name}</div>
                                      <div className="text-xs text-gray-500 truncate">{winner.email}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2 flex-shrink-0">
                                    <span className={`text-xs ${
                                      winner.paymentStatus === 'pending' ? 'text-yellow-600' :
                                      winner.paymentStatus === 'completed' ? 'text-green-600' :
                                      'text-red-600'
                                    }`}>
                                      {winner.paymentStatus === 'pending' ? '⏳' : 
                                       winner.paymentStatus === 'completed' ? '✅' : 
                                       '❌'}
                                    </span>
                                    <div className="text-right">
                                      <div className="text-sm font-bold text-green-600">
                                        ${winner.prizeAmount.toFixed(2)}
                                      </div>
                                      <div className="text-xs text-gray-500 ">
                                        {winner.prizePercentage}%
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-6 rounded-lg text-center">
                      <TrophyIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No hay ganadores aún</h4>
                      <p className="text-sm text-gray-600">Este sorteo aún no ha sido realizado.</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowWeeklyRaffleModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualización de Sorteo Mensual */}
      {showVisualizeModal && selectedMonthlyRaffle && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowVisualizeModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Visualización de Sorteo Mensual</h3>
                <button
                    onClick={() => setShowVisualizeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
                </div>
                
                <div className="space-y-6">
                  {/* Información General */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Información General</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Nombre:</span>
                        <p className="text-sm text-gray-900">{selectedMonthlyRaffle.name}</p>
                        </div>
                        <div>
                        <span className="text-sm font-medium text-gray-600">Mes/Año:</span>
                        <p className="text-sm text-gray-900">{selectedMonthlyRaffle.month}/{selectedMonthlyRaffle.year}</p>
                        </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Fondo Total:</span>
                        <p className="text-sm text-gray-900">${selectedMonthlyRaffle.totalFund.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Estado:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedMonthlyRaffle.isActive 
                              ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                          }`}>
                          {selectedMonthlyRaffle.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                    </div>
              </div>

                  {/* Distribución Semanal */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Distribución Semanal de Fondos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4, 5]
                        .filter(w => (selectedMonthlyRaffle.weeklyDistribution as any)[`week${w}`] !== undefined)
                        .map(week => {
                          const weekPercentage = (selectedMonthlyRaffle.weeklyDistribution as any)[`week${week}`] ?? 0;
                          const weekAmount = (selectedMonthlyRaffle.totalFund * weekPercentage) / 100;
                          return (
                            <div key={week} className="bg-white p-3 rounded-lg border">
                              <div className="text-center">
                                <div className="text-lg font-semibold text-gray-900">Semana {week}</div>
                                <div className="text-sm text-gray-600">{weekPercentage}%</div>
                                <div className="text-sm font-medium text-blue-600">${weekAmount.toFixed(2)}</div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Distribución de Participantes */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Distribución de Participantes</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4, 5]
                        .filter(w => (selectedMonthlyRaffle.participantDistribution as any)[`week${w}`] !== undefined)
                        .map(week => {
                          const weekParticipants = (selectedMonthlyRaffle.participantDistribution as any)[`week${week}`] ?? 0;
                          return (
                            <div key={week} className="bg-white p-3 rounded-lg border">
                              <div className="text-center">
                                <div className="text-lg font-semibold text-gray-900">Semana {week}</div>
                                <div className="text-sm font-medium text-green-600">{weekParticipants} participantes</div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    <div className="mt-4 text-center">
                      <span className="text-sm font-medium text-gray-600">
                        Total: {Object.values(selectedMonthlyRaffle.participantDistribution).reduce((a: number, b: any) => a + (Number(b) || 0), 0)} participantes
                      </span>
                    </div>
                  </div>

                  {/* Sorteos Semanales Existentes */}
                  {selectedMonthlyRaffle.weeklyRaffles.length > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Sorteos Semanales Creados</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {selectedMonthlyRaffle.weeklyRaffles.map((weekly, index) => (
                          <div key={weekly.id} className="bg-white p-3 rounded-lg border">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Semana {index + 1}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                weekly.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {weekly.isActive ? 'Activo' : 'Inactivo'}
                              </span>
                    </div>
                            <div className="text-sm text-gray-600">
                              <p>Fondo: ${weekly.fund.toFixed(2)}</p>
                              <p>Participantes: {weekly.participants.length}</p>
                              <p>Ganadores: {weekly.winners.length}</p>
                    </div>
                  </div>
                        ))}
                    </div>
                    </div>
                  )}
                  </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                    onClick={() => setShowVisualizeModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cerrar
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Pagos */}
      {selectedRaffle && (
        <PaymentManagementModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          raffle={selectedRaffle}
          onUpdatePayment={handleUpdatePayment}
        />
      )}

      {/* Modal de Creación/Edición de Sorteos de Productos */}
      <CreateProductRaffleModal
        isOpen={showCreateProductModal}
        onClose={() => {
          setShowCreateProductModal(false);
          setSelectedProductRaffle(null);
        }}
        onSave={handleSaveProductRaffle}
        productRaffle={selectedProductRaffle || undefined}
        isLoading={createRaffleMutation.isPending || updateRaffleMutation.isPending}
      />

      {/* Modal de Sorteo de Productos */}
      {selectedProductRaffle && (
        <ProductRaffleDrawModal
          isOpen={showProductDrawModal}
          onClose={() => setShowProductDrawModal(false)}
          raffle={selectedProductRaffle}
          onComplete={handleCompleteProductDraw}
        />
      )}

      {/* Modal de Resultados de Productos */}
      {selectedProductRaffle && selectedProductWinner && (
        <ProductRaffleResultsModal
          isOpen={showProductResultsModal}
          onClose={() => {
            setShowProductResultsModal(false);
            setSelectedProductRaffle(null);
            setSelectedProductWinner(null);
          }}
          raffle={selectedProductRaffle}
          winner={selectedProductWinner}
        />
      )}

      {/* Modal de Ganadores Excluidos */}
      {showExcludedWinnersModal && selectedMonthlyRaffle && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => {
              setShowExcludedWinnersModal(false);
              setSelectedMonthlyRaffle(null);
            }} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 ">Ganadores Excluidos</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedMonthlyRaffle.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowExcludedWinnersModal(false);
                      setSelectedMonthlyRaffle(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Información de Exclusión */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">
                      🚫 Configuración de Exclusión
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Período:</span>
                        <p className="text-sm text-gray-900">
                          {selectedMonthlyRaffle.winnerExclusionSettings.exclusionPeriod === 'next_week' ? 'Próxima semana' :
                           selectedMonthlyRaffle.winnerExclusionSettings.exclusionPeriod === 'next_month' ? 'Próximo mes' :
                           `${selectedMonthlyRaffle.winnerExclusionSettings.customPeriod} ${
                             selectedMonthlyRaffle.winnerExclusionSettings.exclusionPeriod.includes('weeks') ? 'semanas' : 'meses'
                           }`}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Estado:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedMonthlyRaffle.winnerExclusionSettings.enabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedMonthlyRaffle.winnerExclusionSettings.enabled ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Ganadores Excluidos */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">
                      📋 Lista de Ganadores Excluidos
                    </h4>
                    
                    {(() => {
                      const now = new Date();
                      const excludedWinners: Array<{
                        winner: RaffleWinner;
                        weeklyRaffle: WeeklyRaffle;
                        excludedUntil: Date;
                      }> = [];
                      
                      selectedMonthlyRaffle.weeklyRaffles.forEach(weekly => {
                        weekly.winners.forEach(winner => {
                          const drawDate = new Date(winner.drawDate);
                          const exclusionPeriod = selectedMonthlyRaffle.winnerExclusionSettings.exclusionPeriod;
                          const customPeriod = selectedMonthlyRaffle.winnerExclusionSettings.customPeriod;
                          
                          let exclusionEndDate: Date;
                          
                          switch (exclusionPeriod) {
                            case 'next_week':
                              exclusionEndDate = new Date(drawDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                              break;
                            case 'next_month':
                              exclusionEndDate = new Date(drawDate.getFullYear(), drawDate.getMonth() + 1, drawDate.getDate());
                              break;
                            case 'custom_weeks':
                              exclusionEndDate = new Date(drawDate.getTime() + customPeriod * 7 * 24 * 60 * 60 * 1000);
                              break;
                            case 'custom_months':
                              exclusionEndDate = new Date(drawDate.getFullYear(), drawDate.getMonth() + customPeriod, drawDate.getDate());
                              break;
                            default:
                              return;
                          }
                          
                          if (now <= exclusionEndDate) {
                            excludedWinners.push({
                              winner,
                              weeklyRaffle: weekly,
                              excludedUntil: exclusionEndDate
                            });
                          }
                        });
                      });
                      
                      if (excludedWinners.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <div className="text-gray-400 text-6xl mb-4">🎉</div>
                            <h5 className="text-lg font-semibold text-gray-900 mb-2">¡No hay ganadores excluidos!</h5>
                            <p className="text-sm text-gray-600">
                              Todos los ganadores pueden participar en futuros sorteos.
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-3">
                          {excludedWinners.map(({ winner, weeklyRaffle, excludedUntil }, index) => (
                            <div key={`${winner.id}-${index}`} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {winner.position}
                                  </div>
                                  <div>
                                    <h6 className="font-semibold text-gray-900">{winner.name}</h6>
                                    <p className="text-sm text-gray-600">{winner.email}</p>
                                    <p className="text-xs text-gray-500 ">
                                      Ganó en: {weeklyRaffle.name}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-green-600">
                                    ${winner.prizeAmount.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {winner.prizePercentage}% del fondo
                                  </div>
                                  <div className="text-xs text-red-600 mt-1">
                                    Excluido hasta: {excludedUntil.toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowExcludedWinnersModal(false);
                      setSelectedMonthlyRaffle(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && raffleToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-gray-200 w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ¿Eliminar Sorteo?
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 mb-4">
                    ¿Estás seguro de que quieres eliminar este sorteo? Esta acción no se puede deshacer.
                  </p>
                  
                  {/* Información del sorteo a eliminar */}
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center shrink-0 flex-none">
                        <TicketIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {raffleToDelete.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {raffleToDelete.type === 'monthly' ? 'Sorteo Mensual' : 
                           raffleToDelete.type === 'weekly' ? 'Sorteo Semanal' : 
                           'Sorteo de Producto'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 px-4 py-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setRaffleToDelete(null);
                  }}
                  className="btn-secondary flex-1"
                  disabled={deleteRaffleMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteRaffle}
                  disabled={deleteRaffleMutation.isPending}
                  className={`flex items-center justify-center text-white font-medium py-2 px-4 rounded-md text-sm flex-1 transition-colors ${
                    deleteRaffleMutation.isPending 
                      ? 'bg-red-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {deleteRaffleMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RafflesPage;
