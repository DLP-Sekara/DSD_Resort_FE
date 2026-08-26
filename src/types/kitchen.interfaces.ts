export interface RawMaterial {
  materialId?: string;
  id?: string;
  materialName: string;
  unitOfMeasure: string;
  quantityOnHand: number;
  category: string;
}

export interface RawMaterialDTO {
  materialId?: string;
  materialName: string;
  unitOfMeasure: string;
  quantityOnHand: number;
  category: string;
}

export const RAW_MATERIAL_CATEGORIES = [
  { value: 'GRAINS', label: 'Grains & Cereals', color: 'gold' },
  { value: 'VEGETABLES', label: 'Vegetables & Greens', color: 'green' },
  { value: 'MEAT_POULTRY', label: 'Meat & Poultry', color: 'red' },
  { value: 'SEAFOOD', label: 'Fresh Seafood', color: 'cyan' },
  { value: 'DAIRY_EGGS', label: 'Dairy & Eggs', color: 'blue' },
  { value: 'SPICES_HERBS', label: 'Spices & Seasonings', color: 'volcano' },
  { value: 'OILS_CONDIMENTS', label: 'Oils & Condiments', color: 'orange' },
  { value: 'BEVERAGES_EXTRACTS', label: 'Beverages & Extracts', color: 'purple' },
  { value: 'PACKAGING_OTHER', label: 'Packaging & Supplies', color: 'default' },
  { value: 'OTHER', label: 'Other', color: 'geekblue' },
] as const;

export const UNITS_OF_MEASURE = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'l', label: 'Liters (l)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'pack', label: 'Packs (pack)' },
  { value: 'can', label: 'Cans (can)' },
  { value: 'bottle', label: 'Bottles (bottle)' },
  { value: 'box', label: 'Boxes (box)' },
  { value: 'unit', label: 'Unit (unit)' },
] as const;

export interface BOMTemplateItem {
  templateItemId?: string;
  materialId: string;
  qtyPerPerson: number;
  materialName?: string;
  unitOfMeasure?: string;
  rawMaterial?: RawMaterial;
}

export interface BOMTemplate {
  templateId?: string;
  id?: string;
  templateName: string;
  createdBy: string;
  itemId: string;
  items?: BOMTemplateItem[];
  templateItems?: BOMTemplateItem[];
  foodItem?: {
    itemId: string;
    name: string;
    unitPrice?: number;
  };
  createdByUser?: {
    adminId?: string;
    userId?: string;
    name?: string;
    role?: string;
  };
}

export interface CreateBOMTemplateDTO {
  templateName: string;
  createdBy: string;
  itemId: string;
  items: {
    materialId: string;
    qtyPerPerson: number;
  }[];
}
