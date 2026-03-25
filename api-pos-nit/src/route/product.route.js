const authMiddleware = require("../middleware/auth.middleware");
const {
    getList,
    create,
    update,
    remove,
    getBusinessProducts,
    linkToBranch
} = require("../controller/product.controller");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
    app.get("/api/product", authMiddleware("product"), getList);
    app.post("/api/product", authMiddleware("product"), uploadFile.single("upload_image"), create);
    app.put("/api/product", authMiddleware("product"), uploadFile.single("upload_image"), update);
    app.delete("/api/product", authMiddleware("product"), remove);

    // SaaS Branch Inventory Management
    app.get("/api/product/business", authMiddleware("product"), getBusinessProducts);
    app.post("/api/product/link", authMiddleware("product"), linkToBranch);

    // Barcode Generation
    const { generateBarcode, checkBarcode } = require("../controller/product.controller");
    app.post("/api/new_barcode", authMiddleware(), generateBarcode);
    app.post("/api/new%20barcode", authMiddleware(), generateBarcode); // Fallback for space
    app.post("/api/new barcode", authMiddleware(), generateBarcode); // Fallback for space
    app.get("/api/check-barcode/:barcode", authMiddleware(), checkBarcode);

    app.get("/api/check-barcode/:barcode", authMiddleware(), checkBarcode);
};
