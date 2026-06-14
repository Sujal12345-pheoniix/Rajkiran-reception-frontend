// stores/types.ts
export interface BaseEntity {
  id: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface StoreState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
}

export interface StoreActions<T> {
  setData: (data: T[]) => void;
  addItem: (item: T) => void;
  updateItem: (id: string, updates: Partial<T>) => void;
  deleteItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  sync: (data: T[]) => void;
  clearStore: () => void;
}
