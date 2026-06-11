import React from 'react';

export default function TopNavBar({ user }) {
  return (
    <header className="fixed top-0 right-0 left-0 ml-sidebar-width h-16 px-gutter flex justify-between items-center bg-background border-b border-outline-variant z-40">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
          <input
            className="w-full bg-[#050505] border border-outline-variant py-1.5 pl-10 pr-4 font-label-caps text-[10px] text-on-surface focus:ring-0 focus:border-primary transition-colors"
            placeholder="QUERY INTELLIGENCE..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button className="bg-primary text-on-primary px-4 py-1.5 font-label-caps text-label-caps hover:brightness-110 active:opacity-80 transition-all border border-primary/20">
          Export Report
        </button>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">notifications</button>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-outline-variant">
                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
            ) : (
              <img
                alt="Recruiter Profile"
                className="w-8 h-8 rounded-full border border-outline-variant"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzqiGB8lFr7wMMSQrw9LFFtXK9PEPlfFjafPzprswqF2X6sEk8kmgvHiCGWxf5Ec--ivBbMjP1rQt_Iq4zCsXEpVtriqu_01WT5mHxNZoC3faGrPJTHxEdYL46vnEZ2KolL1RKwzJQRU8hWyqbbzFqNfDu_bMZnJawopS7AF5-QFuH5624uQ3WvcoxOz40pTU0ROlU-bHRUvKxtWi8dcuUDhE1LKzR801j1Ndd9SXi6-qgNzUuIKz-b3s88CY_SZMO4YUbjzlA2JPW"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
