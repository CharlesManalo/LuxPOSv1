import { useEffect, useRef } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CartItem, ReceiptConfig } from '@/types';

interface ReceiptProps {
  orderNumber: string;
  date: string;
  cashierName: string;
  branchName: string;
  items: CartItem[];
  paymentMethod: string;
  receiptConfig: ReceiptConfig;
  onPrint?: () => void;
}

export function Receipt({
  orderNumber,
  date,
  cashierName,
  branchName,
  items,
  paymentMethod,
  receiptConfig,
  onPrint,
}: ReceiptProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handlePrint = () => {
    window.print();
    onPrint?.();
  };

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = '';
      const fullText = contentRef.current.dataset.text || '';
      let idx = -1;
      let speed = 100;
      const easing = 0.1;
      let timer: ReturnType<typeof setInterval>;

      const tick = () => {
        if (!contentRef.current) return;
        if (idx < fullText.length - 1) {
          idx++;
        } else {
          clearInterval(timer);
          return;
        }
        contentRef.current.innerHTML += fullText.charAt(idx);
        speed = Math.max(30, 100 * (easing * (1 - idx / fullText.length)));
        clearInterval(timer);
        timer = setInterval(tick, speed);
      };

      timer = setInterval(tick, speed);
      return () => clearInterval(timer);
    }
  }, []);

  const receiptText = `${receiptConfig.header_text}
${receiptConfig.address}
Contact: ${receiptConfig.contact_number}
${receiptConfig.show_branch_name ? branchName : ''}
${'-'.repeat(32)}
Order #: ${orderNumber}
Date: ${date}
${receiptConfig.show_cashier_name ? `Cashier: ${cashierName}` : ''}
Payment: ${paymentMethod.toUpperCase()}
${'-'.repeat(32)}
${items.map((item) => `${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}`.padEnd(20) + `${item.qty}x`.padStart(4) + `P${(item.price * item.qty).toFixed(2)}`.padStart(8)).join('\n')}
${'-'.repeat(32)}
${'TOTAL:'.padEnd(24)}P${total.toFixed(2).padStart(8)}
${'='.repeat(32)}
${receiptConfig.footer_message}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        id="receipt-print-area"
        className="w-full max-w-[300px] bg-white p-6 font-mono text-xs text-[#2c2c2c] print:shadow-none"
        style={{ fontFamily: "'Inter', monospace" }}
      >
        <div
          ref={contentRef}
          data-text={receiptText}
          className="whitespace-pre-wrap"
          style={{ display: 'none' }}
        />
        {/* Visible receipt content */}
        <div className="receipt-content whitespace-pre-wrap">
          <h1 className="text-center text-sm font-bold uppercase mb-3" style={{ fontFamily: "'Fredoka', sans-serif" }}>
            {receiptConfig.header_text}
          </h1>
          <p className="text-center text-xs">{receiptConfig.address}</p>
          <p className="text-center text-xs">Contact: {receiptConfig.contact_number}</p>
          {receiptConfig.show_branch_name && <p className="text-center text-xs font-medium mt-1">{branchName}</p>}
          <div className="receipt-line" />
          <p>Order #: {orderNumber}</p>
          <p>Date: {date}</p>
          {receiptConfig.show_cashier_name && <p>Cashier: {cashierName}</p>}
          <p>Payment: {paymentMethod.toUpperCase()}</p>
          <div className="receipt-line" />
          <div className="mt-2">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-xs mb-1">
                <span className="flex-1">
                  {item.product_name}
                  {item.variant_name && <span className="text-muted-foreground"> ({item.variant_name})</span>}
                </span>
                <span className="w-8 text-center">{item.qty}x</span>
                <span className="w-16 text-right">P{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="receipt-line" />
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL:</span>
            <span>P{total.toFixed(2)}</span>
          </div>
          <div className="receipt-line border-t-2 border-dashed" />
          <p className="text-center mt-2">{receiptConfig.footer_message}</p>
        </div>
      </div>
      <Button
        onClick={handlePrint}
        className="bg-accent-orange hover:bg-accent-hover text-white rounded-full px-6 shadow-float"
      >
        <Printer className="w-4 h-4 mr-2" />
        Print Receipt
      </Button>
    </div>
  );
}
