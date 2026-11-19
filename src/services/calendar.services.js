const BASE_URL = import.meta.env.VITE_API_URL;

export const downloadAppointmentCalendar = async (appointmentId) => {
  const res = await fetch(`${BASE_URL}/appointments/${appointmentId}/calendar.ics`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("barberia-token")}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "No se pudo generar el archivo del calendario");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(new Blob([blob], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "turno-craneo-barbero.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
