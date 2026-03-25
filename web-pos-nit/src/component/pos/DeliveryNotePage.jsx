import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import ProductDeliveryNote from './ProductDeliveryNote';
function DeliveryNotePage() {
  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });
  const sampleData = {
    depot: "SAMRONG THOM",
    pdn_no: "000673",
    date: new Date("2025-02-09"),
    release_order_no: "2-25-SRT000462",
    phone_number: "093 82 22 82 / 099 82 22 82",
    customer_name: "ក្រុមហ៊ុនសាមទោម ខេត្រស្វាយរៀង",
    delivery_address: "ក្រុមហ៊ុនសាមទោម ខេត្រស្វាយរៀង",
    products: [
      {
        code: "02",
        description: "Gasoline",
        pack: "Bulk",
        unit: "Litre",
        quantity: "16,000L",
        quantity_text: "Sixteen Thousand Litres Only"
      }
    ]
  };
  return (
    <div>
      <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">
        Print Delivery Note
      </button>
      <ProductDeliveryNote 
        ref={componentRef} 
        deliveryData={sampleData} 
      />
    </div>
  );
}
export default DeliveryNotePage;