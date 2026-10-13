import React, { useEffect, useMemo, useState } from "react";
import {
  IconButton,
} from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import TripOriginIcon from "@mui/icons-material/TripOrigin";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useNavigate } from "react-router-dom";
import api from "../api/backend";
import { toast } from "react-toastify";
import { getToken } from "../utils/auth";
import { handleImageError, FALLBACK_IMAGE } from "../utils/media";
import { cleanAddress } from '../utils/address';

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
      toast.error("Couldn't update your favorites. Please try again.");
    } finally {
      setFavLoading(false);
    }
  };

  useEffect(() => {
    if (selected) refProp?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selected, refProp]);

  const photoUrl = place?.photo?.images?.large?.url || FALLBACK_IMAGE;
  const iconBtnSx = { width: 40, height: 40, color: "var(--text-secondary)", "&:hover": { color: "var(--accent)" } };

  return (
    <article className="group flex flex-col w-full">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[18px] bg-background-secondary">
        <img
          src={photoUrl}
          alt=""
          loading="lazy"
          className={`w-full h-full ${photoUrl === FALLBACK_IMAGE ? "object-contain p-8" : "object-cover"}`}
          onError={handleImageError}
        />
        {place.price_level && (
          <span className="absolute top-3 left-3 text-[0.7rem] font-bold px-2 py-1 rounded-md bg-black/65 text-white">
            {place.price_level}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 pt-3 px-0.5">
        <h3 className="text-[1.02rem] font-bold leading-snug text-content-primary m-0 line-clamp-2" style={{ fontFamily: "var(--font-body)", letterSpacing: 0 }} title={place.name}>
          {place.name}
        </h3>
        <p className="text-sm text-content-secondary line-clamp-2 mt-1.5 mb-3">
          {cleanAddress(place.address) || place.ranking || "Cavite"}
        </p>

        {Array.isArray(place?.cuisine) && place.cuisine.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 mb-3 list-none p-0 m-0">
            {place.cuisine.slice(0, 3).map(({ name }) => (
              <li key={name} className="text-xs font-semibold px-2 py-0.5 rounded-md bg-background-secondary text-content-secondary">
                {name}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-1 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-content-primary">
            <span style={{ color: "var(--star)" }} aria-hidden="true">★</span>
            {place.rating ? Number(place.rating).toFixed(1) : <span className="font-normal text-content-secondary">New</span>}
            {place.num_reviews ? <span className="text-xs font-normal text-content-secondary">({place.num_reviews})</span> : null}
          </span>

          <div className="flex items-center">
            {place.web_url && (
              <IconButton component="a" href={place.web_url} target="_blank" rel="noopener noreferrer" aria-label={`${place.name} on TripAdvisor (opens in new tab)`} sx={iconBtnSx}>
                <TripOriginIcon sx={{ fontSize: 19 }} />
              </IconButton>
            )}
            {place.website && (
              <IconButton component="a" href={place.website} target="_blank" rel="noopener noreferrer" aria-label={`${place.name} website (opens in new tab)`} sx={iconBtnSx}>
                <LanguageIcon sx={{ fontSize: 19 }} />
              </IconButton>
            )}
            <IconButton
              onClick={handleFavoriteClick}
              disabled={favLoading}
              aria-pressed={isFavorited}
              aria-label={isFavorited ? `Remove ${place.name} from favorites` : `Save ${place.name} to favorites`}
              sx={iconBtnSx}
            >
              {isFavorited ? (
                <FavoriteIcon sx={{ color: "#d64545", fontSize: 19 }} />
              ) : (
                <FavoriteBorderIcon sx={{ fontSize: 19 }} />
              )}
            </IconButton>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PlaceDetails;
