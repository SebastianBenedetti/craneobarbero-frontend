const BASE_URL = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 100;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("barberia-token")}`,
});

export const fetchAllPages = async (path, fallbackError) => {
  const separator = path.includes("?") ? "&" : "?";
  const items = [];
  let page = 1;
  let total = Infinity;

  while (items.length < total) {
    const res = await fetch(`${BASE_URL}${path}${separator}page=${page}&pageSize=${PAGE_SIZE}`, {
      headers: authHeaders(),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || fallbackError);
    }
    if (Array.isArray(data)) {
      return data;
    }
    const pageItems = data?.items ?? [];
    items.push(...pageItems);
    total = data?.total ?? items.length;
    if (pageItems.length === 0) break;
    page += 1;
  }

  return items;
};
