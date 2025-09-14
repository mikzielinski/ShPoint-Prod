// src/components/CharacterCard.tsx
import React from "react";
import type { CharacterListItem } from "../lib/api";

type Props = {
  item: CharacterListItem;
  onOpen: (id: string) => void;
};

export default function CharacterCard({ item, onOpen }: Props) {
  return (
    <article
      onClick={() => onOpen(item.id)}
      className="group cursor-pointer rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md overflow-hidden"
      role="button"
      aria-label={`Open ${item.name}`}
    >
      <div className="w-full">
        <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
          <img
            src={item.portrait}
            alt={item.name}
            className="absolute inset-0 h-full w-full object-contain bg-gray-50"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="px-3 pb-3 pt-2">
        <h4 className="text-sm font-semibold leading-snug">{item.name}</h4>
        <div className="mt-1 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1">
            <span className="font-medium">{item.unit_type}</span>
            <span>•</span>
            <span>{item.squad_points} PC</span>
          </span>
        </div>
        <div className="mt-1 text-[11px] text-blue-700 underline underline-offset-2">
          Stances: kliknij kartę
        </div>
      </div>
    </article>
  );
}