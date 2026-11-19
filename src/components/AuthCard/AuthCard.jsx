function AuthCard({ title, children }) {
  return (
    <div
      className="d-flex justify-content-center align-items-center page-transition"
      style={{ minHeight: "80vh", padding: "100px 16px 40px" }}
    >
      <div className="card bg-dark border-warning p-4" style={{ width: "100%", maxWidth: "440px" }}>
        <h4 className="text-warning text-center mb-4">{title}</h4>
        {children}
      </div>
    </div>
  );
}

export default AuthCard;
