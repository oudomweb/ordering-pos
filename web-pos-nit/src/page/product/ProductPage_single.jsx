import React, { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Col,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Upload,
  Tooltip,
} from "antd";
import { request, compressImage } from "../../util/helper";
import { MdAdd, MdDelete, MdEdit, MdRestaurantMenu } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import { Config } from "../../util/config";
import { useProfileStore } from "../../store/profileStore";
import "./Product.css"
import RecipeModal from "./RecipeModal";
import { useLanguage, translations } from "../../store/language.store";

// ─── Color Palette (Matches POS) ─────────────────────────────────────────────
const COLORS = {
  bg: "#f4f1eb",
  darkGreen: "#1e4a2d",
  midGreen: "#2d6a42",
  accentGreen: "#3a7d52",
  white: "#ffffff",
  textPrimary: "#1a2e1a",
  textSecondary: "#6b7c6b",
  softBorder: "#e8e3d8",
  redBadge: "#e85d5d",
};

// ─── Sub-component for dynamic Coffee fields ────────────────────────────────
const CoffeeOptions = ({ config, categoryId, stateId, t }) => {
  const isCoffee = React.useMemo(() => {
    const cid = categoryId || stateId;
    if (!cid) return false;
    
    const strId = String(cid);
    // Explicit list of Coffee IDs in your system
    if (strId === "15" || strId === "51" || strId === "1") return true;

    // Fallback: Check label or name matches
    const cat = (config.category || []).find(c => String(c.value) === strId);
    const label = (cat?.label || cat?.name || "").trim().toLowerCase();
    return label.includes("coffee") || label.includes("កាហ្វេ") || label.includes("cafe");
  }, [categoryId, stateId, config.category]);

  if (!isCoffee) return null;

  return (
    <div style={{ 
      background: "#f0f7f2", 
      padding: "24px", 
      borderRadius: "16px", 
      marginBottom: "20px", 
      border: "1px solid #d9e6dc",
      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
    }}>
      <div style={{ 
        fontWeight: 800, 
        marginBottom: 20, 
        color: COLORS.darkGreen, 
        fontSize: 17, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 10,
        borderBottom: `2px solid #d9e6dc`,
        paddingBottom: 10
      }}>
        <MdRestaurantMenu style={{ fontSize: 20 }} /> 
        {t.customize_coffee}
      </div>

      <Form.Item name="moods" label={false} initialValue={['hot', 'iced']}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 12, color: COLORS.textPrimary, fontSize: 14 }}>
            🔥❄️ {t.mood}
          </div>
          <Checkbox.Group 
            options={[
              { label: t.hot, value: 'hot' },
              { label: t.iced, value: 'iced' },
              { label: t.frappe, value: 'frappe' }
            ]} 
          />
        </div>
      </Form.Item>

      <div style={{ margin: '20px 0', borderTop: '1px dashed #d9e6dc' }} />
      <Form.List name="sizes" initialValue={[]}>
        {(fields, { add, remove }) => (
          <>
            <div style={{ fontWeight: 800, marginBottom: 4, color: COLORS.darkGreen, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>☕</span> {t.sizes}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 12, fontStyle: 'italic' }}>
              {t.sizes_override_msg}
            </div>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: "flex", marginBottom: 12 }} align="start">
                <Form.Item 
                  {...restField} 
                  name={[name, 'label']} 
                  rules={[{ required: true, message: 'Required' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Select 
                    style={{ width: 130 }} 
                    placeholder="Size" 
                    options={[
                      { label: "Small (S)", value: "S" }, 
                      { label: "Medium (M)", value: "M" }, 
                      { label: "Large (L)", value: "L" }
                    ]} 
                  />
                </Form.Item>
                <Form.Item 
                  {...restField} 
                  name={[name, 'price']} 
                  rules={[{ required: true, message: 'Required' }]}
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber 
                    placeholder="Price" 
                    style={{ width: 100 }} 
                    min={0} 
                    step={0.1}
                    precision={2}
                  />
                </Form.Item>
                <Button 
                  danger 
                  type="text" 
                  onClick={() => remove(name)} 
                  icon={<MdDelete style={{ fontSize: 18 }} />} 
                />
              </Space>
            ))}
            <Button 
              type="dashed" 
              onClick={() => add()} 
              icon={<MdAdd />} 
              block 
              style={{ 
                marginBottom: 20, 
                borderRadius: 10, 
                height: 40, 
                borderColor: COLORS.midGreen, 
                color: COLORS.midGreen 
              }}
            >
              {t.add_size}
            </Button>
          </>
        )}
      </Form.List>

      <Form.List name="addons" initialValue={[]}>
        {(fields, { add, remove }) => (
          <>
            <div style={{ fontWeight: 800, marginBottom: 12, color: COLORS.darkGreen, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>➕</span> {t.addons}
            </div>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: "flex", marginBottom: 12 }} align="start">
                <Form.Item 
                  {...restField} 
                  name={[name, 'label']} 
                  rules={[{ required: true, message: 'Required' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Select 
                    style={{ width: 130 }} 
                    placeholder="Add-on" 
                    options={[
                      { label: "Extra Shot", value: "Extra Shot" }, 
                      { label: "Milk Foam", value: "Milk Foam" },
                      { label: "Honey", value: "Honey" },
                      { label: "Pearl", value: "Pearl" }
                    ]} 
                  />
                </Form.Item>
                <Form.Item 
                  {...restField} 
                  name={[name, 'price']} 
                  rules={[{ required: true, message: 'Required' }]}
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber 
                    placeholder="Price" 
                    style={{ width: 100 }} 
                    min={0} 
                    step={0.1}
                    precision={2}
                  />
                </Form.Item>
                <Button 
                  danger 
                  type="text" 
                  onClick={() => remove(name)} 
                  icon={<MdDelete style={{ fontSize: 18 }} />} 
                />
              </Space>
            ))}
            <Button 
              type="dashed" 
              onClick={() => add()} 
              icon={<MdAdd />} 
              block
              style={{ 
                borderRadius: 10, 
                height: 40, 
                borderColor: COLORS.midGreen, 
                color: COLORS.midGreen 
              }}
            >
              {t.add_addon}
            </Button>
          </>
        )}
      </Form.List>
    </div>
  );
};

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

function ProductPage() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const { config } = configStore();
  const [form] = Form.useForm();
  const [state, setState] = useState({
    list: [],
    visibleModal: false,
  });
  const [filter, setFilter] = useState({
    txt_search: "",
    category_id: "",
    brand: "",
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [imageDefault, setImageDefault] = useState([]);
  const [imageOptional, setImageOptional] = useState([]);
  const [visibleRecipeModal, setVisibleRecipeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = useProfileStore(s => s.profile?.id || s.profile?.user_id);
  useEffect(() => {
    if (userId) getList();
  }, [userId]);
  const refPage = React.useRef(1);

  const getList = async () => {
    var param = {
      ...filter,
      page: 1, // Force first page
      is_list_all: 1, // Ensure fetching all
    };

    setState((pre) => ({ ...pre, loading: true }));
    const res = await request(`product`, "get", param);
    if (res && !res.error) {
      const totals = res.list.reduce((acc, item) => {
        if (!acc[item.category_name]) {
          acc[item.category_name] = 0;
        }
        acc[item.category_name] += item.qty;
        return acc;
      }, {});

      setState((pre) => ({
        ...pre,
        list: res.list,
        total: refPage.current == 1 ? res.total : pre.total,
        loading: false,
        totals,
      }));
    }
  };
  const onCloseModal = () => {
    setState((p) => ({
      ...p,
      visibleModal: false,
    }));
    setImageDefault([]);
    form.resetFields();
    // Reset coffee specific fields explicitly if needed
    form.setFieldsValue({ moods: ['hot', 'iced'], sizes: [], addons: [] });
  };
  const onFinish = async (items) => {
    var params = new FormData();
    params.append("name", items.name);
    params.append("category_id", items.category_id);
    params.append("barcode", items.barcode);
    params.append("brand", items.brand);
    params.append("description", items.description);
    params.append("qty", items.qty);
    params.append("price", items.price);
    params.append("discount", items.discount);
    params.append("status", items.status);
    params.append("image", form.getFieldValue("image"));
    params.append("id", form.getFieldValue("id"));
    params.append("sizes", JSON.stringify(items.sizes || []));
    params.append("addons", JSON.stringify(items.addons || []));
    params.append("moods", JSON.stringify(items.moods || []));


    if (items.image_default && items.image_default.file) {
      if (items.image_default.file.status === "removed") {
        params.append("image_remove", "1");
      } else {
        const file = items.image_default.file.originFileObj;
        if (file) {
          // 🚀 Compress image before upload to solve 10s delay
          const compressedFile = await compressImage(file);
          params.append("upload_image", compressedFile, file.name || "image.jpg");
        }
      }
    }
    var method = "post";
    if (form.getFieldValue("id")) {
      method = "put";
    }
    setIsSubmitting(true);
    const res = await request("product", method, params);
    setIsSubmitting(false);
    if (res && !res.error) {
      message.success(t.product_saved);
      onCloseModal();
      getList();
    } else {
      res.error?.barcode && message.error(res.error?.barcode);
    }
  };
  const onBtnNew = async () => {
    try {
      // 🚀 Optimized: Single request to get a checked/unique barcode
      const res = await request("new_barcode", "post");
      if (res && res.barcode) {
        form.setFieldValue("barcode", res.barcode);
      }
    } catch (err) {
      console.error("Barcode generation failed:", err);
    } finally {
      setState((p) => ({
        ...p,
        visibleModal: true,
      }));
    }
  };
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };
  const handleChangeImageDefault = ({ fileList: newFileList }) =>
    setImageDefault(newFileList);
  const handleChangeImageOptional = ({ fileList: newFileList }) =>
    setImageOptional(newFileList);
  const onFilter = () => {
    getList();
  };

  const SAMPLE_SIZES = [
    { label: "Small (S)", value: "S" },
    { label: "Medium (M)", value: "M" },
    { label: "Large (L)", value: "L" },
  ];

  const SAMPLE_ADDONS = [
    { label: "Milk Foam", value: "Milk Foam" },
    { label: "Whipped Cream", value: "Whipped Cream" },
    { label: "Chocolate Syrup", value: "Chocolate Syrup" },
    { label: "Extra Shot", value: "Extra Shot" },
  ];


  const onClickEdit = (item, index) => {
    // Parse strings from DB back to objects/arrays for the form
    const sizes = item.sizes ? (typeof item.sizes === 'string' ? JSON.parse(item.sizes) : item.sizes) : [];
    const addons = item.addons ? (typeof item.addons === 'string' ? JSON.parse(item.addons) : item.addons) : [];
    const moods = item.moods ? (typeof item.moods === 'string' ? JSON.parse(item.moods) : item.moods) : ['hot', 'iced'];

    form.setFieldsValue({
      ...item,
      sizes,
      addons,
      moods,
    });
    setState((pre) => ({ ...pre, visibleModal: true, selectedParentId: item.category_id }));
    if (item.image != "" && item.image != null) {
      const imageProduct = [
        {
          uid: "-1",
          name: item.image,
          status: "done",
          url: Config.getFullImagePath(item.image),

        },
      ];
      setImageDefault(imageProduct);
    }
  };
  const onClickDelete = (item, index) => {
    Modal.confirm({
      title: t.remove_data,
      content: t.confirm_remove_product,
      okText: t.delete,
      okType: "danger",
      onOk: async () => {
        const res = await request("product", "delete", item);
        if (res && !res.error) {
          message.success(t.product_deleted);
          getList();
        }
      },
    });
  };

  const onClickRecipe = (item) => {
    setSelectedProduct(item);
    setVisibleRecipeModal(true);
  };

  return (
    <MainPage loading={state.loading}>
      <div className="pageHeader">

        <Space>
          <div>{t.products} {state.list.length}</div>
          <Input.Search
            onChange={(event) =>
              setFilter((p) => ({ ...p, txt_search: event.target.value }))
            }
            allowClear
            placeholder={t.search}
            onSearch={onFilter}
          />
          <Select
            allowClear
            style={{ width: 130 }}
            placeholder={t.category}
            options={config.category}
            onChange={(id) => {
              setFilter((pre) => ({ ...pre, category_id: id }));
            }}
          />
          <Select
            allowClear
            style={{ width: 130 }}
            placeholder={t.brand}
            options={config.brand}
            onChange={(id) => {
              setFilter((pre) => ({ ...pre, brand: id }));
            }}
          />
          <Button onClick={onFilter} type="primary">
            {t.filter}
          </Button>
        </Space>
        <Button type="primary" onClick={onBtnNew}>
          {t.add_new}
        </Button>
      </div>
      <Modal
        open={state.visibleModal}
        title={
          <div style={{ fontSize: 18, color: COLORS.darkGreen, fontWeight: 700 }}>
            {form.getFieldValue("id") ? t.edit_product : t.add_new_product}
          </div>
        }
        footer={null}
        onCancel={onCloseModal}
        width={800}
        centered
        destroyOnClose
        styles={{
          mask: { backdropFilter: 'blur(4px)' },
          content: { borderRadius: 20, padding: 24 }
        }}
      >
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <Form.Item name="id" hidden><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <div className="form-section">
                <Form.Item
                  name={"category_id"}
                  label={t.category}
                  rules={[{ required: true, message: t.category_required }]}
                >
                  <Select
                    options={config.category}
                    placeholder={t.category_name}
                    onChange={(value) => {
                      setState(prev => ({ ...prev, selectedParentId: value }));
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name={"name"}
                  label={t.product_name}
                  rules={[{ required: true, message: t.product_name }]}
                >
                  <Input placeholder={t.product_name} />
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prev, curr) => prev.category_id !== curr.category_id}
                >
                  {({ getFieldValue }) => (
                    <CoffeeOptions 
                      config={config} 
                      categoryId={getFieldValue("category_id")} 
                      stateId={state.selectedParentId}
                      t={t} 
                    />
                  )}
                </Form.Item>

                <Form.Item name={"barcode"} label={t.barcode}>
                  <Input disabled placeholder={t.barcode} />
                </Form.Item>

                <Form.Item name={"qty"} label={t.quantity}>
                  <InputNumber placeholder={t.quantity} style={{ width: "100%" }} />
                </Form.Item>

                {state.selectedParentId !== 55 && (
                  <Form.Item name={"discount"} label={t.discount}>
                    <InputNumber placeholder={t.discount} style={{ width: "100%" }} />
                  </Form.Item>
                )}
              </div>
            </Col>

            <Col span={12}>
              <div className="form-section">
                <Form.Item
                  label={`${t.price || "Price"} (${t.base_price_label})`}
                  name="price"
                  rules={[{ required: true, message: t.price_required }]}
                  tooltip={t.price_tooltip || "តម្លៃទូទៅ ឬតម្លៃទាបបំផុតប្រសិនបើមានច្រើនទំហំ (General / Fallback Price)"}
                >
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="2.50" />
                </Form.Item>

                <Form.Item label={t.status} name="status">
                  <Select
                    options={[{ label: t.active, value: 1 }, { label: t.inactive, value: 0 }]}
                    placeholder={t.status}
                  />
                </Form.Item>

                <Form.Item name={"description"} label={t.description}>
                  <Input.TextArea rows={2} placeholder={t.enter_description} />
                </Form.Item>

                <Form.Item name={"image_default"} label={t.image}>
                  <Upload
                    customRequest={(options) => options.onSuccess()}
                    maxCount={1}
                    listType="picture-card"
                    fileList={imageDefault}
                    onPreview={handlePreview}
                    onChange={handleChangeImageDefault}
                  >
                    <div>+{t.upload}</div>
                  </Upload>
                </Form.Item>
              </div>
            </Col>
          </Row>

          <div style={{ textAlign: "right", marginTop: 30, borderTop: `1px solid ${COLORS.softBorder}`, paddingTop: 20 }}>
            <Space size="middle">
              <Button size="large" onClick={onCloseModal} style={{ borderRadius: 10, padding: '0 25px' }}>
                {t.cancel}
              </Button>
              <Button 
                type="primary" 
                size="large" 
                htmlType="submit" 
                loading={isSubmitting}
                style={{
                  background: COLORS.darkGreen,
                  borderRadius: 10,
                  padding: '0 35px',
                  fontWeight: 600,
                  height: 45
                }}
              >
                {form.getFieldValue("id") ? t.update_item : t.save_item}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Table
        dataSource={state.list}
        columns={[
          {
            key: "name",
            title: t.product_name,
            dataIndex: "name",
          },
          {
            key: "barcode",
            title: t.barcode,
            dataIndex: "barcode",
          },
          {
            key: "description",
            title: t.description,
            dataIndex: "description",
          },
          {
            key: "category_name",
            title: t.category,
            dataIndex: "category_name",
          },
          {
            key: "brand",
            title: t.brand,
            dataIndex: "brand",
          },
          {
            key: "qty",
            title: t.quantity,
            dataIndex: "qty",
          },
          {
            key: "price",
            title: t.price,
            dataIndex: "price",
          },
          {
            key: "discount",
            title: t.discount,
            dataIndex: "discount",
          },

          {
            key: "status",
            title: t.status,
            dataIndex: "status",
            render: (status) =>
              status == 1 ? (
                <Tag color="green">{t.active}</Tag>
              ) : (
                <Tag color="red">{t.inactive}</Tag>
              ),
          },
          {
            key: "image",
            title: t.image,
            dataIndex: "image",
            render: (value) => (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid #e0e0e0",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.3s, box-shadow 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
                }}
              >
                {value ? (
                  <Image
                    src={Config.optimizeCloudinary(Config.getFullImagePath(value), "w_120,c_fill,f_auto,q_auto")}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    preview={{
                      mask: (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            color: "#fff",
                            fontSize: 16,
                          }}
                        >
                          {t.view_details}
                        </div>
                      ),
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#EEE",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontSize: 10,
                      color: "#999",
                      textAlign: "center",
                      padding: 2
                    }}
                  >
                    {t.no_data}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "Action",
            title: t.action,
            align: "center",
            render: (item, data, index) => (
              <Space>
                <Button
                  title={t.recipe || "Recipe"}
                  style={{ borderColor: "#faad14", color: "#faad14" }}
                  icon={<MdRestaurantMenu />}
                  onClick={() => onClickRecipe(item)}
                />
                <Button
                  type="primary"
                  icon={<MdEdit />}
                  onClick={() => onClickEdit(data, index)}
                />
                <Button
                  type="primary"
                  danger
                  icon={<MdDelete />}
                  onClick={() => onClickDelete(data, index)}
                />
              </Space>
            ),
          },
          {
            key: "created_by",
            title: t.staff,
            render: (text, record) => (
              <div>
                <strong>{record.created_by_name}</strong>
                {record.created_by_username && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    @{record.created_by_username}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
      <RecipeModal
        open={visibleRecipeModal}
        onCancel={() => {
          setVisibleRecipeModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
    </MainPage>
  );
}
export default ProductPage;