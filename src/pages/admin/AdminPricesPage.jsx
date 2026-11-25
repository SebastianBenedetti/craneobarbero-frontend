import { useCallback, useEffect, useState } from "react";
import PriceAdjustmentForm from "./sections/prices/PriceAdjustmentForm";
import PriceAdjustmentsHistory from "./sections/prices/PriceAdjustmentsHistory";
import { getPriceAdjustments } from "../../services/prices.services";
import Toast from "../../components/Toast/Toast";
import "../../styles/adminDashboard.css";
import "../../styles/prices.css";

function AdminPricesPage() {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showError = useCallback((message) => setToast({ message, type: "danger" }), []);

  const loadAdjustments = useCallback(() => {
    getPriceAdjustments()
      .then(setAdjustments)
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => {
    document.title = " Precios | Panel Admin";
    loadAdjustments();
  }, [loadAdjustments]);

  return (
    <div className="admin-dashboard page-transition">
      <div className="admin-dashboard-header">
        <h1 className="admin-title">Precios</h1>
        <p className="admin-subtitle">Actualizá los precios de venta por inflación, con vista previa antes de aplicar</p>
      </div>

      <PriceAdjustmentForm
        onApplied={(adjustment) => {
          setToast({ message: `Se actualizaron ${adjustment.itemsCount} precios.`, type: "success" });
          loadAdjustments();
        }}
        onError={showError}
      />

      <PriceAdjustmentsHistory
        adjustments={adjustments}
        loading={loading}
        onReverted={(result) => {
          setToast({ message: `Ajuste revertido: ${result.restored} precios restaurados.`, type: "success" });
          loadAdjustments();
        }}
        onError={showError}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminPricesPage;
