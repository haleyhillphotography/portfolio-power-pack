import { items, type Item, type InsertItem } from "@shared/schema";

export interface IStorage {
  getItems(): Promise<Item[]>;
}

export class MemStorage implements IStorage {
  private items: Map<number, Item>;
  private currentId: number;

  constructor() {
    this.items = new Map();
    this.currentId = 1;
  }

  async getItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }
}

export const storage = new MemStorage();
