import React from 'react'

export default function Marks() {
  return (
    <div className="px-6 py-4">
      <div className="rounded-2xl border-2 border-brand-500 bg-white p-6 shadow-soft">
        <div className="text-sm font-semibold text-slateish-700">
          Student Marks Detail
        </div>
        <div className="mt-6 grid grid-cols-[240px_160px] items-end gap-4">
          <div>
            <label className="text-xs font-semibold text-slateish-500">
              Semester*
            </label>
            <select className="shadcn-input mt-2">
              <option>Select Semester</option>
              {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].map(
                (sem) => (
                  <option key={sem}>{sem}</option>
                )
              )}
            </select>
          </div>
          <button className="rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-white">
            Find
          </button>
        </div>
      </div>
    </div>
  )
}
