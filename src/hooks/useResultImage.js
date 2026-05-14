import { useState, useEffect, useCallback, useRef } from 'react';
import useStore from '../store/useStore';
import { assembleCaption } from '../data/captionTemplates';

const imageCache = new Map();

export const useResultImage = (gameData) => {
  const { 
    socialSettings: settings, 
    updateSocialSettings: setSettings,
    squad,
    history
  } = useStore();

  const [previewMode, setPreviewMode] = useState('actual');
  const canvasRef = useRef(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [currentBoxes, setCurrentBoxes] = useState([]);
  const [renderTrigger, setRenderTrigger] = useState(0);

  useEffect(() => {
    const fonts = ['Oswald', 'Bebas Neue', 'Montserrat', 'Outfit', 'Inter', 'Teko', 'Racing Sans One'];
    const linkId = 'google-fonts-studio';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.href = `https://fonts.googleapis.com/css2?family=${fonts.map(f => f.replace(' ', '+')).join(':wght@400;700;900&family=')}:wght@400;700;900&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (document.fonts) {
      document.fonts.ready.then(() => setRenderTrigger(t => t + 1));
    }
  }, []);

  const loadImage = useCallback(async (src) => {
    if (!src) return null;
    if (imageCache.has(src)) return imageCache.get(src);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { imageCache.set(src, img); setRenderTrigger(t => t + 1); resolve(img); };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }, []);

  useEffect(() => {
    loadImage(settings.backgroundImage);
    loadImage(settings.teamLogo);
  }, [settings.backgroundImage, settings.teamLogo, loadImage]);

  const updatePosition = (key, updates) => {
    if (key.startsWith('custom_')) {
      const newElements = (settings.elements || []).map(el => el.id === key ? { ...el, ...updates } : el);
      setSettings({ elements: newElements });
    } else {
      setSettings({ positions: { ...settings.positions, [key]: { ...settings.positions[key], ...updates } } });
    }
  };

  const addElement = (type) => {
    const id = `custom_${type}_${Date.now()}`;
    const newElement = {
      id, type, x: 540, y: 540, rotation: 0, scale: 1, fontSize: 40,
      content: type === 'text' ? 'DEIN TEXT' : '',
      color: type === 'text' ? '#ffffff' : '#84cc16',
      opacity: 1,
      w: type === 'rect' ? 200 : 100, h: type === 'rect' ? 100 : 100,
      fontFamily: '', 
      bold: true
    };
    setSettings({ elements: [...(settings.elements || []), newElement] });
    setSelectedElement(id);
  };

  const removeElement = (id) => {
    setSettings({ elements: (settings.elements || []).filter(el => el.id !== id) });
    setSelectedElement(null);
  };

  const updateSettings = (updates) => setSettings(updates);

  const applyTemplate = (templateKey) => {
    // Classic coordinates:
    // statusGroup: right-aligned from x
    // dateLabel: right-aligned from x
    // ourScore: left-aligned from x
    // theirScore: left-aligned from x
    // vsLabel: right-aligned from x
    // teamLabel: center-aligned from x
    // separatorLine: drawn from x, y with given width (rotates around center)
    // ergebnisLabel: rotated text, drawn upwards from x, y
    // seasonLabel: rotated text, drawn upwards from x, y
    const t = {
      toxic_neon: {
        filters: { blur: 0, brightness: 1.1, grayscale: 0.2 },
        overlayOpacity: 0.4, ownTeamColor: '#84cc16', opponentColor: '#ffffff',
        positions: {
          ergebnisLabel: { x: 120, y: 950, fontSize: 130, bold: true, rotation: 0 },
          seasonLabel: { x: 170, y: 550, fontSize: 24, bold: false, rotation: 0 },
          statusGroup: { x: 1000, y: 80, fontSize: 90, bold: true, rotation: 0 },
          dateLabel: { x: 1000, y: 180, fontSize: 24, bold: false },
          ourScore: { x: 600, y: 250, fontSize: 280, bold: true }, 
          theirScore: { x: 600, y: 600, fontSize: 280, bold: true }, 
          vsLabel: { x: 550, y: 550, fontSize: 40, bold: true }, 
          teamLabel: { x: 750, y: 950, fontSize: 24, bold: true },
          logo: { x: 920, y: 880 },
          separatorLine: { x: 140, y: 540, width: 800, thickness: 12, rotation: 0 }
        }
      },
      deep_red: {
        filters: { blur: 4, brightness: 0.7, grayscale: 1 },
        overlayOpacity: 0.6, ownTeamColor: '#ef4444', opponentColor: '#ffffff',
        positions: {
          ergebnisLabel: { x: 120, y: 950, fontSize: 110, bold: true, rotation: 0 },
          seasonLabel: { x: 180, y: 950, fontSize: 24, bold: false, rotation: 0 },
          statusGroup: { x: 1000, y: 100, fontSize: 100, bold: true, rotation: 0 },
          dateLabel: { x: 1000, y: 220, fontSize: 18, bold: false },
          ourScore: { x: 200, y: 400, fontSize: 260, bold: true }, 
          theirScore: { x: 680, y: 400, fontSize: 260, bold: true }, 
          vsLabel: { x: 560, y: 540, fontSize: 40, bold: true }, 
          teamLabel: { x: 540, y: 850, fontSize: 24, bold: true },
          logo: { x: 500, y: 880 },
          separatorLine: { x: 350, y: 520, width: 380, thickness: 3, rotation: 90 } 
        }
      },
      clean_pro: {
        filters: { blur: 0, brightness: 1, grayscale: 0 },
        overlayOpacity: 0.2, ownTeamColor: '#3b82f6', opponentColor: '#1e293b',
        positions: {
          ergebnisLabel: { x: 120, y: 900, fontSize: 60, bold: true, rotation: 0 },
          seasonLabel: { x: 120, y: 250, fontSize: 20, bold: false, rotation: 0 },
          statusGroup: { x: 950, y: 100, fontSize: 60, bold: true, rotation: 0 },
          dateLabel: { x: 950, y: 170, fontSize: 18, bold: false },
          ourScore: { x: 220, y: 400, fontSize: 240, bold: true },
          theirScore: { x: 680, y: 400, fontSize: 240, bold: true },
          vsLabel: { x: 560, y: 520, fontSize: 40, bold: true },
          teamLabel: { x: 540, y: 800, fontSize: 24, bold: true },
          logo: { x: 500, y: 850 },
          separatorLine: { x: 120, y: 200, width: 840, thickness: 2, rotation: 0 }
        }
      },
      custom_blank: {
        filters: { blur: 0, brightness: 1, grayscale: 0 },
        overlayOpacity: 0.55, ownTeamColor: '#ffffff', opponentColor: '#ef4444',
        positions: {
          ergebnisLabel: { x: 230, y: 920, fontSize: 110, bold: true, rotation: 0 },
          seasonLabel: { x: 230, y: 550, fontSize: 24, bold: false, rotation: 0 },
          statusGroup: { x: 800, y: 160, fontSize: 82, bold: false, rotation: 0 },
          dateLabel: { x: 780, y: 310, fontSize: 24, bold: false, rotation: 0 },
          ourScore: { x: 650, y: 440, fontSize: 180, bold: false, rotation: 0 },
          theirScore: { x: 650, y: 620, fontSize: 180, bold: false, rotation: 0 },
          vsLabel: { x: 630, y: 570, fontSize: 22, bold: false, rotation: 0 },
          teamLabel: { x: 510, y: 830, fontSize: 22, bold: false, rotation: 0 },
          logo: { x: 470, y: 850, rotation: 0 },
          separatorLine: { x: 250, y: 225, width: 550, thickness: 3, rotation: 0 }
        }
      }
    }[templateKey];
    if (t) {
      setSettings({
        filters: t.filters, overlayOpacity: t.overlayOpacity,
        ownTeamColor: t.ownTeamColor, opponentColor: t.opponentColor,
        positions: { ...settings.positions, ...t.positions }
      });
    }
  };

  const getP = useCallback((key) => {
    return { ...(settings?.positions?.[key] || {}) };
  }, [settings]);

  const formatGameDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['SO.', 'MO.', 'DI.', 'MI.', 'DO.', 'FR.', 'SA.'];
    return `${days[date.getDay()]}, ${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.`;
  };

  const render = useCallback(async () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 1080; const H = 1080;
    canvas.width = W; canvas.height = H;

    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H);
    const bg = await loadImage(settings.backgroundImage);
    if (bg) {
      ctx.save();
      const f = settings.filters || {};
      ctx.filter = `blur(${f.blur || 0}px) brightness(${f.brightness ?? 1}) grayscale(${f.grayscale || 0})`;
      const scale = Math.max(W / bg.width, H / bg.height);
      const sw = bg.width * scale; const sh = bg.height * scale;
      ctx.drawImage(bg, (W - sw) / 2, (H - sh) / 2, sw, sh);
      ctx.restore();
    }
    ctx.fillStyle = `rgba(0,0,0,${settings.overlayOpacity || 0})`; ctx.fillRect(0, 0, W, H);

    let sH = gameData?.score?.heim ?? 0; let sG = gameData?.score?.gegner ?? 0;
    let isA = gameData?.settings?.isAuswaertsspiel; let gameDate = gameData?.date || gameData?.timestamp;

    if (previewMode === 'win') { sH = 27; sG = 18; isA = false; }
    else if (previewMode === 'away_win') { sH = 24; sG = 32; isA = true; }
    else if (previewMode === 'loss') { sH = 23; sG = 35; isA = false; }
    else if (previewMode === 'draw') { sH = 25; sG = 25; isA = false; }

    const isWin = (sH > sG && !isA) || (sG > sH && isA);
    const statusText = sH === sG ? 'UNENTSCHIEDEN' : (isWin ? (isA ? 'AUSWÄRTSSIEG' : 'HEIMSIEG') : 'NIEDERLAGE');
    const topScore = sH; const bottomScore = sG;
    const topColor = isA ? settings.opponentColor : settings.ownTeamColor;
    const bottomColor = isA ? settings.ownTeamColor : settings.opponentColor;

    const boxes = [];
    const drawWithTransform = (key, x, y, w, h, drawFn) => {
      const p = key.startsWith('custom_') ? (settings.elements || []).find(el => el.id === key) : getP(key);
      if (!p) return;
      const cx = x + w / 2; const cy = y + h / 2;
      boxes.push({ key, x, y, w, h, cx, cy, scale: p.scale ?? 1, rotation: p.rotation ?? 0 });
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(((p.rotation || 0) * Math.PI) / 180); ctx.scale(p.scale ?? 1, p.scale ?? 1); ctx.translate(-cx, -cy);
      drawFn(x, y, w, h, p);
      if (isEditMode) {
        const isS = selectedElement === key;
        ctx.strokeStyle = isS ? '#84cc16' : 'rgba(255,255,255,0.2)'; ctx.lineWidth = 3 / (p.scale || 1);
        if (isS) ctx.setLineDash([]); else ctx.setLineDash([10, 5]);
        ctx.strokeRect(x, y, w, h);
        if (isS) {
          ctx.fillStyle = '#fff'; ctx.strokeStyle = '#84cc16';
          ctx.beginPath(); ctx.arc(x + w, y + h, 12 / (p.scale || 1), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y - 40 / (p.scale || 1)); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, y - 40 / (p.scale || 1), 12 / (p.scale || 1), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
      }
      ctx.restore();
    };

    const gF = settings.fontFamily || 'Oswald';

    // RENDER CUSTOM SHAPES
    (settings.elements || []).forEach(el => {
      if (el.type === 'rect' || el.type === 'circle') {
        drawWithTransform(el.id, el.x - el.w/2, el.y - el.h/2, el.w, el.h, (rx, ry, rw, rh) => {
          ctx.globalAlpha = el.opacity ?? 1; ctx.fillStyle = el.color;
          if (el.type === 'rect') ctx.fillRect(rx, ry, rw, rh);
          else { ctx.beginPath(); ctx.ellipse(rx + rw/2, ry + rh/2, rw/2, rh/2, 0, 0, Math.PI * 2); ctx.fill(); }
          ctx.globalAlpha = 1;
        });
      }
    });

    // RENDER CORE
    const pE = getP('ergebnisLabel');
    const fE = `${pE.bold ? 'bold' : '400'} ${pE.fontSize}px "${pE.fontFamily || gF}"`;
    ctx.font = fE; const wE = ctx.measureText('ERGEBNIS').width;
    drawWithTransform('ergebnisLabel', pE.x - pE.fontSize/2, pE.y - wE, pE.fontSize, wE, () => {
      ctx.save(); ctx.translate(pE.x, pE.y); ctx.rotate(-Math.PI / 2); ctx.font = fE; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('ERGEBNIS', 0, 0); ctx.restore();
    });

    const pS = getP('seasonLabel');
    const tS = `DER SAISON ${settings.seasonName || '25/26'}`;
    const fS = `${pS.bold ? 'bold' : '400'} ${pS.fontSize}px "${pS.fontFamily || gF}"`;
    ctx.font = fS; const wS = ctx.measureText(tS).width;
    drawWithTransform('seasonLabel', pS.x - pS.fontSize/2, pS.y - wS, pS.fontSize, wS, () => {
      ctx.save(); ctx.translate(pS.x, pS.y); ctx.rotate(-Math.PI / 2); ctx.font = fS; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(tS, 0, 0); ctx.restore();
    });

    const pSt = getP('statusGroup');
    const fSt = `${pSt.bold ? 'bold' : '400'} ${pSt.fontSize}px "${pSt.fontFamily || gF}"`;
    ctx.font = fSt; const wSt = ctx.measureText(statusText).width;
    drawWithTransform('statusGroup', pSt.x - wSt, pSt.y, wSt, pSt.fontSize, () => {
      ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText(statusText, pSt.x, pSt.y);
    });

    const pD = getP('dateLabel');
    const tD = formatGameDate(gameDate);
    const fD = `${pD.bold ? 'bold' : '400'} ${pD.fontSize}px "${pD.fontFamily || gF}"`;
    ctx.font = fD; const wD = ctx.measureText(tD).width;
    drawWithTransform('dateLabel', pD.x - wD, pD.y, wD, pD.fontSize, () => {
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText(tD, pD.x, pD.y);
    });

    const pL = getP('separatorLine');
    drawWithTransform('separatorLine', pL.x, pL.y, pL.width, pL.thickness, (rx, ry, rw, rh) => {
      ctx.fillStyle = '#fff'; ctx.fillRect(rx, ry, rw, rh);
    });

    const pO = getP('ourScore'); const pT = getP('theirScore');
    const ourF = `${pO.bold ? 'bold' : '400'} ${pO.fontSize}px "${pO.fontFamily || gF}"`;
    const theF = `${pT.bold ? 'bold' : '400'} ${pT.fontSize}px "${pT.fontFamily || gF}"`;
    ctx.font = ourF; const wO = ctx.measureText(String(topScore)).width;
    drawWithTransform('ourScore', pO.x, pO.y, wO, pO.fontSize, (rx, ry) => { ctx.fillStyle = topColor; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(String(topScore), rx, ry); });
    ctx.font = theF; const wT = ctx.measureText(String(bottomScore)).width;
    drawWithTransform('theirScore', pT.x, pT.y, wT, pT.fontSize, (rx, ry) => { ctx.fillStyle = bottomColor; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(String(bottomScore), rx, ry); });

    const pV = getP('vsLabel');
    const realOppName = isA ? (gameData?.teams?.heim || gameData?.settings?.teamNameHeim) : (gameData?.teams?.gegner || gameData?.settings?.teamNameGegner);
    const tV = `VS. ${isEditMode ? 'GEGNER' : (realOppName || 'GEGNER').toUpperCase()}`;
    const fV = `${pV.bold ? 'bold' : '400'} ${pV.fontSize}px "${pV.fontFamily || gF}"`;
    ctx.font = fV; const wV = ctx.measureText(tV).width;
    drawWithTransform('vsLabel', pV.x - wV, pV.y, wV, pV.fontSize, (rx, ry, rw) => { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(tV, rx + rw, ry + (pV.fontSize/2)); });

    const pTl = getP('teamLabel');
    const tTl = (settings.teamLabel || '1. Herren').toUpperCase();
    const fTl = `${pTl.bold ? 'bold' : '400'} ${pTl.fontSize}px "${pTl.fontFamily || gF}"`;
    ctx.font = fTl; const wTl = ctx.measureText(tTl).width;
    drawWithTransform('teamLabel', pTl.x - wTl/2, pTl.y - pTl.fontSize, wTl, pTl.fontSize, (rx, ry, rw, rh) => { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(tTl, rx + rw/2, ry + rh); });

    const logoImg = await loadImage(settings.teamLogo);
    if (logoImg) {
      const pLogo = getP('logo');
      drawWithTransform('logo', pLogo.x, pLogo.y, 80, 80, (rx, ry) => ctx.drawImage(logoImg, rx, ry, 80, 80));
    }

    // RENDER CUSTOM TEXT
    (settings.elements || []).forEach(el => {
      if (el.type === 'text') {
        const font = `${el.bold ? 'bold' : '400'} ${el.fontSize}px "${el.fontFamily || gF}"`;
        ctx.font = font; const metrics = ctx.measureText(el.content); const w = metrics.width; const h = el.fontSize;
        drawWithTransform(el.id, el.x - w/2, el.y - h/2, w, h, (rx, ry) => {
          ctx.globalAlpha = el.opacity ?? 1; ctx.fillStyle = el.color; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(el.content, rx + w/2, ry + h/2); ctx.globalAlpha = 1;
        });
      }
    });

    setCurrentBoxes(boxes);
  }, [settings, gameData, isEditMode, selectedElement, renderTrigger, previewMode, loadImage, getP]);

  const generateCaption = useCallback(() => {
    let sH = gameData?.score?.heim ?? 0;
    let sG = gameData?.score?.gegner ?? 0;
    let isA = gameData?.settings?.isAuswaertsspiel;

    if (previewMode === 'win') { sH = 27; sG = 18; isA = false; }
    else if (previewMode === 'away_win') { sH = 24; sG = 32; isA = true; }
    else if (previewMode === 'loss') { sH = 23; sG = 35; isA = false; }
    else if (previewMode === 'draw') { sH = 25; sG = 25; isA = false; }

    const tH = (gameData?.teams?.heim || gameData?.teamNameHeim || 'HEIM').toUpperCase();
    const tG = (gameData?.teams?.gegner || gameData?.teamNameGegner || 'GEGNER').toUpperCase();

    const dataObj = {
      scoreHeim: sH,
      scoreGegner: sG,
      isAway: isA,
      teamHeim: tH,
      teamGegner: tG,
      statsSummary: gameData?.statsSummary,
      gameLog: gameData?.gameLog || [],
      timestamp: gameData?.timestamp || gameData?.date
    };

    // Wir importieren assembleCaption dynamisch oder binden es ein.
    // Da wir import { assembleCaption } from '../data/captionTemplates'; hinzufügen müssen:
    return assembleCaption(dataObj, settings);
  }, [gameData, previewMode, settings]);

  useEffect(() => { render(); }, [render]);

  return { canvasRef, settings, updatePosition, updateSettings, setIsEditMode, isEditMode, setSelectedElement, selectedElement, currentBoxes, previewMode, setPreviewMode, addElement, removeElement, applyTemplate, generateCaption };
};
