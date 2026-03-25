// // import React, { useState } from 'react';

// // const coffeeMenu = [
// //   {
// //     id: 1,
// //     name: 'Caramel Frappuccino',
// //     description: 'Caramel syrup with coffee, milk, and whipped cream',
// //     price: 3.95,
// //     image: '/api/placeholder/200/200'
// //   },
// //   {
// //     id: 2,
// //     name: 'Chocolate Frappuccino',
// //     description: 'Sweet chocolate with coffee, milk, and whipped cream',
// //     price: 4.51,
// //     image: '/api/placeholder/200/200'
// //   },
// //   {
// //     id: 3,
// //     name: 'Peppermint Macchiato',
// //     description: 'Fresh peppermint mixed with choco, and blended cream',
// //     price: 5.34,
// //     image: '/api/placeholder/200/200'
// //   },
// //   {
// //     id: 4,
// //     name: 'Coffee Latte Frappuccino',
// //     description: 'Special coffee, choco cream, and whipped cream',
// //     price: 4.79,
// //     image: '/api/placeholder/200/200'
// //   }
// // ];

// // const CoffeePOSPage = () => {
// //   const [cart, setCart] = useState([]);
// //   const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
// //   const [selectedSize, setSelectedSize] = useState({});
// //   const [selectedSugar, setSelectedSugar] = useState({});

// //   const addToCart = (coffee) => {
// //     const existingItem = cart.find(item => item.id === coffee.id);
// //     if (existingItem) {
// //       setCart(cart.map(item => 
// //         item.id === coffee.id 
// //           ? {...item, quantity: (item.quantity || 0) + 1} 
// //           : item
// //       ));
// //     } else {
// //       setCart([...cart, {...coffee, quantity: 1}]);
// //     }
// //   };

// //   const updateQuantity = (id, quantity) => {
// //     setCart(cart.map(item => 
// //       item.id === id ? {...item, quantity} : item
// //     ));
// //   };

// //   const calculateSubtotal = () => {
// //     return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
// //   };

// //   const tax = calculateSubtotal() * 0.1;
// //   const total = calculateSubtotal() + tax;

// //   const sizes = ['S', 'M', 'L'];
// //   const sugarLevels = ['30%', '50%', '70%'];
// //   const paymentMethods = [
// //     { name: 'Cash', icon: '$' },
// //     { name: 'Debit Card', icon: '💳' },
// //     { name: 'E-Wallet', icon: '📱' }
// //   ];

// //   return (
// //     <div className="flex max-w-6xl mx-auto font-sans">
// //       <div className="w-3/5 p-4">
// //         <h2 className="text-2xl font-bold mb-4">Coffee Menu (12 Coffees Result)</h2>
// //         <div className="grid grid-cols-2 gap-4">
// //           {coffeeMenu.map(coffee => (
// //             <div 
// //               key={coffee.id} 
// //               className="border rounded-lg p-4 text-center"
// //             >
// //               <img 
// //                 src={coffee.image} 
// //                 alt={coffee.name} 
// //                 className="w-48 h-48 object-cover rounded-lg mx-auto mb-2"
// //               />
// //               <h3 className="font-semibold">{coffee.name}</h3>
// //               <p className="text-gray-600 mb-2">{coffee.description}</p>
// //               <div className="flex justify-center gap-2 mb-2">
// //                 <div className="space-x-1">
// //                   {sizes.map(size => (
// //                     <button
// //                       key={size}
// //                       onClick={() => setSelectedSize({...selectedSize, [coffee.id]: size})}
// //                       className={`px-2 py-1 rounded ${
// //                         selectedSize[coffee.id] === size 
// //                           ? 'bg-blue-500 text-white' 
// //                           : 'bg-gray-200'
// //                       }`}
// //                     >
// //                       {size}
// //                     </button>
// //                   ))}
// //                 </div>
// //                 <div className="space-x-1">
// //                   {sugarLevels.map(sugar => (
// //                     <button
// //                       key={sugar}
// //                       onClick={() => setSelectedSugar({...selectedSugar, [coffee.id]: sugar})}
// //                       className={`px-2 py-1 rounded ${
// //                         selectedSugar[coffee.id] === sugar 
// //                           ? 'bg-green-500 text-white' 
// //                           : 'bg-gray-200'
// //                       }`}
// //                     >
// //                       {sugar}
// //                     </button>
// //                   ))}
// //                 </div>
// //               </div>
// //               <button 
// //                 onClick={() => addToCart(coffee)}
// //                 className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
// //               >
// //                 Add to Billing
// //               </button>
// //             </div>
// //           ))}
// //         </div>
// //       </div>

// //       <div className="w-2/5 p-4 bg-gray-100 border-l">
// //         <h2 className="text-2xl font-bold mb-4">Order Details</h2>
// //         {cart.map(item => (
// //           <div 
// //             key={item.id} 
// //             className="flex justify-between items-center mb-2 p-2 bg-white rounded-lg"
// //           >
// //             <div>
// //               <strong>{item.name}</strong>
// //               <div className="mt-1">
// //                 <input 
// //                   type="number" 
// //                   min="1" 
// //                   value={item.quantity} 
// //                   onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
// //                   className="w-16 p-1 border rounded"
// //                 />
// //               </div>
// //             </div>
// //             <div>${(item.price * item.quantity).toFixed(2)}</div>
// //           </div>
// //         ))}

// //         <div className="mt-4">
// //           <div className="flex justify-between mb-2">
// //             <span>Subtotal</span>
// //             <span>${calculateSubtotal().toFixed(2)}</span>
// //           </div>
// //           <div className="flex justify-between mb-2">
// //             <span>Tax (10%)</span>
// //             <span>${tax.toFixed(2)}</span>
// //           </div>
// //           <div className="flex justify-between font-bold text-lg">
// //             <span>Total</span>
// //             <span>${total.toFixed(2)}</span>
// //           </div>
// //         </div>

// //         <div className="mt-4">
// //           <h3 className="font-semibold mb-2">Payment Method</h3>
// //           <div className="flex gap-2">
// //             {paymentMethods.map(method => (
// //               <button
// //                 key={method.name}
// //                 onClick={() => setSelectedPaymentMethod(method.name)}
// //                 className={`flex items-center px-4 py-2 rounded ${
// //                   selectedPaymentMethod === method.name 
// //                     ? 'bg-blue-500 text-white' 
// //                     : 'bg-gray-200'
// //                 }`}
// //               >
// //                 <span className="mr-2">{method.icon}</span>
// //                 {method.name}
// //               </button>
// //             ))}
// //           </div>
// //         </div>

// //         <div className="mt-4">
// //           <button 
// //             className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
// //           >
// //             Print Bills
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default CoffeePOSPage;


// import React, { useCallback, useEffect, useState } from "react";
// import {
//   Button,
//   Col,
//   Empty,
//   Input,
//   InputNumber,
//   message,
//   notification,
//   Row,
//   Select,
//   Space,
//   Modal,
//   Form,
//   Tag,
//   Card,
//   Typography
// } from "antd";
// import { request } from "../../util/helper";
// import MainPage from "../../component/layout/MainPage";
// import { configStore } from "../../store/configStore";
// import BillItem from "../../component/pos/BillItem";
// import styles from "./PosPage.module.css";
// import { useReactToPrint } from "react-to-print";
// import PrintInvoice from "../../component/pos/PrintInvoice";
// import { getProfile } from "../../store/profile.store";
// import { MdAddToPhotos } from "react-icons/md";
// import { BsPrinter } from "react-icons/bs";
// import { FiSearch } from "react-icons/fi";
// import { FcDeleteRow } from "react-icons/fc";
// import { Config } from "../../util/config";

// const { Text } = Typography;

// function CoffeePOSPage() {
//   const [isDisabled, setIsDisabled] = useState(false);
//   const { config } = configStore();
//   const refInvoice = React.useRef(null);
//   const [state, setState] = useState({
//     list: [],
//     customers: [],
//     total: 0,
//     loading: false,
//     visibleModal: false,
//     cart_list: [],
//   });
//   const { id } = getProfile();

//   useEffect(() => {
//     setObjSummary((prev) => ({
//       ...prev,
//       user_id: id,
//     }));
//   }, [id]);

//   const fetchCustomers = async () => {
//     try {
//       const { id } = getProfile();
//       if (!id) {
//         console.error("User ID is missing.");
//         return;
//       }
//       const param = {
//         ...filter,
//         page: refPage.current,
//         is_list_all: 1,
//       };
//       setState((prev) => ({ ...prev, loading: true }));
//       const res = await request(`customer/${id}`, "get", param);
//       if (res && !res.error) {
//         const customers = (res.list || []).map((customer) => ({
//           label: `${customer.name} - ${customer.tel}`,
//           value: customer.id,
//         }));
//         setState((prev) => ({ ...prev, customers, loading: false }));
//       } else {
//         console.error("Failed to fetch customers:", res?.error);
//         setState((prev) => ({ ...prev, loading: false }));
//       }
//     } catch (error) {
//       console.error("Failed to fetch customers:", error);
//       setState((prev) => ({ ...prev, loading: false }));
//     }
//   };

//   const [objSummary, setObjSummary] = useState({
//     sub_total: 0,
//     total_qty: 0,
//     save_discount: 0,
//     tax: 10,
//     total: 0,
//     total_paid: 0,
//     customers: null,
//     customer_id: null,
//     user_id: null,
//     payment_method: null,
//     remark: null,
//     order_no: null,
//     order_date: null,
//   });

//   const refPage = React.useRef(1);
//   const [filter, setFilter] = useState({
//     txt_search: "",
//     category_id: "",
//     brand: "",
//   });
//   const [form] = Form.useForm();
//   const filteredProducts = state.list.filter((product) => product.qty > 0);

//   useEffect(() => {
//     handleCalSummary();
//   }, [state.cart_list]);

//   useEffect(() => {
//     fetchCustomers();
//     getList();
//   }, []);

//   useEffect(() => {
//     const checkTime = () => {
//       const now = new Date();
//       const hours = now.getHours();
//       const minutes = now.getMinutes();
//       setIsDisabled(hours === 0 && minutes === 0);
//     };
//     checkTime();
//     const interval = setInterval(checkTime, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   const getList = async () => {
//     var param = {
//       ...filter,
//       page: refPage.current,
//       is_list_all: 1,
//     };
//     setState((pre) => ({ ...pre, loading: true }));
//     const { id } = getProfile();
//     if (!id) {
//       return;
//     }
//     const res = await request(`product/${id}`, "get", param);
//     if (res && !res.error) {
//       if (res.list?.length == 1) {
//         handleAdd(res.list[0]);
//         setState((pre) => ({ ...pre, loading: false }));
//         return;
//       }
//       setState((pre) => ({
//         ...pre,
//         list: res.list,
//         total: refPage.current == 1 ? res.total : pre.total,
//         loading: false,
//       }));
//     }
//   };

//   const onFilter = () => {
//     getList();
//   };

//   const handleAdd = (item) => {
//     var cart_tmp = [...state.cart_list];
//     var findIndex = cart_tmp.findIndex((row) => row.barcode === item.barcode);
//     var isNoStock = false;

//     if (findIndex === -1) {
//       if (item.qty > 0) {
//         cart_tmp.push({ ...item, cart_qty: 1 });
//       } else {
//         isNoStock = true;
//       }
//     } else {
//       cart_tmp[findIndex].cart_qty += 1;
//       if (item.qty < cart_tmp[findIndex].cart_qty) {
//         isNoStock = true;
//       }
//     }

//     if (isNoStock) {
//       notification.error({
//         message: "Warning",
//         description: `No stock! Currently, quantity in stock available: ${item.qty}`,
//         placement: "bottomRight",
//         style: {
//           backgroundColor: "hsl(359,100%,98%)",
//           outline: "1px solid #ff4d4f",
//         },
//       });
//       return;
//     }

//     setState((pre) => ({
//       ...pre,
//       cart_list: cart_tmp,
//     }));
//     handleCalSummary();
//   };

//   const handleClearCart = () => {
//     setState((p) => ({
//       ...p,
//       cart_list: [],
//       customers: []
//     }));

//     setObjSummary((p) => ({
//       ...p,
//       sub_total: 0,
//       total_qty: 0,
//       save_discount: 0,
//       tax: 10,
//       total: 0,
//       total_paid: 0,
//       customer_id: null,
//       payment_method: null,
//       user_id: null,
//       remark: null,
//     }));

//     form.resetFields();
//     fetchCustomers();
//   };

//   const handleCalSummary = useCallback(() => {
//     let total_qty = 0;
//     let sub_total = 0;
//     let total = 0;

//     state.cart_list.forEach((item) => {
//       const qty = item.cart_qty || 0;
//       const unit_price = item.unit_price || 0;
//       const actual_price = item.actual_price || unit_price;

//       const calculated_total = (qty * unit_price) / actual_price;
//       sub_total += calculated_total;
//       total_qty += qty;
//     });

//     total = sub_total;

//     setObjSummary({
//       total_qty: total_qty.toFixed(2),
//       sub_total: sub_total.toFixed(2),
//       total: total.toFixed(2),
//     });
//   }, [state.cart_list]);

//   const handleClickOut = async () => {
//     if (!state.cart_list.length) {
//       message.error("Cart is empty!");
//       return;
//     }

//     if (!objSummary.payment_method) {
//       message.error("Please select a payment method!");
//       return;
//     }

//     if (!objSummary.user_id) {
//       message.error("Please select a location/branch!");
//       return;
//     }

//     var order_details = [];
//     state.cart_list.forEach((item) => {
//       const qty = Number(item.cart_qty) || 0;
//       const price = Number(item.unit_price) || 0;
//       const discount = Number(item.discount) || 0;

//       var total = qty * price;
//       if (discount > 0) {
//         total = total - (total * discount / 100);
//       }

//       var objItem = {
//         product_id: item.id,
//         qty: qty,
//         price: price,
//         discount: discount,
//         total: total,
//       };
//       order_details.push(objItem);
//     });

//     var param = {
//       order: {
//         customer_id: objSummary.customer_id || null,
//         user_id: Number(objSummary.user_id) || null,
//         total_amount: Number(objSummary.total || 0),
//         paid_amount: Number(objSummary.total_paid || 0),
//         payment_method: objSummary.payment_method || "Cash",
//         remark: objSummary.remark || "No remark",
//       },
//       order_details: order_details,
//     };

//     try {
//       const res = await request("order", "post", param);
//       if (res && !res.error) {
//         if (res.order) {
//           message.success("Order created successfully!");
//           setObjSummary((p) => ({
//             ...p,
//             order_no: res.order?.order_no,
//             order_date: res.order?.create_at,
//           }));
//           setTimeout(() => {
//             handlePrintInvoice();
//           }, 1000);
//         }
//       } else {
//         console.error("Error response:", res);
//         message.error(`Order not complete! ${res?.message || ''}`);
//       }
//     } catch (error) {
//       console.error("Error creating order:", error);
//       message.error("Failed to create order. Please try again.");
//     }
//   };

//   const handlePrintInvoice = useReactToPrint({
//     contentRef: refInvoice,
//     onAfterPrint: () => handleClearCart(),
//   });

//   const handleQuantityChange = (value, index) => {
//     if (!value || isNaN(value)) return;
  
//     const newCartList = [...state.cart_list];
//     newCartList[index].cart_qty = Number(value);
//     setState((prev) => ({ ...prev, cart_list: newCartList }));
//     handleCalSummary(); // Add this to recalculate totals after quantity change
//   };

//   const handlePriceChange = (value, index) => {
//     if (value < 0) return;

//     const newCartList = [...state.cart_list];
//     newCartList[index] = { ...newCartList[index], unit_price: value };
//     setState((prev) => ({ ...prev, cart_list: newCartList }));
//   };

//   return (
//     <MainPage loading={state.loading}>
//       <div style={{ display: "none" }}>
//         <PrintInvoice
//           ref={refInvoice}
//           cart_list={state.cart_list}
//           objSummary={objSummary}
//         />
//       </div>
      
//       <Row gutter={24}>
//         {/* Product Display Column */}
//         <Col span={14}>
//           <div className="pageHeader">
//             <Space>
//               <div className="khmer-text">ផលិតផល/ {state.total}</div>
//               <Input.Search
//                 onChange={(e) => setFilter({...filter, txt_search: e.target.value})}
//                 allowClear
//                 placeholder="Search"
//                 onSearch={getList}
//               />
//               <Select
//                 allowClear
//                 style={{ width: 130 }}
//                 placeholder="Category"
//                 options={config.category}
//                 onChange={(id) => setFilter({...filter, category_id: id})}
//               />
//               <Select
//                 allowClear
//                 style={{ width: 130 }}
//                 placeholder="Brand"
//                 options={config.brand}
//                 onChange={(id) => setFilter({...filter, brand: id})}
//               />
//               <Button onClick={onFilter} type="primary" icon={<FiSearch />}>
//                 Search
//               </Button>
//               <Button type="primary" onClick={handlePrintInvoice} icon={<BsPrinter />}>
//                 Print Invoice
//               </Button>
//             </Space>
//           </div>

//           {/* Product Cards Grid */}
//           {state.loading ? (
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16, marginTop: 16 }}>
//               {[1, 2, 3, 4, 5, 6].map((i) => (
//                 <Card key={i} loading={true} />
//               ))}
//             </div>
//           ) : filteredProducts.length > 0 ? (
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16, marginTop: 16 }}>
//               {filteredProducts.map((product) => (
//                 <Card
//                   key={product.id}
//                   hoverable
//                   style={{ borderRadius: 8 }}
//                   bodyStyle={{ padding: 12 }}
//                   cover={
//                     product.image ? (
//                       <img
//                         alt={product.name}
//                         src={Config.getFullImagePath(product.image)}
//                         style={{ height: 160, objectFit: 'cover' }}
//                       />
//                     ) : (
//                       <div style={{
//                         height: 160,
//                         backgroundColor: '#f0f2f5',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         color: '#999'
//                       }}>
//                         No Image
//                       </div>
//                     )
//                   }
//                 >
//                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
//                     <Text strong ellipsis style={{ maxWidth: '70%' }}>{product.name}</Text>
//                     <Tag color="cyan">{product.barcode}</Tag>
//                   </div>
                  
//                   <Text type="secondary" ellipsis style={{ display: 'block', marginBottom: 8 }}>
//                     {product.description || `${product.category_name} | ${product.brand}`}
//                   </Text>
                  
//                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <div>
//                       {product.discount > 0 ? (
//                         <Space size={4}>
//                           <Text strong style={{ color: '#ff4d4f' }}>
//                             ${(product.price - (product.price * product.discount / 100)).toFixed(2)}
//                           </Text>
//                           <Text delete type="secondary" style={{ fontSize: 12 }}>
//                             ${product.price}
//                           </Text>
//                           <Tag color="red" style={{ marginLeft: 4 }}>-{product.discount}%</Tag>
//                         </Space>
//                       ) : (
//                         <Text strong>${product.price}</Text>
//                       )}
//                     </div>
                    
//                     <Text type="secondary" style={{ fontSize: 12 }}>
//                       Stock: {product.qty} {product.unit}
//                     </Text>
//                   </div>
                  
//                   <Button
//                     type="primary"
//                     icon={<MdAddToPhotos />}
//                     style={{ width: '100%', marginTop: 12 }}
//                     onClick={() => handleAdd(product)}
//                   >
//                     Add to Cart
//                   </Button>
//                 </Card>
//               ))}
//             </div>
//           ) : (
//             <Empty
//               image={Empty.PRESENTED_IMAGE_SIMPLE}
//               description="No products found"
//               style={{ margin: '40px 0' }}
//             />
//           )}
//         </Col>

//         {/* Order Summary Column */}
//         <Col span={10}>
//           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
//             <Text strong>Items ({state.cart_list.length})</Text>
//             <Button onClick={handleClearCart} icon={<FcDeleteRow />}>Clear</Button>
//           </div>
          
//           {state.cart_list.length > 0 ? (
//             <>
//               {state.cart_list.map((item, index) => (
//                 <BillItem
//                   key={index}
//                   {...item}
//                   handleQuantityChange={(value) => handleQuantityChange(value, index)}
//                   handlePriceChange={(value) => handlePriceChange(value, index)}
//                 />
//               ))}
              
//               <div className={styles.rowSummary}>
//                 <Text className="khmer-title">បរិមាណសរុប</Text>
//                 <Text>{Number(objSummary.total_qty).toLocaleString()} Liter</Text>
//               </div>
              
//               <div className={styles.rowSummary}>
//                 <Text className="khmer-title">តម្លៃសរុបចុងក្រោយ</Text>
//                 <Text strong>{Math.round(Number(objSummary.total)).toLocaleString()}$</Text>
//               </div>
              
//               <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
//                 <Col span={12}>
//                   <Select
//                     allowClear
//                     style={{ width: "100%" }}
//                     placeholder="Select Customer"
//                     options={state.customers}
//                     loading={state.loading}
//                     value={objSummary.customer_id}
//                     onSelect={(value) => setObjSummary(p => ({...p, customer_id: value}))}
//                   />
//                 </Col>
                
//                 <Col span={12}>
//                   <Select
//                     allowClear
//                     style={{ width: "100%" }}
//                     placeholder="Payment Method"
//                     options={[
//                       { label: "Cash", value: "Cash" },
//                       { label: "Wing", value: "Wing" },
//                       { label: "ABA", value: "ABA" },
//                       { label: "AC", value: "AC" },
//                     ]}
//                     value={objSummary.payment_method}
//                     onSelect={(value) => setObjSummary(p => ({...p, payment_method: value}))}
//                   />
//                 </Col>
                
//                 <Col span={24}>
//                   <Select
//                     allowClear
//                     style={{ width: "100%" }}
//                     placeholder="Select Location"
//                     options={config?.branch_name}
//                     value={objSummary.user_id}
//                     onSelect={(value) => setObjSummary(p => ({...p, user_id: value}))}
//                   />
//                 </Col>
                
//                 <Col span={24}>
//                   <Input.TextArea
//                     placeholder="Remark"
//                     value={objSummary.remark}
//                     onChange={(e) => setObjSummary(p => ({...p, remark: e.target.value}))}
//                   />
//                 </Col>
                
//                 <Col span={12}>
//                   <InputNumber
//                     style={{ width: "100%" }}
//                     placeholder="Amount Paid"
//                     value={objSummary.total_paid}
//                     onChange={(value) => setObjSummary(p => ({...p, total_paid: value}))}
//                   />
//                 </Col>
                
//                 <Col span={12}>
//                   <Button
//                     disabled={isDisabled || state.cart_list.length === 0}
//                     block
//                     type="primary"
//                     onClick={handleClickOut}
//                   >
//                     Checkout
//                   </Button>
//                 </Col>
//               </Row>
//             </>
//           ) : (
//             <Empty description="Your cart is empty" />
//           )}
//         </Col>
//       </Row>
//     </MainPage>
//   );
// }

// export default CoffeePOSPage;

// // import React, { useState } from 'react';
// // import { Card, Button, Space, Typography, Divider, Tag, InputNumber, Empty } from 'antd';
// // import { PlusOutlined, MinusOutlined, PrinterOutlined, DeleteOutlined } from '@ant-design/icons';

// // const { Text, Title } = Typography;

// // const CoffeePOSPage = () => {
// //   const menuItems = [
// //     {
// //       id: 1,
// //       name: 'Caramel Frappuccino',
// //       description: 'Caramel syrup with coffee, milk, and whipped cream',
// //       price: 3.95,
// //       options: {
// //         size: ['S', 'M', 'L'],
// //         sugar: ['30%', '50%', '70%'],
// //         ice: ['30%', '50%', '70%']
// //       }
// //     },
// //     {
// //       id: 2,
// //       name: 'Coffee Latte Frappuccino',
// //       description: 'Special coffee, choco cream, and whipped cream',
// //       price: 4.79
// //     },
// //     {
// //       id: 3,
// //       name: 'Chocolate Frappuccino',
// //       description: 'Sweet chocolate with coffee, milk, and whipped cream',
// //       price: 4.51,
// //       options: {
// //         size: ['S', 'M', 'L'],
// //         sugar: ['30%', '50%', '70%']
// //       }
// //     },
// //     {
// //       id: 4,
// //       name: 'Peppermint Macchiato',
// //       description: 'Fresh peppermint mixed with choco, and blended cream',
// //       price: 5.34
// //     }
// //   ];

// //   const [cart, setCart] = useState([]);
// //   const [selectedOptions, setSelectedOptions] = useState({});
// //   const [paymentMethod, setPaymentMethod] = useState(null);

// //   const addToCart = (item) => {
// //     const options = selectedOptions[item.id] || {};
// //     const existingItem = cart.find(cartItem => 
// //       cartItem.id === item.id && 
// //       JSON.stringify(cartItem.options) === JSON.stringify(options)
// //     );
  
// //     if (existingItem) {
// //       setCart(cart.map(cartItem => 
// //         cartItem.id === item.id && 
// //         JSON.stringify(cartItem.options) === JSON.stringify(options)
// //           ? { ...cartItem, quantity: cartItem.quantity + 1 }
// //           : cartItem
// //       ));
// //     } else {
// //       setCart([...cart, { 
// //         ...item, 
// //         quantity: 1, 
// //         options 
// //       }]);
// //     }
// //   };

// //   const updateQuantity = (index, value) => {
// //     if (value < 1) return;
// //     const newCart = [...cart];
// //     newCart[index].quantity = value;
// //     setCart(newCart);
// //   };

// //   const removeItem = (index) => {
// //     const newCart = cart.filter((_, i) => i !== index);
// //     setCart(newCart);
// //   };

// //   const handleOptionSelect = (itemId, optionType, value) => {
// //     setSelectedOptions(prev => ({
// //       ...prev,
// //       [itemId]: {
// //         ...prev[itemId],
// //         [optionType]: value
// //       }
// //     }));
// //   };

// //   const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
// //   const tax = subtotal * 0.10;
// //   const total = subtotal + tax;

// //   return (
// //     <div style={{ 
// //       display: 'flex', 
// //       height: '100vh',
// //       backgroundColor: '#f5f5f5'
// //     }}>
// //       {/* Menu Column */}
// //       <div style={{
// //         flex: 3,
// //         padding: '16px',
// //         overflowY: 'auto'
// //       }}>
// //         <div style={{
// //           display: 'grid',
// //           gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
// //           gap: '12px'
// //         }}>
// //           {menuItems.map(item => (
// //             <Card 
// //               key={item.id}
// //               hoverable
// //               style={{ borderRadius: '8px' }}
// //               bodyStyle={{ padding: '12px' }}
// //             >
// //               <Title level={4} style={{ marginBottom: '8px' }}>{item.name}</Title>
// //               <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
// //                 {item.description}
// //               </Text>
              
// //               <Text strong style={{ color: '#1890ff', fontSize: '18px', display: 'block', marginBottom: '12px' }}>
// //                 ${item.price}
// //               </Text>

// //               {item.options && Object.entries(item.options).map(([optionType, values]) => (
// //                 <div key={optionType} style={{ marginBottom: '8px' }}>
// //                   <Text strong style={{ display: 'block', marginBottom: '4px' }}>
// //                     {optionType.charAt(0).toUpperCase() + optionType.slice(1)}
// //                   </Text>
// //                   <Space size={4} wrap>
// //                     {values.map(value => (
// //                       <Tag
// //                         key={value}
// //                         style={{ 
// //                           cursor: 'pointer',
// //                           backgroundColor: selectedOptions[item.id]?.[optionType] === value 
// //                             ? '#1890ff' 
// //                             : '#f0f0f0',
// //                           color: selectedOptions[item.id]?.[optionType] === value 
// //                             ? 'white' 
// //                             : 'inherit'
// //                         }}
// //                         onClick={() => handleOptionSelect(item.id, optionType, value)}
// //                       >
// //                         {value}
// //                       </Tag>
// //                     ))}
// //                   </Space>
// //                 </div>
// //               ))}

// //               <Button
// //                 type="primary"
// //                 block
// //                 style={{ marginTop: '12px' }}
// //                 onClick={() => addToCart(item)}
// //               >
// //                 Add to Billing
// //               </Button>
// //             </Card>
// //           ))}
// //         </div>
// //       </div>

// //       {/* Order Column */}
// //       <div style={{
// //         flex: 2,
// //         padding: '16px',
// //         backgroundColor: 'white',
// //         borderLeft: '1px solid #f0f0f0',
// //         display: 'flex',
// //         flexDirection: 'column'
// //       }}>
// //         <div style={{ 
// //           display: 'flex', 
// //           justifyContent: 'space-between',
// //           alignItems: 'center',
// //           marginBottom: '16px'
// //         }}>
// //           <Title level={4} style={{ margin: 0 }}>Order</Title>
// //           <Button 
// //             icon={<DeleteOutlined />} 
// //             danger 
// //             size="small"
// //             onClick={() => setCart([])}
// //             disabled={cart.length === 0}
// //           />
// //         </div>

// //         <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
// //           {cart.length > 0 ? (
// //             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
// //               {cart.map((item, index) => (
// //                 <div 
// //                   key={index}
// //                   style={{ 
// //                     padding: '12px',
// //                     border: '1px solid #f0f0f0',
// //                     borderRadius: '8px'
// //                   }}
// //                 >
// //                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
// //                     <Text strong>{item.name}</Text>
// //                     <Text>${(item.price * item.quantity).toFixed(2)}</Text>
// //                   </div>
                  
// //                   {Object.entries(item.options || {}).map(([optionType, value]) => (
// //                     <Text type="secondary" style={{ fontSize: '12px', display: 'block' }} key={optionType}>
// //                       {optionType}: {value}
// //                     </Text>
// //                   ))}
                  
// //                   <div style={{ 
// //                     display: 'flex', 
// //                     alignItems: 'center', 
// //                     marginTop: '8px'
// //                   }}>
// //                     <Button 
// //                       icon={<MinusOutlined />} 
// //                       size="small" 
// //                       onClick={() => updateQuantity(index, item.quantity - 1)}
// //                     />
// //                     <InputNumber 
// //                       min={1} 
// //                       value={item.quantity} 
// //                       onChange={(value) => updateQuantity(index, value)}
// //                       style={{ width: '60px', margin: '0 8px' }}
// //                     />
// //                     <Button 
// //                       icon={<PlusOutlined />} 
// //                       size="small" 
// //                       onClick={() => updateQuantity(index, item.quantity + 1)}
// //                     />
// //                     <Button 
// //                       danger 
// //                       type="text" 
// //                       size="small" 
// //                       style={{ marginLeft: 'auto' }}
// //                       onClick={() => removeItem(index)}
// //                     >
// //                       Remove
// //                     </Button>
// //                   </div>
// //                 </div>
// //               ))}
// //             </div>
// //           ) : (
// //             <Empty 
// //               description="No items in cart" 
// //               image={Empty.PRESENTED_IMAGE_SIMPLE}
// //               style={{ margin: '32px 0' }}
// //             />
// //           )}
// //         </div>

// //         <div style={{ marginBottom: '16px' }}>
// //           <Divider style={{ margin: '8px 0' }} />
// //           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
// //             <Text>Subtotal:</Text>
// //             <Text>${subtotal.toFixed(2)}</Text>
// //           </div>
// //           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
// //             <Text>Tax (10%):</Text>
// //             <Text>${tax.toFixed(2)}</Text>
// //           </div>
// //           <Divider style={{ margin: '8px 0' }} />
// //           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
// //             <Text strong>Total:</Text>
// //             <Text strong>${total.toFixed(2)}</Text>
// //           </div>
// //         </div>

// //         <div style={{ marginBottom: '16px' }}>
// //           <Text strong style={{ display: 'block', marginBottom: '8px' }}>Payment Method</Text>
// //           <Space>
// //             <Button
// //               type={paymentMethod === 'cash' ? 'primary' : 'default'}
// //               onClick={() => setPaymentMethod('cash')}
// //             >
// //               Cash
// //             </Button>
// //             <Button
// //               type={paymentMethod === 'card' ? 'primary' : 'default'}
// //               onClick={() => setPaymentMethod('card')}
// //             >
// //               Debit Card
// //             </Button>
// //             <Button
// //               type={paymentMethod === 'ewallet' ? 'primary' : 'default'}
// //               onClick={() => setPaymentMethod('ewallet')}
// //             >
// //               E-Wallet
// //             </Button>
// //           </Space>
// //         </div>

// //         <Button
// //           type="primary"
// //           icon={<PrinterOutlined />}
// //           block
// //           size="large"
// //           disabled={cart.length === 0 || !paymentMethod}
// //         >
// //           Print Bill
// //         </Button>
// //       </div>
// //     </div>
// //   );
// // };

// // export default CoffeePOSPage;