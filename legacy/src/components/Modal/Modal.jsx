import styled from '@emotion/styled';
import React from 'react';

const ModalWrapper = styled.div`
position: fixed;
z-index: 99;
left: 0;
top: 0;
width: 100%;
height: 100%;
overflow: auto;
background-color: rgba(0, 0, 0, 0.4);

`;

const ModalContainer = styled.div`
  position: relative;
  background-color: #fefefe;
  margin: 20% auto;
  width: 80%;
  z-index: 100;
  padding: 1rem;
  min-height: 200px;
  min-width: 200px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  animation-name: animatetop;
  animation-duration: 0.4s;
  @keyframes animatetop {
    from {
      top: -400px;
      opacity: 0;
    }
    to {
      top: 0;
      opacity: 1;
    }
  }
`;
const Closed = styled.div`
  text-align: right;
   margin-bottom: 15px;
  font-size: 1.25rem;
  font-weight: bold;
  & span {
    cursor: pointer;
    padding-right: 0.5rem;
    &:hover {
      color: #d0d0d0;
    }
  }
`;

export const Modal = ({children, onClose, open}) => {
    if(!open) return null


  return (
    <ModalWrapper>
        <ModalContainer>
            <Closed onClick={onClose}>
                <span>&times;</span>
            </Closed>
            {children}
        </ModalContainer>
    </ModalWrapper>
  )
}
