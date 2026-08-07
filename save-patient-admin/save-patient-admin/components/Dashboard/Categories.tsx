"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import { api } from "@/api/client";

export default function Categories({ categories, setCategories, showToast }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null); // category or null
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Update open hooks to reset files cleanly
    function openAdd() {
        setEditing(null); setName(""); setSlug(""); setDescription(""); setImageFile(null); setError(""); setModalOpen(true);
    }
    function openEdit(category) {
        setEditing(category); setName(category.name); setSlug(category.slug); setDescription(category.description || ""); setImageFile(null); setModalOpen(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim() || !slug.trim()) return setError("Name and Slug fields are required.");
        setSaving(true); setError("");

        // Create Multipart Form Package
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("slug", slug.trim().toLowerCase().replace(/\s+/g, "-"));
        formData.append("description", description.trim());
        if (imageFile) {
            formData.append("imageFile", imageFile); // Appends the actual binary image file raw stream
        }

        try {
            if (editing) {
                const res = await api.updateCategory(editing.id, formData);
                setCategories((prev) => prev.map((c) => (c.id === editing.id ? res.category : c)));
            } else {
                const res = await api.createCategory(formData);
                setCategories((prev) => [...prev, res.category]);
            }
            setModalOpen(false);
        } catch (err) {
            setError(err.message || "Could not save category.");
        } finally {
            setSaving(false);
        }
    }

    async function confirmDelete(force = false) {
        setDeleting(true);
        try {
            await api.deleteCategory(pendingDelete.id, force);
            setCategories((prev) => prev.filter((c) => c.id !== pendingDelete.id));
            showToast("Category deleted");
            setPendingDelete(null);
        } catch (err) {
            if (err.message?.includes("Delete anyway")) {
                if (confirm(err.message + "\n\nDelete it and unassign those products?")) {
                    return confirmDelete(true);
                }
            } else {
                showToast(err.message || "Could not delete category.");
            }
        } finally {
            setDeleting(false);
        }
    }

//    console.log("categories", categories);

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                    <h1 className="display" style={{ fontSize: 26, fontWeight: 700, color: "var(--teal)", margin: "0 0 4px" }}>
                        Categories
                    </h1>
                    <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: 0 }}>
                        Group treatments so patients can browse by type.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={16} /> Add category
                </button>
            </div>

            <div className="table-card">
                <table>
                    <thead>
                        <tr><td>Id</td><th>Image</th><th>Name</th><th>Slug</th><th>Products</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr>
                    </thead>
                    <tbody>
                        {categories.map((c) => (
                            <tr key={c.id}>
                                <td>{c.id}</td>
                                <td style={{ verticalAlign: "middle" }}>
                                    <img
                                        src={c.image ? `http://localhost:5000/uploads/${c.image}` : "/images/placeholder.png"}
                                        alt={c.name}
                                        style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }}
                                    />
                                </td>
                                <td style={{ fontWeight: 500 }}>{c.name}</td>
                                <td className="mono" style={{ fontSize: 13, color: "var(--ink-soft)" }}>{c.slug}</td>
                                <td className="mono">{c.product_count}</td>
                                <td className="mono">{c.product_status || "-"}</td>
                                <td>
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                        <button className="icon-btn" onClick={() => openEdit(c)}><Pencil size={14} color="var(--teal)" /></button>
                                        <button className="icon-btn" onClick={() => setPendingDelete(c)}><Trash2 size={14} color="var(--brick)" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <div className="overlay modal-center" onClick={() => setModalOpen(false)}>
                    <div className="confirm-card" style={{ maxWidth: 480, width: "100%" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                                {editing ? "Edit category" : "Add category"}
                            </h3>
                            <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", color: "var(--ink-soft)", cursor: "pointer" }}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {error && <div className="form-error">{error}</div>}

                            {/* 1. Category Name */}
                            <div className="field">
                                <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Category Name</label>
                                <input
                                    className="input"
                                    style={{ paddingLeft: 12, width: "100%" }}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Dental"
                                    autoFocus
                                />
                            </div>

                            {/* 2. Manual URL Slug */}
                            <div className="field">
                                <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>URL Slug</label>
                                <input
                                    className="input"
                                    style={{ paddingLeft: 12, width: "100%" }}
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="e.g. cosmetic-plastic-surgery"
                                />
                            </div>

                            {/* 4. Description Block */}
                            <div className="field">
                                <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Description</label>
                                <textarea
                                    className="input"
                                    style={{ paddingLeft: 12, width: "100%", resize: "none" }}
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Briefly describe what treatments fall under this group..."
                                />
                            </div>

                            <div className="field">
                                <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Category Cover Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                    style={{ fontSize: 14 }}
                                />
                            </div>


                            {/* Actions Button Row */}
                            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                                <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={() => setModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={saving}>
                                    {saving && <Loader2 size={14} className="spin" />} Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {pendingDelete && (
                <div className="overlay modal-center" onClick={() => setPendingDelete(null)}>
                    <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 8, color: "var(--brick)", marginBottom: 8 }}>
                            <AlertTriangle size={18} /><h3 style={{ margin: 0 }}>Delete "{pendingDelete.name}"?</h3>
                        </div>
                        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
                            {pendingDelete.product_count > 0
                                ? `${pendingDelete.product_count} product(s) use this category — they'll be unassigned, not deleted.`
                                : "This can't be undone."}
                        </p>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setPendingDelete(null)}>Cancel</button>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => confirmDelete(pendingDelete.product_count > 0)} disabled={deleting}>
                                {deleting && <Loader2 size={14} className="spin" />} Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}