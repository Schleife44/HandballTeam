import { useState, useCallback } from 'react';

export const useImageEditorLogic = (canvasRef, isEditMode, selectedElement, setSelectedElement, currentBoxes, updatePosition, settings) => {
  const [dragState, setDragState] = useState({ 
    isDragging: false, 
    action: null, 
    startX: 0, 
    startY: 0, 
    originalSettings: null 
  });

  const getMousePos = useCallback((e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return { 
      x: (e.clientX - rect.left) * scaleX, 
      y: (e.clientY - rect.top) * scaleY 
    };
  }, [canvasRef]);

  const handleMouseDown = useCallback((e) => {
    if (!isEditMode) return;
    const pos = getMousePos(e);
    let action = 'move';
    let found = null;

    if (selectedElement) {
      const b = currentBoxes.find(box => box.key === selectedElement);
      if (b) {
        const rad = -(b.rotation || 0) * Math.PI / 180;
        const dx = pos.x - b.cx; 
        const dy = pos.y - b.cy;
        const lx = b.cx + dx * Math.cos(rad) - dy * Math.sin(rad);
        const ly = b.cy + dx * Math.sin(rad) + dy * Math.cos(rad);
        const s = 40;
        
        // Rotation Handle (Top)
        if (Math.abs(lx - b.cx) < s && Math.abs(ly - (b.cy - (b.h*b.scale/2) - 40)) < s) { 
          found = b.key; 
          action = 'rotate'; 
        }
        // Scale Handle (Bottom Right)
        else if (Math.abs(lx - (b.cx + b.w*b.scale/2)) < s && Math.abs(ly - (b.cy + b.h*b.scale/2)) < s) { 
          found = b.key; 
          action = 'scale'; 
        }
      }
    }

    if (!found) {
      for (let i = currentBoxes.length - 1; i >= 0; i--) {
        const b = currentBoxes[i];
        if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) { 
          found = b.key; 
          action = 'move'; 
          break; 
        }
      }
    }

    setSelectedElement(found);
    if (found) {
      const element = found.startsWith('custom_') 
        ? (settings.elements || []).find(el => el.id === found) 
        : settings.positions[found];
        
      setDragState({ 
        isDragging: true, 
        action, 
        startX: pos.x, 
        startY: pos.y, 
        originalSettings: { ...element } 
      });
    }
  }, [isEditMode, getMousePos, selectedElement, currentBoxes, setSelectedElement, settings]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current; 
    if (!canvas) return;

    if (!dragState.isDragging || !selectedElement) {
      if (isEditMode) {
        const pos = getMousePos(e); 
        let cursor = 'default';
        if (selectedElement) {
          const b = currentBoxes.find(box => box.key === selectedElement);
          if (b) {
            const rad = -(b.rotation || 0) * Math.PI / 180; 
            const dx = pos.x - b.cx; 
            const dy = pos.y - b.cy;
            const lx = b.cx + dx * Math.cos(rad) - dy * Math.sin(rad); 
            const ly = b.cy + dx * Math.sin(rad) + dy * Math.cos(rad);
            const s = 40;
            if (Math.abs(lx - b.cx) < s && Math.abs(ly - (b.cy - (b.h*b.scale/2) - 40)) < s) cursor = 'crosshair';
            else if (Math.abs(lx - (b.cx + b.w*b.scale/2)) < s && Math.abs(ly - (b.cy + b.h*b.scale/2)) < s) cursor = 'nwse-resize';
          }
        }
        if (cursor === 'default') {
          for (const b of currentBoxes) { 
            if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) { 
              cursor = 'grab'; 
              break; 
            } 
          }
        }
        canvas.style.cursor = cursor;
      }
      return;
    }

    const pos = getMousePos(e); 
    const box = currentBoxes.find(b => b.key === selectedElement); 
    if (!box) return;

    if (dragState.action === 'move') {
      const dx = pos.x - dragState.startX; 
      const dy = pos.y - dragState.startY;
      updatePosition(selectedElement, { 
        x: Math.round((dragState.originalSettings.x + dx) / 5) * 5, 
        y: Math.round((dragState.originalSettings.y + dy) / 5) * 5 
      });
    } else if (dragState.action === 'scale') {
      const d = Math.hypot(pos.x - box.cx, pos.y - box.cy) / Math.hypot(dragState.startX - box.cx, dragState.startY - box.cy);
      updatePosition(selectedElement, { 
        scale: Math.max(0.1, (dragState.originalSettings.scale || 1) * d) 
      });
    } else if (dragState.action === 'rotate') {
      const angle = (Math.atan2(pos.y - box.cy, pos.x - box.cx) - Math.atan2(dragState.startY - box.cy, dragState.startX - box.cx)) * 180 / Math.PI;
      let rot = (dragState.originalSettings.rotation || 0) + angle;
      if (e.shiftKey) rot = Math.round(rot / 45) * 45;
      updatePosition(selectedElement, { rotation: Math.round(rot) });
    }
  }, [dragState, selectedElement, isEditMode, getMousePos, currentBoxes, updatePosition, canvasRef]);

  const handleMouseUp = useCallback(() => {
    setDragState({ isDragging: false, action: null, startX: 0, startY: 0, originalSettings: null });
  }, []);

  return { handleMouseDown, handleMouseMove, handleMouseUp };
};
