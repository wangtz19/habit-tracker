"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props<T> {
  items: T[];
  getId: (item: T) => string;
  onReorder: (orderedIds: string[]) => void;
  renderItem: (item: T, isDragging: boolean) => React.ReactNode;
  enabled?: boolean;
}

export function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  enabled = true,
}: Props<T>) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  const reorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const ids = items.map(getId);
    const fromIdx = ids.indexOf(fromId);
    const toIdx = ids.indexOf(toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const reordered = [...ids];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    onReorder(reordered);
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    if (!enabled) return;
    touchStartY.current = e.touches[0].clientY;
    longPressTimer.current = setTimeout(() => {
      setDraggingId(id);
      try {
        if (navigator.vibrate) navigator.vibrate(30);
      } catch {}
    }, 400);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enabled) return;
    if (longPressTimer.current && Math.abs(e.touches[0].clientY - touchStartY.current) > 8) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!draggingId) return;
    e.preventDefault();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const itemEl = el?.closest("[data-sortable-id]") as HTMLElement | null;
    if (itemEl) {
      const id = itemEl.dataset.sortableId;
      if (id && id !== overId) setOverId(id);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (draggingId && overId && draggingId !== overId) {
      reorder(draggingId, overId);
    }
    setDraggingId(null);
    setOverId(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!enabled) return;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (!enabled || !draggingId) return;
    e.preventDefault();
    if (id !== overId) setOverId(id);
  };

  const handleDrop = (e: React.DragEvent, id: string) => {
    if (!enabled) return;
    e.preventDefault();
    const fromId = e.dataTransfer.getData("text/plain") || draggingId;
    if (fromId && fromId !== id) reorder(fromId, id);
    setDraggingId(null);
    setOverId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setOverId(null);
  };

  return (
    <div ref={containerRef} className="space-y-3">
      {items.map((item) => {
        const id = getId(item);
        const isDragging = draggingId === id;
        const isOver = overId === id && draggingId !== id;
        return (
          <div
            key={id}
            data-sortable-id={id}
            draggable={enabled}
            onDragStart={(e) => handleDragStart(e, id)}
            onDragOver={(e) => handleDragOver(e, id)}
            onDrop={(e) => handleDrop(e, id)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, id)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={cn(
              "transition-all",
              isDragging && "opacity-50 scale-105 shadow-2xl",
              isOver && "ring-2 ring-primary-500 rounded-xl"
            )}
          >
            {renderItem(item, isDragging)}
          </div>
        );
      })}
    </div>
  );
}
