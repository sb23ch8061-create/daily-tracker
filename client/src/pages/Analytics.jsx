import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../components/Layout';
import api from '../utils/api';

const Analytics = () => {
  const [data, setData] = useState(null);
  const COLORS = ['#FF5555', '#B467FF', '#6BFF2C']; // High, Medium, Low

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/tasks/analytics');
        setData(data);
      } catch (err) {
        console.error('Error fetching analytics');
      }
    };
    fetchData();
  }, []);

  if (!data) return <Layout><div style={{color: 'white'}}>Loading...</div></Layout>;

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '32px' }}>Productivity Analytics</h2>

        {/* Top Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Completion Rate</p>
            <h3 style={{ fontSize: '32px', color: 'var(--accent-green)' }}>{data.completionRate}%</h3>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Total Tasks</p>
            <h3 style={{ fontSize: '32px', color: 'white' }}>{data.totalTasks}</h3>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Pending</p>
            <h3 style={{ fontSize: '32px', color: '#FF5555' }}>{data.pendingTasks}</h3>
          </div>
        </div>

        {/* Charts Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

          {/* Priority Chart */}
          <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '16px' }}>
            <h3 style={{ marginBottom: '20px' }}>Tasks by Priority</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.priorityDistribution}>
                  <XAxis dataKey="name" stroke="#A0A3AD" />
                  <YAxis stroke="#A0A3AD" />
                  <Tooltip contentStyle={{ backgroundColor: '#181A24', border: 'none' }} />
                  <Bar dataKey="value" fill="#B467FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Placeholder for future detailed chart */}
          <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>More insights coming soon...</p>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Analytics;