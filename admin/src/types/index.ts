export interface Timestamps {
  created_at?: string;
  updated_at?: string;
}

export interface Customer extends Timestamps {
  id: number;
  customer_code: string;
  name: string;
  phones: string[];
  recipient_name: string;
  address: string;
  area_code?: string | null;
  first_purchase_date?: string | null;
  notes?: string | null;
}

export type CustomerInput = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;

export interface Contract extends Timestamps {
  id: number;
  contract_code: string;
  customer_id: number;
  package_name: string;
  hen_type: string;
  egg_type: string;
  total_eggs: number;
  remaining_eggs?: number | null;
  price: number;
  start_date: string;
  status: string;
  hen_delivered: boolean;
  description?: string | null;
  customer?: Customer;
}

export type ContractInput = Omit<Contract, 'id' | 'created_at' | 'updated_at' | 'customer'>;

export interface Batch extends Timestamps {
  id: number;
  contract_id: number;
  name: string;
  start_date: string;
  end_date?: string | null;
  status: string;
  notes?: string | null;
}

export type BatchInput = Omit<Batch, 'id' | 'created_at' | 'updated_at'>;

export interface RearingPlan extends Timestamps {
  id: number;
  batch_id: number;
  scheduled_date: string;
  activity: string;
  feed_amount?: number | null;
  notes?: string | null;
}

export type RearingPlanInput = Omit<RearingPlan, 'id' | 'created_at' | 'updated_at'>;

export interface ListResult<T> {
  items: T[];
  total: number;
}

export interface Delivery extends Timestamps {
  id: number;
  contract_id: number;
  batch_id?: number | null;
  delivered_at: string;
  eggs_delivered: number;
  packaging: 'family_30' | 'gift_45' | 'bulk';
  vegetables?: string | null;
  kitchen_gift?: string | null;
  delivered_by?: string | null;
  hen_delivered: boolean;
  notes?: string | null;
}

export type DeliveryInput = Omit<
  Delivery,
  'id' | 'created_at' | 'updated_at' | 'delivered_at' | 'hen_delivered'
> & {
  delivered_at?: string;
  hen_delivered?: boolean;
};

export interface SettlementTrialRequest {
  contract_id: number;
  eggs_delivered?: number;
  price_override?: number;
  notes?: string;
}

export interface SettlementTrialResponse {
  contract_id: number;
  eggs_delivered_total: number;
  amount_due: number;
  amount_paid: number;
  status: string;
  notes?: string | null;
}
