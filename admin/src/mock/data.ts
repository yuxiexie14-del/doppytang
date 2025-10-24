import type { Batch, Contract, Customer, Delivery, RearingPlan } from '../types';

const now = new Date().toISOString();

const customers: Customer[] = [
  {
    id: 1,
    customer_code: '23001',
    name: '张三',
    recipient_name: '张三',
    phones: ['13800000001'],
    address: '四川省成都市青羊区XX路1号',
    area_code: '23',
    first_purchase_date: now.slice(0, 10),
    notes: '重点客户',
    created_at: now,
    updated_at: now
  },
  {
    id: 2,
    customer_code: '23002',
    name: '李四',
    recipient_name: '李四',
    phones: ['13900000002', '13700000003'],
    address: '四川省成都市武侯区YY街道2号',
    area_code: '23',
    first_purchase_date: now.slice(0, 10),
    notes: null,
    created_at: now,
    updated_at: now
  }
];

const contracts: Contract[] = [
  {
    id: 1,
    contract_code: 'HT202401',
    customer_id: 1,
    package_name: '山野草鸡定养',
    hen_type: '草鸡母',
    egg_type: '草鸡蛋',
    total_eggs: 200,
    remaining_eggs: 170,
    price: 466,
    start_date: now.slice(0, 10),
    status: 'active',
    hen_delivered: false,
    description: '首单客户',
    created_at: now,
    updated_at: now,
    customer: customers[0]
  }
];

const deliveries: Delivery[] = [
  {
    id: 1,
    contract_id: 1,
    batch_id: null,
    delivered_at: now,
    eggs_delivered: 30,
    packaging: 'family_30',
    vegetables: '上海青',
    kitchen_gift: '抹布',
    delivered_by: '张配送',
    hen_delivered: false,
    notes: '常规配送',
    created_at: now,
    updated_at: now
  }
];

const batches: Batch[] = [
  {
    id: 1,
    contract_id: 1,
    name: '首批次',
    start_date: now.slice(0, 10),
    end_date: null,
    status: 'in_progress',
    notes: '关注气温变化',
    created_at: now,
    updated_at: now
  }
];

const rearingPlans: RearingPlan[] = [
  {
    id: 1,
    batch_id: 1,
    scheduled_date: now.slice(0, 10),
    activity: '第一次巡检',
    feed_amount: 12,
    notes: '补充饲料',
    created_at: now,
    updated_at: now
  }
];

export const mockDb = {
  customers,
  contracts,
  deliveries,
  batches,
  rearingPlans
};

export const mockCounters = {
  customers: customers.length + 1,
  contracts: contracts.length + 1,
  deliveries: deliveries.length + 1,
  batches: batches.length + 1,
  rearingPlans: rearingPlans.length + 1
};
