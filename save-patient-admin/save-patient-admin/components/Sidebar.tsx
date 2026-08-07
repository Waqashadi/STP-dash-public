"use client";

import { LayoutGrid, Package, Tags, LogOut, Stethoscope, LucideIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Define strict types for the Tab structures
interface TabItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  activeTab: string;
  onChangeTab: (key: string) => void;
}

const TABS: TabItem[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "categories", label: "Categories", icon: Tags },
  { key: "subcategories", label: "SubCategories", icon: Tags },
  { key: "products", label: "Products", icon: Package },
];

export default function Sidebar({ activeTab, onChangeTab }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Stethoscope size={18} color="#C79A52" />
        <span>Save The Patients</span>
      </div>

      <nav className="sidebar-nav">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`sidebar-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => onChangeTab(tab.key)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {user && <div className="sidebar-user">Signed in as {user.username}</div>}
        <button className="sidebar-logout" onClick={logout}>
          <LogOut size={16} /> Log out
        </button>
      </div>
    </aside>
  );
}