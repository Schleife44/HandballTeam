import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useDragControls, animate } from 'framer-motion';

const DraggablePlayer = ({ id, x, y, curve, prevPos, color, number, label, onUpdate, onContextMenu, constraintsRef }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const displayX = useMotionValue(x);
  const displayY = useMotionValue(y);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const dragControls = useDragControls();

  const left = useTransform(displayX, (val) => `${val}%`);
  const top = useTransform(displayY, (val) => `${val}%`);

  useEffect(() => {
    if (isDragging) return;
    const targetX = x;
    const targetY = y;
    const currentX = displayX.get();
    const currentY = displayY.get();
    if (Math.abs(currentX - targetX) < 0.1 && Math.abs(currentY - targetY) < 0.1) return;

    const startX = prevPos ? prevPos.x : currentX;
    const startY = prevPos ? prevPos.y : currentY;
    
    displayX.set(startX);
    displayY.set(startY);

    if (!prevPos || !curve || (prevPos.x === targetX && prevPos.y === targetY)) {
      animate(displayX, targetX, { duration: 0.8, ease: "easeInOut" });
      animate(displayY, targetY, { duration: 0.8, ease: "easeInOut" });
      return;
    }

    const midX = (prevPos.x + targetX) / 2;
    const midY = (prevPos.y + targetY) / 2;
    const handleX = midX + curve.x;
    const handleY = midY + curve.y;
    const p1x = 2 * handleX - 0.5 * prevPos.x - 0.5 * targetX;
    const p1y = 2 * handleY - 0.5 * prevPos.y - 0.5 * targetY;

    const controls = animate(0, 1, {
      duration: 0.8,
      ease: "easeInOut",
      onUpdate: (t) => {
        const curX = Math.pow(1 - t, 2) * prevPos.x + 2 * (1 - t) * t * p1x + Math.pow(t, 2) * targetX;
        const curY = Math.pow(1 - t, 2) * prevPos.y + 2 * (1 - t) * t * p1y + Math.pow(t, 2) * targetY;
        displayX.set(curX);
        displayY.set(curY);
      }
    });

    return () => controls.stop();
  }, [x, y, prevPos, curve, isDragging, displayX, displayY]);

  const handleUpdate = (info, finalize = false) => {
    const container = constraintsRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const newX = ((info.point.x - rect.left) / rect.width) * 100;
    const newY = ((info.point.y - rect.top) / rect.height) * 100;
    const finalX = Math.max(0, Math.min(100, newX));
    const finalY = Math.max(0, Math.min(100, newY));

    if (finalize) {
      displayX.set(finalX);
      displayY.set(finalY);
    }
    onUpdate(id, { x: finalX, y: finalY });
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={constraintsRef}
      dragMomentum={false}
      dragElastic={0}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, id);
      }}
      onPointerDown={(e) => {
        if (e.button === 2) return;
        setIsDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        dragX.set(e.clientX - centerX);
        dragY.set(e.clientY - centerY);
        dragControls.start(e);
      }}
      onDrag={(e, info) => handleUpdate(info)}
      onDragEnd={(e, info) => {
        handleUpdate(info, true);
        dragX.set(0);
        dragY.set(0);
        setTimeout(() => setIsDragging(false), 20);
      }}
      style={{ 
        position: 'absolute',
        left: left,
        top: top,
        x: dragX, 
        y: dragY,
        marginLeft: color === 'ball' ? '-12px' : '-20px',
        marginTop: color === 'ball' ? '-12px' : '-20px',
        zIndex: isDragging ? 100 : 20,
      }}
      whileDrag={{ scale: 1.1 }}
      className={`rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing border-2 shadow-2xl 
        ${color === 'attack' ? 'bg-brand border-brand-light text-black w-10 h-10' : 
          color === 'defense' ? 'bg-zinc-800 border-zinc-600 text-zinc-100 w-10 h-10 shadow-lg' : 
          'bg-yellow-500 border-yellow-300 w-6 h-6 shadow-md'}`}
    >
      <span className="text-xs font-black italic select-none pointer-events-none">{number}</span>
      {label && label.trim() !== "" && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/60 px-2 py-0.5 rounded text-[8px] font-bold text-zinc-400 select-none pointer-events-none">
          {label}
        </div>
      )}
    </motion.div>
  );
};

export default DraggablePlayer;
