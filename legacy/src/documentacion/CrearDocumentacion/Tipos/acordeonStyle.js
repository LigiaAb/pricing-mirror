export const backgroundStyles = (color = "transparent") => ({ bgcolor: color });
const general = {
  marginY: 0,
  marginX: 0,
  marginRight: 0,
  paddingY: 0,
  paddingX: 0,
  lineHeight: 1,
  minHeight: "auto",
  boxShadow: "none",
  borderRadius: 0,
  ...backgroundStyles(),
};
export const acordionStyles = {
  "&.Mui-expanded": { ...general, paddingX: 0, "& .MuiCollapse-root": { ...general, my: 0, pl: 1.1 }, ml: 0 },
  "& .MuiCollapse-root": { ...general, my: 0, pl: 1.1 },
  "& .MuiAccordionSummary-root": { ...general, paddingX: 0, "& .MuiCollapse-root": { ...general, my: 0, pl: 1.1 }, ml: 0 },
  ...{ ...general, paddingX: 0, ml: 0 },
  "& button": {},
  "& .MuiGrid-root": {},
  m: 0,
};

export const acordionSumaryStyles = {
  m: 0,
  // "& .Mui-expanded": { bgcolor: "primary.main", m: "0 !important", p: "2px 3px !important" },
  "&.MuiAccordionSummary-content.Mui-expanded": {
    ...general,
    my: 0,
    ...backgroundStyles("primary.main"),
    color: "white.main",
    p: 0.3,
    textTransform: "uppercase",
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  "& .MuiAccordionSummary-content": {
    ...general,
    m: 0,
    ...backgroundStyles("primary.main"),
    color: "white.main",
    p: "2px 3px !important",
    textTransform: "uppercase",
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  "&.MuiAccordionSummary-gutters": { ...general, borderBottomLeftRadius: 8, borderTopRightRadius: 8 },
  "&.MuiAccordionSummary-contentGutters": { ...general, borderBottomLeftRadius: 8, borderTopRightRadius: 8 },
  ".MuiAccordionSummary-expandIconWrapper": { mx: 0, pr: 1, borderBottomLeftRadius: 8, borderTopRightRadius: 8 },
  "&.MuiAccordionSummary-expandIconWrapper": { mx: 0, pr: 1, borderBottomLeftRadius: 8, borderTopRightRadius: 8 },
  "& .MuiAccordionSummary-expandIconWrapper": { mx: 0, pr: 1, borderBottomLeftRadius: 8, borderTopRightRadius: 8 },
  ".Mui-expanded": {
    ...general,
    "& .MuiAccordionSummary-expandIconWrapper": { mx: 1, pr: 1 },
    my: 0,
    pr: 1,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  ...general,
  borderBottomLeftRadius: 8,
  borderTopRightRadius: 8,
  "& .Mui-expanded": { bgcolor: "primary.main", m: "0 !important", p: "2px 3px !important" },
};

export const acordionDetailsStyles = {
  "&.MuiAccordion-region": { ...general, m: 0, p: 0, pl: 1.1 },
  ...{ ...general, m: 0, p: 0, pl: 1.1 },
  borderWidth: 1,
  borderTopWidth: 0,
  borderColor: "primary.main",
  borderStyle: "solid",
  borderBottomRightRadius: 8,
};
