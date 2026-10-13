import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { styled, keyframes } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import api, { API_BASE_URL } from "../api/backend";
import { useAuth } from "../context/AuthContext";
import VeganBadge from "./VeganBadge";

const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const HeroSection = styled("section")(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  position: "relative",
  overflow: "hidden",
  color: theme.palette.common.white,
  background: "var(--bg-primary)",
}));

const HeroContent = styled(Container)(({ theme }) => ({
  position: "relative",
  zIndex: 2,
  paddingTop: theme.spacing(14),
  paddingBottom: theme.spacing(8),
}));

const GuideBadge = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  minHeight: 56,
  padding: theme.spacing(1, 2.25, 1, 1),
  borderRadius: 999,
  background: "rgba(8, 52, 27, 0.88)",
  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.24)",
  border: "1px solid rgba(181, 224, 133, 0.22)",
  animation: `${fadeIn} 700ms ease-out`,
}));

const GuideBadgeIcon = styled(Box)({
  width: 38,
  height: 38,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg, #8bc53f 0%, #6eab2d 100%)",
  color: "#17381e",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
});

const HeroTitle = styled(Typography)({
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 800,
  lineHeight: 0.95,
  letterSpacing: "-0.04em",
  textWrap: "balance",
  animation: `${fadeIn} 900ms ease-out`,
});

const HeroSubtitle = styled(Typography)({
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 400,
  animation: `${fadeIn} 1100ms ease-out`,
});

const ExploreButton = styled(Button)({
  borderRadius: 999,
  padding: "10px 12px 10px 22px",
  background: "linear-gradient(180deg, #95d53d 0%, #79bb2b 100%)",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "1.02rem",
  letterSpacing: "0.01em",
  boxShadow: "0 18px 34px rgba(44, 70, 17, 0.24)",
  textTransform: "uppercase",
  "&:hover": {
    background: "linear-gradient(180deg, #a1dd4d 0%, #80bf31 100%)",
  },
});

const FeatureCard = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "48px 1fr",
  alignItems: "center",
  gap: theme.spacing(1.5),
  animation: `${fadeIn} 1200ms ease-out`,
}));

const FeatureIcon = styled(Box)({
  width: 48,
  height: 48,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background: "rgba(14, 48, 23, 0.78)",
  border: "1px solid rgba(181, 224, 133, 0.28)",
  color: "#9fd84a",
  boxShadow: "0 8px 22px rgba(0, 0, 0, 0.18)",
});

const featureItems = [
  {
    icon: <PlaceOutlinedIcon fontSize="small" />,
    title: "Local Restaurants",
  },
  {
    icon: <SpaOutlinedIcon fontSize="small" />,
    title: "Inclusive Dining Options",
  },
  {
    icon: <Groups2OutlinedIcon fontSize="small" />,
    title: "Community Recommended",
  },
];

function imageUrl(value) {
  if (!value) return null;
  return value.startsWith("http") ? value : `${API_BASE_URL}${value}`;
}

const Hero = ({ searchQuery = "", setSearchQuery = () => {} }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const { ownerPlaces, fetchOwnerPlaces } = useAuth();
  const [posts, setPosts] = useState([]);
  const SLIDE_INTERVAL_MS = 4000;

  const backgroundImages = useMemo(() => {
    try {
      const ctx = require.context("../", true, /^\.\/background\/.*\.(png|jpe?g|webp|gif)$/i);
      return ctx.keys().sort().map(ctx);
    } catch {
      return [];
    }
  }, []);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const postsRes = await api.get("/api/uploads/posts");
        if (!ignore) {
          setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
        }
      } catch {
        if (!ignore) {
          setPosts([]);
        }
      }
      
      // ownerPlaces is handled by AuthContext
      fetchOwnerPlaces();
    })();

    return () => {
      ignore = true;
    };
  }, [fetchOwnerPlaces]);

  const handleExploreClick = () => {
    const mapSection = document.getElementById("explore-map-section");
    if (mapSection) mapSection.scrollIntoView({ behavior: "smooth" });
  };

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

        matchingPosts?.forEach?.((post) => {
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
          featured_image_url: imageUrl(place?.display_image_url || place?.image_url || bestPostImage) || "/GreenSimpleCleanVeganFoodLogo.png",
        };
      })
      .sort((a, b) => {
        if ((b.top_rating_avg || 0) !== (a.top_rating_avg || 0)) return (b.top_rating_avg || 0) - (a.top_rating_avg || 0);
        if ((b.top_rating_count || 0) !== (a.top_rating_count || 0)) return (b.top_rating_count || 0) - (a.top_rating_count || 0);
        return String(a.name || "").localeCompare(String(b.name || ""));
      })
      .slice(0, 5);
  }, [ownerPlaces, posts]);

  useEffect(() => {
    const maxSlides = Math.max(backgroundImages.length, featuredPlaces.length);
    if (maxSlides <= 1) return undefined;

    const id = setInterval(() => {
      setCurrentSlide((i) => (i + 1) % maxSlides);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [backgroundImages.length, featuredPlaces.length]);

  const featuredSlide = featuredPlaces.length ? featuredPlaces[currentSlide % featuredPlaces.length] : null;
  const currentBackground = backgroundImages.length
    ? backgroundImages[currentSlide % backgroundImages.length]
    : "/GreenSimpleCleanVeganFoodLogo.png";

  return (
    <HeroSection id="hero">
      <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
        {backgroundImages.length > 0 ? (
          backgroundImages?.map((src, idx) => (
            <Box
              key={idx}
              aria-hidden
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transition: "opacity 900ms ease-in-out",
                opacity: idx === currentSlide % backgroundImages.length ? 1 : 0,
                transform: "scale(1.02)",
              }}
            />
          ))
        ) : (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${currentBackground})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(8,13,15,0.62) 0%, rgba(8,13,15,0.36) 42%, rgba(8,13,15,0.2) 100%)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(7, 24, 12, 0.22) 0%, rgba(7, 24, 12, 0.1) 40%, rgba(7, 24, 12, 0.42) 100%)",
          }}
        />
      </Box>

      <HeroContent maxWidth="lg">
        <Grid container spacing={{ xs: 5, md: 4 }} alignItems="center">
          <Grid item xs={12} md={7}>
            <Box sx={{ maxWidth: 780 }}>
          <GuideBadge>
            <GuideBadgeIcon>
              <RestaurantMenuRoundedIcon fontSize="small" />
            </GuideBadgeIcon>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "#d6efc7",
                lineHeight: 1,
              }}
            >
              Cavite Food Guide
            </Typography>
          </GuideBadge>

          <HeroTitle
            variant="h1"
            sx={{
              mt: 2.5,
              fontSize: { xs: "3.5rem", sm: "4.8rem", md: "5.4rem" },
              maxWidth: 760,
            }}
          >
            Discover the <Box component="span" sx={{ color: "var(--accent)" }}>Hidden Flavors</Box> of Cavite
          </HeroTitle>

          <HeroSubtitle
            variant="h5"
            sx={{
              mt: 3,
              maxWidth: 640,
              color: "rgba(255,255,255,0.92)",
              fontSize: { xs: "1.25rem", md: "1.45rem" },
            }}
          >
            Your premium digital gateway to Cavite's heritage kitchens, local favorites, and authentic culinary secrets.
          </HeroSubtitle>

          {/* Prominent, rounded Search/Filter bar inside Hero */}
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleExploreClick();
            }}
            sx={{
              mt: 4,
              display: "flex",
              alignItems: "center",
              bgcolor: "var(--surface, #ffffff)",
              borderRadius: 999,
              p: 0.5,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
              width: "100%",
              maxWidth: 580,
              border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
              animation: `${fadeIn} 1300ms ease-out`,
            }}
          >
            <Box sx={{ pl: 2, display: "flex", alignItems: "center", color: "var(--text-secondary, #66756a)" }}>
              <PlaceOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
            <input
              type="text"
              placeholder="Search by name, cuisine, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                padding: "12px 16px",
                fontSize: "0.95rem",
                borderRadius: 999,
                color: "var(--text-primary)",
                backgroundColor: "transparent",
              }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{
                borderRadius: 999,
                padding: "8px 24px",
                bgcolor: "var(--brand-accent, #79bb2b)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "0.9rem",
                textTransform: "uppercase",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "var(--accent, #95d53d)",
                  boxShadow: "none",
                },
                m: 0.25,
              }}
            >
              Search
            </Button>
          </Box>

          <Box
            sx={{
              mt: 4,
              width: { xs: "100%", sm: 460 },
              maxWidth: "100%",
              height: 2,
              borderRadius: 999,
              background: "linear-gradient(90deg, var(--accent) 0%, rgba(163,217,119,0.32) 100%)",
              animation: `${fadeIn} 1200ms ease-out`,
            }}
          />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 2, sm: 3.5 }}
            sx={{ mt: 3.5, maxWidth: 760 }}
          >
            {featureItems.map((item) => (
              <FeatureCard key={item.title}>
                <FeatureIcon>{item.icon}</FeatureIcon>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 500,
                    lineHeight: 1.2,
                    color: "#ffffff",
                    fontSize: { xs: "1.05rem", md: "1.2rem" },
                  }}
                >
                  {item.title}
                </Typography>
              </FeatureCard>
            ))}
          </Stack>

          <Box sx={{ mt: 4.5, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
            <ExploreButton variant="contained" onClick={handleExploreClick}>
              <Box component="span" sx={{ px: 1.5 }}>
                Explore Now
              </Box>
              <Box
                component="span"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "var(--bg-primary)",
                  color: "var(--accent)",
                  ml: 1,
                }}
              >
                <ArrowForwardRoundedIcon />
              </Box>
            </ExploreButton>
          </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            {featuredSlide ? (
              <Box
                className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer group"
                sx={{
                  borderRadius: { xs: 5, md: 6 },
                  overflow: "hidden",
                  background: "linear-gradient(180deg, rgba(15, 41, 21, 0.94) 0%, rgba(7, 25, 13, 0.96) 100%)",
                  border: "1px solid rgba(197, 234, 149, 0.18)",
                  boxShadow: "0 28px 60px rgba(0, 0, 0, 0.28)",
                  animation: `${fadeIn} 1200ms ease-out`,
                }}
                onClick={() => navigate(`/restaurants/${featuredSlide.id}`)}
              >
                <Box
                  sx={{
                    height: { xs: 240, md: 300 },
                    overflow: "hidden",
                  }}
                >
                  <Box
                    component="img"
                    src={featuredSlide.featured_image_url}
                    alt={featuredSlide.name}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 500ms ease",
                      ".group:hover &": {
                        transform: "scale(1.05)",
                      },
                    }}
                  />
                </Box>
                <Box sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography
                    variant="overline"
                    sx={{ letterSpacing: "0.16em", color: "rgba(226, 241, 209, 0.82)" }}
                  >
                    Featured from Owners
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      mt: 1,
                      fontWeight: 800,
                      lineHeight: 1.05,
                      fontSize: { xs: "2.4rem", md: "3rem" },
                    }}
                  >
                    {featuredSlide.name}
                  </Typography>
                  <Typography
                    variant="body1"
                    className="line-clamp-2"
                    sx={{
                      mt: 2,
                      color: "rgba(255,255,255,0.82)",
                      fontSize: { xs: "1.12rem", md: "1.18rem" },
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {featuredSlide.description || "Explore one of Cavite's standout owner restaurants with strong reviews, menu highlights, and local community interest."}
                  </Typography>

                  <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap" sx={{ mt: 2.5 }}>
                    {featuredSlide.has_vegan_items ? <VeganBadge label="Inclusive Options" /> : null}
                    {featuredSlide.address ? (
                      <Box
                        className="truncate max-w-full"
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: 999,
                          bgcolor: "rgba(255,255,255,0.14)",
                          color: "#f6fff3",
                          fontWeight: 700,
                          fontSize: "1rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={featuredSlide.address}
                      >
                        {featuredSlide.address}
                      </Box>
                    ) : null}
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                    <StarRoundedIcon sx={{ color: "#ffd54a", fontSize: 26 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {featuredSlide.top_rating_avg > 0 ? featuredSlide.top_rating_avg.toFixed(1) : "No ratings yet"}
                    </Typography>
                    {featuredSlide.top_rating_count > 0 ? (
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                        ({featuredSlide.top_rating_count} reviews)
                      </Typography>
                    ) : null}
                  </Stack>

                  {featuredPlaces.length > 1 && (
                    <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
                      {featuredPlaces?.map((place, index) => (
                        <Box
                          key={place.id}
                          sx={{
                            width: index === currentSlide % featuredPlaces.length ? 28 : 10,
                            height: 10,
                            borderRadius: 999,
                            background: index === currentSlide % featuredPlaces.length ? "var(--accent)" : "rgba(255,255,255,0.22)",
                            transition: "all 200ms ease",
                          }}
                        />
                      ))}
                    </Stack>
                  )}

                  <Button
                    variant="contained"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/restaurants/${featuredSlide.id}`);
                    }}
                    sx={{
                      mt: 3,
                      borderRadius: 999,
                      px: 3.25,
                      py: 1.4,
                      background: "linear-gradient(180deg, #d7f3b8 0%, #b7e57b 100%)",
                      color: "#17381e",
                      fontWeight: 800,
                      fontSize: "1.04rem",
                      boxShadow: "none",
                      "&:hover": {
                        background: "linear-gradient(180deg, #e2f9c8 0%, #bfe77f 100%)",
                        boxShadow: "none",
                      },
                    }}
                  >
                    View Restaurant
                  </Button>
                </Box>
              </Box>
            ) : null}
          </Grid>
        </Grid>
      </HeroContent>
    </HeroSection>
  );
};

export default Hero;
