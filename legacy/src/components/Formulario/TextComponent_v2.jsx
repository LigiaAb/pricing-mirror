import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box, FormControl, InputBase, InputLabel, TextField, Typography } from "@mui/material";
import { Field } from "@base-ui-components/react/field";

const TextComponent_v2 = (props) => {
  const [isFocus, setIsFocus] = useState(false);

  return (
    <>
      <InputBase fullWidth />
    </>
  );
};

TextComponent_v2.propTypes = {};

export default TextComponent_v2;
