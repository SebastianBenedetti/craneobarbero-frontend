import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { getCategories, getStockAlerts, getSuppliers } from "../../services/store.services";
import ProductsSection from "./sections/store/ProductsSection";
import CategoriesSection from "./sections/store/CategoriesSection";
import SuppliersSection from "./sections/store/SuppliersSection";
import PurchaseSection from "./sections/store/PurchaseSection";
import MovementsSection from "./sections/store/MovementsSection";
import ValuationSection from "./sections/store/ValuationSection";
import ReorderSection from "./sections/store/ReorderSection";
import OrdersSection from "./sections/store/OrdersSection";
import "../../styles/adminDashboard.css";
import "../../styles/store.css";

const TABS = [
  { id: "orders", label: "Pedidos" },
  { id: "products", label: "Productos" },
  { id: "purchase", label: "Nueva compra" },
  { id: "reorder", label: "Para reponer" },
  { id: "movements", label: "Movimientos" },
  { id: "valuation", label: "Valorización" },
  { id: "categories", label: "Categorías" },
  { id: "suppliers", label: "Proveedores" },
];

function AdminStorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const activeTab = TABS.some((t) => t.id === requested) ? requested : "orders";

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [purchaseDraft, setPurchaseDraft] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    document.title = "Tienda y stock | Panel Admin";
  }, []);

  const loadCategories = useCallback(() => {
    getCategories().then(setCategories).catch((err) => setLoadError(err.message));
  }, []);

  const loadSuppliers = useCallback(() => {
    getSuppliers().then(setSuppliers).catch((err) => setLoadError(err.message));
  }, []);

  const loadAlerts = useCallback(() => {
    getStockAlerts().then(setAlerts).catch(() => setAlerts(null));
  }, []);

  useEffect(() => {
    loadCategories();
    loadSuppliers();
    loadAlerts();
  }, [loadCategories, loadSuppliers, loadAlerts]);

  const selectTab = (id) => setSearchParams(id === "orders" ? {} : { tab: id });

  const startPurchase = (draft) => {
    setPurchaseDraft({ ...draft, id: crypto.randomUUID() });
    selectTab("purchase");
  };

  const renderSection = () => {
    switch (activeTab) {
      case "products":
        return <ProductsSection categories={categories} suppliers={suppliers} onStockChanged={loadAlerts} />;
      case "purchase":
        return (
          <PurchaseSection
            key={purchaseDraft?.id ?? "new"}
            suppliers={suppliers}
            draft={purchaseDraft}
            onSuppliersChanged={loadSuppliers}
            onDone={loadAlerts}
          />
        );
      case "reorder":
        return <ReorderSection onCreatePurchase={startPurchase} />;
      case "movements":
        return <MovementsSection suppliers={suppliers} />;
      case "valuation":
        return <ValuationSection />;
      case "categories":
        return <CategoriesSection categories={categories} onChanged={loadCategories} />;
      case "suppliers":
        return <SuppliersSection suppliers={suppliers} onChanged={loadSuppliers} />;
      default:
        return <OrdersSection onStockChanged={loadAlerts} />;
    }
  };

  return (
    <div className="admin-dashboard page-transition">
      <div className="admin-dashboard-header">
        <h1 className="admin-title">Tienda y stock</h1>
      </div>

      {alerts?.count > 0 && (
        <div className="store-alert" role="status">
          <div>
            <strong>Stock bajo en {alerts.count === 1 ? "1 producto" : `${alerts.count} productos`}:</strong>{" "}
            {alerts.items.slice(0, 5).map((item) => `${item.name} (${item.stock}/${item.minStock})`).join(", ")}
            {alerts.count > 5 && "…"}
          </div>
          {activeTab !== "reorder" && (
            <button className="btn btn-sm btn-warning text-dark" onClick={() => selectTab("reorder")}>Ver para reponer</button>
          )}
        </div>
      )}

      {loadError && <p className="text-danger">{loadError}</p>}

      <div className="admin-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`admin-tab-btn ${activeTab === tab.id ? "admin-tab-btn-active" : ""}`}
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
            {tab.id === "reorder" && alerts?.count > 0 && <span className="store-tab-count">{alerts.count}</span>}
          </button>
        ))}
      </div>

      <div className="admin-tab-content">{renderSection()}</div>
    </div>
  );
}

export default AdminStorePage;
