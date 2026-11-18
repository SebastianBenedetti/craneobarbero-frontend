import { Card, Button } from "react-bootstrap";
import "../../styles/appointment.css";
//funcion de calculo de años de experiencia
function calcYearsOfExperience(startDate) {
  if (!startDate) return null;
  return Math.floor(
    (new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24 * 365.25),
  );
}

function BarberCard({ isSelected, barber, onClick }) {
  const years = calcYearsOfExperience(barber.startDate);

  return (
    <Card
      className={`bg-black shadow-lg rounded-4 ${isSelected ? "border-warning border-4" : "border-0"}`}
      style={
        isSelected
          ? {
              boxShadow: "0 0 15px rgba(255, 193, 7, 0.8)",
              transform: "scale(1.05)",
            }
          : {}
      }
    >
      <Card.Img
        style={{
          width: "100%",
          height: 150,
          objectFit: "cover",
          objectPosition: "top",
        }}
        variant="top"
        src={barber.imageUrl}
      />
      <Card.Body className="card-body-custom">
        <Card.Title className="text-warning">{barber.name}</Card.Title>
        {years !== null && <p>Años de experiencia: {years}</p>}
        <p>Telefono: {barber.phone}</p>
        <Button variant="warning" className="w-100" onClick={onClick}>
          Seleccionar barbero
        </Button>
      </Card.Body>
    </Card>
  );
}

export default BarberCard;
