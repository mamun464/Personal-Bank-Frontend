// react-bootstrap
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import CountUp from 'react-countup';

// project-imports
import SalesPerformanceCard from 'components/cards/SalesPerformanceCard';
import SocialStatsCard from 'components/cards/SocialStatsCard';
import StatIndicatorCard from 'components/cards/StatIndicatorCard';
import { UsersMap, EarningChart, RatingCard, RecentUsersCard } from 'sections/dashboard/default';

// .meta.env.BACKEND_URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ===============================|| STAT INDICATOR CARD - DATA ||============================== //

const statIndicatorData = [
  { icon: 'ph ph-lightbulb-filament', value: '235', label: 'TOTAL IDEAS', iconColor: 'text-success' },
  { icon: 'ph ph-map-pin-line', value: '26', label: 'TOTAL LOCATION', iconColor: 'text-primary' }
];

// ===============================|| SOCIAL STATS CARD - DATA ||============================== //

const socialStatsData = [
  {
    icon: 'ti ti-brand-facebook-filled text-primary',
    count: '12,281',
    percentage: '+7.2%',
    color: 'text-success',
    stats: [
      {
        label: 'Target',
        value: '35,098',
        progress: {
          now: 60,
          className: 'bg-brand-color-1'
        }
      },
      {
        label: 'Duration',
        value: '3,539',
        progress: {
          now: 45,
          className: 'bg-brand-color-2'
        }
      }
    ]
  },
  {
    icon: 'ti ti-brand-twitter-filled text-info',
    count: '11,200',
    percentage: '+6.2%',
    color: 'text-primary',
    stats: [
      {
        label: 'Target',
        value: '34,185',
        progress: {
          now: 40,
          className: 'bg-success'
        }
      },
      {
        label: 'Duration',
        value: '4,567',
        progress: {
          now: 70
        }
      }
    ]
  },
  {
    icon: 'ti ti-brand-google-filled text-danger',
    count: '10,500',
    percentage: '+5.9%',
    color: 'text-primary',
    stats: [
      {
        label: 'Target',
        value: '25,998',
        progress: {
          now: 80,
          className: 'bg-brand-color-1'
        }
      },
      {
        label: 'Duration',
        value: '7,753',
        progress: {
          now: 50,
          className: 'bg-brand-color-2'
        }
      }
    ]
  }
];

// ===============================|| BACK AND FORTH PROGRESS BAR HOOK ||============================== //

function useBackAndForthProgress(cardLoading) {
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState(1);
  const [dummyNumbers, setDummyNumbers] = useState([0, 0, 0]); // ✅ moved here

  useEffect(() => {
    if (!cardLoading) {
      setProgress(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        let next = prev + direction * 5;
        if (next >= 85) {
          setDirection(-1);
          next = 85;
        } else if (next <= 0) {
          setDirection(1);
          next = 0;
        }
        return next;
      });
    }, 95);

    return () => clearInterval(progressInterval);
  }, [cardLoading, direction]);

  useEffect(() => {
    if (!cardLoading) return;

    const dummyInterval = setInterval(() => {
      setDummyNumbers([Math.floor(Math.random() * 2000), Math.floor(Math.random() * 3000), Math.floor(Math.random() * 5000)]);
    }, 125); // slower update → smooth counting

    return () => clearInterval(dummyInterval);
  }, [cardLoading]);

  return { progress, dummyNumbers };
}

// ================================|| DASHBOARD - DEFAULT ||============================== //

export default function DefaultPage() {
  // your stored token
  const token = localStorage.getItem('authkey');
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const AUTHORIZED_ROLES = ['admin', 'CEO', 'employee'];
  // Check if user is authorized
  const isAuthorized = AUTHORIZED_ROLES.includes(userData.role);

  const [dashboardPerformanceCardData, setDashboardPerformanceCardData] = useState([]);
  const [cardLoading, setCardLoading] = useState(true);

  const { progress, dummyNumbers } = useBackAndForthProgress(cardLoading);

  // ✅ Define the API call outside of useEffect
  const fetchDashboardData = async (e) => {
    if (!isAuthorized) {
      setCardLoading(false);
      return; // stop API call
    }
    setCardLoading(true);
    try {
      if (!token) {
        toast.error('No token found. Please login again.');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/wallet-api/dashboard-cards/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200 && response.data.success) {
        const { deposit, withdrawal, todays_balance } = response.data.data;

        setDashboardPerformanceCardData([
          {
            title: 'Daily Deposit',
            icon: deposit.progress ? 'ph ph-arrow-up text-success' : 'ph ph-arrow-down text-danger',
            amount: ` ${deposit.total_amount.toFixed(2)}`,
            progress: {
              now: Math.max(0, deposit.progress_percentage),
              className: deposit.progress ? 'bg-brand-color-1' : 'bg-brand-color-2'
            }
          },
          {
            title: 'Daily Withdrawal',
            icon: withdrawal.progress ? 'ph ph-arrow-up text-success' : 'ph ph-arrow-down text-danger',
            amount: ` ${withdrawal.total_amount.toFixed(2)}`,
            progress: {
              now: Math.max(0, withdrawal.progress_percentage),
              className: withdrawal.progress ? 'bg-brand-color-1' : 'bg-brand-color-2'
            }
          },
          {
            title: 'Today’s Balance',
            icon: todays_balance.progress ? 'ph ph-arrow-up text-success' : 'ph ph-arrow-down text-danger',
            amount: ` ${todays_balance.total_amount.toFixed(2)}`,
            progress: {
              now: Math.max(0, todays_balance.progress_percentage),
              className: todays_balance.progress ? 'bg-brand-color-1' : 'bg-brand-color-2'
            }
          }
        ]);
      } else {
        toast.error(response.data?.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setCardLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(); // ✅ just call it here
  }, []);
  return (
    <Row>
      {isAuthorized &&
        (cardLoading ? dummyNumbers : dashboardPerformanceCardData).map((item, index) => (
          <Col key={index} md={index === 2 ? 12 : 6} xl={4}>
            <SalesPerformanceCard
              title={item.title || ['Daily Deposit', 'Daily Withdrawal', 'Today’s Balance'][index]}
              icon={item.icon || 'spinner-border text-primary thin-spinner'}
              amount={`$ ${cardLoading ? dummyNumbers[index] : item.amount}`}
              progress={cardLoading ? { now: progress, className: 'bg-brand-color-1' } : item.progress}
            />
          </Col>
        ))}

      {/* Other dashboard sections remain unchanged */}
      <Col md={6} xl={8}>
        <UsersMap />
      </Col>
      <Col md={6} xl={4}>
        <EarningChart />
        <StatIndicatorCard
          data={[
            { icon: 'ph ph-lightbulb-filament', value: '235', label: 'TOTAL IDEAS', iconColor: 'text-success' },
            { icon: 'ph ph-map-pin-line', value: '26', label: 'TOTAL LOCATION', iconColor: 'text-primary' }
          ]}
        />
      </Col>
      <Col md={6} xl={4}>
        <RatingCard />
      </Col>
      <Col md={6} xl={8}>
        <RecentUsersCard />
      </Col>
    </Row>
  );
}
