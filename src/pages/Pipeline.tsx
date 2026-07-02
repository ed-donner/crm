import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { api } from "../api";
import { STAGES, STAGE_COLORS, STAGE_LABELS } from "../constants";
import type { Deal } from "../types";
import { ErrorBanner, Spinner } from "../components/ui";
import { formatDate, formatMoney } from "../utils";

const STAGE_SET = new Set<string>(STAGES);

function resolveStage(over: { id: unknown; data?: { current?: Record<string, unknown> } }): string | undefined {
  const id = String(over.id);
  if (STAGE_SET.has(id)) return id;
  const stage = over.data?.current?.stage;
  return typeof stage === "string" ? stage : undefined;
}

export default function Pipeline() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function load() {
    setError(null);
    try {
      setDeals(await api.deals.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load deals");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || !deals) return;
    const dealId = Number(String(active.id).replace("deal-", ""));
    const targetStage = resolveStage(over as never);
    if (!targetStage) return;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === targetStage) return;

    // Optimistic update, then persist. Revert by reloading on failure.
    setDeals((prev) =>
      prev ? prev.map((d) => (d.id === dealId ? { ...d, stage: targetStage } : d)) : prev,
    );
    api.deals.setStage(dealId, targetStage).catch(() => {
      setError("Could not save the new stage — reverting.");
      load();
    });
  }

  if (error && !deals) return <ErrorBanner message={error} />;
  if (!deals) return <Spinner label="Loading pipeline…" />;

  const activeDeal = activeId ? deals.find((d) => `deal-${d.id}` === activeId) : null;

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="pipeline">
          {STAGES.map((stage) => {
            const list = deals.filter((d) => d.stage === stage);
            const total = list.reduce((s, d) => s + (d.value || 0), 0);
            return (
              <Column key={stage} stage={stage} count={list.length} total={total}>
                {list.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onClick={() => navigate(`/deals/${deal.id}`)}
                  />
                ))}
                {list.length === 0 && (
                  <div className="pipeline__empty">No deals</div>
                )}
              </Column>
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  stage,
  count,
  total,
  children,
}: {
  stage: string;
  count: number;
  total: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage, data: { stage } });
  return (
    <div className={`pipeline__col${isOver ? " is-over" : ""}`} ref={setNodeRef}>
      <div className="pipeline__col-header">
        <div className="pipeline__col-name">
          <span
            className="badge-dot"
            style={{ background: STAGE_COLORS[stage], width: 8, height: 8, borderRadius: "50%", display: "inline-block" }}
          />
          {STAGE_LABELS[stage]}
        </div>
        <span className="pipeline__col-count">{count}</span>
      </div>
      <div className="pipeline__col-body">{children}</div>
      {total > 0 && (
        <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)" }}>
          {formatMoney(total)}
        </div>
      )}
    </div>
  );
}

function DealCard({
  deal,
  onClick,
  dragging,
}: {
  deal: Deal;
  onClick?: () => void;
  dragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `deal-${deal.id}`,
    data: { stage: deal.stage },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`deal-card${isDragging || dragging ? " is-dragging" : ""}`}
      onClick={(e) => {
        // Only treat as a click if it wasn't a drag.
        if (!isDragging && onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <div className="deal-card__name">{deal.name}</div>
      <div className="deal-card__meta">
        <span className="deal-card__value">{formatMoney(deal.value)}</span>
        {deal.close_date && (
          <span className="deal-card__date" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            {formatDate(deal.close_date)}
          </span>
        )}
      </div>
      {deal.organization_name && <div className="deal-card__org">{deal.organization_name}</div>}
    </div>
  );
}
