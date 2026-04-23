
export type StockType = 'DANGOTE' | 'ASHAKA';

export interface SaleRecord {
  id: string;
  date: string;
  shopName: string;
  stockType: StockType;
  bagsSold: number;
  pricePerBag: number;
  totalTransfer: number;
  expenses: number;
  notes?: string;
  expectedRevenue: number;
  discrepancy: number;
  authorUid?: string;
  deliveryId?: string;
}

export type NewSaleData = Omit<SaleRecord, 'id' | 'expectedRevenue' | 'discrepancy' | 'authorUid'>;

export interface DeliveryRecord {
  id: string;
  date: string;
  quantity: number;
  remainingQuantity: number;
  stockType: StockType;
}

export interface ShopInventory {
  currentStock: {
    DANGOTE: number;
    ASHAKA: number;
  };
  deliveries: DeliveryRecord[];
  authorUid?: string;
  shopName?: string;
}

export type InventoryData = {
  [shopName: string]: ShopInventory;
};
