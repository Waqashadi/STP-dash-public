"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/api/client";
import { Pencil, Trash2, Plus, X, Loader2, AlertTriangle } from "lucide-react";
import { Category } from "./Categories"; // Import the Category interface

interface Subcategory {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  slug: string;
  description: string;
  image?: string; // 👈 Added image path field
}

interface SubcategoriesProps {
  categories: Category[];
  showToast: (msg: string) => void;
}

export default function Subcategories({ categories, showToast }: SubcategoriesProps) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Subcategory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Subcategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form Field States
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null); // 👈 Added local image binary state

  useEffect(() => {
    fetchSubcategories();
  }, []);

  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      setError("");
      const subData = await api.getSubcategories();
      setSubcategories(subData.subcategories || []);
    } catch (err: any) {
      setError(err.message || "Failed to load subcategories.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    setName(val);
    setSlug(generatedSlug);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setName("");
    setSlug("");
    setCategoryId(categories[0]?.id ? String(categories[0].id) : "");
    setDescription("");
    setImageFile(null); // Clean image selection
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: Subcategory) => {
    setEditingItem(item);
    setName(item.name);
    setSlug(item.slug);
    setCategoryId(String(item.category_id));
    setDescription(item.description || "");
    setImageFile(null); // Reset image selection on edit load
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !categoryId || !slug.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    setSaving(true);

    // Create Multipart Form Package (just like Categories)
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("category_id", categoryId);
    formData.append("slug", slug.trim().toLowerCase().replace(/\s+/g, "-"));
    formData.append("description", description.trim());
    if (imageFile) {
      formData.append("imageFile", imageFile); // Appends the actual binary image file stream
    }

    try {
      if (editingItem) {
        await api.updateSubcategory(editingItem.id, formData);
        showToast("Subcategory updated successfully!");
      } else {
        await api.createSubcategory(formData);
        showToast("Subcategory created successfully!");
      }
      setIsModalOpen(false);
      fetchSubcategories(); // Refresh subcategory list
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.deleteSubcategory(pendingDelete.id);
      showToast("Subcategory deleted successfully!");
      setPendingDelete(null);
      fetchSubcategories();
    } catch (err: any) {
      setError(err.message || "Could not delete subcategory.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 className="display" style={{ fontSize: 26, fontWeight: 700, color: "var(--teal)", margin: "0 0 4px" }}>
            Subcategories
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: 0 }}>
            Manage the nested treatment types for patients.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={16} /> Add subcategory
        </button>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 16 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="table-card">
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "60px 0", color: "var(--ink-soft)" }}>
            <Loader2 size={16} className="spin" /> Loading subcategories...
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Id</th>
                <th>Image</th> {/* 👈 Added Image Column Header */}
                <th>Name</th>
                <th>Slug</th>
                <th>Parent Category</th>
                <th>Description</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subcategories.length > 0 ? (
                subcategories.map((sub) => {
                  const parentCategory = categories.find((c) => Number(c.id) === Number(sub.category_id));
                  const categoryDisplayName = sub.category_name || parentCategory?.name || "Unassigned";

                  return (
                    <tr key={sub.id}>
                      <th>{sub.id}</th>
                      {/* 🖼️ Render Image with correct Localhost Upload path */}
                      <td style={{ verticalAlign: "middle" }}>
                        <img
                          src={sub.image ? `http://localhost:5000/uploads/${sub.image}` : "/images/placeholder.png"}
                          alt={sub.name}
                          style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }}
                        />
                      </td>
                      <td style={{ fontWeight: 500 }}>{sub.name}</td>
                      <td className="mono" style={{ fontSize: 13, color: "var(--ink-soft)" }}>{sub.slug}</td>
                      <td style={{ fontWeight: 500, color: "var(--teal)" }}>
                        {categoryDisplayName}
                      </td>
                      <td className="mono">{sub.description || "-"}</td>
                      <td>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button className="icon-btn" onClick={() => openEditModal(sub)}>
                            <Pencil size={14} color="var(--teal)" />
                          </button>
                          <button className="icon-btn" onClick={() => setPendingDelete(sub)}>
                            <Trash2 size={14} color="var(--brick)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-soft)", padding: "24px 0" }}>
                    No subcategories found. Get started by adding one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* --- ADD / EDIT SUBCATEGORY MODAL --- */}
      {isModalOpen && (
        <div className="overlay" onClick={() => setIsModalOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="display" style={{ fontSize: 18, fontWeight: 600, color: "var(--teal)", margin: 0 }}>
                {editingItem ? "Edit Subcategory" : "Add Subcategory"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "var(--ink-soft)" }}>
                <X size={20} />
              </button>
            </div>

            <form className="drawer-body" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {error && <div className="form-error">{error}</div>}

              {/* 1. Parent Category Selector */}
              <div className="field">
                <label>
                  Parent Category <span style={{ color: "var(--brick)" }}>*</span>
                </label>
                <select
                  className="select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Subcategory Name */}
              <div className="field">
                <label>
                  Subcategory Name <span style={{ color: "var(--brick)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  style={{ paddingLeft: 12 }}
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g. Orthodontics"
                  required
                />
              </div>

              {/* 3. Slug (Auto-generated) */}
              <div className="field">
                <label>Slug (Auto-generated)</label>
                <input
                  type="text"
                  className="input"
                  style={{ paddingLeft: 12, background: "var(--bg-soft, #f9f9f9)" }}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>

              {/* 4. Description */}
              <div className="field">
                <label>Description</label>
                <textarea
                  className="input"
                  style={{ paddingLeft: 12, resize: "none" }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a brief description..."
                  rows={3}
                />
              </div>

              {/* 5. Subcategory Cover Image 👈 Added Image Input */}
              <div className="field">
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Subcategory Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  style={{ fontSize: 14 }}
                />
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={saving}>
                  {saving && <Loader2 size={14} className="spin" />}
                  {editingItem ? "Save changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {pendingDelete && (
        <div className="overlay modal-center" onClick={() => setPendingDelete(null)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--brick)", marginBottom: 8 }}>
              <AlertTriangle size={18} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Delete Subcategory?</h3>
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
              Are you sure you want to delete <strong>{pendingDelete.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }} onClick={handleDelete} disabled={deleting}>
                {deleting && <Loader2 size={14} className="spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}