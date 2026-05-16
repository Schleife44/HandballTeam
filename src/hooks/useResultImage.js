import { useState, useEffect, useCallback, useRef } from 'react';
import useStore from '../store/useStore';
import { assembleCaption } from '../data/captionTemplates';
import { ImageEngine } from '../components/graphics/ImageEngine';
import { TEMPLATES } from '../components/graphics/graphicsConstants';

const imageCache = new Map();

export const useResultImage = (gameData) => {
  const { 
    socialSettings: settings, 
    updateSocialSettings: setSettings,
    squad,
    activeTeamId
  } = useStore();

  const [previewMode, setPreviewMode] = useState('actual');
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [currentBoxes, setCurrentBoxes] = useState([]);
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Initialize Engine
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new ImageEngine(canvasRef.current);
    }
  }, []);

  // Load Fonts
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

  const applyTemplate = (templateKey) => {
    const template = TEMPLATES.find(t => t.id === templateKey);
    if (template) {
      const { config } = template;
      setSettings({
        filters: config.filters, 
        overlayOpacity: config.overlayOpacity,
        ownTeamColor: config.ownTeamColor, 
        opponentColor: config.opponentColor,
        positions: { ...settings.positions, ...config.positions }
      });
    }
  };

  const render = useCallback(async () => {
    if (!engineRef.current) return;
    const boxes = await engineRef.current.render(settings, gameData, {
      isEditMode,
      selectedElement,
      previewMode,
      imageCache
    });
    setCurrentBoxes(boxes);
  }, [settings, gameData, isEditMode, selectedElement, previewMode, renderTrigger]);

  const generateCaption = useCallback(() => {
    const dataObj = { ...gameData };
    // Simulation logic for preview modes
    if (previewMode !== 'actual') {
      const scores = {
        win: { heim: 27, gegner: 18, isAway: false },
        away_win: { heim: 24, gegner: 32, isAway: true },
        loss: { heim: 23, gegner: 35, isAway: false },
        draw: { heim: 25, gegner: 25, isAway: false }
      }[previewMode];
      if (scores) {
        dataObj.score = { heim: scores.heim, gegner: scores.gegner };
        dataObj.settings = { ...dataObj.settings, isAuswaertsspiel: scores.isAway };
      }
    }
    return assembleCaption(dataObj, settings);
  }, [gameData, previewMode, settings]);

  useEffect(() => { render(); }, [render]);

  return { 
    canvasRef, 
    settings, 
    updatePosition, 
    updateSettings: setSettings, 
    setIsEditMode, 
    isEditMode, 
    setSelectedElement, 
    selectedElement, 
    currentBoxes, 
    previewMode, 
    setPreviewMode, 
    addElement, 
    removeElement, 
    applyTemplate, 
    generateCaption 
  };
};
