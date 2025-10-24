import dayjs from 'dayjs';
import type { RequestConfig } from '../utils/request';
import type {
  Batch,
  Contract,
  Customer,
  Delivery,
  RearingPlan,
  SettlementTrialRequest,
  SettlementTrialResponse
} from '../types';
import { mockCounters, mockDb } from './data';

const delay = (value: unknown, ms = 200) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });

const buildTimestamps = () => ({
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

const findById = <T extends { id: number }>(collection: T[], id: number): T => {
  const item = collection.find((entry) => entry.id === id);
  if (!item) {
    throw new Error('记录不存在');
  }
  return item;
};

const parseId = (segments: string[]): number | null => {
  const maybeId = segments[segments.length - 1];
  const id = Number(maybeId);
  return Number.isInteger(id) ? id : null;
};

const filterByKeyword = <T extends Record<string, unknown>>(collection: T[], keyword?: string): T[] => {
  if (!keyword) {
    return collection;
  }
  const lower = keyword.toLowerCase();
  return collection.filter((item) =>
    Object.values(item).some((value) => {
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lower);
      }
      if (Array.isArray(value)) {
        return value.some((inner) => typeof inner === 'string' && inner.toLowerCase().includes(lower));
      }
      return false;
    })
  );
};

const attachCustomer = (contract: Contract): Contract => ({
  ...contract,
  customer: mockDb.customers.find((customer) => customer.id === contract.customer_id)
});

const attachBatch = (plan: RearingPlan): RearingPlan => ({
  ...plan
});

const clampRemainingEggs = (contract: Contract) => {
  if (typeof contract.remaining_eggs === 'number') {
    contract.remaining_eggs = Math.max(0, contract.remaining_eggs);
  }
};

export async function mockRequest<T>(config: RequestConfig): Promise<T> {
  const method = (config.method ?? 'GET').toUpperCase();
  const url = config.url.startsWith('http') ? new URL(config.url).pathname : config.url;
  const pathname = url.replace(/\?.*$/, '');
  const segments = pathname.split('/').filter(Boolean);
  const keyword = typeof config.params?.q === 'string' ? (config.params?.q as string) : undefined;

  if (segments[0] !== 'api' || segments[1] !== 'v1') {
    throw new Error(`未实现的 Mock 接口：${pathname}`);
  }

  const resource = segments[2];
  const id = parseId(segments);

  switch (resource) {
    case 'customers': {
      if (segments.length === 3 && method === 'GET') {
        const data = filterByKeyword(mockDb.customers, keyword);
        return (await delay(data)) as T;
      }
      if (segments.length === 3 && method === 'POST') {
        const payload = config.data as Partial<Customer>;
        const timestamp = buildTimestamps();
        const created: Customer = {
          id: mockCounters.customers++,
          customer_code: String(payload.customer_code ?? `MOCK${mockCounters.customers}`),
          name: payload.name ?? '新客户',
          phones: Array.isArray(payload.phones) ? payload.phones : [],
          recipient_name: payload.recipient_name ?? payload.name ?? '未知收货人',
          address: payload.address ?? '',
          area_code: payload.area_code ?? null,
          first_purchase_date: payload.first_purchase_date ?? dayjs().format('YYYY-MM-DD'),
          notes: (payload.notes as string | null | undefined) ?? null,
          ...timestamp
        };
        mockDb.customers.push(created);
        return (await delay(created)) as T;
      }
      if (segments.length === 4 && id && method === 'GET') {
        const customer = findById(mockDb.customers, id);
        return (await delay(customer)) as T;
      }
      if (segments.length === 4 && id && method === 'PUT') {
        const customer = findById(mockDb.customers, id);
        Object.assign(customer, config.data, { updated_at: new Date().toISOString() });
        return (await delay(customer)) as T;
      }
      if (segments.length === 4 && id && method === 'DELETE') {
        const index = mockDb.customers.findIndex((item) => item.id === id);
        if (index >= 0) {
          mockDb.customers.splice(index, 1);
        }
        return (await delay(undefined)) as T;
      }
      break;
    }
    case 'contracts': {
      if (segments.length === 3 && method === 'GET') {
        const data = filterByKeyword(mockDb.contracts, keyword).map(attachCustomer);
        return (await delay(data)) as T;
      }
      if (segments.length === 3 && method === 'POST') {
        const payload = config.data as Partial<Contract>;
        const timestamp = buildTimestamps();
        const created: Contract = {
          id: mockCounters.contracts++,
          contract_code: payload.contract_code ?? `CONTRACT${mockCounters.contracts}`,
          customer_id: payload.customer_id ?? 1,
          package_name: payload.package_name ?? '未命名套餐',
          hen_type: payload.hen_type ?? '',
          egg_type: payload.egg_type ?? '',
          total_eggs: payload.total_eggs ?? 0,
          remaining_eggs: payload.remaining_eggs ?? payload.total_eggs ?? 0,
          price: payload.price ?? 0,
          start_date: payload.start_date ?? dayjs().format('YYYY-MM-DD'),
          status: payload.status ?? 'active',
          hen_delivered: payload.hen_delivered ?? false,
          description: payload.description ?? null,
          ...timestamp
        };
        mockDb.contracts.push(created);
        return (await delay(attachCustomer(created))) as T;
      }
      if (segments.length === 4 && id && method === 'GET') {
        const contract = attachCustomer(findById(mockDb.contracts, id));
        return (await delay(contract)) as T;
      }
      if (segments.length === 4 && id && method === 'PUT') {
        const contract = findById(mockDb.contracts, id);
        Object.assign(contract, config.data, { updated_at: new Date().toISOString() });
        return (await delay(attachCustomer(contract))) as T;
      }
      if (segments.length === 4 && id && method === 'DELETE') {
        const index = mockDb.contracts.findIndex((item) => item.id === id);
        if (index >= 0) {
          mockDb.contracts.splice(index, 1);
        }
        return (await delay(undefined)) as T;
      }
      break;
    }
    case 'deliveries': {
      if (segments.length === 3 && method === 'GET') {
        const data = filterByKeyword(mockDb.deliveries, keyword);
        return (await delay(data)) as T;
      }
      if (segments.length === 3 && method === 'POST') {
        const payload = config.data as Partial<Delivery>;
        const timestamp = buildTimestamps();
        const deliveredAt =
          typeof payload.delivered_at === 'string'
            ? payload.delivered_at
            : payload.delivered_at instanceof Date
            ? payload.delivered_at.toISOString()
            : new Date().toISOString();
        const created: Delivery = {
          id: mockCounters.deliveries++,
          contract_id: payload.contract_id ?? 1,
          batch_id: payload.batch_id ?? null,
          delivered_at: deliveredAt,
          eggs_delivered: payload.eggs_delivered ?? 30,
          packaging: (payload.packaging as Delivery['packaging']) ?? 'family_30',
          vegetables: payload.vegetables ?? null,
          kitchen_gift: payload.kitchen_gift ?? null,
          delivered_by: payload.delivered_by ?? '系统',
          hen_delivered: payload.hen_delivered ?? false,
          notes: payload.notes ?? null,
          ...timestamp
        };
        mockDb.deliveries.push(created);
        const contract = mockDb.contracts.find((item) => item.id === created.contract_id);
        if (contract) {
          contract.remaining_eggs = (contract.remaining_eggs ?? contract.total_eggs) - created.eggs_delivered;
          clampRemainingEggs(contract);
        }
        return (await delay(created)) as T;
      }
      if (segments.length === 4 && id && method === 'PUT') {
        const delivery = findById(mockDb.deliveries, id);
        const original = { ...delivery };
        Object.assign(delivery, config.data, { updated_at: new Date().toISOString() });
        const contract = mockDb.contracts.find((item) => item.id === delivery.contract_id);
        if (contract) {
          const delta = (delivery.eggs_delivered ?? 0) - (original.eggs_delivered ?? 0);
          contract.remaining_eggs = (contract.remaining_eggs ?? contract.total_eggs) - delta;
          clampRemainingEggs(contract);
        }
        return (await delay(delivery)) as T;
      }
      if (segments.length === 4 && id && method === 'DELETE') {
        const index = mockDb.deliveries.findIndex((item) => item.id === id);
        if (index >= 0) {
          const [removed] = mockDb.deliveries.splice(index, 1);
          const contract = mockDb.contracts.find((item) => item.id === removed.contract_id);
          if (contract) {
            contract.remaining_eggs = (contract.remaining_eggs ?? contract.total_eggs) + (removed?.eggs_delivered ?? 0);
          }
        }
        return (await delay(undefined)) as T;
      }
      break;
    }
    case 'settlements': {
      if (segments.length >= 4 && segments[3] === 'trial' && method === 'POST') {
        const payload = (config.data ?? {}) as SettlementTrialRequest;
        const contract = findById(mockDb.contracts, payload.contract_id);
        const eggsDelivered = payload.eggs_delivered ?? contract.total_eggs;
        const price = payload.price_override ?? contract.price;
        const amountDue = Number(((eggsDelivered / Math.max(contract.total_eggs, 1)) * price).toFixed(2));
        const response: SettlementTrialResponse = {
          contract_id: contract.id,
          eggs_delivered_total: eggsDelivered,
          amount_due: amountDue,
          amount_paid: 0,
          status: 'trial',
          notes: payload.notes ?? null
        };
        return (await delay(response)) as T;
      }
      break;
    }
    case 'batches': {
      if (segments.length === 3 && method === 'GET') {
        const data = filterByKeyword(mockDb.batches, keyword);
        return (await delay(data)) as T;
      }
      if (segments.length === 3 && method === 'POST') {
        const payload = config.data as Partial<Batch>;
        const timestamp = buildTimestamps();
        const created: Batch = {
          id: mockCounters.batches++,
          contract_id: payload.contract_id ?? 1,
          name: payload.name ?? '新批次',
          start_date: payload.start_date ?? dayjs().format('YYYY-MM-DD'),
          end_date: payload.end_date ?? null,
          status: payload.status ?? 'planned',
          notes: payload.notes ?? null,
          ...timestamp
        };
        mockDb.batches.push(created);
        return (await delay(created)) as T;
      }
      if (segments.length === 4 && id && method === 'PUT') {
        const batch = findById(mockDb.batches, id);
        Object.assign(batch, config.data, { updated_at: new Date().toISOString() });
        return (await delay(batch)) as T;
      }
      if (segments.length === 4 && id && method === 'DELETE') {
        const index = mockDb.batches.findIndex((item) => item.id === id);
        if (index >= 0) {
          mockDb.batches.splice(index, 1);
        }
        return (await delay(undefined)) as T;
      }
      break;
    }
    case 'rearing-plans': {
      if (segments.length === 3 && method === 'GET') {
        const data = filterByKeyword(mockDb.rearingPlans, keyword).map(attachBatch);
        return (await delay(data)) as T;
      }
      if (segments.length === 3 && method === 'POST') {
        const payload = config.data as Partial<RearingPlan>;
        const timestamp = buildTimestamps();
        const created: RearingPlan = {
          id: mockCounters.rearingPlans++,
          batch_id: payload.batch_id ?? 1,
          scheduled_date: payload.scheduled_date ?? dayjs().format('YYYY-MM-DD'),
          activity: payload.activity ?? '未命名计划',
          feed_amount: payload.feed_amount ?? null,
          notes: payload.notes ?? null,
          ...timestamp
        };
        mockDb.rearingPlans.push(created);
        return (await delay(created)) as T;
      }
      if (segments.length === 4 && id && method === 'PUT') {
        const plan = findById(mockDb.rearingPlans, id);
        Object.assign(plan, config.data, { updated_at: new Date().toISOString() });
        return (await delay(plan)) as T;
      }
      if (segments.length === 4 && id && method === 'DELETE') {
        const index = mockDb.rearingPlans.findIndex((item) => item.id === id);
        if (index >= 0) {
          mockDb.rearingPlans.splice(index, 1);
        }
        return (await delay(undefined)) as T;
      }
      break;
    }
    default:
      break;
  }

  throw new Error(`未实现的 Mock 接口：${pathname} (${method})`);
}
