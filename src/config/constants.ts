/**
 * Business constants for CRM sales, commissions, and customer segmentation
 */

// UUID fijado en el sistema para el cliente "Consumidor Final"
// Las ventas a este cliente usan precio de lista y NO generan comisión de revendedor
export const CONSUMIDOR_FINAL_CUSTOMER_ID = '332bd40b-a7d7-4fac-bf33-c28412e8a871';

// Tasa de comisión fija para ventas a revendedores (10% sobre precio de costo)
export const RESELLER_COMMISSION_RATE = 0.10;
