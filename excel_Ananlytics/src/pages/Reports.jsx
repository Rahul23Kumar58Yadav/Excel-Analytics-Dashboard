import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';

// Animation for loading cards
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled components
const ReportsContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
`;

const Sidebar = styled.div`
  width: 250px;
  background: linear-gradient(135deg, #4a6bff 0%, #3a56d9 100%);
  color: white;
  padding: 2rem 1rem;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
`;

const MenuItem = styled.div`
  padding: 12px 16px;
  margin: 8px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  font-weight: 500;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background-color: rgba(255, 255, 255, 0.2);
    font-weight: 600;
  }

  svg {
    margin-right: 10px;
    font-size: 1.2rem;
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #2c3e50;
  font-weight: 700;
`;

const ActionButton = styled.button`
  background-color: #4a6bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 6px rgba(74, 107, 255, 0.2);

  &:hover {
    background-color: #3a56d9;
    transform: translateY(-2px);
  }

  svg {
    margin-right: 8px;
  }
`;

const ReportsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const ReportCard = styled.div`
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.5s ease forwards;
  opacity: 0;
  border-left: 4px solid ${props => props.color || '#4a6bff'};

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  &:nth-child(4) { animation-delay: 0.4s; }
  &:nth-child(5) { animation-delay: 0.5s; }
  &:nth-child(6) { animation-delay: 0.6s; }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 600;
`;

const CardBadge = styled.span`
  background-color: ${props => props.color || '#e3f2fd'};
  color: ${props => props.textColor || '#1976d2'};
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const CardContent = styled.div`
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #95a5a6;
`;

const CardAction = styled.button`
  background: none;
  border: none;
  color: #4a6bff;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #3a56d9;
    text-decoration: underline;
  }
`;

// Icons (using simple emojis as placeholders)
const DashboardIcon = () => <span>📊</span>;
const AnalyzeIcon = () => <span>🔍</span>;
const UploadIcon = () => <span>📤</span>;
const ReportsIcon = () => <span>📑</span>;
const SettingsIcon = () => <span>⚙️</span>;
const PlusIcon = () => <span>➕</span>;
const DownloadIcon = () => <span>⬇️</span>;
const ShareIcon = () => <span>↗️</span>;

const Reports = () => {
  const navigate = useNavigate()  
  const reportsData = [
    {
      id: 1,
      title: 'Sales Performance Q2 2023',
      description: 'Detailed analysis of sales trends, regional performance, and product category breakdown.',
      date: 'Jun 15, 2025',
      type: 'Sales',
      color: '#4a6bff',
      badgeColor: '#e3f2fd',
      badgeText: 'Updated'
    },
    {
      id: 2,
      title: 'Customer Acquisition Cost',
      description: 'Breakdown of marketing spend vs. new customer acquisition across all channels.',
      date: 'May 28, 2025',
      type: 'Marketing',
      color: '#ff6b6b',
      badgeColor: '#ffebee',
      badgeText: 'New'
    },
    {
      id: 3,
      title: 'Inventory Analysis',
      description: 'Current stock levels, turnover rates, and recommendations for reordering.',
      date: 'Jun 5, 2025',
      type: 'Operations',
      color: '#6bcebb',
      badgeColor: '#e0f2f1',
      badgeText: 'Active'
    },
    {
      id: 4,
      title: 'Employee Productivity',
      description: 'Performance metrics and productivity analysis across departments.',
      date: 'May 20, 2025',
      type: 'HR',
      color: '#ffb74d',
      badgeColor: '#fff3e0',
      badgeText: 'Review'
    },
    {
      id: 5,
      title: 'Financial Forecast 2023',
      description: 'Projected revenue, expenses, and profitability for the fiscal year.',
      date: 'Apr 30, 2025',
      type: 'Finance',
      color: '#9575cd',
      badgeColor: '#f3e5f5',
      badgeText: 'Critical'
    },
    {
      id: 6,
      title: 'Website Analytics',
      description: 'Traffic sources, conversion rates, and user behavior patterns.',
      date: 'Jun 10, 2025',
      type: 'Digital',
      color: '#4dd0e1',
      badgeColor: '#e0f7fa',
      badgeText: 'Trending'
    }
  ];

  return (
    <ReportsContainer>
      

      <MainContent>
        <Header>
          <Title>Reports</Title>
          <ActionButton onClick={() => navigate("/reports/generate")}>
          <PlusIcon /> Generate New Report
          </ActionButton>
        </Header>

        <ReportsGrid>
          {reportsData.map((report, index) => (
            <ReportCard key={report.id} color={report.color}>
              <CardHeader>
                <CardTitle>{report.title}</CardTitle>
                <CardBadge color={report.badgeColor} textColor={report.color}>
                  {report.badgeText}
                </CardBadge>
              </CardHeader>
              <CardContent>{report.description}</CardContent>
              <CardFooter>
                <span>{report.date}</span>
                <div>
                  <CardAction>
                    <DownloadIcon /> Download
                  </CardAction>
                  <CardAction style={{ marginLeft: '10px' }}>
                    <ShareIcon /> Share
                  </CardAction>
                </div>
              </CardFooter>
            </ReportCard>
          ))}
        </ReportsGrid>
      </MainContent>
    </ReportsContainer>
  );
};

export default Reports;