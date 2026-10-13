import React, { useMemo, useState } from "react";
import {
  IconButton,
} from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import TripOriginIcon from "@mui/icons-material/TripOrigin";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useNavigate } from "react-router-dom";
import api from "../api/backend";
import { getToken } from "../utils/auth";

const PlaceDetails = ({ place, selected, refProp }) => {
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const placeId = useMemo(() => {
    return (
      place?.location_id || place?.id || place?.locationId || place?.name || ""
    );
  }, [place]);

  const requireLogin = () => {
    const has = !!getToken();
    if (!has) navigate("/login");
    return has;
  };

  const handleFavoriteClick = async (e) => {
    if (e) e.stopPropagation();
    if (!requireLogin()) return;
    if (!placeId) return;
    setFavLoading(true);
    try {
      if (!isFavorited) {
        await api.post("/api/favorites", {
          placeId,
          placeName: place?.name,
          placeType: place?.category?.key || place?.subcategory?.[0]?.name || null,
          lat: Number(place?.latitude) || null,
          lng: Number(place?.longitude) || null,
        });
        setIsFavorited(true);
      } else {
        await api.delete("/api/favorites", { data: { placeId } });
        setIsFavorited(false);
      }
    } catch (e) {
      // Optionally notify
    } finally {
      setFavLoading(false);
    }
  };

  if (selected)
    refProp?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const photoUrl = place.photo
    ? place.photo.images.large.url
    : "https://www.travelxp.com/_next/image?url=https%3A%2F%2Fimages.travelxp.com%2Fimages%2Findia%2Fmandvi%2Fbastian.png&w=1920&q=75";

  return (
    <div className="flex flex-col h-full w-full bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Uniform Image Container */}
      <div className="w-full h-48 sm:h-52 overflow-hidden bg-background-secondary relative flex-shrink-0">
        <img
          src={photoUrl}
          alt={place.name}
          className="w-full h-48 sm:h-52 object-cover hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Delicious+Food'; }}
        />
        {place.price_level && (
          <span className="absolute top-3 left-3 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-black/60 text-white backdrop-blur-sm">
            {place.price_level}
          </span>
        )}
      </div>

      {/* Content Flex-Grow */}
      <div className="flex flex-col flex-1 p-4 md:p-5">
        <h4 className="font-bold text-base text-content-primary leading-tight truncate m-0 mb-1" title={place.name}>
          {place.name}
        </h4>

        {/* Line-clamped address */}
        <p className="text-sm text-secondary line-clamp-2 mt-2 mb-3">
          {place.address || place.ranking || 'Cavite, Philippines'}
        </p>

        {/* Cuisine Chips */}
        {Array.isArray(place?.cuisine) && place.cuisine.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {place.cuisine.slice(0, 3).map(({ name }) => (
              <span
                key={name}
                className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-background-tertiary text-content-secondary"
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Anchored Footer */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border-subtle/50 gap-2">
          {/* Rating */}
          <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
            <span className="text-amber-500 text-xs font-bold">★</span>
            <span className="text-xs font-black text-amber-700 dark:text-amber-400">
              {place.rating ? Number(place.rating).toFixed(1) : 'New'}
            </span>
            {place.num_reviews && (
              <span className="text-[10px] text-content-secondary">
                ({place.num_reviews})
              </span>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            {place.web_url && (
              <IconButton
                size="small"
                title="TripAdvisor"
                onClick={() => window.open(place.web_url, "_blank")}
                sx={{ color: "var(--text-secondary)" }}
              >
                <TripOriginIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            {place.website && (
              <IconButton
                size="small"
                title="Website"
                onClick={() => window.open(place.website, "_blank")}
                sx={{ color: "var(--text-secondary)" }}
              >
                <LanguageIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={handleFavoriteClick}
              disabled={favLoading}
              title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
            >
              {isFavorited ? (
                <FavoriteIcon sx={{ color: "#ef4444", fontSize: 18 }} />
              ) : (
                <FavoriteBorderIcon sx={{ color: "var(--text-secondary)", fontSize: 18 }} />
              )}
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetails;
