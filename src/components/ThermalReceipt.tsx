import React from 'react';
import { Invoice, InvoiceItem, Customer } from '../types';
import { ThermalPrinterSettings, CompanyInfo } from '../hooks/useThermalSettings';

interface Props {
  invoice: Invoice & { items: InvoiceItem[], customer?: Customer };
  settings?: ThermalPrinterSettings | null;
  company?: CompanyInfo | null;
}

export default function ThermalReceipt({ invoice, settings, company }: Props) {
  const now = new Date();

  if (!settings || !company) {
    return (
      <div className="p-4 text-center text-slate-400 text-xs font-mono">
        Loading receipt settings...
      </div>
    );
  }

  return (
    <div 
      className="thermal-receipt bg-[var(--bg-card)] text-[var(--text-main)] mx-auto" 
      id="thermal-receipt"
      style={{ 
        fontFamily: settings.font_family,
        fontSize: settings.font_size,
        width: '80mm',
        maxWidth: '80mm',
        lineHeight: '1.3',
        boxSizing: 'border-box',
        padding: '4mm',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body * {
            visibility: hidden;
          }
          #thermal-receipt, #thermal-receipt * {
            visibility: visible;
          }
          #thermal-receipt {
            position: fixed;
            left: 0;
            top: 0;
            width: 80mm;
            max-width: 80mm;
            padding: 4mm;
            box-sizing: border-box;
            word-break: break-word;
            overflow-wrap: break-word;
            background: white !important;
            color: black !important;
          }
          #thermal-receipt table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
          }
          #thermal-receipt .col-item {
            width: 52%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          #thermal-receipt .col-qty {
            width: 12%;
            text-align: right;
          }
          #thermal-receipt .col-price {
            width: 36%;
            text-align: right;
          }
        }
        #thermal-receipt table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
        }
        #thermal-receipt .col-item {
          width: 52%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        #thermal-receipt .col-qty {
          width: 12%;
          text-align: right;
        }
        #thermal-receipt .col-price {
          width: 36%;
          text-align: right;
        }
      `}} />
      
      <div className="text-center mb-3">
        {settings.show_logo && (
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-[var(--bg-accent-subtle)] rounded-full flex items-center justify-center text-[9px] text-[var(--text-muted-more)]">
              LOGO
            </div>
          </div>
        )}
        {settings.show_business_name && <div style={{ fontSize: '1.1em', fontWeight: 'bold', textTransform: 'uppercase' }}>{company.name}</div>}
        {settings.show_business_address && <div style={{ fontSize: '0.9em' }}>{company.address}{company.city ? `, ${company.city}` : ''}</div>}
        {settings.show_business_phone && <div style={{ fontSize: '0.9em' }}>Tel: {company.phone}</div>}
        {settings.show_business_email && <div style={{ fontSize: '0.9em' }}>{company.email}</div>}
      </div>
      
      <div style={{ borderBottom: '1px dashed var(--border-dashed)', marginBottom: '6px', paddingBottom: '6px' }}>
        {settings.show_date && <div>Date: {new Date(invoice.created_at || now).toLocaleString()}</div>}
        {settings.show_invoice_number && <div>Invoice: {invoice.invoice_number}</div>}
        {settings.show_customer_info && <div>Customer: {invoice.customer?.name || 'Walk-in'}</div>}
      </div>
      
      {settings.show_items_table && (
        <table style={{ marginBottom: '6px' }}>
          <thead>
            <tr style={{ borderBottom: '1px dashed var(--border-dashed)' }}>
              <th className="col-item" style={{ textAlign: 'left', paddingBottom: '3px' }}>Item</th>
              <th className="col-qty" style={{ textAlign: 'right', paddingBottom: '3px' }}>Qty</th>
              <th className="col-price" style={{ textAlign: 'right', paddingBottom: '3px' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, idx) => (
              <tr key={idx}>
                <td className="col-item" style={{ paddingTop: '2px' }} title={item.product_name}>
                  {item.product_name}
                  {item.imei && <div style={{ fontSize: '0.75em', color: 'var(--text-muted)' }}>IMEI: {item.imei}</div>}
                </td>
                <td className="col-qty" style={{ paddingTop: '2px' }}>{item.quantity}</td>
                <td className="col-price" style={{ paddingTop: '2px' }}>€{(item.total || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {settings.show_totals && (
        <div style={{ borderTop: '1px dashed var(--border-dashed)', paddingTop: '6px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>€{invoice.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tax (0%):</span>
            <span>€{invoice.tax_total.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.15em', marginTop: '4px', borderTop: '1px solid var(--text-main)', paddingTop: '4px' }}>
            <span>TOTAL:</span>
            <span>€{invoice.grand_total.toFixed(2)}</span>
          </div>
          {(invoice.paid_amount || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>PAID:</span>
              <span>€{(invoice.paid_amount || 0).toFixed(2)}</span>
            </div>
          )}
          {(invoice.due_amount || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'var(--text-danger)' }}>
              <span>DUE:</span>
              <span>€{(invoice.due_amount || 0).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
      
      {invoice.payments && invoice.payments.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold' }}>Payment:</div>
          {invoice.payments.map((p, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}>
              <span>{p.method}</span>
              <span>€{(p.amount || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
      
      {settings.show_footer && (
        <div style={{ textAlign: 'center', marginTop: '12px', borderTop: '1px dashed var(--border-dashed)', paddingTop: '8px', fontSize: '0.9em', fontStyle: 'italic' }}>
          {settings.footer_text}
        </div>
      )}
<div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.7em', color: 'var(--text-muted-more)' }}>
        Powered by iCover EPOS
      </div>
      </div>
  );
}
