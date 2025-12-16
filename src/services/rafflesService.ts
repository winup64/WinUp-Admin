import apiClient from '../config/axios';
import { API_ENDPOINTS } from '../config/api';

// Tipos mínimos basados en backend (tabla raffles)
export interface ApiRaffle {
	raffle_id: string;
	raffle_type: 'monthly' | 'weekly' | 'product';
	name: string;
	description?: string;
	start_date: string; // ISO
	end_date: string; // ISO
	points_required?: number;
	month?: number;
	year?: number;
	fund?: number;
	total_fund?: number;
	week_number?: number;
	monthly_raffle_id?: string;
	max_participants?: number;
	current_participants?: number;
	registration_start_date?: string;
	registration_end_date?: string;
	draw_date?: string;
	status?: 'pending' | 'active' | 'finished' | 'inactive' | 'suspended'; // Estado del sorteo (scheduler automático: pending/active/finished, manual: inactive/suspended)
	is_registration_open?: boolean;
	is_completed?: boolean;
	is_drawn?: boolean;
	product?: string;
	product_value?: number;
	url_image?: string;
	is_active?: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface RafflesListResponse {
	status: number;
	message: string;
	data: ApiRaffle[];
	total: number;
	pagination?: { page: number; limit: number; totalPages: number };
	generalInfo?: {
		totalParticipants?: number;
		totalPremiumUsers?: number;
		totalRaffleSubscribers?: number;
		totalRegularUsers?: number;
		totalMonthlyRaffles?: number;
		totalWeeklyRaffles?: number;
		totalProductRaffles?: number;
		totalFundMonthly?: number;
	};
	timestamp: string;
}

export interface RafflesListParams {
	page?: number;
	limit?: number;
	search?: string;
	type?: 'monthly' | 'weekly' | 'product';
}

// Payloads de creación/actualización (alineados con DTO backend)
export type CreateRafflePayload = {
	name: string;
	description?: string;
	start_date: string;
	end_date: string;
	image_url?: string;
  max_tickets?: number;
  ticket_cost?: number;
	is_active?: boolean;
  // Campos específicos para sorteos semanales (opcional)
  raffle_type?: 'weekly' | 'monthly' | 'product';
  week_number?: number;
  month?: number;
  year?: number;
  monthly_raffle_id?: string;
  fund?: number;
  max_participants?: number;
  current_participants?: number;
  registration_start_date?: string;
  registration_end_date?: string;
  draw_date?: string;
  is_registration_open?: boolean;
  is_completed?: boolean;
  is_drawn?: boolean;
  points_required?: number;
  // NUEVOS: configuración de ganadores
  winners_count?: number;
  prize_distribution?: any;
};

export type UpdateRafflePayload = Partial<CreateRafflePayload>;

function coalesce<T>(...vals: (T | undefined)[]): T | undefined {
	for (const v of vals) if (v !== undefined) return v;
}

function normalizeIso(dateLike?: any): string | undefined {
	if (!dateLike) return undefined;
	// Si ya es Date, convertir a ISO UTC
	if (dateLike instanceof Date && !isNaN(dateLike.getTime())) {
		return dateLike.toISOString();
	}
	const s = String(dateLike).trim();
	if (!s) return undefined;
	// Si viene en formato YYYY-MM-DD o YYYY-MM-DDTHH:mm (sin zona), asumir local y convertir a UTC ISO
	const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
	const dateTimeNoZone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
	const dateTimeWithSecondsNoZone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
	if (dateOnly.test(s)) {
		const d = new Date(`${s}T00:00:00`);
		return isNaN(d.getTime()) ? s : d.toISOString();
	}
	if (dateTimeNoZone.test(s) || dateTimeWithSecondsNoZone.test(s)) {
		const d = new Date(s);
		return isNaN(d.getTime()) ? s : d.toISOString();
	}
	// Si ya parece ISO con zona, devolver tal cual
	return s;
}

// Mapea camelCase del front a snake_case del backend y asegura campos requeridos
function mapToBackendCreatePayload(payload: any): any {
	const type: string | undefined = coalesce(payload?.raffle_type, payload?.raffleType, (payload?.week || payload?.weekNumber) ? 'weekly' : undefined);
	const monthlyIdRaw = coalesce(payload?.monthly_raffle_id, payload?.monthlyRaffleId);
	const weekNumberRaw = coalesce(payload?.week_number, payload?.weekNumber, payload?.week);
	const pointsRequired = coalesce(payload?.points_required, payload?.pointsRequired);
	const maxParticipants = coalesce(payload?.max_participants, payload?.maxParticipants);
	const currentParticipants = coalesce(payload?.current_participants, payload?.currentParticipants);
	const registrationStart = normalizeIso(coalesce(payload?.registration_start_date, payload?.registrationStartDate));
	const registrationEnd = normalizeIso(coalesce(payload?.registration_end_date, payload?.registrationEndDate));
	const drawDate = normalizeIso(coalesce(payload?.draw_date, payload?.drawDate));
	// start/end obligatorios
	const startDate = normalizeIso(coalesce(payload?.start_date, payload?.startDate, registrationStart));
	// preferimos drawDate como end si existe, si no, registrationEnd
	const endDate = normalizeIso(coalesce(payload?.end_date, payload?.endDate, drawDate, registrationEnd, registrationStart));

	const winnersCount = coalesce(payload?.winners_count, payload?.winnersCount);
	const prizeDistribution = coalesce(payload?.prize_distribution, payload?.prizeDistribution);
	// Derivar top3 si viene en prizeDistribution
	const prizePctFirst = coalesce(payload?.prize_pct_first, payload?.prizePctFirst, prizeDistribution?.firstPlace);
	const prizePctSecond = coalesce(payload?.prize_pct_second, payload?.prizePctSecond, prizeDistribution?.secondPlace);
	const prizePctThird = coalesce(payload?.prize_pct_third, payload?.prizePctThird, prizeDistribution?.thirdPlace);

	// Sanitizar monthly_raffle_id: sólo UUID
	const isUuid = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
	const monthlyId = isUuid(monthlyIdRaw as any) ? (monthlyIdRaw as any) : undefined;
  // Sanitizar week_number: entero 1..5 si weekly
	let weekNumber: number | undefined = undefined;
	if ((type ?? payload?.raffle_type) === 'weekly' && weekNumberRaw != null) {
		const n = Math.floor(Number(weekNumberRaw));
    if (Number.isFinite(n) && n >= 1 && n <= 5) weekNumber = n;
	}

	const out: any = {
		raffle_type: (type ?? payload?.raffle_type)?.toLowerCase?.() ?? payload?.raffle_type,
		name: payload?.name,
		description: payload?.description,
		start_date: startDate,
		end_date: endDate,
		points_required: pointsRequired,
		month: coalesce(payload?.month),
		year: coalesce(payload?.year),
		fund: coalesce(payload?.fund),
		week_number: weekNumber,
		monthly_raffle_id: monthlyId,
		max_participants: maxParticipants != null ? Math.max(1, Math.floor(Number(maxParticipants))) : undefined,
		current_participants: currentParticipants,
		registration_start_date: registrationStart,
		registration_end_date: registrationEnd,
		draw_date: drawDate,
		is_completed: coalesce(payload?.is_completed, payload?.isCompleted),
		is_drawn: coalesce(payload?.is_drawn, payload?.isDrawn),
		product: payload?.product,
		url_image: payload?.image_url ?? payload?.imageUrl,
		winners_count: winnersCount,
		prize_distribution: prizeDistribution,
		prize_pct_first: prizePctFirst,
		prize_pct_second: prizePctSecond,
		prize_pct_third: prizePctThird,
    // Campos de distribución semanal de fondos
		weekly_dist_week1: coalesce(payload?.weekly_dist_week1),
		weekly_dist_week2: coalesce(payload?.weekly_dist_week2),
		weekly_dist_week3: coalesce(payload?.weekly_dist_week3),
		weekly_dist_week4: coalesce(payload?.weekly_dist_week4),
    weekly_dist_week5: coalesce(payload?.weekly_dist_week5),
		// Campos de distribución de participantes
		participant_dist_week1: coalesce(payload?.participant_dist_week1),
		participant_dist_week2: coalesce(payload?.participant_dist_week2),
		participant_dist_week3: coalesce(payload?.participant_dist_week3),
		participant_dist_week4: coalesce(payload?.participant_dist_week4),
    participant_dist_week5: coalesce(payload?.participant_dist_week5),
		// Fechas de sábados
		saturday_date_week1: normalizeIso(coalesce(payload?.saturday_date_week1)),
		saturday_date_week2: normalizeIso(coalesce(payload?.saturday_date_week2)),
		saturday_date_week3: normalizeIso(coalesce(payload?.saturday_date_week3)),
		saturday_date_week4: normalizeIso(coalesce(payload?.saturday_date_week4)),
    saturday_date_week5: normalizeIso(coalesce(payload?.saturday_date_week5)),
		// Configuración de exclusión de ganadores
		exclusion_enabled: coalesce(payload?.exclusion_enabled),
		exclusion_period: coalesce(payload?.exclusion_period),
		exclusion_custom_period: coalesce(payload?.exclusion_custom_period),
	};

	// Eliminar undefined
	Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
	return out;
}

export function mapProductToDbPayload(product: any): any {
    // Enviar propiedades que el DTO de backend acepta (no columnas directas)
    if (product?.imageFile instanceof File) {
        const fd = new FormData();
        fd.append('raffle_type', 'product');
        fd.append('name', product?.name ?? '');
        if (product?.description) fd.append('description', product.description);
        fd.append('start_date', String(product?.registrationStartDate || product?.startDate || new Date().toISOString()));
        fd.append('end_date', String(product?.registrationEndDate || product?.drawDate || product?.endDate || new Date().toISOString()));
        if (product?.product) fd.append('product', product.product);
        if (product?.pointsRequired != null) fd.append('points_required', String(product.pointsRequired));
        if (product?.maxParticipants != null) fd.append('max_participants', String(product.maxParticipants));
        if (product?.registrationStartDate) fd.append('registration_start_date', String(product.registrationStartDate));
        if (product?.registrationEndDate) fd.append('registration_end_date', String(product.registrationEndDate));
        if (product?.drawDate) fd.append('draw_date', String(product.drawDate));
        fd.append('image', product.imageFile);
        return fd;
    }
    return {
        raffle_type: 'product',
        name: product?.name,
        description: product?.description,
        start_date: product?.registrationStartDate || product?.startDate || new Date().toISOString(),
        end_date: product?.registrationEndDate || product?.drawDate || product?.endDate || new Date().toISOString(),
        product: product?.product,
        points_required: product?.pointsRequired,
        max_participants: product?.maxParticipants,
        registration_start_date: product?.registrationStartDate,
        registration_end_date: product?.registrationEndDate,
        draw_date: product?.drawDate,
    };
}

class RafflesService {
	static async list(params: RafflesListParams = {}): Promise<RafflesListResponse> {
		const safe = {
			page: params.page ?? 1,
			limit: Math.min(Math.max(params.limit ?? 10, 1), 50),
			search: params.search,
			type: params.type,
		};
		Object.keys(safe).forEach((k) => {
			const v = (safe as any)[k];
			if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
				delete (safe as any)[k];
			}
		});
		const url = API_ENDPOINTS.RAFFLES_ADMIN.LIST;
		const { data } = await apiClient.get(url, { params: safe });
		return data as RafflesListResponse;
	}

	static async getById(id: string): Promise<ApiRaffle> {
		const url = `${API_ENDPOINTS.RAFFLES_ADMIN.LIST}/${encodeURIComponent(id)}`;
		const { data } = await apiClient.get(url);
		return (data?.data ?? data) as ApiRaffle;
	}

	// Nuevo: conteo de participantes (tickets y usuarios únicos)
	static async getParticipantsCount(id: string): Promise<{ raffle_id: string; total_tickets: number; unique_users: number; }> {
		const url = `${API_ENDPOINTS.RAFFLES_ADMIN.LIST}/${encodeURIComponent(id)}/participants-count`;
		const { data } = await apiClient.get(url);
		const payload = (data?.data ?? data) as any;
		return {
			raffle_id: payload.raffle_id,
			total_tickets: Number(payload.total_tickets ?? 0),
			unique_users: Number(payload.unique_users ?? 0),
		};
	}

	static async create(payload: CreateRafflePayload): Promise<ApiRaffle> {
		const url = API_ENDPOINTS.RAFFLES_ADMIN.CREATE;
		try {
			// Construcción de body/config dependiendo de si es FormData o JSON
			const isAlreadyFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
			let config: any = isAlreadyFormData ? { } : { headers: { 'Content-Type': 'application/json' } };
			let body: any = payload as any;
			if (!isAlreadyFormData && body && typeof body === 'object') {
				// Si viene archivo (imageFile), construir FormData y adjuntar todos los campos mapeados + 'image'
				if ((body as any).imageFile instanceof File) {
					const mapped = mapToBackendCreatePayload(body);
					const fd = new FormData();
					Object.keys(mapped).forEach((k) => {
						const v: any = (mapped as any)[k];
						if (v !== undefined && v !== null) {
							fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
						}
					});
					fd.append('image', (body as any).imageFile as File);
					body = fd;
					config = { };
				} else {
					// JSON normal: mapear al contrato del backend
					const p: any = body;
					if ('image' in p) delete p.image;
					if ('imageFile' in p) delete p.imageFile;
					body = mapToBackendCreatePayload(p);
				}
			}
			const { data } = await apiClient.post(url, body, config);
			return (data?.data ?? data) as ApiRaffle;
		} catch (error: any) {
			try {
				const status = error?.response?.status;
				const serverData = error?.response?.data;
				// Silenciar logs
			} catch (_) {}
			throw error;
		}
	}

	static async update(id: string, payload: UpdateRafflePayload): Promise<ApiRaffle> {
		const url = `${API_ENDPOINTS.RAFFLES_ADMIN.UPDATE}/${encodeURIComponent(id)}`;
		try {
			const isAlreadyFormData = typeof FormData !== 'undefined' && (payload as any) instanceof FormData;
			let config: any = isAlreadyFormData ? { } : { headers: { 'Content-Type': 'application/json' } };
			let body: any = payload as any;
			if (!isAlreadyFormData && body && typeof body === 'object') {
				if ((body as any).imageFile instanceof File) {
					const mapped = mapToBackendCreatePayload(body);
					const fd = new FormData();
					Object.keys(mapped).forEach((k) => {
						const v: any = (mapped as any)[k];
						if (v !== undefined && v !== null) {
							fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
						}
					});
					fd.append('image', (body as any).imageFile as File);
					body = fd;
					config = { };
				} else {
					const p: any = body;
					if ('image' in p) delete p.image;
					if ('imageFile' in p) delete p.imageFile;
					body = mapToBackendCreatePayload(p);
				}
			}
			const { data } = await apiClient.patch(url, body, config);
			return (data?.data ?? data) as ApiRaffle;
		} catch (error: any) {
			throw error;
		}
	}

	static async remove(id: string): Promise<{ message: string } | undefined> {
		const url = `${API_ENDPOINTS.RAFFLES_ADMIN.DELETE}/${encodeURIComponent(id)}`;
		const { data } = await apiClient.delete(url);
		return (data?.data ?? data) as any;
	}

	// Realizar sorteo (admin) - El frontend envía los ganadores seleccionados
	// winners: Array de strings (UUIDs de usuarios)
	static async draw(id: string, winners?: string[]): Promise<{ raffle_id: string; winners: Array<{ position: number; user_id: string; percentage: number }>}> {
		const url = `${API_ENDPOINTS.RAFFLES_ADMIN.LIST}/${encodeURIComponent(id)}/draw`;
		const body = winners ? { winners } : {};
		const { data } = await apiClient.post(url, body);
		const payload = (data?.data ?? data) as any;
		return {
			raffle_id: String(payload?.raffle_id ?? id),
			winners: Array.isArray(payload?.winners) ? payload.winners.map((w: any) => ({
				position: Number(w?.position ?? 0),
				user_id: String(w?.user_id ?? ''),
				percentage: Number(w?.percentage ?? 0),
			})) : [],
		};
	}

	// Obtener ganadores del sorteo (admin)
	static async getWinners(id: string): Promise<Array<{ winner_id: string; user_id: string; ticket_id: string; awarded_at: string; position: number; prize_percentage: number; prize_amount: number; name: string; email: string; phone?: string }>> {
		const url = `${API_ENDPOINTS.RAFFLES_ADMIN.LIST}/${encodeURIComponent(id)}/winners`;
		const { data } = await apiClient.get(url);
		const payload = (data?.data ?? data) as any[];
		return (payload || []).map((r: any) => ({
			winner_id: String(r?.winner_id ?? ''),
			user_id: String(r?.user_id ?? ''),
			ticket_id: String(r?.ticket_id ?? ''),
			awarded_at: String(r?.awarded_at ?? new Date().toISOString()),
			position: Number(r?.position ?? 0),
			prize_percentage: Number(r?.prize_percentage ?? 0),
			prize_amount: Number(r?.prize_amount ?? 0),
			name: String(r?.name ?? ''),
			email: String(r?.email ?? ''),
			phone: r?.phone ? String(r.phone) : undefined,
		}));
	}

	static async getParticipants(id: string): Promise<Array<{ id: string; userId: string; ticketNumber: number; name: string; email: string }>> {
		const url = `${API_ENDPOINTS.RAFFLES_ADMIN.LIST}/${encodeURIComponent(id)}/participants?all=true`;
		const { data } = await apiClient.get(url);
		const list = (data?.data?.participants ?? []) as any[];
		return list.map((p: any) => ({
			id: String(p?.ticket_id ?? ''),
			userId: String(p?.user_id ?? ''),
			ticketNumber: Number(p?.ticket_number ?? 0),
			name: String(p?.name ?? 'Usuario'),
			email: String(p?.email ?? ''),
		}));
	}
}

export default RafflesService;

