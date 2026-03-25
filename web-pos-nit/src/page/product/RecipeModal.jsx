import React, { useEffect, useState } from "react";
import { Button, Form, InputNumber, message, Modal, Select, Space, Table } from "antd";
import { request } from "../../util/helper";
import { MdDelete, MdAdd } from "react-icons/md";

function RecipeModal({ open, onCancel, product }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [ingredients, setIngredients] = useState([]);

    useEffect(() => {
        if (open && product) {
            fetchRawMaterials();
            fetchRecipe(product.id);
        }
    }, [open, product]);

    const fetchRawMaterials = async () => {
        const res = await request("raw_material", "get", { status: 1 }); // Active only
        if (res && !res.error) {
            setRawMaterials(res.list.map(item => ({
                label: `${item.name} (${item.unit})`,
                value: item.id,
                unit: item.unit,
                price: item.price
            })));
        }
    };

    const fetchRecipe = async (productId) => {
        setLoading(true);
        const res = await request("recipe", "get", { product_id: productId });
        if (res && !res.error) {
            setIngredients(res.list || []);
            form.setFieldsValue({
                ingredients: res.list.map(item => ({
                    raw_material_id: item.raw_material_id,
                    qty: item.qty,
                    unit: item.unit
                }))
            });
        }
        setLoading(false);
    };

    const onFinish = async (values) => {
        if (!product) return;

        setLoading(true);
        const cleanIngredients = values.ingredients.map(ing => {
            const material = rawMaterials.find(rm => rm.value === ing.raw_material_id);
            return {
                raw_material_id: ing.raw_material_id,
                qty: ing.qty,
                unit: material ? material.unit : ing.unit // Ensure unit is correct
            };
        });

        const res = await request("recipe", "post", {
            product_id: product.id,
            ingredients: cleanIngredients
        });

        if (res && !res.error) {
            message.success("Recipe saved successfully!");
            onCancel();
        } else {
            message.error(res.error || "Failed to save recipe");
        }
        setLoading(false);
    };

    const calculateSummary = () => {
        const currentIngredients = form.getFieldValue("ingredients") || [];
        let totalCost = 0;
        currentIngredients.forEach(ing => {
            if (!ing) return;
            const material = rawMaterials.find(rm => rm.value === ing.raw_material_id);
            if (material) {
                totalCost += (Number(ing.qty) || 0) * (Number(material.price) || 0);
            }
        });

        const sellingPrice = Number(product?.price) || 0;
        const profit = sellingPrice - totalCost;
        const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

        return {
            totalCost: totalCost.toFixed(2),
            profit: profit.toFixed(2),
            margin: margin.toFixed(1)
        };
    };

    const summary = calculateSummary();

    return (
        <Modal
            title={<b>☕ Recipe Configuration - {product?.name}</b>}
            open={open}
            onCancel={onCancel}
            width={720}
            footer={null}
            centered
            destroyOnClose
        >
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                background: "linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%)",
                padding: "16px",
                borderRadius: "12px",
                marginBottom: "20px",
                border: "1px solid #dee2e6"
            }}>
                <div>
                    <div style={{ fontSize: 12, color: "#6c757d", textTransform: "uppercase" }}>Est. Cost Per Cup</div>
                    <div style={{ fontSize: 20, fontWeight: "bold", color: "#333" }}>${summary.totalCost}</div>
                </div>
                <div>
                    <div style={{ fontSize: 12, color: "#6c757d", textTransform: "uppercase" }}>Selling Price</div>
                    <div style={{ fontSize: 20, fontWeight: "bold", color: "#333" }}>${Number(product?.price || 0).toFixed(2)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#6c757d", textTransform: "uppercase" }}>Gross Profit</div>
                    <div style={{ fontSize: 20, fontWeight: "bold", color: "#2ecc71" }}>
                        ${summary.profit} <span style={{ fontSize: 14, fontWeight: "normal" }}>({summary.margin}%)</span>
                    </div>
                </div>
            </div>

            <Form form={form} layout="vertical" onFinish={onFinish}>
                <div style={{ maxHeight: "400px", overflowY: "auto", overflowX: "hidden", paddingRight: 8 }}>
                    <Form.List name="ingredients">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 8, padding: "12px", marginBottom: 12, position: "relative" }}>
                                        <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
                                            <div style={{ flex: 1 }}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "raw_material_id"]}
                                                    label="Select Ingredient"
                                                    rules={[{ required: true, message: "Required" }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Select
                                                        placeholder="Search Ingredient..."
                                                        options={rawMaterials}
                                                        showSearch
                                                        onChange={() => form.setFieldsValue({})}
                                                    />
                                                </Form.Item>
                                            </div>
                                            <div style={{ width: 120 }}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "qty"]}
                                                    label="Usage Qty"
                                                    rules={[{ required: true, message: "Required" }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <InputNumber
                                                        min={0.01}
                                                        style={{ width: "100%" }}
                                                        placeholder="0.00"
                                                        onChange={() => form.setFieldsValue({})}
                                                    />
                                                </Form.Item>
                                            </div>
                                            <div style={{ width: 60, paddingBottom: 6 }}>
                                                <Form.Item
                                                    shouldUpdate={(prev, curr) => prev.ingredients?.[name]?.raw_material_id !== curr.ingredients?.[name]?.raw_material_id}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    {() => {
                                                        const id = form.getFieldValue(["ingredients", name, "raw_material_id"]);
                                                        const material = rawMaterials.find(rm => rm.value === id);
                                                        return <Tag bordered={false}>{material?.unit || '-'}</Tag>
                                                    }}
                                                </Form.Item>
                                            </div>
                                            <Button
                                                danger
                                                type="text"
                                                icon={<MdDelete size={20} />}
                                                onClick={() => { remove(name); form.setFieldsValue({}); }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<MdAdd />}
                                    style={{ height: 45, borderRadius: 8 }}
                                >
                                    Add New Ingredient Link
                                </Button>
                            </>
                        )}
                    </Form.List>
                </div>

                <div style={{ textAlign: "right", marginTop: 24, borderTop: "1px solid #eee", paddingTop: 20 }}>
                    <Space size="middle">
                        <Button size="large" onClick={onCancel}>Close</Button>
                        <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ paddingLeft: 40, paddingRight: 40 }}>
                            Sync Recipe
                        </Button>
                    </Space>
                </div>
            </Form>
        </Modal>
    );
}

export default RecipeModal;
