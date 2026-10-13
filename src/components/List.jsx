import React, { useState, useEffect, useMemo, createRef } from "react";
import { Avatar } from "@mui/material";
import { Link } from "react-router-dom";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import ViewAgendaOutlinedIcon from "@mui/icons-material/ViewAgendaOutlined";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import PlaceDetails from "./PlaceDetails";
import SectionHeader from "./ui/SectionHeader";
import EmptyState from "./ui/EmptyState";
import Button from "./ui/Button";
import { mediaUrl, isVideo, handleImageError, FALLBACK_IMAGE } from "../utils/media";
import { cleanAddress } from '../utils/address';

const PAGE_SIZE = 9;

const SORTS = [
  { value: "new", label: "Newest" },
  { value: "top", label: "Top rated" },
];

const RATING_FILTERS = [
  { value: 5, label: "5" },
  { value: 4, label: "4" },
  { value: 3, label: "3" },
];

// If backend didn't supply grouped `posts`, build them client-side from `uploads`
function buildPostsFromUploads(uploads) {
  if (!Array.isArray(uploads)) return [];
  const map = new Map();
  const singles = [];
  for (const u of uploads) {
    if (u.post_id) {
      const key = `post-${u.post_id}`;
      if (!map.has(key)) {
        map.set(key, {
          id: u.post_id,
          media: [],
          caption: u.caption,
          address: u.address,
          created_at: u.created_at,
          rating_avg: null,
          rating_count: 0,
          user_id: u.user_id,
          author_name: u.author_name,
          author_profile_url: u.author_profile_url,
        });
      }
      const entry = map.get(key);
      entry.media.push({ id: u.id, filename: u.filename, url: u.url, created_at: u.created_at, rating_avg: u.rating_avg, rating_count: u.rating_count });
      // accumulate approximate rating/count (simple sum)
      if (u.rating_avg !== null && u.rating_count !== null) {
        const prevAvg = entry.rating_avg || 0;
        const prevCount = entry.rating_count || 0;
        const totalScore = prevAvg * prevCount + (u.rating_avg || 0) * (u.rating_count || 0);
        const totalCount = prevCount + (u.rating_count || 0);
        entry.rating_avg = totalCount ? totalScore / totalCount : null;
        entry.rating_count = totalCount;
      }
    } else {
      // standalone upload becomes a post-like item
      singles.push({
        id: u.id,
        media: [{ id: u.id, filename: u.filename, url: u.url, created_at: u.created_at }],
        caption: u.caption,
        address: u.address,
        created_at: u.created_at,
        rating_avg: u.rating_avg,
        rating_count: u.rating_count,
        user_id: u.user_id,
        author_name: u.author_name,
        author_profile_url: u.author_profile_url,
      });
    }
  }
  return [...Array.from(map.values()), ...singles];
}

/** Food-app style card: big photo, name + rating, address, who posted it. */
function PostCard({ post: p, layout }) {
  const first = p.media && p.media[0];
  const target = `/post/${first && first.id ? first.id : p.id}`;
  const src = first?.url ? mediaUrl(first.url) : FALLBACK_IMAGE;
  const horizontal = layout === "list";
  const title = p.restaurant_name || p.caption || "Food post";
  const avg = p.rating_avg ? Number(p.rating_avg) : 0;
  const extraMedia = Array.isArray(p.media) ? p.media.length - 1 : 0;

  return (
    <article className={`group relative flex w-full ${horizontal ? "flex-col sm:flex-row sm:gap-4 sm:items-center" : "flex-col"}`}>
      <div
        className={`relative overflow-hidden rounded-[18px] bg-background-secondary shrink-0 ${
          horizontal ? "aspect-[16/10] sm:aspect-[4/3] sm:w-56" : "aspect-[16/10]"
        }`}
      >
        {first && isVideo(first.url) ? (
          <>
            <video className="w-full h-full object-cover" muted playsInline preload="metadata" aria-hidden="true">
              <source src={src} />
            </video>
            <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
              <span className="w-12 h-12 rounded-full grid place-items-center bg-black/55 text-white">
                <PlayArrowRoundedIcon />
              </span>
            </span>
          </>
        ) : (
          <img
            alt=""
            src={src}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={handleImageError}
          />
        )}
        {extraMedia > 0 && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-black/60 text-white">
            <PhotoLibraryOutlinedIcon sx={{ fontSize: 14 }} aria-hidden="true" />
            +{extraMedia}
          </span>
        )}
      </div>

      <div className={`min-w-0 flex-1 ${horizontal ? "pt-3 sm:pt-0" : "pt-3"} px-0.5`}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="m-0 text-[1.05rem] font-bold leading-snug text-content-primary line-clamp-1" style={{ fontFamily: "var(--font-body)", letterSpacing: 0 }}>
            {/* Stretched link: the whole card opens the post; the author link stays clickable */}
            <Link to={target} className="no-underline group-hover:text-brand-accent after:absolute after:inset-0 after:content-['']">
              {title}
            </Link>
          </h3>
          <span className="shrink-0 inline-flex items-center gap-0.5 text-sm font-bold text-content-primary tabular-nums">
            <StarRoundedIcon sx={{ fontSize: 18, color: avg ? "var(--star)" : "var(--text-muted)" }} aria-hidden="true" />
            {avg ? avg.toFixed(1) : <span className="font-semibold text-content-muted">New</span>}
            {p.rating_count ? <span className="font-normal text-content-muted">({p.rating_count})</span> : null}
            <span className="visually-hidden"> rating</span>
          </span>
        </div>
        <p className="m-0 mt-0.5 text-sm text-content-secondary line-clamp-2 leading-snug">{cleanAddress(p.address) || "Cavite"}</p>
        <Link
          to={`/user/${p.user_id}`}
          className="relative z-10 mt-2 inline-flex items-center gap-1.5 min-h-[32px] no-underline text-sm text-content-secondary hover:text-content-primary"
        >
          <Avatar
            src={p.author_profile_url}
            sx={{ width: 22, height: 22, bgcolor: "var(--accent)", color: "var(--on-accent)", fontSize: "0.7rem", fontWeight: 700 }}
          >
            {(p.author_name || "U").charAt(0).toUpperCase()}
          </Avatar>
          <span className="truncate max-w-[200px]">{p.author_name || "Anonymous"}</span>
        </Link>
      </div>
    </article>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-7" aria-busy="true" aria-label="Loading dining spots">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[16/10] rounded-[18px] skeleton" />
          <div className="pt-3 space-y-2">
            <div className="h-4 w-2/3 rounded skeleton" />
            <div className="h-3 w-1/2 rounded skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

const List = ({ places, childClicked, isLoading, type, setType, rating, setRating, uploads = [], posts = [] }) => {
  const [elRefs, setElRefs] = useState([]);
  const [layout, setLayout] = useState("grid");
  const [sort, setSort] = useState("new");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setElRefs((refs) =>
      Array(places?.length || 0)
        .fill()
        .map((_, i) => refs[i] || createRef())
    );
  }, [places?.length]);

  const displayedPosts = Array.isArray(posts) && posts.length > 0 ? posts : buildPostsFromUploads(uploads);
  const selectedRating = Number(rating || 0);

  const combinedItems = useMemo(() => {
    const filteredPosts = displayedPosts.filter((p) => {
      const avg = p.rating_avg !== null ? Number(p.rating_avg) : 0;
      if (selectedRating === 0) return true;
      return Math.round(avg) === selectedRating;
    });
    const sortedPosts =
      sort === "top"
        ? [...filteredPosts].sort((a, b) => (Number(b.rating_avg) || 0) - (Number(a.rating_avg) || 0) || (b.rating_count || 0) - (a.rating_count || 0))
        : [...filteredPosts].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return [
      ...sortedPosts.map((post) => ({ kind: "post", id: `post-${post.id}`, post })),
      ...(selectedRating === 0
        ? (places || []).map((place, i) => ({ kind: "place", id: `place-${i}`, place, placeIndex: i }))
        : []),
    ];
  }, [displayedPosts, places, selectedRating, sort]);

  const visibleItems = combinedItems.slice(0, visibleCount);
  const remaining = combinedItems.length - visibleItems.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [rating, type, sort, places?.length, displayedPosts.length]);

  const gridClass =
    layout === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-7"
      : "grid grid-cols-1 gap-6 max-w-4xl";

  const filterChip = (pressed) =>
    `shrink-0 inline-flex items-center gap-1 min-h-[40px] px-4 rounded-full text-sm font-semibold border transition-colors ${
      pressed
        ? "bg-content-primary text-background-primary border-transparent"
        : "bg-surface text-content-primary border-strong hover:border-brand-accent"
    }`;

  return (
    <section id="discover" aria-labelledby="discover-title" className="scroll-mt-24 py-12 sm:py-16 border-t border-subtle">
      <SectionHeader
        id="discover-title"
        title="Discover Cavite's dining spots"
        lede="Latest food finds from locals and restaurant owners."
      />

      {/* Filter strip: scrolls sideways on phones, like food apps */}
      <div className="mt-5 flex items-center gap-3">
        <div
          className="flex-1 min-w-0 flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 py-1"
          role="toolbar"
          aria-label="Sort and filter"
        >
          {SORTS.map((s) => (
            <button key={s.value} type="button" className={filterChip(sort === s.value && selectedRating === 0)} aria-pressed={sort === s.value && selectedRating === 0} onClick={() => { setSort(s.value); setRating(0); }}>
              {s.label}
            </button>
          ))}
          <span className="shrink-0 w-px my-2 bg-[var(--border-strong)]" aria-hidden="true" />
          {RATING_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={filterChip(selectedRating === f.value)}
              aria-pressed={selectedRating === f.value}
              aria-label={`${f.value}-star posts`}
              onClick={() => setRating(selectedRating === f.value ? 0 : f.value)}
            >
              <StarRoundedIcon sx={{ fontSize: 17, color: selectedRating === f.value ? "inherit" : "var(--star)" }} aria-hidden="true" />
              {f.label}
            </button>
          ))}
        </div>

        <div className="hidden sm:inline-flex p-1 rounded-full bg-background-secondary border border-subtle shrink-0" role="group" aria-label="Layout">
          {[
            { value: "grid", label: "Grid view", icon: <GridViewRoundedIcon sx={{ fontSize: 20 }} /> },
            { value: "list", label: "List view", icon: <ViewAgendaOutlinedIcon sx={{ fontSize: 20 }} /> },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={layout === opt.value}
              aria-label={opt.label}
              title={opt.label}
              onClick={() => setLayout(opt.value)}
              className={`w-10 h-10 grid place-items-center rounded-full transition-colors ${
                layout === opt.value ? "bg-surface text-brand-accent shadow-card" : "text-content-secondary hover:text-content-primary"
              }`}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <SkeletonGrid />
        ) : visibleItems.length === 0 ? (
          <EmptyState
            icon={<RestaurantRoundedIcon />}
            title={selectedRating > 0 ? `No ${selectedRating}-star posts yet` : "Nothing here yet"}
            description={selectedRating > 0 ? "Try another rating, or see everything." : "Move the map to another part of Cavite to load more places."}
            action={selectedRating > 0 ? <Button variant="secondary" onClick={() => setRating(0)}>Show everything</Button> : null}
          />
        ) : (
          <ul className={`${gridClass} list-none p-0 m-0`}>
            {visibleItems.map((item) =>
              item.kind === "post" ? (
                <li key={item.id} className="flex">
                  <PostCard post={item.post} layout={layout} />
                </li>
              ) : (
                <li key={item.id} ref={elRefs[item.placeIndex]} className="flex scroll-mt-24">
                  <PlaceDetails
                    place={item.place}
                    selected={Number(childClicked) === item.placeIndex}
                    refProp={elRefs[item.placeIndex]}
                  />
                </li>
              )
            )}
          </ul>
        )}

        {!isLoading && remaining > 0 && (
          <div className="mt-8 flex flex-col items-center gap-2">
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
              Show more
            </Button>
            <p className="m-0 text-xs text-content-muted" aria-live="polite">
              Showing {visibleItems.length} of {combinedItems.length}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default List;
