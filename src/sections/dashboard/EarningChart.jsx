// third-party
import ReactApexChart from 'react-apexcharts';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

// project-imports
import MainCard from 'components/MainCard';
// .meta.env.BACKEND_URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// =============================|| DEFAULT - EARNING CHART ||============================== //

export default function EarningChart() {
  const token = localStorage.getItem('authkey');

  const [realtimeBalance, setRealtimeBalance] = useState(0);
  const [monthlyTransactions, setMonthlyTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  // ✅ Animation state
  // heartbeat animation state
  const [animatedData, setAnimatedData] = useState(new Array(12).fill(0));
  const [frame, setFrame] = useState(0);

  // ✅ Heartbeat pattern (ECG style)
  const heartbeatPattern = [0, 0, 80, -40, 0, 0, 0, 0, 0, 0, , 0, 0];

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setAnimatedData((prev) => {
        // Shift previous values left by one position
        const newArr = [...prev.slice(1), heartbeatPattern[frame]];
        return newArr;
      });

      setFrame((prev) => (prev >= heartbeatPattern.length - 1 ? 0 : prev + 1));
    }, 150); // adjust speed to look natural

    return () => clearInterval(interval);
  }, [loading, frame]);

  // ✅ API call defined outside useEffect
  const fetchWalletData = async (e) => {
    setLoading(true);
    try {
      if (!token) {
        toast.error('No token found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/wallet-api/wallet-cards/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200 && response.data.success) {
        const { realtime_balance, monthly_transactions } = response.data.data;
        setRealtimeBalance(realtime_balance);
        setMonthlyTransactions(monthly_transactions);
      } else {
        toast.error(response.data?.message || 'Failed to fetch wallet data ');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ just call it inside useEffect
  useEffect(() => {
    fetchWalletData();
  }, []);

  // chart-options
  const chartOptions = {
    series: [{ name: 'Monthly Balance', data: loading ? animatedData : monthlyTransactions, color: '#fff' }],

    options: {
      chart: {
        toolbar: {
          show: false
        },
        animations: { enabled: false }
      },
      dataLabels: {
        enabled: false
      },
      markers: {
        size: 6,
        hover: {
          size: 5
        }
      },
      stroke: {
        curve: 'straight',
        width: 6
      },

      grid: {
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: false
          }
        }
      },

      tooltip: {
        x: {
          show: false
        },

        marker: {
          show: false
        }
      },

      yaxis: {
        labels: {
          show: false
        }
      },

      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        axisTicks: {
          show: false
        },
        axisBorder: {
          show: false
        },
        labels: {
          style: {
            colors: '#fff'
          }
        }
      }
    }
  };

  return (
    <MainCard
      title={<p className="mb-0 text-white">Savings</p>}
      headerClassName="border-0"
      className="bg-primary overflow-hidden"
      bodyClassName="py-0"
    >
      <div className="earning-text">
        <h3 className="mb-2 text-white f-w-300">
          $ {realtimeBalance} {loading && <span className="spinner-border text-light thin-spinner" role="status"></span>}
        </h3>
        <span className="text-uppercase text-white d-block">Total Balance</span>
      </div>
      <ReactApexChart options={chartOptions.options} series={chartOptions.series} type="line" height={210} />
    </MainCard>
  );
}
