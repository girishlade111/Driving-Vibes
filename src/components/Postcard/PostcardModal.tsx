import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Download,
  Sparkles,
  X,
  Check,
  RefreshCw,
  Type,
  Image as ImageIcon,
  Sliders,
  Layers,
  Copy,
  Shuffle,
  Monitor,
  Smartphone,
  Mail,
  Square,
  Tv,
  Upload,
  Palette,
  Eye,
  Zap,
} from 'lucide-react';
import {
  PostcardModalProps,
  PostcardRenderState,
  TemplateId,
  SizeId,
  FontStyleId,
  ColorFilterId,
  BadgeId,
  BackdropSource,
} from './postcardTypes';
import {
  TEMPLATES,
  SIZES,
  FONT_STYLES,
  COLOR_FILTERS,
  BADGE_OPTIONS,
  CURATED_BACKDROPS,
  QUOTES,
  KANJI_STAMPS,
  TELEMETRY_PRESETS,
  DEFAULT_RENDER_STATE,
} from './postcardAssets';
import { renderPostcardStudioCanvas } from './postcardCanvasRenderer';

type TabKey = 'styles' | 'backdrop' | 'typography' | 'badges' | 'fx' | 'format';

export const PostcardModal: React.FC<PostcardModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  activeBgPreset,
  customBgUrl,
  onApplyWallpaper,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [renderState, setRenderState] = useState<PostcardRenderState>(() => {
    try {
      const saved = localStorage.getItem('driving_vibes_postcard_state');
      if (saved) {
        return { ...DEFAULT_RENDER_STATE, ...JSON.parse(saved) };
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_RENDER_STATE;
  });

  const [activeTab, setActiveTab] = useState<TabKey>('styles');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Sync current track title & artist into render state if not customized
  useEffect(() => {
    if (currentTrack) {
      setRenderState((prev) => ({
        ...prev,
        trackTitle: currentTrack.name || 'Midnight Highway Drift',
        artistName: 'Driving Vibes Ambient Radio',
      }));
    }
  }, [currentTrack]);

  // Show Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Master Render Callback
  const renderPostcard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRendering(true);
    try {
      const activeAppImage =
        customBgUrl || activeBgPreset?.imageSrc?.desktop || '/backgrounds/desktop-background.png';

      const url = await renderPostcardStudioCanvas(canvas, renderState, activeAppImage);
      setPreviewUrl(url);

      // Save state to localStorage
      try {
        localStorage.setItem(
          'driving_vibes_postcard_state',
          JSON.stringify({
            template: renderState.template,
            size: renderState.size,
            backdropSource: renderState.backdropSource,
            curatedBackdropId: renderState.curatedBackdropId,
            fontStyle: renderState.fontStyle,
            colorFilter: renderState.colorFilter,
            activeBadges: renderState.activeBadges,
            grainIntensity: renderState.grainIntensity,
            scanlinesIntensity: renderState.scanlinesIntensity,
            vignetteIntensity: renderState.vignetteIntensity,
          })
        );
      } catch {
        /* ignore */
      }
    } catch (err) {
      console.error('Canvas render error:', err);
    } finally {
      setIsRendering(false);
    }
  }, [renderState, activeBgPreset, customBgUrl]);

  // Re-render when open or state changes (debounced)
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(renderPostcard, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, renderPostcard]);

  // Keyboard escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Template switch handler (updates theme defaults)
  const handleSelectTemplate = (tplId: TemplateId) => {
    const tpl = TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;

    const newBadges = { ...renderState.activeBadges };
    BADGE_OPTIONS.forEach((b) => {
      newBadges[b.id] = tpl.defaultBadges.includes(b.id);
    });

    setRenderState((prev) => ({
      ...prev,
      template: tplId,
      colorFilter: tpl.defaultFilter,
      fontStyle: tpl.defaultFont,
      activeBadges: newBadges,
    }));
  };

  // Randomize / Quick Shuffle Vibe
  const handleRandomize = () => {
    const randomTemplate = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    const randomBackdrop = CURATED_BACKDROPS[Math.floor(Math.random() * CURATED_BACKDROPS.length)];
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const randomKanji = KANJI_STAMPS[Math.floor(Math.random() * KANJI_STAMPS.length)];
    const randomTelemetry = TELEMETRY_PRESETS[Math.floor(Math.random() * TELEMETRY_PRESETS.length)];
    const randomFilter = COLOR_FILTERS[Math.floor(Math.random() * COLOR_FILTERS.length)];
    const randomFont = FONT_STYLES[Math.floor(Math.random() * FONT_STYLES.length)];

    setRenderState((prev) => ({
      ...prev,
      template: randomTemplate.id,
      backdropSource: 'curated',
      curatedBackdropId: randomBackdrop.id,
      quote: randomQuote,
      selectedKanjiId: randomKanji.id,
      selectedTelemetryId: randomTelemetry.id,
      colorFilter: randomFilter.id,
      fontStyle: randomFont.id,
    }));

    showToast('🎲 Randomized Vibe & Aesthetics!');
  };

  // Download High-Res File
  const handleDownload = () => {
    if (!previewUrl) return;
    setDownloading(true);

    const a = document.createElement('a');
    a.href = previewUrl;
    const sizeOpt = SIZES.find((s) => s.id === renderState.size) ?? SIZES[0];
    const cleanTitle = (renderState.trackTitle || 'driving-vibes')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    a.download = `driving-vibes-${renderState.template}-${sizeOpt.id}-${cleanTitle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloading(false);
      showToast('✨ Wallpaper downloaded in Ultra HD!');
    }, 600);
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          // @ts-ignore
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          showToast('📋 Copied High-Res Image to Clipboard!');
        } catch (err) {
          showToast('⚠️ Clipboard copy unsupported in this browser.');
        }
      }, 'image/png');
    } catch {
      showToast('⚠️ Could not copy image.');
    }
  };

  // Set as App Wallpaper
  const handleApplyAsAppWallpaper = () => {
    if (!previewUrl) return;
    if (onApplyWallpaper) {
      onApplyWallpaper(previewUrl);
      showToast('🚀 Applied directly as App Background Wallpaper!');
    } else {
      showToast('✨ Wallpaper ready for use!');
    }
  };

  // Custom File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setRenderState((prev) => ({
        ...prev,
        backdropSource: 'custom_upload',
        customBackdropUrl: dataUrl,
      }));
      showToast('📁 Custom photo uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  // Toggle Badge
  const toggleBadge = (badgeId: BadgeId) => {
    setRenderState((prev) => ({
      ...prev,
      activeBadges: {
        ...prev.activeBadges,
        [badgeId]: !prev.activeBadges[badgeId],
      },
    }));
  };

  if (!isOpen) return null;

  const currentTemplate =
    TEMPLATES.find((t) => t.id === renderState.template) ?? TEMPLATES[0];
  const currentSize = SIZES.find((s) => s.id === renderState.size) ?? SIZES[0];

  const getFormatIcon = (name: SizeOption['iconName']) => {
    switch (name) {
      case 'monitor': return <Monitor className="w-3.5 h-3.5" />;
      case 'smartphone': return <Smartphone className="w-3.5 h-3.5" />;
      case 'mail': return <Mail className="w-3.5 h-3.5" />;
      case 'square': return <Square className="w-3.5 h-3.5" />;
      case 'tv': return <Tv className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xl animate-fadeIn select-none">
      <div
        className="glass-panel w-full max-w-6xl max-h-[95vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/15 animate-slideUp text-white"
        role="dialog"
        aria-modal="true"
        aria-label="Cinematic Postcard & Wallpaper Studio"
      >
        {/* ── Studio Header ── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg"
              style={{
                backgroundColor: `${currentTemplate.primaryColor}20`,
                borderColor: `${currentTemplate.primaryColor}50`,
                color: currentTemplate.primaryColor,
              }}
            >
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-white tracking-wide">
                  Cinematic Postcard & Wallpaper Studio
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10 uppercase">
                  {currentTemplate.tag}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  {currentSize.aspect}
                </span>
              </div>
              <p className="text-xs text-white/50">
                Craft high-resolution aesthetic driving wallpapers, postcards & vinyl sleeves
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomize}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white text-xs font-medium border border-white/10 transition-all active:scale-95"
              title="Randomize aesthetic mix"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Randomize</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Hidden Canvas for full-res render ── */}
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        {/* ── Main Studio Body (Split: Preview Left, Controls Right) ── */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* ── Left: Studio Preview Canvas Stage ── */}
          <div className="w-full md:w-7/12 p-4 md:p-6 flex flex-col justify-between items-center bg-black/40 border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto custom-scrollbar">
            {/* Live Canvas Preview Frame */}
            <div className="w-full flex-1 flex flex-col items-center justify-center relative min-h-[260px] md:min-h-[380px]">
              <div className="relative w-full max-w-xl rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black/80 postcard-preview-container group">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Postcard Wallpaper preview"
                    className="w-full h-auto max-h-[360px] md:max-h-[460px] object-contain block mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-white/40 gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                    <span className="text-xs">Compositing ultra-res artwork…</span>
                  </div>
                )}

                {isRendering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/80 border border-white/15 text-xs text-white">
                      <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                      <span>Updating live canvas…</span>
                    </div>
                  </div>
                )}

                {/* Shimmer sweep animation */}
                <div className="postcard-shimmer" aria-hidden="true" />
              </div>
            </div>

            {/* Stage Quick Actions Bar */}
            <div className="w-full max-w-xl mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={renderPostcard}
                  disabled={isRendering}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white border border-white/10 transition-colors"
                  title="Redraw canvas"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRendering ? 'animate-spin' : ''}`} />
                  <span>Redraw</span>
                </button>

                <button
                  onClick={handleCopyImage}
                  disabled={!previewUrl || isRendering}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white border border-white/10 transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Copy</span>
                </button>

                {onApplyWallpaper && (
                  <button
                    onClick={handleApplyAsAppWallpaper}
                    disabled={!previewUrl || isRendering}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white border border-white/10 transition-colors"
                    title="Set as App Background"
                  >
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    <span>Set as App BG</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleDownload}
                disabled={!previewUrl || isRendering || downloading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {downloading ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <Download className="w-4 h-4 stroke-[3]" />
                )}
                <span>{downloading ? 'Saving HD File…' : 'Download Ultra HD'}</span>
              </button>
            </div>
          </div>

          {/* ── Right: Studio Controls Inspector Decks ── */}
          <div className="w-full md:w-5/12 flex flex-col bg-white/[0.02] overflow-hidden">
            {/* Tab Bar */}
            <div className="flex overflow-x-auto gap-1 p-2 border-b border-white/10 bg-white/[0.02] shrink-0 custom-scrollbar">
              {(
                [
                  ['styles', Layers, 'Styles'],
                  ['backdrop', ImageIcon, 'Backdrop'],
                  ['typography', Type, 'Text & Quotes'],
                  ['badges', Sparkles, 'Badges & HUD'],
                  ['fx', Sliders, 'FX & Grade'],
                  ['format', Palette, 'Format'],
                ] as const
              ).map(([tab, Icon, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 min-w-[70px] flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-[11px] font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                      : 'text-white/45 hover:text-white/80 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>

            {/* Tab Panels Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 custom-scrollbar">
              {/* ── 1. STYLES & TEMPLATES TAB ── */}
              {activeTab === 'styles' && (
                <div className="space-y-2.5">
                  <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1">
                    Signature Design Templates
                  </div>
                  {TEMPLATES.map((t) => {
                    const isSelected = renderState.template === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTemplate(t.id)}
                        className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400/50 text-white shadow-md'
                            : 'bg-white/[0.03] border-white/[0.06] text-white/70 hover:bg-white/[0.08] hover:text-white'
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border"
                          style={{
                            backgroundColor: `${t.primaryColor}25`,
                            borderColor: `${t.primaryColor}50`,
                          }}
                        >
                          {t.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{t.label}</span>
                            <span className="text-[10px] font-mono text-white/40">{t.tag}</span>
                          </div>
                          <p className="text-[11px] text-white/45 mt-0.5 line-clamp-1">{t.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center shrink-0 mt-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── 2. BACKDROP & ARTWORK TAB ── */}
              {activeTab === 'backdrop' && (
                <div className="space-y-4">
                  {/* Backdrop Source Switcher */}
                  <div>
                    <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Backdrop Source
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          ['curated', 'Curated Wallpapers'],
                          ['app_current', 'Current Scene'],
                          ['custom_upload', 'Custom Photo'],
                        ] as const
                      ).map(([source, label]) => (
                        <button
                          key={source}
                          onClick={() =>
                            setRenderState((prev) => ({
                              ...prev,
                              backdropSource: source as BackdropSource,
                            }))
                          }
                          className={`py-2 px-1.5 text-center text-[11px] font-medium rounded-xl border transition-all ${
                            renderState.backdropSource === source
                              ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                              : 'bg-white/[0.03] border-white/[0.06] text-white/55 hover:bg-white/[0.07] hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Curated Wallpaper Gallery */}
                  {renderState.backdropSource === 'curated' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                        Curated 4K Driving Scenes
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {CURATED_BACKDROPS.map((bg) => {
                          const isSelected = renderState.curatedBackdropId === bg.id;
                          return (
                            <button
                              key={bg.id}
                              onClick={() =>
                                setRenderState((prev) => ({
                                  ...prev,
                                  curatedBackdropId: bg.id,
                                }))
                              }
                              className={`relative rounded-xl overflow-hidden border text-left group transition-all ${
                                isSelected
                                  ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                                  : 'border-white/10 hover:border-white/30'
                              }`}
                            >
                              <div className="h-20 bg-black/50 overflow-hidden relative">
                                <img
                                  src={bg.thumbnail}
                                  alt={bg.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <span className="absolute top-1.5 left-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-white/80 border border-white/10">
                                  {bg.category}
                                </span>
                                {isSelected && (
                                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                              <div className="p-2 bg-white/[0.04]">
                                <div className="text-[11px] font-bold text-white truncate">
                                  {bg.title}
                                </div>
                                <div className="text-[9px] text-white/40 truncate">{bg.subtitle}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Custom Photo Upload */}
                  {renderState.backdropSource === 'custom_upload' && (
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-8 border-2 border-dashed border-white/20 hover:border-amber-400/60 rounded-2xl flex flex-col items-center justify-center gap-2 bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
                      >
                        <Upload className="w-6 h-6 text-white/40 group-hover:text-amber-400 transition-colors" />
                        <span className="text-xs font-semibold text-white/70 group-hover:text-white">
                          Click to upload your driving photo
                        </span>
                        <span className="text-[10px] text-white/35">PNG, JPG, WebP up to 20MB</span>
                      </button>

                      {renderState.customBackdropUrl && (
                        <div className="relative rounded-xl overflow-hidden border border-white/20 h-28">
                          <img
                            src={renderState.customBackdropUrl}
                            alt="Uploaded custom backdrop"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded bg-black/70 text-white border border-white/15">
                            Active custom photo
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Current Scene Info */}
                  {renderState.backdropSource === 'app_current' && (
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Eye className="w-4 h-4 text-cyan-400" />
                        <span>Synchronized with Current App Visualizer</span>
                      </div>
                      <p className="text-[11px] text-white/45">
                        The postcard automatically composites whatever visual preset is currently running in your background player.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── 3. TYPOGRAPHY & QUOTES TAB ── */}
              {activeTab === 'typography' && (
                <div className="space-y-4">
                  {/* Track Title */}
                  <div>
                    <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                      Track Title
                    </label>
                    <input
                      type="text"
                      value={renderState.trackTitle}
                      onChange={(e) =>
                        setRenderState((prev) => ({ ...prev, trackTitle: e.target.value }))
                      }
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/40"
                    />
                  </div>

                  {/* Artist / Subtitle */}
                  <div>
                    <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                      Artist / Soundscape Subtitle
                    </label>
                    <input
                      type="text"
                      value={renderState.artistName}
                      onChange={(e) =>
                        setRenderState((prev) => ({ ...prev, artistName: e.target.value }))
                      }
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/40"
                    />
                  </div>

                  {/* Font Family Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Typography Font Style
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FONT_STYLES.map((f) => (
                        <button
                          key={f.id}
                          onClick={() =>
                            setRenderState((prev) => ({
                              ...prev,
                              fontStyle: f.id as FontStyleId,
                            }))
                          }
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            renderState.fontStyle === f.id
                              ? 'bg-amber-500/20 border-amber-400/40 text-white'
                              : 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold truncate" style={{ fontFamily: f.fontFamily }}>
                            {f.label}
                          </div>
                          <div className="text-[9px] text-white/40 truncate mt-0.5">{f.styleDesc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mood Quotes Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                        Curated Mood Quotes
                      </label>
                      <button
                        onClick={() => {
                          const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
                          setRenderState((prev) => ({ ...prev, quote: q }));
                        }}
                        className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        <Shuffle className="w-2.5 h-2.5" />
                        <span>Shuffle quote</span>
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {QUOTES.map((q) => (
                        <button
                          key={q}
                          onClick={() => setRenderState((prev) => ({ ...prev, quote: q }))}
                          className={`w-full px-3 py-2 rounded-xl text-left text-[11px] border transition-all ${
                            renderState.quote === q
                              ? 'bg-amber-500/15 border-amber-400/35 text-amber-200'
                              : 'bg-white/[0.03] border-white/[0.05] text-white/55 hover:bg-white/[0.07] hover:text-white'
                          }`}
                        >
                          "{q}"
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Note */}
                  <div>
                    <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                      Personal Signature Note <span className="text-white/30 normal-case font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={renderState.customMessage}
                      onChange={(e) =>
                        setRenderState((prev) => ({
                          ...prev,
                          customMessage: e.target.value.slice(0, 90),
                        }))
                      }
                      placeholder="e.g. Midnight thoughts on Route 101…"
                      rows={2}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/25 resize-none focus:outline-none focus:border-amber-400/40"
                    />
                  </div>
                </div>
              )}

              {/* ── 4. BADGES & HUD GRAPHICS TAB ── */}
              {activeTab === 'badges' && (
                <div className="space-y-4">
                  {/* Badge Switches */}
                  <div>
                    <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Aesthetic Graphics & Badges
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {BADGE_OPTIONS.map((badge) => {
                        const isActive = renderState.activeBadges[badge.id];
                        return (
                          <button
                            key={badge.id}
                            onClick={() => toggleBadge(badge.id)}
                            className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                              isActive
                                ? 'bg-amber-500/15 border-amber-400/40 text-white'
                                : 'bg-white/[0.03] border-white/[0.06] text-white/55 hover:bg-white/[0.06] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-base">{badge.icon}</span>
                              <div>
                                <div className="text-xs font-bold">{badge.label}</div>
                                <div className="text-[10px] text-white/40">{badge.desc}</div>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                                isActive
                                  ? 'bg-amber-400 border-amber-400 text-black'
                                  : 'border-white/20 bg-black/40'
                              }`}
                            >
                              {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Japanese Kanji Calligraphy Selector */}
                  {renderState.activeBadges.kanji_stamp && (
                    <div>
                      <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                        Kanji Calligraphy Phrase
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {KANJI_STAMPS.map((k) => (
                          <button
                            key={k.id}
                            onClick={() =>
                              setRenderState((prev) => ({ ...prev, selectedKanjiId: k.id }))
                            }
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              renderState.selectedKanjiId === k.id
                                ? 'bg-amber-500/20 border-amber-400/40 text-white'
                                : 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06]'
                            }`}
                          >
                            <div className="text-xs font-bold font-['Noto_Sans_JP']">{k.kanji}</div>
                            <div className="text-[10px] text-white/45">{k.english}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* HUD Telemetry Selector */}
                  {renderState.activeBadges.telemetry_hud && (
                    <div>
                      <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                        Telemetry GPS Location
                      </label>
                      <div className="space-y-1.5">
                        {TELEMETRY_PRESETS.map((t) => (
                          <button
                            key={t.id}
                            onClick={() =>
                              setRenderState((prev) => ({ ...prev, selectedTelemetryId: t.id }))
                            }
                            className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                              renderState.selectedTelemetryId === t.id
                                ? 'bg-amber-500/20 border-amber-400/40 text-white'
                                : 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06]'
                            }`}
                          >
                            <div className="text-xs font-bold">{t.title}</div>
                            <div className="text-[10px] font-mono text-white/40 mt-0.5 truncate">
                              {t.coordinates} · {t.speed}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── 5. FX & COLOR GRADE TAB ── */}
              {activeTab === 'fx' && (
                <div className="space-y-4">
                  {/* Color Grading Presets */}
                  <div>
                    <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Cinematic Color Grading
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {COLOR_FILTERS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() =>
                            setRenderState((prev) => ({
                              ...prev,
                              colorFilter: f.id as ColorFilterId,
                            }))
                          }
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                            renderState.colorFilter === f.id
                              ? 'bg-amber-500/20 border-amber-400/40 text-white'
                              : 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06]'
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded-full shrink-0 border border-white/20 shadow-sm"
                            style={{ background: f.previewGradient }}
                          />
                          <span className="text-xs font-medium truncate">{f.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-3 pt-2">
                    {/* Film Grain */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/70">Film Grain Noise</span>
                        <span className="font-mono text-amber-400">{renderState.grainIntensity}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={renderState.grainIntensity}
                        onChange={(e) =>
                          setRenderState((prev) => ({
                            ...prev,
                            grainIntensity: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-amber-400 cursor-pointer h-1.5 rounded-lg bg-white/10"
                      />
                    </div>

                    {/* CRT Scanlines */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/70">CRT Scanlines</span>
                        <span className="font-mono text-amber-400">{renderState.scanlinesIntensity}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={renderState.scanlinesIntensity}
                        onChange={(e) =>
                          setRenderState((prev) => ({
                            ...prev,
                            scanlinesIntensity: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-amber-400 cursor-pointer h-1.5 rounded-lg bg-white/10"
                      />
                    </div>

                    {/* Vignette */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/70">Edge Vignette</span>
                        <span className="font-mono text-amber-400">{renderState.vignetteIntensity}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={renderState.vignetteIntensity}
                        onChange={(e) =>
                          setRenderState((prev) => ({
                            ...prev,
                            vignetteIntensity: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-amber-400 cursor-pointer h-1.5 rounded-lg bg-white/10"
                      />
                    </div>

                    {/* Light Leak / Bloom */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/70">Warm Light Leak</span>
                        <span className="font-mono text-amber-400">{renderState.lightLeakIntensity}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={renderState.lightLeakIntensity}
                        onChange={(e) =>
                          setRenderState((prev) => ({
                            ...prev,
                            lightLeakIntensity: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-amber-400 cursor-pointer h-1.5 rounded-lg bg-white/10"
                      />
                    </div>

                    {/* Background Blur */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/70">Backdrop Bokeh Blur</span>
                        <span className="font-mono text-amber-400">{renderState.blurIntensity}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={renderState.blurIntensity}
                        onChange={(e) =>
                          setRenderState((prev) => ({
                            ...prev,
                            blurIntensity: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-amber-400 cursor-pointer h-1.5 rounded-lg bg-white/10"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 6. FORMAT & RESOLUTIONS TAB ── */}
              {activeTab === 'format' && (
                <div className="space-y-3">
                  <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                    Resolution & Aspect Ratio
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {SIZES.map((s) => {
                      const isSelected = renderState.size === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() =>
                            setRenderState((prev) => ({ ...prev, size: s.id as SizeId }))
                          }
                          className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400/50 text-white shadow-md'
                              : 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-amber-400 border border-white/10">
                              {getFormatIcon(s.iconName)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">{s.label}</div>
                              <div className="text-[10px] text-white/40">{s.hint}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/70">
                              {s.aspect}
                            </span>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Toast Notification Banner ── */}
        {toastMessage && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-black/90 text-white text-xs font-semibold border border-amber-400/50 shadow-2xl backdrop-blur-lg flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
