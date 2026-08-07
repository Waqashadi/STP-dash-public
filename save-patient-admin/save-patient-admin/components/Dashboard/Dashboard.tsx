"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, AlertTriangle } from "lucide-react";
import { api } from "@/api/client";
import Sidebar from "../Sidebar";
import Overview from "./Overview";
import Products, { Product, Subcategory } from "./Products";
import Categories, { Category } from "./Categories";
import Subcategories from "./SubCategories";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getProducts(), api.getCategories(), api.getSubcategories()])
      .then(([p, c, s]) => {
        setProducts(p.products || []);
        setCategories(c.categories || []);
        setSubCategories(s.subcategories || []);
      })
      .catch((err: any) => {
        setError(err.message || "Could not load dashboard data from the server.");
      })
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onChangeTab={setActiveTab} />

      <main className="main-content">
        {error && (
          <div className="error-banner">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {activeTab === "overview" && <Overview products={products} />}
        {activeTab === "categories" && (
          <Categories categories={categories} setCategories={setCategories} showToast={showToast} />
        )}
        {activeTab === "subcategories" && (
          <Subcategories categories={categories} showToast={showToast}/>
        )}
        {activeTab === "products" && (
          <Products
            products={products}
            setProducts={setProducts}
            categories={categories}
            subcategories={subCategories}
            loading={loading}
            error={error}
            showToast={showToast}
          />
        )}
      </main>

      {toast && (
        <div className="toast">
          <BadgeCheck size={16} /> {toast}
        </div>
      )}
    </div>
  );
}