import { create } from "zustand";
export const configStore = create((set) => ({
  config: {
    category: null,
    role: null,
    supplier: null,
    purchase_status: null,
    brand: null,
    customer: [],
    expense_type: null,
    expense : null,
    unit:null,
    company_name:null,
    user:null,
    branch_name:null,
    createby:null,
    product:null,
    expense_type:null,
    products_name:null,
    getSizes:null,
    getAddons:null,
    groupOptions:null
    

  },
  setConfig: (params) =>
    set((state) => ({
      config: params,
    })),
}));
