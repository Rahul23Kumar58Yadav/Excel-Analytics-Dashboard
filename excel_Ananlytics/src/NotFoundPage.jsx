import React from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// Animations
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const gradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Styled Components
const NotFoundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(-45deg, #4a6bff, #3a56d9, #6bcebb, #4dd0e1);
  background-size: 400% 400%;
  animation: ${gradient} 15s ease infinite;
  color: white;
  text-align: center;
  overflow: hidden;
  padding: 1rem;
`;

const NotFoundContent = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const NotFoundTitle = styled.h1`
  font-size: 5rem;
  margin: 0.5rem 0;
  font-weight: 900;
  background: linear-gradient(to right, #fff, #e0e0e0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const NotFoundSubtitle = styled.h2`
  font-size: 1.5rem;
  margin: 0.5rem 0;
  font-weight: 500;
`;

const NotFoundText = styled.p`
  font-size: 1rem;
  margin: 1rem 0 1.5rem;
  line-height: 1.5;
`;

const NotFoundImage = styled.div`
  width: 120px;
  height: 120px;
  margin: 0 auto 1rem;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffffff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  animation: ${float} 3s ease-in-out infinite;
  opacity: 0.9;
`;

const HomeButton = styled(Link)`
  display: inline-block;
  padding: 10px 24px;
  background: white;
  color: #4a6bff;
  border-radius: 50px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid white;
  font-size: 1rem;
  
  &:hover {
    background: transparent;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
  }
`;

const NotFoundPage = () => {
  return (
    <NotFoundContainer>
      <NotFoundContent>
        <NotFoundImage />
        <NotFoundTitle>404</NotFoundTitle>
        <NotFoundSubtitle>Oops! Page Not Found</NotFoundSubtitle>
        <NotFoundText>
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable. Let's get you back to familiar territory.
        </NotFoundText>
        <HomeButton to="/">Return Home</HomeButton>
      </NotFoundContent>
    </NotFoundContainer>
  );
};

export default NotFoundPage;