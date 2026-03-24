export class ReduceStockItemDto {
  id: number;
  quantity: number;
}

export class ReduceStockDto {
  items: ReduceStockItemDto[];
}