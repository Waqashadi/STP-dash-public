"use client";

import { useMemo, useState, Dispatch, SetStateAction, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, X, BadgeCheck, AlertTriangle, Loader2 } from "lucide-react";
import { api } from "@/api/client";

export interface Product {
  id: string | number;
  name: string;
  category_id: string | number;
  category?: string;
  subcategory_id?: string | number | null;
  subcategory?: string;
  country: string;
  price: string | number;
  duration: string;
  status: "Active" | "Draft";
  description?: string;
  image?: string;
}

interface Category {
  id: string | number;
  name: string;
}

// 🚀 Added Subcategory interface
export interface Subcategory {
  id: string | number;
  category_id: string | number;
  name: string;
}

interface ProductsProps {
  products: Product[];
  setProducts: Dispatch<SetStateAction<Product[]>>;
  categories: Category[];
  subcategories?: Subcategory[]; // 🚀 Passed dynamically from parent page
  loading: boolean;
  error: string | null;
  showToast: (message: string) => void;
}

const COUNTRIES = [
  { code: "IN", name: "India" }, { code: "TR", name: "Türkiye" }, { code: "KR", name: "South Korea" },
  { code: "RO", name: "Romania" }, { code: "AE", name: "UAE" }, { code: "UK", name: "UK" },
  { code: "QA", name: "Qatar" }, { code: "DE", name: "Germany" }, { code: "JP", name: "Japan" },
  { code: "TH", name: "Thailand" }, { code: "SG", name: "Singapore" }, { code: "MY", name: "Malaysia" },
];

export default function Products({ 
  products, 
  setProducts, 
  categories = [], 
  subcategories = [], // Defaults to empty array if not supplied
  loading, 
  error, 
  showToast 
}: ProductsProps) {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  
  console.log("subcategoriessssss", subcategories);

  // State elements
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | number>("");
  const [subcategoryId, setSubcategoryId] = useState<string | number>(""); // 🚀 Subcategory state
  const [country, setCountry] = useState(COUNTRIES[0].code);
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState<"Active" | "Draft">("Active");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Set default category when categories load
  // useEffect(() => {
  //   if (categories.length > 0 && !categoryId) {
  //     setCategoryId(categories[0].id);
  //   }
  // }, [categories]);

  // 🚀 Filter subcategories that belong to the currently selected Category ID
  const filteredSubcategories = useMemo(() => {
    if (!categoryId) return [];
    return subcategories.filter(sub => String(sub.category_id) === String(categoryId));
  }, [subcategories, categoryId]);

  // Reset selected subcategory if it's no longer valid for the updated Category ID selection
  useEffect(() => {
    if (subcategoryId) {
      const isValid = filteredSubcategories.some(sub => String(sub.id) === String(subcategoryId));
      if (!isValid) {
        setSubcategoryId("");
      }
    }
  }, [categoryId, filteredSubcategories, subcategoryId]);

  function openAdd() {
    setEditingId(null);
    setName("");
    setCategoryId(categories[0]?.id || "");
    setSubcategoryId(""); // Reset
    setCountry(COUNTRIES[0].code);
    setPrice("");
    setDuration("");
    setStatus("Active");
    setDescription("");
    setImageFile(null);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setName(p.name);
    setCategoryId(p.category_id);
    setSubcategoryId(p.subcategory_id ? String(p.subcategory_id) : ""); // Set current subcategory if exists
    setCountry(p.country);
    setPrice(String(p.price));
    setDuration(p.duration);
    setStatus(p.status);
    setDescription(p.description || "");
    setImageFile(null);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setFormError("Give the treatment a name.");
    if (!categoryId) return setFormError("Select a treatment category.");
    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) return setFormError("Enter a valid price.");

    setSaving(true);
    setFormError("");

    // Create dynamic multipart form package
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("category_id", String(categoryId));
    // 🚀 Appending subcategory_id field (handles empty selection safely)
    formData.append("subcategory_id", subcategoryId ? String(subcategoryId) : "");
    formData.append("country", country);
    formData.append("price", String(priceNum));
    formData.append("duration", duration.trim());
    formData.append("status", status);
    formData.append("description", description.trim());
    if (imageFile) {
      formData.append("imageFile", imageFile);
    }

    try {
      if (editingId) {
        const res = await api.updateProduct(editingId, formData);
        setProducts((prev) => prev.map((p) => (p.id === editingId ? res.product : p)));
        showToast("Treatment updated");
      } else {
        const res = await api.createProduct(formData);
        setProducts((prev) => [res.product, ...prev]);
        showToast("Treatment added");
      }
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.deleteProduct(pendingDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      showToast("Treatment deleted");
      setPendingDelete(null);
    } catch (err: any) {
      showToast(err.message || "Could not delete.");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(search.toLowerCase())) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(search.toLowerCase())); // Includes subcategory search
      const matchesCountry = countryFilter === "all" || p.country === countryFilter;
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesCountry && matchesStatus;
    });
  }, [products, search, countryFilter, statusFilter]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 className="display" style={{ fontSize: 26, fontWeight: 700, color: "var(--teal)", margin: "0 0 4px" }}>
            Treatment Catalog
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: 0 }}>
            Add, edit and remove the packages your website shows to patients.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add treatment
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="toolbar">
        <div className="search-wrap">
          <Search size={16} />
          <input className="input" placeholder="Search by name, category or subcategory…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}>
          <option value="all">All countries</option>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      <div className="table-card">
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "60px 0", color: "var(--ink-soft)" }}>
            <Loader2 size={16} className="spin" /> Loading catalog…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ink-soft)" }}>
            {products.length === 0 ? "No treatments yet. Add your first one." : "Nothing matches your filters."}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Image</th><th>Treatment</th><th>Destination</th><th>Category & Sub</th><th>Price</th><th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const country = COUNTRIES.find((c) => c.code === p.country);
                return (
                  <tr key={p.id}>
                    <td style={{ verticalAlign: "middle" }}>
                      <img
                        src={p.image ? `http://localhost:5000/uploads/${p.image}` : "/images/placeholder.png"}
                        alt={p.name}
                        style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{p.duration}</div>
                    </td>
                    <td>
                      <span className="country-badge">
                        <span className="country-circle">{p.country}</span>
                        <span style={{ fontSize: 14, color: "var(--ink-soft)" }}>{country ? country.name : p.country}</span>
                      </span>
                    </td>
                    {/* Category & Subcategory Cell representation */}
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.category}</div>
                      {p.subcategory && (
                        <div style={{ fontSize: 11, color: "var(--teal)", marginTop: 2, background: "rgba(0, 128, 128, 0.08)", display: "inline-block", padding: "1px 6px", borderRadius: 4 }}>
                          {p.subcategory}
                        </div>
                      )}
                    </td>
                    <td className="mono" style={{ fontWeight: 500, color: "var(--teal)" }}>${Number(p.price).toLocaleString()}</td>
                    <td>
                      <span className={`stamp ${p.status === "Active" ? "active" : "draft"}`}>
                        {p.status === "Active" ? <BadgeCheck size={12} /> : <AlertTriangle size={12} />}
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button className="icon-btn" onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}>
                          <Pencil size={14} color="var(--teal)" />
                        </button>
                        <button className="icon-btn" onClick={() => setPendingDelete(p)} aria-label={`Delete ${p.name}`}>
                          <Trash2 size={14} color="var(--brick)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {modalOpen && (
        <div className="overlay" onClick={() => setModalOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="display" style={{ fontSize: 18, fontWeight: 600, color: "var(--teal)", margin: 0 }}>
                {editingId ? "Edit treatment" : "Add treatment"}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", color: "var(--ink-soft)" }}>
                <X size={20} />
              </button>
            </div>
            <form className="drawer-body" onSubmit={handleSubmit}>
              {formError && <div className="form-error">{formError}</div>}

              <div className="field">
                <label>Treatment name</label>
                <input className="input" style={{ paddingLeft: 12 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rhinoplasty" />
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Destination</label>
                  <select className="select" value={country} onChange={(e) => setCountry(e.target.value)}>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Category</label>
                  <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* 🚀 NEW: Dependent Subcategory Field Row */}
              <div className="field-row">
                <div className="field" style={{ flex: 1 }}>
                  <label>Subcategory (Optional)</label>
                  <select 
                    className="select" 
                    value={subcategoryId} 
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    disabled={filteredSubcategories.length === 0}
                    style={{ opacity: filteredSubcategories.length === 0 ? 0.6 : 1 }}
                  >
                    <option value="">None / All</option>
                    {filteredSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                  {filteredSubcategories.length === 0 && categoryId && (
                    <span style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4, display: "block" }}>
                      No subcategories configured for this category.
                    </span>
                  )}
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Duration</label>
                  <input className="input" style={{ paddingLeft: 12 }} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="5-7 days" />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Price (USD)</label>
                  <input className="input" style={{ paddingLeft: 12 }} type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2800" />
                </div>
                <div className="field">
                  <label>Status</label>
                  <div className="status-toggle">
                    {["Active", "Draft"].map((s) => (
                      <button type="button" key={s} className={status === s ? "active" : ""} onClick={() => setStatus(s as "Active" | "Draft")}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Image File Uploader */}
              <div className="field">
                <label>Treatment Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
                  style={{ fontSize: 14 }}
                />
              </div>

              <div className="field">
                <label>Description</label>
                <textarea className="input" style={{ paddingLeft: 12, resize: "none" }} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's included in this package…" />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={saving}>
                  {saving && <Loader2 size={14} className="spin" />}
                  {editingId ? "Save changes" : "Add treatment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="overlay modal-center" onClick={() => setPendingDelete(null)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--brick)", marginBottom: 8 }}>
              <AlertTriangle size={18} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Delete this treatment?</h3>
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
              {pendingDelete.name} will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }} onClick={confirmDelete} disabled={deleting}>
                {deleting && <Loader2 size={14} className="spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}