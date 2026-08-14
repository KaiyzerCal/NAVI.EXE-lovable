import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { skinTurntableUrl, skinThumbUrl, TURNTABLE_ANGLES } from "@/lib/skinArt";

/**
 * Drag-to-rotate view of the equipped Navi.
 *
 * There is no 3D model here — the "rotation" is eight pre-rendered orbit
 * frames (0..315 degrees) swapped as you drag, the same technique product
 * turntables use. That keeps it to eight small images instead of shipping a
 * WebGL runtime and a mesh per skin, and it works on any device.
 *
 * Frames are generated on demand by the navi-generate-skin edge function and
 * cached in storage, so the first person to view a given skin pays the
 * generation cost and everyone after gets it instantly.
 */
export default function NaviTurntable({
  skinName,
  size = 240,
  className = "",
}: {
  skinName: string;
  size?: number;
  className?: string;
}) {
  const [angleIndex, setAngleIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [building, setBuilding] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);

  const dragRef = useRef<{ startX: number; startIndex: number } | null>(null);
  // Guards against a second build being kicked off for the same skin by a
  // re-render while the first is still in flight.
  const buildingFor = useRef<string | null>(null);

  const slug = skinName?.toLowerCase() ?? "";

  // Probe for an existing frame set; build it if it isn't there yet.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setFailed(false);
    setAngleIndex(0);
    setHasDragged(false);
    if (!slug) return;

    (async () => {
      // 180 is the last frame written for a full set, so finding it means the
      // whole set is present — checking angle 0 alone would pass even for a
      // half-built set, since angle 0 is just a copy of the front render.
      const probe = await fetch(skinTurntableUrl(skinName, 180), { method: "HEAD" }).catch(() => null);
      if (cancelled) return;
      if (probe?.ok) { setReady(true); return; }

      if (buildingFor.current === slug) return;
      buildingFor.current = slug;
      setBuilding(true);
      const { data, error } = await supabase.functions.invoke("navi-generate-skin", {
        body: { skinName, style: "cgi", turntable: true },
      });
      if (cancelled) return;
      setBuilding(false);
      buildingFor.current = null;
      if (error || !data?.frames) { setFailed(true); return; }
      setReady(true);
    })();

    return () => { cancelled = true; };
  }, [skinName, slug]);

  // Preload every frame once available, so dragging doesn't flash blank.
  useEffect(() => {
    if (!ready) return;
    TURNTABLE_ANGLES.forEach((deg) => {
      const img = new Image();
      img.src = skinTurntableUrl(skinName, deg);
    });
  }, [ready, skinName]);

  const step = useCallback((delta: number) => {
    setAngleIndex((i) => (i + delta + TURNTABLE_ANGLES.length) % TURNTABLE_ANGLES.length);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!ready) return;
    dragRef.current = { startX: e.clientX, startIndex: angleIndex };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    // One frame per ~28px of travel: responsive without spinning wildly on a
    // short flick.
    const framesMoved = Math.round((e.clientX - drag.startX) / 28);
    if (framesMoved !== 0) setHasDragged(true);
    const next = (drag.startIndex - framesMoved) % TURNTABLE_ANGLES.length;
    setAngleIndex(next < 0 ? next + TURNTABLE_ANGLES.length : next);
  };

  const endDrag = (e: React.PointerEvent) => {
    dragRef.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* already released */ }
  };

  const deg = TURNTABLE_ANGLES[angleIndex];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        role="slider"
        tabIndex={0}
        aria-label={`Rotate ${skinName}. Currently ${deg} degrees.`}
        aria-valuenow={deg}
        aria-valuemin={0}
        aria-valuemax={315}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); setHasDragged(true); }
          if (e.key === "ArrowRight") { e.preventDefault(); step(1); setHasDragged(true); }
        }}
        style={{ width: size, height: size, touchAction: "pan-y" }}
        className="relative select-none cursor-ew-resize rounded-full focus:outline-none focus:ring-2 focus:ring-primary/60"
      >
        {/* Always render the front thumb underneath so there is never an empty
            frame while the set builds or a frame decodes. */}
        <img
          src={skinThumbUrl(skinName)}
          alt={skinName}
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {ready && (
          <img
            src={skinTurntableUrl(skinName, deg)}
            alt={`${skinName} rotated ${deg} degrees`}
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_0_12px_hsl(185,100%,50%,0.35)]"
          />
        )}

        {building && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-full bg-background/70 backdrop-blur-sm">
            <Loader2 size={18} className="animate-spin text-primary" />
            <p className="text-[9px] font-mono text-primary/80">BUILDING 3D VIEW</p>
            <p className="text-[8px] font-mono text-muted-foreground">// one-time, ~1 min</p>
          </div>
        )}
      </div>

      {ready && !hasDragged && (
        <p className="mt-2 flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground animate-pulse">
          <RotateCcw size={10} /> DRAG TO ROTATE
        </p>
      )}
      {ready && hasDragged && (
        <p className="mt-2 text-[9px] font-mono text-muted-foreground/70">{deg}°</p>
      )}
      {failed && (
        <p className="mt-2 text-[9px] font-mono text-muted-foreground/70">// 3D view unavailable</p>
      )}
    </div>
  );
}
