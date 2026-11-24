import React, { useState, useRef, useEffect } from 'react';
import { Box, Icon, Typography, IconButton } from '@mui/material';
import propTypes from 'prop-types';
import { useSelector } from "react-redux";

const TimePickerComponent = (props) => {
    const { onChange = () => {}, value, showSeconds = false } = props;
    const screenSize = useSelector((state) => state.screen);
    const [hour, setHour] = useState(value ? new Date(value).getHours() : 0);
    const [minute, setMinute] = useState(value ? new Date(value).getMinutes() : 0);
    const [second, setSecond] = useState(value ? new Date(value).getSeconds() : 0);

    const [ localUpdate, setLocalUpdate ] = useState(false);
    const [ initialLoad, setInitialLoad ] = useState(true);

    const hourRef = useRef(null);
    const minuteRef = useRef(null);
    const secondRef = useRef(null);

    const itemHeight = 30; 
    const hours = Array.from({ length: 24 }, (_, i) => i); 
    const minutes = Array.from({ length: 60 }, (_, i) => i); 

    const centerSelectedItem = (ref, selectedIndex) => {
        if (ref.current) {
            const containerHeight = ref.current.offsetHeight;
            const scrollOffset = selectedIndex * itemHeight - containerHeight / 2 + itemHeight / 2;
            ref.current.scrollTop = scrollOffset;
        }
    };

    const onClickUpHour = (ref) => {
        setHour(Math.max(hour - 1, 0));
    };

    const onClickDownHour = (ref) => {
        setHour(Math.min(hour + 1, 23));
    };

    const onClickUpMinute = (ref) => {
        setMinute(Math.max(minute - 1, 0));
    };

    const onClickDownMinute = (ref) => {
        setMinute(Math.min(minute + 1, 59));
    };

    const onClickUpSecond = (ref) => {
        setSecond(Math.max(second - 1, 0));
    };

    const onClickDownSecond = (ref) => {
        setSecond(Math.min(second + 1, 59));
    };   
    
    useEffect(() => {
        if(localUpdate){
            setLocalUpdate(false);
        }else{
            if(initialLoad){
                setInitialLoad(false);
            }else{
                setHour(new Date(value).getHours());
                setMinute(new Date(value).getMinutes());
                setSecond(new Date(value).getSeconds());
            }
        }
    }, [value]);

    useEffect(() => {
        centerSelectedItem(hourRef, hour);
        centerSelectedItem(minuteRef, minute);
        centerSelectedItem(secondRef, second);

        if(value < 0 || value == null){
            let date = new Date();
            date.setHours(0, 0, 0);
            onChange(null);

        } else {
            let date = new Date(value);
            date.setHours(hour, minute, showSeconds ? second : 0);
            onChange(new Date(date));
        }
        
    }, [hour, minute, second]);

    return (
        <Box sx={{ display: 'flex', flexDirection: "column", py: 2, height: "270px", px: 2,
            width: ["xs", "sm"].includes(screenSize.name) ? "250px" : "auto"
        }}>
            <Box sx={{ justifyContent: 'center', display: 'flex', gap: 2 }}>
                <Box sx={{ textAlign: 'center', display:"flex", justifyContent:"center", flexDirection:"column" }}>
                    <Box sx={{ marginBottom: '5', pb: 0.8 }}>Hora</Box>
                    <Box sx={{ border: '1px solid #ccc', borderRadius: '5px'}}>

                        <IconButton onClick={onClickUpHour} sx={upButtonStyles}>
                            <Typography className='c-arriba-simple' sx={{fontSize:"1rem"}}/>
                        </IconButton>

                        <Box ref={hourRef} sx={scrollableListStyles}>
                            {hours.map((h, index) => (
                                <Box
                                    key={h}
                                    onClick={() => { setHour(h); setLocalUpdate(true); }}
                                    sx={{
                                        padding: '10px',
                                        cursor: 'pointer',
                                        backgroundColor: h === hour ? 'primary.main' : 'transparent',
                                        color: h === hour ? 'white.main' : 'text.main',
                                        height: `${itemHeight}px`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    >
                                    {h < 10 ? `0${h}` : h}
                                </Box>
                            ))}
                        </Box>
                        <IconButton sx={downButtonStyles} onClick={onClickDownHour}>
                            <Typography className='c-abajo-simple' sx={{fontSize:"1rem"}}/>
                        </IconButton>
                    </Box>
                </Box>
                <Box sx={{ textAlign: 'center', display:"flex", justifyContent:"center", flexDirection:"column" }}>
                    <Box sx={{ marginBottom: '5', pb: 0.8 }}>Minuto</Box>
                    <Box sx={{ border: '1px solid #ccc', borderRadius: '5px'}}>
                        <IconButton sx={upButtonStyles} onClick={onClickUpMinute}>
                            <Typography className='c-arriba-simple' sx={{fontSize:"1rem"}}/>
                        </IconButton>
                        <Box ref={minuteRef} sx={scrollableListStyles}>
                            {minutes.map((m, index) => (
                                <Box
                                    key={m}
                                    onClick={() => {setMinute(m); setLocalUpdate(true);}}
                                    sx={{
                                        padding: '10px',
                                        cursor: 'pointer',
                                        backgroundColor: m === minute ? 'primary.main' : 'transparent',
                                        color: m === minute ? 'white.main' : 'text.main',
                                        height: `${itemHeight}px`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    >
                                    {m < 10 ? `0${m}` : m}
                                </Box>
                            ))}
                        </Box>
                        <IconButton sx={downButtonStyles} onClick={onClickDownMinute}> 
                            <Typography className='c-abajo-simple' sx={{fontSize:"1rem"}}/>
                        </IconButton>
                    </Box>
                </Box>

                {
                    showSeconds &&
                    <Box sx={{ textAlign: 'center', display:"flex", justifyContent:"center", flexDirection:"column" }}>
                        <Box sx={{ marginBottom: '5', pb: 0.8 }}>Segundo</Box>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: '5px', width:"50px"}}>
                            <Box sx={upButtonStyles} onClick={onClickUpSecond}>
                                <Typography className='c-arriba-simple' sx={{fontSize:"1rem"}}/>
                            </Box>
                            <Box ref={secondRef} sx={scrollableListStyles}>
                                {minutes.map((s, index) => (
                                    <Box
                                        key={s}
                                        onClick={() => {setSecond(s); setLocalUpdate(true);}}
                                        sx={{
                                            padding: '10px',
                                            cursor: 'pointer',
                                            backgroundColor: s === second ? 'primary.main' : 'transparent',
                                            color: s === second ? 'white.main' : 'text.main',
                                            height: `${itemHeight}px`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                        >
                                        {s < 10 ? `0${s}` : s}
                                    </Box>
                                ))}
                            </Box>
                            <Box sx={downButtonStyles} onClick={onClickDownSecond}> 
                                <Typography className='c-abajo-simple' sx={{fontSize:"1rem"}}/>
                            </Box>
                        </Box>
                    </Box>
                }
            </Box>
        </Box>
    );};

const scrollableListStyles = {
  height: '180px',
  width: '50px !important',
  maxWidth: '50px',
  scrollBehavior: 'smooth',
  overflowX: 'hidden',
  overflowY: 'scroll',
  scrollbarWidth: "none",
};

const upButtonStyles = {
    bgcolor:"backgroun.100", 
    borderBottom: 1,
    borderColor: 'text.A100',
    borderRadius: "5px 5px 0 0",
    cursor: 'pointer',
    maxHeight: "25px",
}

const downButtonStyles = {
    bgcolor:"backgroun.100", 
    borderTop: 1,
    borderColor: 'text.A100',
    borderRadius: "0 0 5px 5px",
    cursor: 'pointer',
    maxHeight: "25px",
}

TimePickerComponent.propTypes = {
    onChange: propTypes.func,
};
  

export default TimePickerComponent;