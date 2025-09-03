import React, { useEffect, useRef } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Chart2D = ({ data, chartType, xAxis, yAxis }) => {
  const chartRef = useRef(null);

  // Cleanup chart on unmount to prevent canvas reuse errors
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        const chart = chartRef.current;
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      }
    };
  }, []);

  // Cleanup and recreate when chart type or data changes
  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    }
  }, [chartType, data, xAxis, yAxis]);

  if (!data || !xAxis || !yAxis) {
    return <div className="p-4 bg-gray-100 rounded">Please select X and Y axes</div>;
  }

  // Prepare chart data
  const labels = data.map((row) => row[xAxis]);
  const chartData = {
    labels,
    datasets: [
      {
        label: yAxis,
        data: data.map((row) => row[yAxis]),
        backgroundColor: chartType === 'pie' 
          ? [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 205, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
              'rgba(255, 159, 64, 0.5)',
            ]
          : 'rgba(54, 162, 235, 0.5)',
        borderColor: chartType === 'pie'
          ? [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 205, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
            ]
          : 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${xAxis} vs ${yAxis}`,
      },
    },
    // Only add scales for bar and line charts, not pie charts
    ...(chartType !== 'pie' && {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    }),
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      options,
      ref: chartRef,
    };

    switch (chartType) {
      case 'bar':
        return <Bar {...commonProps} />;
      case 'line':
        return <Line {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      default:
        return <Bar {...commonProps} />;
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="h-96">{renderChart()}</div>
    </div>
  );
};

export default Chart2D;