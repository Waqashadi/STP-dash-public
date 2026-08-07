// Next.js uses NEXT_PUBLIC_ prefix to expose environment variables to the browser
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null; // Safeguard for server-side execution
  return localStorage.getItem("stp_token");
}

interface RequestOptions {
  method?: string;
  body?: any;
  auth?: boolean;
}

async function request(
  path: string,
  { method = "GET", body, auth = true }: RequestOptions = {},
) {
  // 1. DYNAMIC HEADERS: Only add Content-Type if it is NOT a file upload FormData payload
  const headers: Record<string, string> = {};
  if (!(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    // 2. DYNAMIC BODY: Keep body raw if it's FormData, otherwise stringify JSON
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // No body response
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("stp_token");
      localStorage.removeItem("stp_user");
      window.location.href = "/login";
    }
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }

  return data;
}

export const api = {
  // --- AUTHENTICATION ---
  login: (email: string, password: string) =>
    request("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  logout: () => request("/auth/logout", { method: "POST" }),

  me: () => request("/auth/me"),

  // --- PRODUCTS (TREATMENTS) ---
  getProducts: () => request("/auth/products", { auth: false }),

  createProduct: (formData: FormData) =>
    request("/auth/products", { method: "POST", body: formData }),

  updateProduct: (id: string | number, formData: FormData) =>
    request(`/auth/products/${id}`, { method: "PUT", body: formData }),

  deleteProduct: (id: string | number) =>
    request(`/auth/products/${id}`, { method: "DELETE" }),

  getCategories: () => request("/auth/categories", { auth: false }),

  // Accept the FormData directly from your form submission loop
  createCategory: (formData: FormData) =>
    request("/auth/categories", { method: "POST", body: formData }),

  updateCategory: (id: string | number, formData: FormData) =>
    request(`/auth/categories/${id}`, { method: "PUT", body: formData }),

  deleteCategory: (id: string | number, force: boolean = false) =>
    request(`/auth/categories/${id}${force ? "?force=true" : ""}`, {
      method: "DELETE",
    }),

  // --- SUBCATEGORIES ---
  getSubcategories: () => request("/auth/subcategories", { auth: false }),

  // Accepts the Multipart Form Package (FormData) containing the image binary
  createSubcategory: (formData: FormData) => 
    request("/auth/subcategories", { method: "POST", body: formData }),

  // Accepts the ID and the Multipart Form Package (FormData)
  updateSubcategory: (id: string | number, formData: FormData) => 
    request(`/auth/subcategories/${id}`, { method: "PUT", body: formData }),

  deleteSubcategory: (id: string | number) =>
    request(`/auth/subcategories/${id}`, { method: "DELETE" }),
};

export { getToken };