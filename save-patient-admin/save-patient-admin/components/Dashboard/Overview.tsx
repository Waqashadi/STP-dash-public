"use client";

import { Product } from "./Products"; // Reusing the Product interface we created earlier
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface OverviewProps {
  products: Product[];
}

export default function Overview({ products }: OverviewProps) {
  const total = products.length;
  const active = products.filter((p) => p.status === "Active").length;
  const countries = new Set(products.map((p) => p.country)).size;
  const avgPrice = total ? Math.round(products.reduce((s, p) => s + Number(p.price), 0) / total) : 0;

  const stats = [
    { label: "Total treatments", value: total },
    { label: "Active", value: active },
    { label: "Countries covered", value: countries },
    { label: "Avg. price", value: `$${avgPrice.toLocaleString()}` },
  ];

  // 🚀 1. Group products by country for the chart
  const countryDataMap: Record<string, { totalProducts: number; totalPrice: number }> = {};

  products.forEach((p) => {
    const country = p.country || "Unknown";
    if (!countryDataMap[country]) {
      countryDataMap[country] = { totalProducts: 0, totalPrice: 0 };
    }
    countryDataMap[country].totalProducts += 1;
    countryDataMap[country].totalPrice += Number(p.price) || 0;
  });

  // Convert the map to an array and calculate average price per country
  const chartData = Object.keys(countryDataMap).map((country) => {
    const data = countryDataMap[country];
    return {
      country,
      "Treatments Count": data.totalProducts,
      "Avg Price ($)": Math.round(data.totalPrice / data.totalProducts),
    };
  });

  return (
    <div className="">
      <h1 className="display" style={{ fontSize: 26, fontWeight: 700, color: "var(--teal)", margin: "0 0 4px" }}>
        Overview
      </h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: "0 0 24px" }}>
        A quick snapshot of your treatment catalog.
      </p>

      {/* Stat Grid */}
      <div className="stat-grid" style={{ marginBottom: "32px" }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-value mono">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 🚀 2. Treatment Breakdown Chart Section */}
      <div 
        className="table-card" 
        style={{ 
          padding: "24px", 
          borderRadius: "12px", 
          background: "var(--bg-card, #ffffff)",
          border: "1px solid var(--border, #eaeaea)" 
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", margin: "0 0 20px" }}>
          Treatments & Pricing by Country
        </h3>
        
        {chartData.length > 0 ? (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="country" 
                  stroke="var(--ink-soft)" 
                  fontSize={12} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="var(--ink-soft)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ 
                    background: "var(--bg-card, #fff)", 
                    border: "1px solid var(--border, #eaeaea)", 
                    borderRadius: "8px",
                    fontFamily: "inherit"
                  }} 
                />
                {/* Bar for Count */}
                <Bar 
                  dataKey="Treatments Count" 
                  fill="var(--teal)" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                />
                {/* Bar for Average Price */}
                <Bar 
                  dataKey="Avg Price ($)" 
                  fill="#fbbf24" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ color: "var(--ink-soft)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
            No data available to build the dashboard breakdown.
          </div>
        )}
      </div>
    </div>
  );
}