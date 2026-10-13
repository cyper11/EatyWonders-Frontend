import React, { useEffect, useMemo, useRef, useState } from 'react';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';

const fileKey = (f) => `${f.name}-${f.size}-${f.lastModified}`;

/**
 * Photo/video picker with reordering. The order of `files` is the upload order,
 * so the first item becomes the post's cover image.
 */
export default function MediaPicker({ files, setFiles, id = 'media-picker', disabled = false }) {
  const inputRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [announcement, setAnnouncement] = useState('');

  // Object URLs for previews, revoked when files change
  const previews = useMemo(() => files.map((f) => ({ key: fileKey(f), url: URL.createObjectURL(f), isVideo: f.type.startsWith('video/') })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const addFiles = (list) => {
    const incoming = Array.from(list || []);
    if (!incoming.length) return;
    setFiles((prev) => {
      const seen = new Set(prev.map(fileKey));
      return [...prev, ...incoming.filter((f) => !seen.has(fileKey(f)))];
    });
  };

  const move = (from, to) => {
    if (to < 0 || to >= files.length || from === to) return;
    setFiles((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setAnnouncement(`Moved to position ${to + 1} of ${files.length}${to === 0 ? ', now the cover' : ''}.`);
  };

  const remove = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setAnnouncement('Removed.');
  };

  const navBtn =
    'w-8 h-8 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white';

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        id={id}
        accept="image/*,video/*"
        multiple
        className="visually-hidden"
        disabled={disabled}
        onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
      />

      {files.length === 0 ? (
        <label
          htmlFor={id}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          className="flex flex-col items-center justify-center gap-2 min-h-[140px] px-4 py-6 rounded-card border-2 border-dashed border-strong bg-background-secondary/50 text-center cursor-pointer hover:border-brand-accent hover:bg-brand-accent/5 transition-colors"
        >
          <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 32, color: 'var(--accent)' }} aria-hidden="true" />
          <span className="font-semibold text-content-primary">Add photos or videos</span>
          <span className="text-sm text-content-secondary">Click to choose, or drop files here. You can reorder them after.</span>
        </label>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <p className="m-0 text-sm font-semibold text-content-primary">
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
            </p>
            <p className="m-0 text-xs text-content-secondary hidden sm:block">Drag to reorder · first is the cover</p>
          </div>

          <ol className="grid grid-cols-2 sm:grid-cols-3 gap-3 list-none p-0 m-0" aria-label="Selected media, in upload order">
            {previews.map((p, i) => (
              <li
                key={p.key}
                draggable={!disabled}
                onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
                onDragLeave={() => setOverIndex((o) => (o === i ? null : o))}
                onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) move(dragIndex, i); setDragIndex(null); setOverIndex(null); }}
                onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                className={`relative aspect-square rounded-card overflow-hidden bg-black group cursor-grab active:cursor-grabbing transition-[box-shadow,opacity] ${
                  dragIndex === i ? 'opacity-40' : ''
                } ${overIndex === i && dragIndex !== i ? 'ring-4 ring-brand-accent' : 'ring-1 ring-black/10'}`}
              >
                {p.isVideo ? (
                  <>
                    <video src={p.url} className="w-full h-full object-cover" muted playsInline preload="metadata" aria-hidden="true" />
                    <PlayCircleOutlineRoundedIcon
                      sx={{ fontSize: 36, color: '#fff', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  <img src={p.url} alt={`Selected file ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />
                )}

                <span className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="min-w-[24px] h-6 px-1.5 grid place-items-center rounded-full bg-black/70 text-white text-xs font-bold tabular-nums">
                    {i + 1}
                  </span>
                  {i === 0 && (
                    <span className="h-6 px-2 grid place-items-center rounded-full bg-[var(--leaf-300)] text-[#12251a] text-xs font-bold">Cover</span>
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={disabled}
                  aria-label={`Remove file ${i + 1}`}
                  className={`absolute top-2 right-2 ${navBtn}`}
                >
                  <CloseRoundedIcon sx={{ fontSize: 18 }} />
                </button>

                <span className="absolute inset-x-2 bottom-2 flex items-center justify-between">
                  <button type="button" className={navBtn} onClick={() => move(i, i - 1)} disabled={disabled || i === 0} aria-label={`Move file ${i + 1} earlier`}>
                    <ChevronLeftRoundedIcon sx={{ fontSize: 20 }} />
                  </button>
                  <DragIndicatorRoundedIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,.85)', display: { xs: 'none', sm: 'block' } }} aria-hidden="true" />
                  <button type="button" className={navBtn} onClick={() => move(i, i + 1)} disabled={disabled || i === files.length - 1} aria-label={`Move file ${i + 1} later`}>
                    <ChevronRightRoundedIcon sx={{ fontSize: 20 }} />
                  </button>
                </span>
              </li>
            ))}

            <li>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="w-full aspect-square flex flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-strong text-content-secondary hover:border-brand-accent hover:text-brand-accent transition-colors"
              >
                <AddPhotoAlternateOutlinedIcon aria-hidden="true" />
                <span className="text-sm font-semibold">Add more</span>
              </button>
            </li>
          </ol>
        </>
      )}

      <p className="visually-hidden" aria-live="polite">{announcement}</p>
    </div>
  );
}
