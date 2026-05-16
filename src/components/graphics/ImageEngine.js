/**
 * ImageEngine - Pure JavaScript Canvas Renderer
 * Decoupled from React to allow for easier testing and potential server-side usage.
 */

export class ImageEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 1080;
    this.H = 1080;
    this.boxes = [];
  }

  async render(state, gameData, options = {}) {
    const { ctx, W, H } = this;
    const { isEditMode = false, selectedElement = null, previewMode = 'actual' } = options;
    
    this.boxes = [];
    this.canvas.width = W;
    this.canvas.height = H;

    // 1. Background & Filters
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    if (state.backgroundImage && options.imageCache?.has(state.backgroundImage)) {
      const bg = options.imageCache.get(state.backgroundImage);
      ctx.save();
      const f = state.filters || {};
      ctx.filter = `blur(${f.blur || 0}px) brightness(${f.brightness ?? 1}) grayscale(${f.grayscale || 0})`;
      const scale = Math.max(W / bg.width, H / bg.height);
      const sw = bg.width * scale;
      const sh = bg.height * scale;
      ctx.drawImage(bg, (W - sw) / 2, (H - sh) / 2, sw, sh);
      ctx.restore();
    }
    
    ctx.fillStyle = `rgba(0,0,0,${state.overlayOpacity || 0})`;
    ctx.fillRect(0, 0, W, H);

    // 2. Prepare Data
    const data = this._prepareGameData(gameData, previewMode, state);
    const gF = state.fontFamily || 'Oswald';

    // 3. Render Custom Shapes (Rect/Circle)
    (state.elements || []).forEach(el => {
      if (el.type === 'rect' || el.type === 'circle') {
        this._drawWithTransform(el.id, el.x - el.w/2, el.y - el.h/2, el.w, el.h, state, isEditMode, selectedElement, (rx, ry, rw, rh) => {
          ctx.globalAlpha = el.opacity ?? 1;
          ctx.fillStyle = el.color;
          if (el.type === 'rect') ctx.fillRect(rx, ry, rw, rh);
          else { ctx.beginPath(); ctx.ellipse(rx + rw/2, ry + rh/2, rw/2, rh/2, 0, 0, Math.PI * 2); ctx.fill(); }
          ctx.globalAlpha = 1;
        });
      }
    });

    // 4. Render Core Elements
    this._renderLabels(state, data, gF, isEditMode, selectedElement);
    this._renderScores(state, data, gF, isEditMode, selectedElement);
    this._renderTeamInfo(state, data, gF, isEditMode, selectedElement, options.imageCache);

    // 5. Render Custom Text
    (state.elements || []).forEach(el => {
      if (el.type === 'text') {
        const font = `${el.bold ? 'bold' : '400'} ${el.fontSize}px "${el.fontFamily || gF}"`;
        ctx.font = font;
        const metrics = ctx.measureText(el.content);
        const w = metrics.width;
        const h = el.fontSize;
        this._drawWithTransform(el.id, el.x - w/2, el.y - h/2, w, h, state, isEditMode, selectedElement, (rx, ry) => {
          ctx.globalAlpha = el.opacity ?? 1;
          ctx.fillStyle = el.color;
          ctx.font = font;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.content, rx + w/2, ry + h/2);
          ctx.globalAlpha = 1;
        });
      }
    });

    return this.boxes;
  }

  _prepareGameData(gameData, previewMode, settings) {
    let sH = gameData?.score?.heim ?? 0;
    let sG = gameData?.score?.gegner ?? 0;
    let isA = gameData?.settings?.isAuswaertsspiel;
    const gameDate = gameData?.date || gameData?.timestamp;

    if (previewMode === 'win') { sH = 27; sG = 18; isA = false; }
    else if (previewMode === 'away_win') { sH = 24; sG = 32; isA = true; }
    else if (previewMode === 'loss') { sH = 23; sG = 35; isA = false; }
    else if (previewMode === 'draw') { sH = 25; sG = 25; isA = false; }

    const isWin = (sH > sG && !isA) || (sG > sH && isA);
    const statusText = sH === sG ? 'UNENTSCHIEDEN' : (isWin ? (isA ? 'AUSWÄRTSSIEG' : 'HEIMSIEG') : 'NIEDERLAGE');
    
    return {
      sH, sG, isA, gameDate, statusText,
      topScore: sH,
      bottomScore: sG,
      topColor: isA ? settings.opponentColor : settings.ownTeamColor,
      bottomColor: isA ? settings.ownTeamColor : settings.opponentColor,
      oppName: isA ? (gameData?.teams?.heim || gameData?.settings?.teamNameHeim) : (gameData?.teams?.gegner || gameData?.settings?.teamNameGegner)
    };
  }

  _drawWithTransform(key, x, y, w, h, state, isEditMode, selectedElement, drawFn) {
    const { ctx } = this;
    const p = key.startsWith('custom_') ? (state.elements || []).find(el => el.id === key) : state.positions[key];
    if (!p) return;

    const cx = x + w / 2;
    const cy = y + h / 2;
    const rotation = p.rotation ?? 0;
    const scale = p.scale ?? 1;

    this.boxes.push({ key, x, y, w, h, cx, cy, scale, rotation });

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    
    drawFn(x, y, w, h, p);

    if (isEditMode) {
      const isS = selectedElement === key;
      ctx.strokeStyle = isS ? '#84cc16' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 3 / scale;
      if (isS) ctx.setLineDash([]); else ctx.setLineDash([10, 5]);
      ctx.strokeRect(x, y, w, h);
      
      if (isS) {
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#84cc16';
        ctx.beginPath(); ctx.arc(x + w, y + h, 12 / scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y - 40 / scale); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, y - 40 / scale, 12 / scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore();
  }

  _renderLabels(state, data, gF, isEditMode, selectedElement) {
    const { ctx } = this;
    
    // Ergebnis Label
    const pE = state.positions.ergebnisLabel;
    const fE = `${pE.bold ? 'bold' : '400'} ${pE.fontSize}px "${pE.fontFamily || gF}"`;
    ctx.font = fE;
    const wE = ctx.measureText('ERGEBNIS').width;
    this._drawWithTransform('ergebnisLabel', pE.x - pE.fontSize/2, pE.y - wE, pE.fontSize, wE, state, isEditMode, selectedElement, () => {
      ctx.save(); ctx.translate(pE.x, pE.y); ctx.rotate(-Math.PI / 2); ctx.font = fE; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('ERGEBNIS', 0, 0); ctx.restore();
    });

    // Season Label
    const pS = state.positions.seasonLabel;
    const tS = `DER SAISON ${state.seasonName || '25/26'}`;
    const fS = `${pS.bold ? 'bold' : '400'} ${pS.fontSize}px "${pS.fontFamily || gF}"`;
    ctx.font = fS;
    const wS = ctx.measureText(tS).width;
    this._drawWithTransform('seasonLabel', pS.x - pS.fontSize/2, pS.y - wS, pS.fontSize, wS, state, isEditMode, selectedElement, () => {
      ctx.save(); ctx.translate(pS.x, pS.y); ctx.rotate(-Math.PI / 2); ctx.font = fS; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(tS, 0, 0); ctx.restore();
    });

    // Status Text
    const pSt = state.positions.statusGroup;
    const fSt = `${pSt.bold ? 'bold' : '400'} ${pSt.fontSize}px "${pSt.fontFamily || gF}"`;
    ctx.font = fSt;
    const wSt = ctx.measureText(data.statusText).width;
    this._drawWithTransform('statusGroup', pSt.x - wSt, pSt.y, wSt, pSt.fontSize, state, isEditMode, selectedElement, () => {
      ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText(data.statusText, pSt.x, pSt.y);
    });

    // Date Label
    const pD = state.positions.dateLabel;
    const tD = this._formatDate(data.gameDate);
    const fD = `${pD.bold ? 'bold' : '400'} ${pD.fontSize}px "${pD.fontFamily || gF}"`;
    ctx.font = fD;
    const wD = ctx.measureText(tD).width;
    this._drawWithTransform('dateLabel', pD.x - wD, pD.y, wD, pD.fontSize, state, isEditMode, selectedElement, () => {
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText(tD, pD.x, pD.y);
    });

    // Separator
    const pL = state.positions.separatorLine;
    this._drawWithTransform('separatorLine', pL.x, pL.y, pL.width, pL.thickness, state, isEditMode, selectedElement, (rx, ry, rw, rh) => {
      ctx.fillStyle = '#fff'; ctx.fillRect(rx, ry, rw, rh);
    });
  }

  _renderScores(state, data, gF, isEditMode, selectedElement) {
    const { ctx } = this;
    const pO = state.positions.ourScore;
    const pT = state.positions.theirScore;
    const ourF = `${pO.bold ? 'bold' : '400'} ${pO.fontSize}px "${pO.fontFamily || gF}"`;
    const theF = `${pT.bold ? 'bold' : '400'} ${pT.fontSize}px "${pT.fontFamily || gF}"`;

    ctx.font = ourF;
    const wO = ctx.measureText(String(data.topScore)).width;
    this._drawWithTransform('ourScore', pO.x, pO.y, wO, pO.fontSize, state, isEditMode, selectedElement, (rx, ry) => { 
      ctx.fillStyle = data.topColor; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(String(data.topScore), rx, ry); 
    });

    ctx.font = theF;
    const wT = ctx.measureText(String(data.bottomScore)).width;
    this._drawWithTransform('theirScore', pT.x, pT.y, wT, pT.fontSize, state, isEditMode, selectedElement, (rx, ry) => { 
      ctx.fillStyle = data.bottomColor; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(String(data.bottomScore), rx, ry); 
    });

    // VS Label
    const pV = state.positions.vsLabel;
    const tV = `VS. ${isEditMode ? 'GEGNER' : (data.oppName || 'GEGNER').toUpperCase()}`;
    const fV = `${pV.bold ? 'bold' : '400'} ${pV.fontSize}px "${pV.fontFamily || gF}"`;
    ctx.font = fV;
    const wV = ctx.measureText(tV).width;
    this._drawWithTransform('vsLabel', pV.x - wV, pV.y, wV, pV.fontSize, state, isEditMode, selectedElement, (rx, ry, rw) => { 
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(tV, rx + rw, ry + (pV.fontSize/2)); 
    });
  }

  _renderTeamInfo(state, data, gF, isEditMode, selectedElement, imageCache) {
    const { ctx } = this;
    const pTl = state.positions.teamLabel;
    const tTl = (state.teamLabel || '1. Herren').toUpperCase();
    const fTl = `${pTl.bold ? 'bold' : '400'} ${pTl.fontSize}px "${pTl.fontFamily || gF}"`;
    ctx.font = fTl;
    const wTl = ctx.measureText(tTl).width;
    this._drawWithTransform('teamLabel', pTl.x - wTl/2, pTl.y - pTl.fontSize, wTl, pTl.fontSize, state, isEditMode, selectedElement, (rx, ry, rw, rh) => { 
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(tTl, rx + rw/2, ry + rh); 
    });

    if (state.teamLogo && imageCache?.has(state.teamLogo)) {
      const logoImg = imageCache.get(state.teamLogo);
      const pLogo = state.positions.logo;
      this._drawWithTransform('logo', pLogo.x, pLogo.y, 80, 80, state, isEditMode, selectedElement, (rx, ry) => ctx.drawImage(logoImg, rx, ry, 80, 80));
    }
  }

  _formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['SO.', 'MO.', 'DI.', 'MI.', 'DO.', 'FR.', 'SA.'];
    return `${days[date.getDay()]}, ${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.`;
  }
}
