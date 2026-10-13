import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { API_BASE_URL } from "../api/backend";
import { useAuth } from "../context/AuthContext";
import VeganBadge from "./VeganBadge";
import { handleImageError } from "../utils/media";
import longganisa from "../background/65318319_372215033498670__n.jpg";
import sinigang from "../background/494642311_3952270825087877_2351193646782868173_n.jpg";
import adobongPusit from "../background/adobongpusitsagatarecipe-1.jpg";
import lechePuto from "../background/leche-puto-3.jpg";
import { cleanAddress, CAVITE_TOWNS, normalizeText } from '../utils/address';

// Real dish photos only (no AI-generated images).
const HERO_PHOTOS = [longganisa, sinigang, adobongPusit, lechePuto];
const SLIDE_INTERVAL_MS = 5000;

const normalize = normalizeText;

// Towns that actually appear in listings, most common first.
function townsFromListings(...lists) {
  const counts = new Map();
  lists.flat().forEach((entry) => {
    const address = normalize(entry?.address || entry?.restaurant_address);
    if (!address) return;
    CAVITE_TOWNS.forEach((town) => {
      if (address.includes(normalize(town))) counts.set(town, (counts.get(town) || 0) + 1);
    });
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([town, count]) => ({ town, count }));
}

function imageUrl(value) {
  if (!value) return null;
  return value.startsWith("http") ? value : `${API_BASE_URL}${value}`;
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function FeaturedCard({ place }) {
  const navigate = useNavigate();
  return (
    <article
      className="group relative bg-surface rounded-panel shadow-float border border-subtle p-4 sm:p-5 flex gap-4 items-start cursor-pointer"
      onClick={() => navigate(`/restaurants/${place.id}`)}
    >
      <img
        src={place.featured_image_url}
        alt=""
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 bg-background-secondary"
        onError={handleImageError}
      />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-highlight">Featured from owners</p>
        <h2 className="font-display text-xl sm:text-2xl font-semibold leading-tight text-content-primary mt-1 mb-0 truncate">
          <Link
            to={`/restaurants/${place.id}`}
            className="no-underline hover:text-brand-accent"
            onClick={(e) => e.stopPropagation()}
          >
            {place.name}
          </Link>
        </h2>
        {place.address && (
          <p className="text-sm text-content-secondary mt-1 mb-0 line-clamp-2 leading-snug" title={place.address}>{cleanAddress(place.address)}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2.5">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-content-primary">
            <StarRoundedIcon sx={{ fontSize: 18, color: "var(--star)" }} aria-hidden="true" />
            {place.top_rating_avg > 0 ? (
              <>
                {place.top_rating_avg.toFixed(1)}
                <span className="font-normal text-content-secondary">({place.top_rating_count} reviews)</span>
              </>
            ) : (
              <span className="font-normal text-content-secondary">No ratings yet</span>
            )}
          </span>
          {place.has_vegan_items ? <VeganBadge label="Inclusive options" /> : null}
        </div>
      </div>
    </article>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="bg-surface rounded-panel shadow-float border border-subtle p-5 flex gap-4" aria-hidden="true">
      <div className="w-24 h-24 rounded-xl skeleton shrink-0" />
      <div className="flex-1 space-y-2.5 pt-1">
        <div className="h-3 w-32 rounded skeleton" />
        <div className="h-5 w-3/4 rounded skeleton" />
        <div className="h-3 w-1/2 rounded skeleton" />
      </div>
    </div>
  );
}

const Hero = ({ searchQuery = "", setSearchQuery = () => {}, posts = [] }) => {
  const { ownerPlaces, isLoadingPlaces } = useAuth();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [prevPhotoIndex, setPrevPhotoIndex] = useState(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [hovering, setHovering] = useState(false);

  const featuredPlaces = useMemo(() => {
    if (!Array.isArray(ownerPlaces) || ownerPlaces.length === 0) return [];

    return ownerPlaces
      .map((place) => {
        const matchingPosts = Array.isArray(posts)
          ? posts.filter((post) => Number(post?.owner_place_id) === Number(place.id))
          : [];

        let totalScore = 0;
        let totalCount = 0;
        let bestPostImage = null;

        matchingPosts.forEach((post) => {
          const avg = Number(post?.rating_avg);
          const count = Number(post?.rating_count) || 0;
          if (Number.isFinite(avg) && count > 0) {
            totalScore += avg * count;
            totalCount += count;
          }
          if (!bestPostImage) {
            bestPostImage = post?.restaurant_image_url || post?.media?.[0]?.url || null;
          }
        });

        return {
          ...place,
          top_rating_avg: totalCount > 0 ? totalScore / totalCount : 0,
          top_rating_count: totalCount,
          featured_image_url:
            imageUrl(place?.display_image_url || place?.image_url || bestPostImage) || "/GreenSimpleCleanVeganFoodLogo.png",
        };
      })
      .sort((a, b) => {
        if ((b.top_rating_avg || 0) !== (a.top_rating_avg || 0)) return (b.top_rating_avg || 0) - (a.top_rating_avg || 0);
        if ((b.top_rating_count || 0) !== (a.top_rating_count || 0)) return (b.top_rating_count || 0) - (a.top_rating_count || 0);
        return String(a.name || "").localeCompare(String(b.name || ""));
      })
      .slice(0, 5);
  }, [ownerPlaces, posts]);

  // Rotate photo + featured restaurant together; paused on hover/focus, by the user, or for reduced motion.
  useEffect(() => {
    if (!playing || hovering) return undefined;
    const id = setInterval(() => {
      setPhotoIndex((i) => {
        setPrevPhotoIndex(i);
        return (i + 1) % HERO_PHOTOS.length;
      });
      setFeaturedIndex((i) => (featuredPlaces.length ? (i + 1) % featuredPlaces.length : 0));
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [playing, hovering, featuredPlaces.length]);

  const allTowns = useMemo(
    () => townsFromListings(Array.isArray(ownerPlaces) ? ownerPlaces : [], Array.isArray(posts) ? posts : []),
    [ownerPlaces, posts]
  );
  // Keep the row tidy: top towns as chips, the rest in one dropdown.
  const MAX_TOWN_CHIPS = 4;
  const towns = allTowns.slice(0, MAX_TOWN_CHIPS);
  const moreTowns = allTowns.slice(MAX_TOWN_CHIPS);
  const placeCount = Array.isArray(ownerPlaces) ? ownerPlaces.length : 0;
  const postCount = Array.isArray(posts) ? posts.length : 0;

  const browseTown = (town) => {
    setSearchQuery(town);
    scrollToId("nearby");
  };

  const activeFeatured = featuredPlaces.length ? featuredIndex % featuredPlaces.length : 0;
  const featured = featuredPlaces.length ? featuredPlaces[activeFeatured] : null;

  const onSubmit = (e) => {
    e.preventDefault();
    scrollToId("nearby");
  };

  return (
    <section id="hero" aria-labelledby="hero-title" className="relative">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-10 lg:gap-16 items-center pt-8 sm:pt-12 lg:pt-14 pb-14 lg:pb-20">
        {/* ── Copy + primary action ── */}
        <div className="animate-fade-in-up">
          <h1
            id="hero-title"
            className="m-0 font-display font-semibold text-content-primary leading-[1.04] text-[2.6rem] sm:text-[3.4rem] md:text-[2.9rem] lg:text-[4rem] xl:text-[4.4rem]"
          >
            Discover the <em className="italic text-brand-accent font-medium">hidden flavors</em> of Cavite
          </h1>

          <p className="mt-5 mb-0 text-lg sm:text-xl text-content-secondary max-w-[34rem] leading-relaxed">
            Your digital gateway to Cavite's heritage kitchens, local favorites, and authentic culinary secrets.
          </p>

          <form
            role="search"
            onSubmit={onSubmit}
            className="mt-8 flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 p-2 bg-surface rounded-[22px] sm:rounded-full md:rounded-[22px] lg:rounded-full border border-subtle shadow-lift max-w-xl focus-within:border-brand-accent/60 transition-colors"
          >
            <label htmlFor="hero-search" className="visually-hidden">Search restaurants by name, cuisine, or location</label>
            <div className="flex items-center flex-1 min-w-0 pl-3">
              <SearchRoundedIcon sx={{ fontSize: 22, color: "var(--text-muted)" }} aria-hidden="true" />
              <input
                id="hero-search"
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="Search by name, cuisine, or town…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 bg-transparent border-0 outline-none px-3 py-3 text-base text-content-primary placeholder:text-content-muted"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-full bg-brand-accent text-on-accent font-bold hover:bg-brand-strong transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/30"
            >
              Find food
              <ArrowForwardRoundedIcon sx={{ fontSize: 20 }} aria-hidden="true" />
            </button>
          </form>

          <a
            href="#map"
            onClick={(e) => { e.preventDefault(); scrollToId("map"); }}
            className="mt-4 inline-flex items-center gap-1.5 min-h-[40px] text-sm font-semibold text-brand-accent no-underline hover:underline underline-offset-4"
          >
            <MapOutlinedIcon sx={{ fontSize: 18 }} aria-hidden="true" />
            Or browse the food map
          </a>

          {(placeCount > 0 || towns.length > 0) && (
            <div className="mt-6 pt-6 border-t border-subtle max-w-xl">
              {placeCount > 0 && (
                <p className="m-0 text-sm text-content-secondary">
                  <strong className="text-content-primary font-semibold">{placeCount}</strong> {placeCount === 1 ? "restaurant" : "restaurants"} listed by their owners
                  {postCount > 0 && (
                    <>
                      {" · "}
                      <strong className="text-content-primary font-semibold">{postCount}</strong> community {postCount === 1 ? "post" : "posts"}
                    </>
                  )}
                </p>
              )}
              {towns.length > 0 && (
                <div className="mt-4">
                  <p id="towns-label" className="m-0 mb-2 text-sm font-semibold text-content-primary">Browse by town</p>
                  <ul aria-labelledby="towns-label" className="flex flex-wrap gap-2 list-none p-0 m-0">
                    {towns.map(({ town, count }) => (
                      <li key={town}>
                        <button
                          type="button"
                          onClick={() => browseTown(town)}
                          className="inline-flex items-center gap-2 min-h-[40px] pl-3.5 pr-2 rounded-full border border-strong bg-surface text-sm font-semibold text-content-primary hover:border-brand-accent hover:text-brand-accent transition-colors"
                        >
                          {town}
                          <span className="min-w-[22px] h-[22px] px-1.5 grid place-items-center rounded-full bg-background-secondary text-xs text-content-secondary tabular-nums">
                            {count}
                          </span>
                          <span className="visually-hidden"> listings</span>
                        </button>
                      </li>
                    ))}
                    {moreTowns.length > 0 && (
                      <li className="relative">
                        <label htmlFor="more-towns" className="visually-hidden">More towns</label>
                        <select
                          id="more-towns"
                          value=""
                          onChange={(e) => e.target.value && browseTown(e.target.value)}
                          className="appearance-none min-h-[40px] pl-3.5 pr-9 rounded-full border border-strong bg-surface text-sm font-semibold text-content-primary hover:border-brand-accent focus:border-brand-accent outline-none cursor-pointer"
                        >
                          <option value="">+{moreTowns.length} more {moreTowns.length === 1 ? "town" : "towns"}</option>
                          {moreTowns.map(({ town, count }) => (
                            <option key={town} value={town}>{town} ({count})</option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-content-muted text-xs" aria-hidden="true">▾</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Photo + featured restaurant ── */}
        <div
          className="relative pb-10"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onFocusCapture={() => setHovering(true)}
          onBlurCapture={() => setHovering(false)}
        >
          <div className="relative w-full max-w-[520px] md:ml-auto">
            {/* Main rotating photo */}
            <div className="relative aspect-[5/4] sm:aspect-square rounded-[24px] sm:rounded-[28px] overflow-hidden bg-background-secondary shadow-lift">
              {HERO_PHOTOS.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  aria-hidden="true"
                  loading={i === 0 ? "eager" : "lazy"}
                  // New photo fades in on top while the previous one stays opaque underneath (no flash).
                  className={`absolute inset-0 w-full h-full object-cover ${
                    i === photoIndex
                      ? "opacity-100 z-[2] transition-opacity duration-1000"
                      : i === prevPhotoIndex
                        ? "opacity-100 z-[1]"
                        : "opacity-0 z-0"
                  }`}
                />
              ))}
              <div className="absolute inset-0 z-[3] bg-gradient-to-t from-black/25 via-transparent to-transparent" aria-hidden="true" />
            </div>

            {/* Featured restaurant card overlapping the photo */}
            <div className="relative -mt-24 mx-3 sm:mx-5 lg:-ml-8 lg:mr-5 z-20">
              {featured ? <FeaturedCard place={featured} /> : isLoadingPlaces ? <FeaturedSkeleton /> : null}

              {/* Slideshow controls */}
              {featuredPlaces.length > 0 && (
                <div className="mt-3 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    aria-label={playing ? "Pause slideshow" : "Play slideshow"}
                    className="w-8 h-8 grid place-items-center rounded-full text-content-secondary hover:text-content-primary hover:bg-brand-accent/10 transition-colors"
                  >
                    {playing ? <PauseRoundedIcon sx={{ fontSize: 18 }} /> : <PlayArrowRoundedIcon sx={{ fontSize: 18 }} />}
                  </button>
                  {featuredPlaces.length > 1 && (
                    <div className="flex" role="group" aria-label="Choose featured restaurant">
                      {featuredPlaces.map((p, i) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setFeaturedIndex(i); setPlaying(false); }}
                          aria-label={`Show ${p.name}`}
                          aria-current={i === activeFeatured ? "true" : undefined}
                          className="w-7 h-8 grid place-items-center rounded-full"
                        >
                          <span
                            className={`block h-1.5 rounded-full transition-all duration-300 ${
                              i === activeFeatured ? "w-5 bg-brand-accent" : "w-1.5 bg-content-secondary/40"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
