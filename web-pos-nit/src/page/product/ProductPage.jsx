// import React, { useEffect, useState } from "react";
// import {
//   Button,
//   Col,
//   Form,
//   Image,
//   Input,
//   InputNumber,
//   message,
//   Modal,
//   Row,
//   Select,
//   Space,
//   Table,
//   Tag,
//   Upload,
// } from "antd";
// import { SearchOutlined } from "@ant-design/icons";
// import dayjs from "dayjs";
// import { request } from "../../util/helper";
// import { MdAdd, MdDelete, MdEdit, MdRestaurantMenu } from "react-icons/md";
// import MainPage from "../../component/layout/MainPage";
// import { configStore } from "../../store/configStore";
// import { Config } from "../../util/config";
// import { getProfile } from "../../store/profile.store";
// import "./Product.css"
// import RecipeModal from "./RecipeModal";
// import { useLanguage, translations } from "../../store/language.store";
// const getBase64 = (file) =>
//   new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = () => resolve(reader.result);
//     reader.onerror = (error) => reject(error);
//   });

// // ─── Color Palette (Matches POS) ─────────────────────────────────────────────
// const COLORS = {
//   bg: "#f4f1eb",
//   darkGreen: "#1e4a2d",
//   midGreen: "#2d6a42",
//   accentGreen: "#3a7d52",
//   white: "#ffffff",
//   textPrimary: "#1a2e1a",
//   textSecondary: "#6b7c6b",
//   softBorder: "#e8e3d8",
//   redBadge: "#e85d5d",
// };

// // ─── Sub-component for dynamic Coffee fields ────────────────────────────────
// const CoffeeOptions = ({ config, categoryId, stateId, t }) => {
//   const isCoffee = React.useMemo(() => {
//     const cid = categoryId || stateId;
//     if (!cid) return false;
    
//     const strId = String(cid);
//     // Explicit list of Coffee IDs in your system
//     if (strId === "15" || strId === "51" || strId === "1") return true;

//     // Fallback: Check label matches
//     const cat = (config.category || []).find(c => String(c.value) === strId);
//     const label = (cat?.label || "").trim().toLowerCase();
//     return label.includes("coffee") || label.includes("កាហ្វេ") || label.includes("cafe");
//   }, [categoryId, stateId, config.category]);

//   if (!isCoffee) return null;

//   return (
//     <div style={{ 
//       background: "#f0f7f2", 
//       padding: "16px", 
//       borderRadius: "16px", 
//       marginBottom: "20px", 
//       border: "1px solid #d9e6dc",
//       boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
//     }}>
//       <Form.List name="sizes" initialValue={[]}>
//         {(fields, { add, remove }) => (
//           <>
//             <div style={{ fontWeight: 800, marginBottom: 12, color: COLORS.darkGreen, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
//               <span>☕</span> {t.sizes} / {translations.kh.sizes}
//             </div>
//             {fields.map(({ key, name, ...restField }) => (
//               <Space key={key} style={{ display: "flex", marginBottom: 12 }} align="start">
//                 <Form.Item 
//                   {...restField} 
//                   name={[name, 'label']} 
//                   rules={[{ required: true, message: 'Required' }]}
//                   style={{ marginBottom: 0 }}
//                 >
//                   <Select 
//                     style={{ width: 130 }} 
//                     placeholder="Size" 
//                     options={[
//                       { label: "Small (S)", value: "S" }, 
//                       { label: "Medium (M)", value: "M" }, 
//                       { label: "Large (L)", value: "L" }
//                     ]} 
//                   />
//                 </Form.Item>
//                 <Form.Item 
//                   {...restField} 
//                   name={[name, 'price']} 
//                   rules={[{ required: true, message: 'Required' }]}
//                   style={{ marginBottom: 0 }}
//                 >
//                   <InputNumber 
//                     placeholder="Price" 
//                     style={{ width: 100 }} 
//                     min={0} 
//                     step={0.1}
//                     precision={2}
//                   />
//                 </Form.Item>
//                 <Button 
//                   danger 
//                   type="text" 
//                   onClick={() => remove(name)} 
//                   icon={<MdDelete style={{ fontSize: 18 }} />} 
//                 />
//               </Space>
//             ))}
//             <Button 
//               type="dashed" 
//               onClick={() => add()} 
//               icon={<MdAdd />} 
//               block 
//               style={{ 
//                 marginBottom: 20, 
//                 borderRadius: 10, 
//                 height: 40, 
//                 borderColor: COLORS.midGreen, 
//                 color: COLORS.midGreen 
//               }}
//             >
//               {t.add_size} / {translations.kh.add_size || "បន្ថែមទំហំ"}
//             </Button>
//           </>
//         )}
//       </Form.List>

//       <Form.List name="addons" initialValue={[]}>
//         {(fields, { add, remove }) => (
//           <>
//             <div style={{ fontWeight: 800, marginBottom: 12, color: COLORS.darkGreen, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
//               <span>➕</span> {t.addons} / {translations.kh.addons}
//             </div>
//             {fields.map(({ key, name, ...restField }) => (
//               <Space key={key} style={{ display: "flex", marginBottom: 12 }} align="start">
//                 <Form.Item 
//                   {...restField} 
//                   name={[name, 'label']} 
//                   rules={[{ required: true, message: 'Required' }]}
//                   style={{ marginBottom: 0 }}
//                 >
//                   <Select 
//                     style={{ width: 130 }} 
//                     placeholder="Add-on" 
//                     options={[
//                       { label: "Extra Shot", value: "Extra Shot" }, 
//                       { label: "Milk Foam", value: "Milk Foam" },
//                       { label: "Honey", value: "Honey" },
//                       { label: "Pearl", value: "Pearl" }
//                     ]} 
//                   />
//                 </Form.Item>
//                 <Form.Item 
//                   {...restField} 
//                   name={[name, 'price']} 
//                   rules={[{ required: true, message: 'Required' }]}
//                   style={{ marginBottom: 0 }}
//                 >
//                   <InputNumber 
//                     placeholder="Price" 
//                     style={{ width: 100 }} 
//                     min={0} 
//                     step={0.1}
//                     precision={2}
//                   />
//                 </Form.Item>
//                 <Button 
//                   danger 
//                   type="text" 
//                   onClick={() => remove(name)} 
//                   icon={<MdDelete style={{ fontSize: 18 }} />} 
//                 />
//               </Space>
//             ))}
//             <Button 
//               type="dashed" 
//               onClick={() => add()} 
//               icon={<MdAdd />} 
//               block
//               style={{ 
//                 borderRadius: 10, 
//                 height: 40, 
//                 borderColor: COLORS.midGreen, 
//                 color: COLORS.midGreen 
//               }}
//             >
//               {t.add_addon} / {translations.kh.add_addon || "បន្ថែមគ្រឿងបន្ថែម"}
//             </Button>
//           </>
//         )}
//       </Form.List>
//     </div>
//   );
// };

// function ProductPage() {
//   const { lang } = useLanguage();
//   const t = translations[lang];
//   const { config } = configStore();
//   const [form] = Form.useForm();
//   const [state, setState] = useState({
//     list: [],
//     visibleModal: false,
//   });
//   const [filter, setFilter] = useState({
//     txt_search: "",
//     category_id: "",
//     brand: "",
//   });
//   const [previewOpen, setPreviewOpen] = useState(false);
//   const [previewImage, setPreviewImage] = useState("");
//   const [imageDefault, setImageDefault] = useState([]);
//   const [imageOptional, setImageOptional] = useState([]);
//   const [visibleRecipeModal, setVisibleRecipeModal] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);

//   useEffect(() => {
//     getList();
//   }, []);
//   const refPage = React.useRef(1);

//   const getList = async () => {
//     var param = {
//       ...filter,
//       page: 1, // Force first page
//       is_list_all: 1, // Ensure fetching all
//     };

//     setState((pre) => ({ ...pre, loading: true }));
//     const res = await request(`product`, "get", param);
//     if (res && !res.error) {
//       // Calculate totals for each product category
//       const totals = res.list.reduce((acc, item) => {
//         if (!acc[item.category_name]) {
//           acc[item.category_name] = 0;
//         }
//         acc[item.category_name] += item.qty;
//         return acc;
//       }, {});

//       setState((pre) => ({
//         ...pre,
//         list: res.list,
//         total: refPage.current == 1 ? res.total : pre.total,
//         loading: false,
//         totals, // Store totals in state
//       }));
//     }
//   };
//   const onCloseModal = () => {
//     setState((p) => ({
//       ...p,
//       visibleModal: false,
//     }));
//     setImageDefault([]);
//     form.resetFields();
//   };
//   const onFinish = async (items) => {
//     // 🔍 Debug log to see what we are sending
//     console.log("Submitting items:", items);
//     console.log("Form ID:", form.getFieldValue("id"));

//     var params = new FormData();
//     // Use items from onFinish if available, otherwise fallback to form
//     const getValue = (key) => items[key] !== undefined ? items[key] : form.getFieldValue(key);

//     params.append("id", form.getFieldValue("id") || "");
//     params.append("name", getValue("name") || "");
//     params.append("category_id", getValue("category_id") || "");
//     params.append("barcode", getValue("barcode") || "");
//     params.append("brand", getValue("brand") || "");
//     params.append("description", getValue("description") || "");
//     params.append("qty", getValue("qty") || 0);
//     params.append("min_stock_alert", getValue("min_stock_alert") || 0);
//     params.append("price", getValue("price") || 0);
//     params.append("cost_price", getValue("cost_price") || 0);
//     params.append("discount", getValue("discount") || 0);
//     params.append("status", getValue("status") === 0 ? 0 : 1);
//     params.append("sizes", JSON.stringify(getValue("sizes") || []));
//     params.append("addons", JSON.stringify(getValue("addons") || []));

//     if (items.image_default) {
//       if (items.image_default.file.status === "removed") {
//         params.append("image_remove", "1");
//       } else if (items.image_default.file.originFileObj) {
//         params.append(
//           "upload_image",
//           items.image_default.file.originFileObj,
//           items.image_default.file.name
//         );
//       }
//     }
    
//     var method = "post";
//     if (form.getFieldValue("id")) {
//       method = "put";
//     }

//     const res = await request("product", method, params);
//     if (res && !res.error) {
//       message.success(res.message);
//       onCloseModal();
//       getList();
//     } else {
//       if (res && res.error?.barcode) {
//         message.error(res.error.barcode);
//       } else if (res && res.message) {
//         message.error(res.message);
//       } else {
//         message.error("Connection failed. Check console for details.");
//       }
//     }
//   };
//   const onBtnNew = async () => {
//     try {
//       const res = await request("new_barcode", "post");
//       if (res && res.barcode) {
//         const checkRes = await request(`check-barcode/${res.barcode}`, "get");
//         if (checkRes && checkRes.exists) {
//           return onBtnNew();
//         }
//         form.setFieldValue("barcode", res.barcode);
//       }
//     } catch (err) {
//       console.error("Barcode generation failed:", err);
//     } finally {
//       const firstCategoryId = config.category?.[0]?.value;
//       if (firstCategoryId) {
//         form.setFieldValue("category_id", firstCategoryId);
//       }
//       setState((p) => ({
//         ...p,
//         visibleModal: true,
//         selectedParentId: firstCategoryId
//       }));
//     }
//   };
//   const handlePreview = async (file) => {
//     if (!file.url && !file.preview) {
//       file.preview = await getBase64(file.originFileObj);
//     }
//     setPreviewImage(file.url || file.preview);
//     setPreviewOpen(true);
//   };
//   const handleChangeImageDefault = ({ fileList: newFileList }) =>
//     setImageDefault(newFileList);
//   const handleChangeImageOptional = ({ fileList: newFileList }) =>
//     setImageOptional(newFileList);
//   const onFilter = () => {
//     getList();
//   };

//   const SAMPLE_SIZES = [
//     { label: "Small (S)", value: "S" },
//     { label: "Medium (M)", value: "M" },
//     { label: "Large (L)", value: "L" },
//   ];

//   const SAMPLE_ADDONS = [
//     { label: "Milk Foam", value: "Milk Foam" },
//     { label: "Whipped Cream", value: "Whipped Cream" },
//     { label: "Chocolate Syrup", value: "Chocolate Syrup" },
//     { label: "Extra Shot", value: "Extra Shot" },
//   ];


//   const onClickEdit = (item, index) => {
//     form.setFieldsValue({
//       ...item,
//     });
//     setState((pre) => ({ ...pre, visibleModal: true, selectedParentId: item.category_id }));
//     if (item.image != "" && item.image != null) {
//       const imageProduct = [
//         {
//           uid: "-1",
//           name: item.image,
//           status: "done",
//           url: Config.getFullImagePath(item.image),

//         },
//       ];
//       setImageDefault(imageProduct);
//     }
//   };
//   const onClickDelete = (item, index) => {
//     Modal.confirm({
//       title: t.remove_data,
//       content: t.confirm_remove_product,
//       onOk: async () => {
//         const res = await request("product", "delete", item);
//         if (res && !res.error) {
//           message.success(t.product_deleted);
//           getList();
//         }
//       },
//     });
//   };

//   const onClickRecipe = (item) => {
//     setSelectedProduct(item);
//     setVisibleRecipeModal(true);
//   };

//   return (
//     <MainPage loading={state.loading}>
//       {/* Stats Section */}
//       <div style={{ marginBottom: 24 }}>
//         <Row gutter={16}>
//           <Col span={6}>
//             <div style={{
//               background: COLORS.darkGreen,
//               color: "#fff",
//               padding: "20px",
//               borderRadius: "16px",
//               boxShadow: "0 4px 15px rgba(30,74,45,0.2)"
//             }}>
//               <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase", letterSpacing: 0.5 }}>{t.total_products}</div>
//               <div style={{ fontSize: "28px", fontWeight: "bold" }}>{state.total}</div>
//             </div>
//           </Col>
//           <Col span={6}>
//             <div style={{
//               background: "linear-gradient(135deg, #2d6a42 0%, #40916c 100%)",
//               color: "#fff",
//               padding: "20px",
//               borderRadius: "16px",
//               boxShadow: "0 4px 15px rgba(45,106,66,0.2)"
//             }}>
//               <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase", letterSpacing: 0.5 }}>{t.categories}</div>
//               <div style={{ fontSize: "28px", fontWeight: "bold" }}>{config.category?.length || 0}</div>
//             </div>
//           </Col>
//           <Col span={12}>
//             <div style={{
//               background: "#fff",
//               padding: "20px",
//               borderRadius: "16px",
//               border: `1px solid ${COLORS.softBorder}`,
//               display: 'flex',
//               gap: 20,
//               overflowX: 'auto'
//             }}>
//               {Object.entries(state.totals || {}).map(([cat, qty]) => (
//                 <div key={cat} style={{ textAlign: 'center', minWidth: 80 }}>
//                   <div style={{ fontSize: 10, color: COLORS.textSecondary, textTransform: 'uppercase' }}>{cat}</div>
//                   <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.darkGreen }}>{qty}</div>
//                 </div>
//               ))}
//             </div>
//           </Col>
//         </Row>
//       </div>

//       <div style={{
//         background: "#fff",
//         padding: "20px",
//         borderRadius: "20px",
//         border: `1px solid ${COLORS.softBorder}`,
//         marginBottom: 24
//       }}>
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
//           <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.textPrimary }}>{t.menu_inventory}</div>
//           <Button
//             type="primary"
//             size="large"
//             icon={<MdAdd />}
//             onClick={onBtnNew}
//             style={{
//               background: COLORS.darkGreen,
//               borderRadius: 12,
//               height: 45,
//               padding: '0 25px',
//               fontWeight: 600,
//               border: 'none',
//               boxShadow: '0 4px 12px rgba(30,74,45,0.3)'
//             }}
//           >
//             {t.add_new_product}
//           </Button>
//         </div>

//         <Row gutter={12}>
//           <Col span={8}>
//             <Input
//               prefix={<SearchOutlined style={{ color: COLORS.textSecondary }} />}
//               placeholder={t.search_product}
//               size="large"
//               style={{ borderRadius: 12 }}
//               onChange={(e) => setFilter(p => ({ ...p, txt_search: e.target.value }))}
//             />
//           </Col>
//           <Col span={5}>
//             <Select
//               placeholder={t.category_name}
//               size="large"
//               allowClear
//               style={{ width: '100%' }}
//               options={config.category}
//               onChange={(id) => setFilter(p => ({ ...p, category_id: id }))}
//             />
//           </Col>
//           <Col span={5}>
//             <Select
//               placeholder={t.brand}
//               size="large"
//               allowClear
//               style={{ width: '100%' }}
//               options={config.brand}
//               onChange={(id) => setFilter(p => ({ ...p, brand: id }))}
//             />
//           </Col>
//           <Col span={4}>
//             <Button
//               block
//               size="large"
//               type="primary"
//               onClick={onFilter}
//               style={{ background: COLORS.midGreen, borderRadius: 12, fontWeight: 600 }}
//             >
//               {t.apply_filters.toUpperCase()}
//             </Button>
//           </Col>
//         </Row>
//       </div>
//       <Modal
//         open={state.visibleModal}
//         title={
//           <div style={{ fontSize: 18, color: COLORS.darkGreen, fontWeight: 700 }}>
//             {form.getFieldValue("id") ? t.edit_product_title : t.new_menu_item}
//           </div>
//         }
//         footer={null}
//         onCancel={onCloseModal}
//         width={800}
//         centered
//         destroyOnClose
//         styles={{
//           mask: { backdropFilter: 'blur(4px)' },
//           content: { borderRadius: 20, padding: 24 }
//         }}
//       >

//         <Form layout="vertical" onFinish={onFinish} form={form}>
//           {/* Hidden ID field to ensure AntD tracks it */}
//           <Form.Item name="id" hidden><Input /></Form.Item>
//           <Row gutter={16}>
//             <Col span={12}>
//               <div className="form-section">
//                 <Form.Item
//                   name={"category_id"}
//                   label={t.category}
//                   rules={[{ required: true, message: t.category_required }]}
//                 >
//                   <Select
//                     options={config.category}
//                     placeholder={t.category_name}
//                     onChange={(value) => {
//                       setState(prev => ({ ...prev, selectedParentId: value }));
//                     }}
//                   />
//                 </Form.Item>

//                 <Form.Item
//                   name={"name"}
//                   label={t.product_name}
//                   rules={[{ required: true, message: t.product_name }]}
//                 >
//                   <Input placeholder={t.product_name} />
//                 </Form.Item>

//                 <Form.Item
//                   noStyle
//                   shouldUpdate={(prev, curr) => prev.category_id !== curr.category_id}
//                 >
//                   {({ getFieldValue }) => (
//                     <CoffeeOptions 
//                       config={config} 
//                       categoryId={getFieldValue("category_id")} 
//                       stateId={state.selectedParentId}
//                       t={t} 
//                     />
//                   )}
//                 </Form.Item>

//                 <Form.Item name={"barcode"} label={t.barcode}>
//                   <Input disabled placeholder={t.barcode} />
//                 </Form.Item>

//                 <Form.Item name={"qty"} label={t.quantity}>
//                   <InputNumber placeholder={t.quantity} style={{ width: "100%" }} />
//                 </Form.Item>

//                 {state.selectedParentId !== 55 && (
//                   <Form.Item name={"discount"} label={t.discount}>
//                     <InputNumber placeholder={t.discount} style={{ width: "100%" }} />
//                   </Form.Item>
//                 )}
//               </div>
//             </Col>

//             <Col span={12}>
//               <div className="form-section">
//                 <Form.Item
//                   label={t.price}
//                   name="price"
//                   rules={[{ required: true, message: t.price_required }]}
//                 >
//                   <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="2.50" />
//                 </Form.Item>

//                 <Form.Item label={t.last_cost || "Cost Price"} name="cost_price">
//                   <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="1.20" />
//                 </Form.Item>

//                 <Form.Item name={"status"} label={t.status}>
//                   <Select
//                     options={[{ label: t.active, value: 1 }, { label: t.inactive, value: 0 }]}
//                     placeholder={t.status}
//                   />
//                 </Form.Item>

//                 <Form.Item name={"description"} label={t.description}>
//                   <Input.TextArea rows={2} placeholder={t.enter_description} />
//                 </Form.Item>

//                 <Form.Item name={"image_default"} label={t.image}>
//                   <Upload
//                     customRequest={(options) => options.onSuccess()}
//                     maxCount={1}
//                     listType="picture-card"
//                     fileList={imageDefault}
//                     onPreview={handlePreview}
//                     onChange={handleChangeImageDefault}
//                   >
//                     <div>+{t.upload}</div>
//                   </Upload>
//                 </Form.Item>
//               </div>
//             </Col>
//           </Row>

//           {previewImage && (
//             <Image
//               wrapperStyle={{ display: "none" }}
//               preview={{
//                 visible: previewOpen,
//                 onVisibleChange: (visible) => setPreviewOpen(visible),
//                 afterOpenChange: (visible) => !visible && setPreviewImage(""),
//               }}
//               src={previewImage}
//             />
//           )}

//           <div style={{ textAlign: "right", marginTop: 30, borderTop: `1px solid ${COLORS.softBorder}`, paddingTop: 20 }}>
//             <Space size="middle">
//               <Button size="large" onClick={onCloseModal} style={{ borderRadius: 10, padding: '0 25px' }}>
//                 {t.cancel}
//               </Button>
//               <Button
//                 type="primary"
//                 size="large"
//                 htmlType="submit"
//                 style={{
//                   background: COLORS.darkGreen,
//                   borderRadius: 10,
//                   padding: '0 35px',
//                   fontWeight: 600,
//                   height: 45
//                 }}
//               >
//                 {form.getFieldValue("id") ? t.update_item : t.save_item}
//               </Button>
//             </Space>
//           </div>
//         </Form>
//       </Modal>

//       <Table
//         dataSource={state.list}
//         scroll={{ x: 'max-content' }}
//         pagination={{
//           pageSize: 10,
//           showSizeChanger: true,
//           style: { paddingRight: 20 }
//         }}
//         rowClassName="modern-row"
//         style={{
//           background: '#fff',
//           borderRadius: '16px',
//           border: `1px solid ${COLORS.softBorder}`,
//           overflow: 'hidden'
//         }}
//         columns={[
//           {
//             key: "image",
//             title: t.image.toUpperCase(),
//             dataIndex: "image",
//             width: 90,
//             render: (value) => (
//               <div
//                 style={{
//                   width: 55,
//                   height: 55,
//                   borderRadius: 15,
//                   overflow: "hidden",
//                   background: "#f0ede6",
//                   border: `1px solid ${COLORS.softBorder}`,
//                 }}
//               >
//                 {value ? (
//                   <Image
//                     src={Config.getFullImagePath(value)}
//                     style={{ width: "100%", height: "100%", objectFit: "cover" }}
//                     preview={{
//                       mask: <div style={{ fontSize: 10 }}>{t.view.toUpperCase()}</div>,
//                     }}
//                   />
//                 ) : (
//                   <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>☕</div>
//                 )}
//               </div>
//             ),
//           },
//           {
//             key: "name",
//             title: t.product_name.toUpperCase(),
//             dataIndex: "name",
//             render: (val, item) => (
//               <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>
//                 {val}
//                 <div style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 400 }}>{item.barcode}</div>
//               </div>
//             )
//           },
//           {
//             key: "category_name",
//             title: t.category.toUpperCase(),
//             dataIndex: "category_name",
//             render: (val) => <Tag color="default" style={{ borderRadius: 6, padding: '2px 10px', fontWeight: 500 }}>{val}</Tag>
//           },
//           {
//             key: "qty",
//             title: t.stock.toUpperCase(),
//             dataIndex: "qty",
//             align: 'center',
//             render: (qty, record) => (
//               <div style={{
//                 color: qty <= (record.min_stock_alert || 5) ? COLORS.redBadge : COLORS.midGreen,
//                 fontWeight: 700,
//                 fontSize: 15
//               }}>
//                 {qty}
//                 {qty <= (record.min_stock_alert || 5) && <div style={{ fontSize: 9, fontWeight: 400 }}>LOW</div>}
//               </div>
//             )
//           },
//           {
//             key: "cost_price",
//             title: (t.last_cost || "Cost").toUpperCase(),
//             dataIndex: "cost_price",
//             align: 'right',
//             render: (val) => <span style={{ color: COLORS.textSecondary }}>${Number(val || 0).toFixed(2)}</span>
//           },
//           {
//             key: "price",
//             title: t.price.toUpperCase(),
//             dataIndex: "price",
//             align: 'right',
//             render: (val) => <span style={{ fontWeight: 800, color: COLORS.darkGreen }}>${Number(val).toFixed(2)}</span>
//           },
//           {
//             key: "discount",
//             title: t.discount.toUpperCase(),
//             dataIndex: "discount",
//             align: 'center',
//             render: (val) => val > 0 ? <Tag color="volcano">-{val}%</Tag> : "-"
//           },
//           {
//             key: "status",
//             title: t.status.toUpperCase(),
//             dataIndex: "status",
//             render: (status) =>
//               status == 1 ? (
//                 <Tag color="success" style={{ borderRadius: 50, padding: '0 12px' }}>{t.active}</Tag>
//               ) : (
//                 <Tag color="error" style={{ borderRadius: 50, padding: '0 12px' }}>{t.off}</Tag>
//               ),
//           },
//           {
//             key: "Action",
//             title: t.action.toUpperCase(),
//             align: "center",
//             width: 150,
//             render: (item, data, index) => (
//               <Space>
//                 <Button
//                   title={t.recipe}
//                   type="text"
//                   style={{ color: "#faad14", background: '#fffbe6', borderRadius: 10 }}
//                   icon={<MdRestaurantMenu size={18} />}
//                   onClick={() => onClickRecipe(item)}
//                 />
//                 <Button
//                   type="text"
//                   style={{ color: "#1890ff", background: '#e6f7ff', borderRadius: 10 }}
//                   icon={<MdEdit size={18} />}
//                   onClick={() => onClickEdit(data, index)}
//                 />
//                 <Button
//                   type="text"
//                   danger
//                   style={{ background: '#fff1f0', borderRadius: 10 }}
//                   icon={<MdDelete size={18} />}
//                   onClick={() => onClickDelete(data, index)}
//                 />
//               </Space>
//             ),
//           },
//           {
//             key: "created_by",
//             title: t.audit.toUpperCase(),
//             render: (text, record) => (
//               <div style={{ fontSize: 11 }}>
//                 <div style={{ fontWeight: 600 }}>{record.created_by_name}</div>
//                 <div style={{ color: COLORS.textSecondary }}>{dayjs(record.created_at).format('DD/MM/YY')}</div>
//               </div>
//             ),
//           },
//         ]}
//       />
//       <RecipeModal
//         open={visibleRecipeModal}
//         onCancel={() => {
//           setVisibleRecipeModal(false);
//           setSelectedProduct(null);
//         }}
//         product={selectedProduct}
//       />
//     </MainPage>
//   );
// }
// export default ProductPage;