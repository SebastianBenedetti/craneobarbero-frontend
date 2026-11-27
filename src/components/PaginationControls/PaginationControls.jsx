// componente de paginado reutilizable, lo usamos en la agenda del barber, el panel del admin y donde haga falta
// recibe los datos de la página actual y funciones para cambiarla
// sizes son los tamaños de página disponibles, por defecto 10/25/50
function visiblePages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((page) => pages.add(page));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((page) => pages.add(page));
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push(null);
    result.push(page);
  });
  return result;
}

function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  total,
  sizes = [10, 25, 50],
}) {
  // si no hay nada para paginar no mostramos nada
  if (total === 0) return null;

  return (
    <div className="pagination-controls">

      {/* selector de cuántos resultados mostrar por página */}
      <div className="pagination-size">
        <span>Mostrar</span>
        {sizes.map((size) => (
          <button
            key={size}
            className={`btn-page-size ${pageSize === size ? "btn-page-size-active" : ""}`}
            onClick={() => onPageSizeChange(size)}
          >
            {size}
          </button>
        ))}
        {/* mostramos cuántos hay en total */}
        <span>por página · {total} {total === 1 ? "resultado" : "resultados"}</span>
      </div>

      {/* navegación entre páginas, anterior los números y siguiente */}
      <div className="pagination-nav">
        <button
          className="btn-page"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ‹
        </button>

        {/* botón por cada página */}
        {visiblePages(currentPage, totalPages).map((page, index) =>
          page === null ? (
            <span key={`gap-${index}`} className="pagination-gap" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={page}
              className={`btn-page ${currentPage === page ? "btn-page-active" : ""}`}
              onClick={() => onPageChange(page)}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          ),
        )}

        <button
          className="btn-page"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          ›
        </button>
      </div>

    </div>
  );
}

export default PaginationControls;
