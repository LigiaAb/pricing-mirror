import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid, Icon } from "@mui/material";
import { useSelector } from "react-redux";

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

export const ControlledCarruselComponent = ({
  children,
  itemsPerPage = {},
  autoPlay = false,
  autoPlayDirection = "right",
  timeout = 3000,

  currentIndex,
  defaultIndex = 0,
  onChangeIndex,
  onSelectItem,

  showDots = true,
  showArrows = true,
  circular = false,
  fullHeightArrows = false,
}) => {
  const screenSize = useSelector((state) => state.screen);

  const visibleItems = useMemo(
    () => ({
      xs: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      ...itemsPerPage,
    }),
    [itemsPerPage]
  );

  const itemsVisible = visibleItems[screenSize.name] || 1;
  const totalItems = React.Children.count(children);
  const maxIndex = Math.max(0, totalItems - itemsVisible);

  const isControlled = typeof currentIndex === "number";
  const [internalIndex, setInternalIndex] = useState(defaultIndex);
  const index = isControlled ? currentIndex : internalIndex;

  const isAtStart = index <= 0;
  const isAtEnd = index >= maxIndex;

  const disablePrev = !circular && isAtStart;
  const disableNext = !circular && isAtEnd;

  const setIndex = (i) => {
    const next = clamp(i, 0, maxIndex);
    if (!isControlled) setInternalIndex(next);
    onChangeIndex && onChangeIndex(next);
  };
  const next = circular
    ? () => {
        if (disableNext) return;

        if (index >= maxIndex) {
          setIndex(0);
        } else {
          setIndex(index + 1);
        }
      }
    : () => setIndex(index + 1);

  const prev = circular
    ? () => {
        if (disablePrev) return;

        if (index <= 0) {
          setIndex(maxIndex);
        } else {
          setIndex(index - 1);
        }
      }
    : () => setIndex(index - 1);

  const isVisible = (i) => i >= index && i < index + itemsVisible;

  // Autoplay
  useEffect(() => {
    if (!autoPlay) return;

    const id = setInterval(() => {
      autoPlayDirection === "right" ? next() : prev();
    }, timeout);

    return () => clearInterval(id);
  }, [autoPlay, autoPlayDirection, timeout, index]);

  return (
    <Grid container alignItems="center" spacing={1} sx={{ height: "100%" }}>
      {showArrows && (
        <Grid size="auto" alignItems="center" height="100%">
          <Box
            onClick={prev}
            alignContent="center"
            sx={{
              p: 0.5,
              opacity: disablePrev ? 0.3 : 1,
              pointerEvents: disablePrev ? "none" : "auto",
              borderRadius: 2,
              "&:hover": disablePrev ? {} : { cursor: "pointer", boxShadow: 2 },
              height: fullHeightArrows ? "100%" : "auto",
            }}
          >
            <Icon className="c-izquierda-simple" />
          </Box>
        </Grid>
      )}

      <Grid size="grow" xs sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            display: "flex",
            transform: `translateX(-${(index * 100) / itemsVisible}%)`,
            transition: "transform .4s ease",
          }}
        >
          {React.Children.map(children, (child, i) => {
            const selected = i === index;

            return (
              <Box
                onClick={() => onSelectItem && onSelectItem(child, i)}
                sx={{
                  flex: `0 0 ${100 / itemsVisible}%`,
                  px: isVisible(i) ? 1 : 0,
                  height: isVisible(i) ? "auto" : 0,
                  overflow: "hidden",
                  pointerEvents: isVisible(i) ? "auto" : "none",
                  opacity: isVisible(i) ? 1 : 0,
                  transition: "opacity .3s, height .3s",
                }}
              >
                {child}
              </Box>
            );
          })}
        </Box>
      </Grid>

      {showArrows && (
        <Grid size="auto" alignItems="center" height="100%">
          <Box
            onClick={next}
            alignContent="center"
            sx={{
              p: 0.5,
              opacity: disableNext ? 0.3 : 1,
              pointerEvents: disableNext ? "none" : "auto",
              borderRadius: 2,
              "&:hover": disableNext ? {} : { cursor: "pointer", boxShadow: 2 },
              height: fullHeightArrows ? "100%" : "auto",
            }}
          >
            <Icon sx={{ my: "auto" }} className="c-derecha-simple" />
          </Box>
        </Grid>
      )}

      {showDots && (
        <Grid size={12} sx={{ textAlign: "center", mt: 1 }}>
          {[...Array(totalItems)].map((_, i) => (
            <Icon key={i} onClick={() => setIndex(i)} className={i === index ? "c-radio-button" : "c-circulo"} fontSize="0.3rem" sx={{ cursor: "pointer", mx: 0.3 }} />
          ))}
        </Grid>
      )}
    </Grid>
  );
};

ControlledCarruselComponent.propTypes = {
  children: PropTypes.node.isRequired,
  itemsPerPage: PropTypes.object,
  autoPlay: PropTypes.bool,
  autoPlayDirection: PropTypes.string,
  timeout: PropTypes.number,

  currentIndex: PropTypes.number,
  defaultIndex: PropTypes.number,
  onChangeIndex: PropTypes.func,
  onSelectItem: PropTypes.func,

  showDots: PropTypes.bool,
  showArrows: PropTypes.bool,
  circular: PropTypes.bool,
  fullHeightArrows: PropTypes.bool,
};
