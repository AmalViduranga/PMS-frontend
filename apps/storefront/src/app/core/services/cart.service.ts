import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  productId: string;
  brandName: string;
  genericName: string;
  unitPrice: number;
  quantity: number;
  requiresPrescription: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  items = signal<CartItem[]>([]);
  selectedBranchId = signal<string>('');
  selectedBranchName = signal<string>('');
  prescriptionDocumentId = signal<string | null>(null);
  prescriptionFileName = signal<string | null>(null);
  notes = signal<string>('');
  isOpen = signal<boolean>(false);

  itemCount = computed(() => {
    return this.items().reduce((sum, item) => sum + item.quantity, 0);
  });

  subtotal = computed(() => {
    return this.items().reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  });

  hasRxItems = computed(() => {
    return this.items().some(item => item.requiresPrescription);
  });

  addItem(product: { id: string; brandName: string; genericName: string; sellingPrice: number; requiresPrescription: boolean }) {
    const current = this.items();
    const existingIndex = current.findIndex(i => i.productId === product.id);

    if (existingIndex > -1) {
      const updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + 1
      };
      this.items.set(updated);
    } else {
      this.items.set([
        ...current,
        {
          productId: product.id,
          brandName: product.brandName,
          genericName: product.genericName,
          unitPrice: product.sellingPrice,
          quantity: 1,
          requiresPrescription: product.requiresPrescription
        }
      ]);
    }
    this.isOpen.set(true);
  }

  removeItem(productId: string) {
    this.items.set(this.items().filter(i => i.productId !== productId));
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    const current = this.items();
    const updated = current.map(i => i.productId === productId ? { ...i, quantity } : i);
    this.items.set(updated);
  }

  setBranch(branchId: string, branchName: string) {
    this.selectedBranchId.set(branchId);
    this.selectedBranchName.set(branchName);
  }

  setPrescription(docId: string | null, fileName: string | null) {
    this.prescriptionDocumentId.set(docId);
    this.prescriptionFileName.set(fileName);
  }

  clear() {
    this.items.set([]);
    this.prescriptionDocumentId.set(null);
    this.prescriptionFileName.set(null);
    this.notes.set('');
  }
}
