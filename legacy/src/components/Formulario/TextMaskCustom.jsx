import React, { forwardRef } from "react";
import MaskedInput from "react-text-mask";
import PropTypes from "prop-types";

// import { IMaskInput } from 'react-imask';

const TextMaskCustom = forwardRef(function TextMaskCustom(props, ref) {
  const { mask, input = {}, ...other } = props;

  return (
    <>
      <MaskedInput
        {...other}
        inputRef={ref}
        mask={mask}
        placeholderChar={input.placeholderChar || " "}
        showMask
        overwrite
        keepCharPositions
        onFocus={(ev) => ev.target.setSelectionRange(0, 0)}
        onClick={(ev) => ev.target.setSelectionRange(0, 0)}
        definitions={{
          "#": /[1-9]/,
        }}
      />
    </>
  );
});

TextMaskCustom.propTypes = {
  mask: PropTypes.string,
  id: PropTypes.string,
  input: PropTypes.object,
};

export default TextMaskCustom;
