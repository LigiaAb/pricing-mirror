import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Card, Box, Typography, Grid, Button, Icon, CircularProgress, Slide } from "@mui/material";
import { useSelector } from "react-redux";
import Carousel from "react-material-ui-carousel";

export const CarruselComponent = (props) => {
  const { children, itemsPerPage = {}, autoPlay = false, autoPlayDirection = "right", timeout = 3000 } = props;
  const screenSize = useSelector((state) => state.screen);
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleItems = {
    xs: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
    ...itemsPerPage,
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % children.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + children.length) % children.length);
  };

  // Handle autoplay
  useEffect(() => {
    const intervalId = setInterval(() => {
      autoPlay ? (autoPlayDirection == "right" ? nextSlide() : prevSlide()) : null;
    }, timeout);
    return () => clearInterval(intervalId);
  }, [currentIndex]);

  return (
    <Grid
      container
      spacing={1}
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        py: 1,
      }}
    >
      <Grid
        item
        size={0.5}
        sx={{
          borderRadius: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 1,
          "&:hover": {
            boxShadow: 2,
            bgcolor: "primary.main",
            color: "white.main",
            cursor: "pointer",
          },
        }}
        onClick={prevSlide}
      >
        <Icon className="c-izquierda-simple" fontSize="large" />
      </Grid>

      <Grid item size="grow" sx={{ overflow: "hidden", py: 0.5 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            transform: `translateX(-${currentIndex * (100 / visibleItems[screenSize.name])}%)`,
            transition: "transform 0.5s ease-in-out",
            width: "100%",
          }}
        >
          {children.map((item, idx) => (
            <Box
              key={idx}
              sx={{
                display: "flex",
                flex: `0 0 ${100 / visibleItems[screenSize.name]}%`,
                justifyContent: "center",
                justifyItems: "center",
                alignContent: "center",
                alignItems: "center",
                boxSizing: "border-box",
                px: 1,
                // height:"100%"
              }}
            >
              {item}
            </Box>
          ))}
        </Box>
      </Grid>

      <Grid
        item
        size={0.5}
        sx={{
          borderRadius: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 1,
          "&:hover": {
            boxShadow: 2,
            bgcolor: "primary.main",
            color: "white.main",
            cursor: "pointer",
          },
        }}
        onClick={nextSlide}
      >
        <Icon className="c-derecha-simple" fontSize="large" />
      </Grid>

      <Grid
        item
        size={12}
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <Grid container spacing={1}>
          {children.map((item, i) => (
            <Icon
              key={i}
              className={i == currentIndex ? "c-radio-button" : "c-circulo"}
              fontSize="0.2rem"
              color="primary"
              onClick={() => setCurrentIndex(i)}
              sx={{ "&:hover": { cursor: "pointer" } }}
            />
          ))}
        </Grid>
      </Grid>
    </Grid>
  );
};

CarruselComponent.propTypes = {
  children: PropTypes.arrayOf(PropTypes.node).isRequired,
  itemsPerPage: PropTypes.number,
  autoPlay: PropTypes.bool,
  autoPlayDirection: PropTypes.string,
  timeout: PropTypes.number,
};
