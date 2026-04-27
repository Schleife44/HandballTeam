import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const TacticsPath = ({ start, end, curve, color, onCurveChange, constraintsRef }) => {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  
  const curveX = useMotionValue(curve?.x || 0);
  const curveY = useMotionValue(curve?.y || 0);

  useEffect(() => {
    curveX.set(curve?.x || 0);
    curveY.set(curve?.y || 0);
  }, [curve, curveX, curveY]);

  const [pathD, setPathD] = React.useState('');
  
  useEffect(() => {
    const updatePath = () => {
      const cx = 2 * (midX + curveX.get()) - 0.5 * start.x - 0.5 * end.x;
      const cy = 2 * (midY + curveY.get()) - 0.5 * start.y - 0.5 * end.y;
      setPathD(`M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`);
    };
    updatePath();
    const unsubX = curveX.on("change", updatePath);
    const unsubY = curveY.on("change", updatePath);
    return () => { unsubX(); unsubY(); };
  }, [start, end, midX, midY, curveX, curveY]);

  return (
    <>
      <svg 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      >
        <motion.path
          d={pathD}
          fill="none"
          stroke={color === 'attack' ? '#84cc16' : color === 'defense' ? '#3b82f6' : '#eab308'}
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="12 8"
          className="opacity-70"
        />
      </svg>

      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0}
        // Wir nutzen whileHover/whileTap von Framer Motion für stabile Effekte
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'absolute',
          left: `${midX}%`,
          top: `${midY}%`,
          // Prozentualer Versatz als Transform (Pixel-basiert für Stabilität)
          x: useTransform(curveX, val => {
            const width = constraintsRef.current?.getBoundingClientRect().width || 0;
            return (val / 100) * width;
          }),
          y: useTransform(curveY, val => {
            const height = constraintsRef.current?.getBoundingClientRect().height || 0;
            return (val / 100) * height;
          }),
          translateX: "-50%",
          translateY: "-50%",
        }}
        onDrag={(e, info) => {
          const rect = constraintsRef.current.getBoundingClientRect();
          const currentMouseX = ((info.point.x - rect.left) / rect.width) * 100;
          const currentMouseY = ((info.point.y - rect.top) / rect.height) * 100;
          
          const newCurve = {
            x: currentMouseX - midX,
            y: currentMouseY - midY
          };
          
          curveX.set(newCurve.x);
          curveY.set(newCurve.y);
          onCurveChange(newCurve);
        }}
        className={`w-4 h-4 bg-white rounded-full cursor-pointer z-30 shadow-xl border-2
          ${color === 'attack' ? 'border-brand' : color === 'defense' ? 'border-blue-500' : 'border-yellow-500'}`}
      />
    </>
  );
};

export default TacticsPath;
