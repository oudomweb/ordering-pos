

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
//   Table,
//   Modal,
//   Form,
//   Tag,
// } from "antd";
// import { request } from "../../util/helper";
// import MainPage from "../../component/layout/MainPage";
// import { configStore } from "../../store/configStore";
// import ProductItem from "../../component/pos/ProductItem";
// import BillItem from "../../component/pos/BillItem";
// import styles from "./PosPage.module.css";
// import { useReactToPrint } from "react-to-print";
// import PrintInvoice from "../../component/pos/PrintInvoice";

// function InvoicesUser() {
//   const [isDisabled, setIsDisabled] = useState(false);
//   const { config } = configStore();
//   const refInvoice = React.useRef(null);
//   const [state, setState] = useState({
//     list: [],
//     total: 0,
//     loading: false,
//     visibleModal: false,
//     cart_list: [],
//   });

//   const [objSummary, setObjSummary] = useState({
//     sub_total: 0,
//     total_qty: 0,
//     save_discount: 0,
//     // name:"",
//     tax: 10,
//     total: 0,
//     total_paid: 0,
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

//   useEffect(() => {
//     getList();
//   }, []);
//   useEffect(() => {
//     const checkTime = () => {
//       const now = new Date();
//       const hours = now.getHours();
//       const minutes = now.getMinutes();

//       // Disable button at 12:00 AM
//       setIsDisabled(hours === 0 && minutes === 0);
//     };

//     checkTime(); // Run on mount
//     const interval = setInterval(checkTime, 60000); // Check every 1 minute

//     return () => clearInterval(interval); // Cleanup interval
//   }, []);

//   const getList = async () => {
//     var param = {
//       ...filter,
//       page: refPage.current,
//       is_list_all: 1,
//     };
//     setState((pre) => ({ ...pre, loading: true }));
    
//     const res = await request("product", "get", param);
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
//     var cart_tmp = state.cart_list;
//     var findIndex = cart_tmp.findIndex((row) => row.barcode == item.barcode);
//     var isNoStock = false;
//     if (findIndex == -1) {
//       if (item.qty > 500) {
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
//         description: "No stock!. Currently quantity in stock available " + item.qty,
//         placement: "top",
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

//     // alert(JSON.stringify(item))
//   };


//   const handleClearCart = () => {
//     setState((p) => ({ ...p, cart_list: [] }));
//     setObjSummary((p) => ({
//       ...p,
//       sub_total: 0,
//       total_qty: 0,
//       save_discount: 0,
//       tax: 10,
//       total: 0,
//       total_paid: 0,
//     }));
//   };

//   const handleIncrease = (item, index) => {
//     state.cart_list[index].cart_qty += 100;
//     setState((p) => ({ ...p, cart_list: state.cart_list }));
//     handleCalSummary();
//   };

//   const handleDescrease = (item, index) => {
//     if (item.cart_qty > 1) {
//       state.cart_list[index].cart_qty -= 1;
//       setState((p) => ({ ...p, cart_list: state.cart_list }));
//       handleCalSummary();
//     }
//   };


//   const handleRemove = (item, index) => {
//     const new_list = state.cart_list.filter((item1) => item1.barcode != item.barcode);
//     setState((p) => ({
//       ...p,
//       cart_list: new_list,
//     }));
//     handleCalSummary();
//   };

//   const handleCalSummary = useCallback(() => {
//     let total_qty = 0,
//       sub_total = 0,
//       save_discount = 0,
//       total = 0,
//       original_total = 0;
//     state.cart_list.map((item) => {
//       total_qty += item.cart_qty;
//       var final_price = item.unit_price;
//       if (item.discount != 0 && item.discount != null) {
//         final_price = item.unit_price - (item.unit_price * item.discount) / 100;
//         final_price = final_price.toFixed(2);
//       }
//       original_total += item.cart_qty * item.unit_price;
//       sub_total += item.cart_qty * final_price;
//     });
//     total = sub_total;
//     save_discount = original_total - sub_total;
//     setObjSummary((p) => ({
//       ...p,
//       total_qty: total_qty,
//       sub_total: sub_total.toFixed(2),
//       save_discount: save_discount.toFixed(2),
//       total: total.toFixed(2),
//     }));
//   }, [state.cart_list]);

//   // const handleClickOut = async () => {
//   //   var order_details = [];
//   //   state.cart_list.forEach((item) => {
//   //     var total = Number(item.cart_qty) * Number(item.unit_price);
//   //     if (item.discount != null && item.discount != 0) {
//   //       total = total - (total * Number(item.discount)) / 100;
//   //     }
//   //     var objItem = {
//   //       proudct_id: item.id,
//   //       qty: Number(item.cart_qty),
//   //       price: Number(item.unit_price),
//   //       discount: Number(item.discount),
//   //       total: total,
//   //     };
//   //     order_details.push(objItem);
//   //   });
//   //   var param = {
//   //     order: {
//   //       customer_id: objSummary.customer_id,
//   //       total_amount: objSummary.total,
//   //       paid_amount: objSummary.total_paid,
//   //       payment_method: objSummary.payment_method,
//   //       remark: objSummary.remark,
//   //     },
//   //     order_details: order_details,
//   //   };
//   //   const res = await request("order", "post", param);
//   //   // console.log(res)
//   //   if (res && !res.error) {
//   //     if (res.order) {
//   //       message.success("Order created success!");
//   //       setObjSummary((p) => ({
//   //         ...p,
//   //         order_no: res.order?.order_no,
//   //         order_date: res.order?.create_at,
//   //       }));
//   //       setTimeout(() => {
//   //         handlePrintInvoice();
//   //       }, 2000);
//   //     }
//   //   } else {
//   //     message.success("Order not complete!");
//   //   }
//   // };

//   const handleClickOut = async () => {
//     var order_details = [];
//     state.cart_list.forEach((item) => {
//       var total = Number(item.cart_qty) * Number(item.unit_price);
//       if (item.discount != null && item.discount != 0) {
//         total = total - (total * Number(item.discount)) / 100;
//       }
//       var objItem = {
//         product_id: item.id, // Fix typo: proudct_id -> product_id
//         qty: Number(item.cart_qty),
//         price: Number(item.unit_price),
//         discount: Number(item.discount),
//         total: total,
//       };
//       order_details.push(objItem);
//     });
//     var param = {

//       order: {
//         customer_id: objSummary.customer_id,
//         user_id: objSummary.user_id,
//         total_amount: objSummary.total,
//         paid_amount: objSummary.total_paid,
//         payment_method: objSummary.payment_method,
//         remark: objSummary.remark,
//       },
//       order_details: order_details,
//     };

//     // console.log("Request Payload:", param); // Log the payload

//     const res = await request("order", "post", param);
//     if (res && !res.error) {
//       if (res.order) {
//         message.success("Order created success!");
//         setObjSummary((p) => ({
//           ...p,
//           order_no: res.order?.order_no,
//           order_date: res.order?.create_at,
//         }));
//         setTimeout(() => {
//           handlePrintInvoice();
//         }, 2000);
//       }
//     } else {
//       message.error("Order not complete!");
//     }
//   };

//   const onBeforePrint = React.useCallback(() => {
//     console.log("`onBeforePrint` called");
//     return Promise.resolve();
//   }, []);

//   const onAfterPrint = React.useCallback((event) => {
//     handleClearCart();
//     console.log("`onAfterPrint` called", event);
//   }, []);

//   const onPrintError = React.useCallback(() => {
//     console.log("`onPrintError` called");
//   }, []);

//   const handlePrintInvoice = useReactToPrint({
//     contentRef: refInvoice,
//     onBeforePrint: onBeforePrint,
//     onAfterPrint: onAfterPrint,
//     onPrintError: onPrintError,
//   });

//   const handleExportExcel = () => {
//     // Implement export to Excel functionality
//   };

//   const handleSavePdf = () => {
//     // Implement save as PDF functionality
//   };

//   const handlePrint = () => {
//     // Implement print functionality
//   };

//   const handleModalOk = () => {
//     form.validateFields().then((values) => {
//       // Handle the form submission
//       setState((p) => ({ ...p, visibleModal: false }));
//     });
//   };

//   const handleModalCancel = () => {
//     setState((p) => ({ ...p, visibleModal: false }));
//   };
//   // const uniqueProducts = state.list.filter((product, index, self) => 
//   //   index === self.findIndex((p) => p.category_name === product.category_name)
//   // );

//   const uniqueProducts = state.list.reduce((acc, product) => {
//     const existingCategory = acc.find((p) => p.category_name === product.category_name);

//     if (existingCategory) {
//       existingCategory.qty += product.qty; // Sum up the quantity
//     } else {
//       acc.push({ ...product }); // Add new category
//     }

//     return acc;
//   }, []);



//   const columns = [
//     {
//       title: (
//         <div className="table-header">
//           <div className="khmer-text">លេខបាកូដ</div>
//           <div className="english-text">Barcode</div>
//         </div>
//       ),
//       dataIndex: "barcode",
//       key: "barcode",
//       render: (value) => <Tag className="barcode-tag" color="cyan">{value}</Tag>,
//     },
//     {
//       title: (
//         <div className="table-header">
//           <div className="khmer-text">ឈ្មោះផលិតផល</div>
//           <div className="english-text">Product Name</div>
//         </div>
//       ),
//       dataIndex: "name",
//       key: "name",
//       render: (text) => <span className="product-name">{text}</span>,
//     },
//     {
//       title: (
//         <div className="table-header">
//           <div className="khmer-text">ប្រភេទ</div>
//           <div className="english-text">Category Name</div>
//         </div>
//       ),
//       dataIndex: "category_name",
//       key: "category_name",
//       render: (text) => <span className="category-name">{text}</span>,
//     },
//     {
//       title: (
//         <div className="table-header">
//           <div className="khmer-text">ឯកតា</div>
//           <div className="english-text">Unit</div>
//         </div>
//       ),
//       dataIndex: "unit",
//       key: "unit",
//       render: (text) => <span className="unit-text">{text}</span>,
//     },
//     {
//       title: (
//         <div className="table-header">
//           <div className="khmer-text">តម្លៃរាយ</div>
//           <div className="english-text">Unit Price</div>
//         </div>
//       ),
//       dataIndex: "unit_price",
//       key: "unit_price",
//       render: (text) => <span className="unit-price">{text}</span>,
//     },
//     {
//       title: (
//         <div className="table-header">
//           <div className="khmer-text">បរិមាណ</div>
//           <div className="english-text">QTY</div>
//         </div>
//       ),
//       dataIndex: "qty",
//       key: "qty",
//       render: (text) => <span className="qty-text">{text}</span>,
//     },
//     {
//       title: (
//         <div className="table-header">
//           <div className="khmer-text">បញ្ចុះតម្លៃ</div>
//           <div className="english-text">Discount</div>
//         </div>
//       ),
//       dataIndex: "discount",
//       key: "discount",
//       render: (text) => <span className="discount-text">{text}</span>,
//     },
//     {
//       title: (
//         <div className="table-header">
//           <div className="khmer-text">សកម្មភាព</div>
//           <div className="english-text">Action</div>
//         </div>
//       ),
//       key: "action",
//       render: (text, record) => (
//         <Button className="add-to-cart-btn" onClick={() => handleAdd(record)} type="primary">
//           Add to Cart
//         </Button>
//       ),
//     },
//   ];


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
//         <Col span={16} className={styles.grid1}>
//           <div className="pageHeader">
//             <Space>
//               <div>Product {state.total}</div>
//               <Input.Search
//                 onChange={(event) =>
//                   setFilter((p) => ({ ...p, txt_search: event.target.value }))
//                 }
//                 allowClear
//                 placeholder="Search"
//                 onSearch={() => getList()}
//               />
//               <Select
//                 allowClear
//                 style={{ width: 130 }}
//                 placeholder="Category"
//                 options={config.category}
//                 onChange={(id) => {
//                   setFilter((pre) => ({ ...pre, category_id: id }));
//                 }}
//               />
//               <Select
//                 allowClear
//                 style={{ width: 130 }}
//                 placeholder="Brand"
//                 options={config.brand}
//                 onChange={(id) => {
//                   setFilter((pre) => ({ ...pre, brand: id }));
//                 }}
//               />
//               <Button onClick={onFilter} type="primary">
//                 Search
//               </Button>
//               <Button type="primary" onClick={handlePrintInvoice}>
//                   Print Invoice{" "}
//                 </Button>
//             </Space>
//             {/* <Space>
//               <Button onClick={handleExportExcel}>Export to Excel</Button>
//               <Button onClick={handleSavePdf}>Save as PDF</Button>
//               <Button onClick={handlePrint}>Print</Button>
//               <Button type="primary" onClick={() => setState((p) => ({ ...p, visibleModal: true }))}>
//                 New
//               </Button>
//             </Space> */}
//           </div>
//           <Table
//             dataSource={uniqueProducts}
//             columns={columns}
//             loading={state.loading}
//             pagination={false}
//             rowKey="id"
//           />
//         </Col>



//         <Col span={8}>
//           <div style={{ display: "flex", justifyContent: "space-between" }}>
//             <div>Items {state.cart_list.length}</div>
//             <Button onClick={handleClearCart}>Clear</Button>
//           </div>
//           {state.cart_list?.map((item, index) => (
//             <BillItem
//               key={index}
//               {...item}
//               handleDescrease={() => handleDescrease(item, index)}
//               handleIncrease={() => handleIncrease(item, index)}



//             />
//           ))}
//           {!state.cart_list.length && <Empty />}
//           <div>
//             <div className={styles.rowSummary}>
//               <div>Total Qty </div>
//               <div>{objSummary.total_qty}Liter</div>
//             </div>
//             <div className={styles.rowSummary}>
//               <div>Sub total </div>
//               <div>{objSummary.sub_total}$</div>
//             </div>
//             <div className={styles.rowSummary}>
//               <div>Save($) </div>
//               <div>{objSummary.save_discount}$</div>
//             </div>
//             <div className={styles.rowSummary}>
//               <div style={{ fontWeight: "bold" }}>Total </div>
//               <div style={{ fontWeight: "bold" }}>{objSummary.total}$</div>
//             </div>
//           </div>
//           <div>
//             <Row gutter={[6, 6]} style={{ marginTop: 15 }}>
//               <Col span={12}>
//                 <Select
//                   allowClear
//                   style={{ width: "100%" }}
//                   placeholder="Select Customer"
//                   options={config?.customer}
//                   onSelect={(value, option) => { // `option` contains the full selected object
//                     setObjSummary((p) => ({
//                       ...p,
//                       customer_id: value, // `value` is the selected ID
//                       customer_name: option.label, // `option.label` is the customer name
//                     }));
//                   }}
//                 />
//               </Col>

//               <Col span={12}>
//                 <Select
//                   allowClear
//                   style={{ width: "100%" }}
//                   placeholder="Select Payment"
//                   options={[
//                     {
//                       label: "Cash",
//                       value: "Cash",
//                     },
//                     {
//                       label: "Wing",
//                       value: "Wing",
//                     },
//                     {
//                       label: "ABA",
//                       value: "ABA",
//                     },
//                     {
//                       label: "AC",
//                       value: "AC",
//                     },
//                   ]}
//                   onSelect={(value) => {
//                     setObjSummary((p) => ({
//                       ...p,
//                       payment_method: value,
//                     }));
//                   }}
//                 />
//               </Col>
//               <Col span={24}>
//                 <Select
//                   allowClear
//                   style={{ width: "100%" }}
//                   placeholder="Select location"
//                   options={config?.user} // Make sure `config?.user` contains `branch_name`
//                   onSelect={(value, option) => {
//                     console.log(option); // 🔥 Debugging: ពិនិត្យ `option`
//                     setObjSummary((prev) => ({
//                       ...prev,
//                       user_id: value,
//                       user_name: option.label,
//                       user_address: option.address || "",
//                       branch_name: option.branch_name || "", // ✅ Fix: avoid undefined error
//                       tel: option.tel || "",
//                     }));
//                   }}
//                 />


//               </Col>

//               <Col span={24}>
//                 <Input.TextArea
//                   placeholder="Remark"
//                   onChange={(e) => {
//                     setObjSummary((p) => ({ ...p, remark: e.target.value }));
//                   }}
//                 />
//               </Col>
              
//             </Row>

//             <Row gutter={[16, 16]} style={{ marginTop: 15 }}>
//               <Col span={12}>
//                 <InputNumber
//                   style={{ width: "100%" }}
//                   placeholder="Amount to paid"
//                   value={objSummary.total_paid}
//                   onChange={(value) => {
//                     setObjSummary((p) => ({ ...p, total_paid: value }));
//                   }}
//                 />
//               </Col>
//               <Col span={12}>
               
//                 <Button
//                   disabled={isDisabled || state.cart_list.length == 0}
//                   block
//                   type="primary"
//                   onClick={handleClickOut}
//                 >
//                   Checkout{" "}
//                 </Button>
//               </Col>
//               {/* <Col span={24}>
//                 <Button type="primary" onClick={handlePrintInvoice}>
//                   Print Invoice{" "}
//                 </Button>
//               </Col> */}
//             </Row>
//           </div>
//         </Col>
//       </Row>
//       <Modal
//         title="New Order"
//         visible={state.visibleModal}
//         onOk={handleModalOk}
//         onCancel={handleModalCancel}
//       >
//         <Form form={form} layout="vertical">
//           <Form.Item label="Customer" name="customer_id" rules={[{ required: true }]}>
//             <Select
//               allowClear
//               placeholder="Select Customer"
//               options={config?.customer}
//             />
//           </Form.Item>
//           <Form.Item label="Payment Method" name="payment_method" rules={[{ required: true }]}>
//             <Select
//               allowClear
//               placeholder="Select Payment"
//               options={[
//                 { label: 'Cash', value: 'Cash' },
//                 { label: 'Wing', value: 'Wing' },
//                 { label: 'ABA', value: 'ABA' },
//                 { label: 'AC', value: 'AC' },
//               ]}
//             />
//           </Form.Item>
//           <Form.Item label="Total" name="total" rules={[{ required: true }]}>
//             <InputNumber style={{ width: '100%' }} />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </MainPage>
//   );
// }

// export default InvoicesUser;