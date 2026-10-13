import React, { useState, useEffect, createRef } from "react";
import {
  CircularProgress,
  Grid,
  Typography,
  Box,
  IconButton,
  Button,
  MenuItem,
  Menu,
  Pagination,
  Avatar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { API_BASE_URL } from "../api/backend";
import { Rating } from "@mui/material";
import PlaceDetails from "./PlaceDetails";
import { useNavigate, Link } from "react-router-dom";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import GridOnIcon from "@mui/icons-material/GridOn";
import ListIcon from "@mui/icons-material/List";
import FilterListIcon from "@mui/icons-material/FilterList";

const ContainerWrapper = styled("div")(({ theme }) => ({
  padding: "20px",
  backgroundColor: "#f0f2f5",
  borderRadius: theme.shape.borderRadius,
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  marginTop: "20px",
  marginBottom: "20px",
}));

const Title = styled(Typography)({
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 600,
  background: "linear-gradient(to right, #A3D977, #D6EFC7)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  marginBottom: "10px",
});

const ControlsContainer = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
  flexWrap: "wrap",
  gap: "10px",
});

const CategoryButton = styled(Button)(({ selected }) => ({
  padding: "8px 16px",
  borderRadius: "20px",
  textTransform: "none",
  fontWeight: selected ? "bold" : "normal",
  background: selected
    ? "linear-gradient(to right, #A3D977, #D6EFC7)"
    : "transparent",
  color: selected ? "#fff" : "#000",
  border: selected ? "none" : "1px solid #A3D977",
  "&:hover": {
    background: "linear-gradient(to right, #A3D977, #D6EFC7)",
    color: "#fff",
  },
}));

const ListWrapper = styled(Grid)(({ theme }) => ({
  height: "75vh",
  overflowY: "auto",
  borderRadius: theme.shape.borderRadius,
  padding: "16px",
  marginTop: "8px",
  "& .MuiGrid-item": {
    display: "flex",
  },
  "&::-webkit-scrollbar": {
    width: "8px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#A3D977",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: theme.palette.background.paper,
    borderRadius: "4px",
  },
}));

const List = ({ places, childClicked, isLoading, type, setType, rating, setRating, uploads = [], posts = [] }) => {
  const ITEMS_PER_PAGE = 9;
  const [elRefs, setElRefs] = useState([]);
  const [layout, setLayout] = useState("grid");
  const [anchorEl, setAnchorEl] = useState(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const [galleryOpen, setGalleryOpen] = React.useState(false);
  const [galleryItems, setGalleryItems] = React.useState([]);
  const [galleryIndex, setGalleryIndex] = React.useState(0);

  useEffect(() => {
    setElRefs((refs) =>
      Array(places?.length || 0)
        .fill()
        .map((_, i) => refs[i] || createRef())
    );
  }, [places?.length]);

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
  };

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  // If backend didn't supply grouped `posts`, build them client-side from `uploads`
  const buildPostsFromUploads = () => {
    if (!Array.isArray(uploads)) return [];
    const map = new Map();
    const singles = [];
    for (const u of uploads) {
      if (u.post_id) {
        const key = `post-${u.post_id}`;
        if (!map.has(key)) map.set(key, { 
          id: u.post_id, 
          media: [], 
          caption: u.caption, 
          address: u.address, 
          created_at: u.created_at, 
          rating_avg: null, 
          rating_count: 0,
          user_id: u.user_id,
          author_name: u.author_name,
          author_profile_url: u.author_profile_url
        });
        const entry = map.get(key);
        entry.media.push({ id: u.id, filename: u.filename, url: u.url, created_at: u.created_at, rating_avg: u.rating_avg, rating_count: u.rating_count });
        // accumulate approximate rating/count (simple sum)
        if (u.rating_avg !== null && u.rating_count !== null) {
          const prevAvg = entry.rating_avg || 0;
          const prevCount = entry.rating_count || 0;
          const totalScore = prevAvg * prevCount + (u.rating_avg || 0) * (u.rating_count || 0);
          const totalCount = prevCount + (u.rating_count || 0);
          entry.rating_avg = totalCount ? (totalScore / totalCount) : null;
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
          author_profile_url: u.author_profile_url
        });
      }
    }
    return [...Array.from(map.values()), ...singles];
  };

  const displayedPosts = (Array.isArray(posts) && posts.length > 0) ? posts : buildPostsFromUploads();
  const filteredPosts = displayedPosts.filter((p) => {
    const avg = p.rating_avg !== null ? Number(p.rating_avg) : 0;
    const selected = Number(rating || 0);
    if (selected === 0) return true;
    const bucket = Math.round(avg);
    return bucket === selected;
  });
  const combinedItems = [
    ...filteredPosts.map((post) => ({ kind: "post", id: `post-${post.id}`, post })),
    ...(Number(rating || 0) === 0
      ? (places || []).map((place, i) => ({ kind: "place", id: `place-${i}`, place, placeIndex: i }))
      : []),
  ];
  const totalPages = Math.max(1, Math.ceil(combinedItems.length / ITEMS_PER_PAGE));
  const paginatedItems = combinedItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // keep galleryItems in sync (clear when posts change) to avoid unused setter lint
  React.useEffect(() => {
    if (galleryItems && galleryItems.length && !displayedPosts.length) {
      setGalleryItems([]);
    }
  }, [displayedPosts.length, galleryItems]);

  useEffect(() => {
    setPage(1);
  }, [rating, type, places?.length, displayedPosts.length]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <ContainerWrapper>
      <Title variant="h4">
        <b>Discover Cavite’s Dining Spots</b>
      </Title>
      {isLoading ? (
        <Box
          height="600px"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <CircularProgress size="5rem" />
        </Box>
      ) : (
        <>
          <ControlsContainer>
            {/* Category Selection */}
            <Box display="flex" gap={1}>
              <CategoryButton
                selected={type === "restaurants"}
                onClick={() => setType("restaurants")}
                startIcon={<RestaurantIcon />}
              >
                Restaurants
              </CategoryButton>
            </Box>

            {/* Right-Side Icons */}
            <Box display="flex" alignItems="center">
              {/* Rating Filter */}
              <IconButton onClick={handleFilterClick}>
                <FilterListIcon />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleFilterClose}
              >
                <MenuItem onClick={() => setRating(0)}>All</MenuItem>
                <MenuItem onClick={() => setRating(3)}>rate 3.0 ★</MenuItem>
                <MenuItem onClick={() => setRating(4)}>rate 4.0 ★</MenuItem>
                <MenuItem onClick={() => setRating(5)}>rate 5.0 ★</MenuItem>
              </Menu>

              {/* View Mode Toggle */}
              <IconButton onClick={() => handleLayoutChange("grid")}>
                <GridOnIcon color={layout === "grid" ? "primary" : "inherit"} />
              </IconButton>
              <IconButton onClick={() => handleLayoutChange("list")}>
                <ListIcon color={layout === "list" ? "primary" : "inherit"} />
              </IconButton>
            </Box>
          </ControlsContainer>

          {/* List/Grid View */}
          <ListWrapper container spacing={3}>
            {paginatedItems?.map((item) => {
              if (item.kind === "post") {
                const p = item.post;
                return (
                  <Grid item xs={12} sm={layout === "grid" ? 6 : 12} md={layout === "grid" ? 4 : 12} key={item.id} sx={{ display: 'flex' }}>
                    <div
                      className="flex flex-col h-full w-full bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/post/${(p.media && p.media[0] && p.media[0].id) ? p.media[0].id : p.id}`)}
                    >
                      {/* Uniform Image Container */}
                      <div className="w-full h-48 sm:h-52 bg-[var(--bg-secondary)] relative overflow-hidden flex-shrink-0">
                        {p.media && p.media[0] && (p.media[0].url.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video controls className="w-full h-48 sm:h-52 object-cover block">
                            <source src={p.media[0].url.startsWith('http') ? p.media[0].url : `${API_BASE_URL}${p.media[0].url}`} />
                          </video>
                        ) : (
                          <img
                            alt={p.caption || (p.media && p.media[0] && p.media[0].filename) || 'Post'}
                            src={(p.media && p.media[0] && p.media[0].url) ? (p.media[0].url.startsWith('http') ? p.media[0].url : `${API_BASE_URL}${p.media[0].url}`) : 'https://placehold.co/600x400?text=Delicious+Food'}
                            className="w-full h-48 sm:h-52 object-cover block hover:scale-105 transition-transform duration-500"
                            onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Delicious+Food'; }}
                          />
                        ))}
                        {Array.isArray(p.media) && p.media.length > 1 && (
                          <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm">
                            +{p.media.length - 1} more
                          </span>
                        )}
                      </div>

                      {/* Content Flex-Grow */}
                      <div className="flex flex-col flex-1 p-4 md:p-5">
                        {/* Author Info */}
                        <div className="flex items-center gap-2 mb-2">
                          <Link to={`/user/${p.user_id}`} onClick={(e) => e.stopPropagation()} className="no-underline flex items-center gap-2">
                            <Avatar 
                              src={p.author_profile_url} 
                              sx={{ width: 24, height: 24, border: '1px solid var(--brand-accent)', bgcolor: 'var(--brand-accent)', fontSize: '0.75rem' }}
                            >
                              {(p.author_name || 'U').charAt(0).toUpperCase()}
                            </Avatar>
                            <span className="text-xs font-bold text-[var(--text-primary)] hover:underline truncate max-w-[140px]">
                              {p.author_name || 'Anonymous'}
                            </span>
                          </Link>
                        </div>

                        {p.caption && (
                          <h4 className="font-bold text-base text-[var(--text-primary)] leading-tight truncate m-0 mb-1">
                            {p.caption}
                          </h4>
                        )}
                        <p className="text-sm text-secondary line-clamp-2 mt-2 mb-3">
                          {p.address || 'Cavite, Philippines'}
                        </p>

                        {/* Anchored Footer */}
                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border-subtle/50">
                          <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                            <Rating size="small" value={p.rating_avg ? Number(p.rating_avg) : 0} precision={0.5} readOnly />
                            <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                              ({p.rating_count || 0})
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[var(--brand-accent)] hover:underline">
                            View Post →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Grid>
                );
              }

              return (
                <Grid
                  ref={elRefs[item.placeIndex]}
                  item
                  key={item.id}
                  xs={12}
                  sm={layout === "grid" ? 6 : 12}
                  md={layout === "grid" ? 4 : 12}
                >
                  <PlaceDetails
                    place={item.place}
                    selected={Number(childClicked) === item.placeIndex}
                    refProp={elRefs[item.placeIndex]}
                  />
                </Grid>
              );
            })}
            {paginatedItems.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ p: 3, borderRadius: 2, bgcolor: '#fff', textAlign: 'center' }}>
                  <Typography color="text.secondary">No dining spots matched the current filters.</Typography>
                </Box>
              </Grid>
            )}
          </ListWrapper>

          {combinedItems.length > ITEMS_PER_PAGE && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, combinedItems.length)} of {combinedItems.length} spots
              </Typography>
              <Pagination
                page={page}
                count={totalPages}
                color="primary"
                onChange={(_, value) => setPage(value)}
                shape="rounded"
              />
            </Box>
          )}

          {/* Gallery dialog for posts */}
          <div>
            <dialog open={galleryOpen} style={{ width: '80%', maxWidth: 900, border: 'none', borderRadius: 8, padding: 0 }} onClose={() => setGalleryOpen(false)}>
              <Box sx={{ position: 'relative', bgcolor: '#000' }}>
                {galleryItems[galleryIndex] && (galleryItems[galleryIndex].url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video controls style={{ width: '100%', height: '60vh', objectFit: 'contain' }}>
                    <source src={galleryItems[galleryIndex].url.startsWith('http') ? galleryItems[galleryIndex].url : `${API_BASE_URL}${galleryItems[galleryIndex].url}`} />
                  </video>
                ) : (
                  <img src={galleryItems[galleryIndex].url.startsWith('http') ? galleryItems[galleryIndex].url : `${API_BASE_URL}${galleryItems[galleryIndex].url}`} alt="media" style={{ width: '100%', height: '60vh', objectFit: 'contain' }} />
                ))}
                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                  <Button variant="contained" onClick={() => setGalleryOpen(false)}>Close</Button>
                </Box>
                <Box sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }}>
                  <Button disabled={galleryIndex === 0} onClick={() => setGalleryIndex(i => Math.max(0, i - 1))}>&lt;</Button>
                </Box>
                <Box sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                  <Button disabled={galleryIndex >= galleryItems.length - 1} onClick={() => setGalleryIndex(i => Math.min(galleryItems.length - 1, i + 1))}>&gt;</Button>
                </Box>
              </Box>
            </dialog>
          </div>
        </>
      )}
    </ContainerWrapper>
  );
};

export default List;
