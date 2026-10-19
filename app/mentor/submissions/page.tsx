"use client";

import { useState } from "react";
import NavItem from "../components/NavItem";

type Filter = "all" | "pending" | "fail" | "done";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "To review" },
  { id: "fail", label: "Tests failing" },
  { id: "done", label: "Done" },
];

export default function Submission() {
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <>
      <aside className="rounded-lg border border-slate-200 bg-white">
        <header className="px-4 pt-4 pb-3">
          <h2 className="text-lg font-bold">Submissions</h2>
          <p className="text-sm text-slate-500">2 waiting for your review</p>
        </header>

        <ul className="flex flex-col flex-wrap gap-1 px-3 pb-3 text-sm">
          {filters.map((f) => (
            <NavItem
              key={f.id}
              icon={null}
              label={f.label}
              active={filter === f.id}
              onClick={() => setFilter(f.id)}
            />
          ))}
        </ul>
      </aside>
      {/* submission list goes here, filtered by `filter` */}
      {filter === "all" && <div>all component</div>}
      {filter === "pending" && <div>pend component</div>}
      {filter === "fail" && <div>failed component</div>}
      {filter === "done" && <div>done component</div>}
    </>
  );
}
