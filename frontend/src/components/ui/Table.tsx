import React from "react";
import type { TableColumn, TableProps } from "../../types";

export const Table = <T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "데이터가 없습니다.",
  onRowClick,
  virtualized = false,
}: TableProps<T>): React.ReactElement => {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-8 text-center text-slate-500">로딩 중...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-8 text-center text-slate-500">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{ width: col.width }}
                className="px-6 py-3 text-left text-sm font-semibold text-slate-900"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-slate-200 transition ${
                onRowClick ? "hover:bg-slate-50 cursor-pointer" : ""
              }`}
            >
              {columns.map((col) => {
                const value = row[col.key];
                const content = col.render ? col.render(value, row) : value;

                return (
                  <td key={String(col.key)} className="px-6 py-4 text-sm text-slate-700">
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Dark variant for dark backgrounds (admin dashboard)
export const TableDark = <T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "데이터가 없습니다.",
  onRowClick,
}: Omit<TableProps<T>, "virtualized">): React.ReactElement => {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-700 overflow-hidden bg-slate-800">
        <div className="p-8 text-center text-slate-400">로딩 중...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 overflow-hidden bg-slate-800">
        <div className="p-8 text-center text-slate-400">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700 overflow-hidden bg-slate-800">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-900/50">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{ width: col.width }}
                className="px-6 py-3 text-left text-sm font-semibold text-slate-200"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-slate-700 transition ${
                onRowClick ? "hover:bg-slate-700/50 cursor-pointer" : ""
              }`}
            >
              {columns.map((col) => {
                const value = row[col.key];
                const content = col.render ? col.render(value, row) : value;

                return (
                  <td key={String(col.key)} className="px-6 py-4 text-sm text-slate-300">
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
