import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts'

const AccessChart = ({ data = [] }) => {
  // Match the exact data from your UI design
  const defaultData = [
    { day: 'Mon', granted: 0, denied: 0, exited: 0 },
    { day: 'Tue', granted: 1, denied: 0, exited: 0 },
    { day: 'Wed', granted: 2, denied: 1, exited: 0 },
    { day: 'Thu', granted: 4, denied: 2, exited: 1 },
    { day: 'Fri', granted: 8, denied: 1, exited: 2 },
    { day: 'Sat', granted: 10, denied: 0, exited: 3 }
  ]
  
  const chartData = data.length > 0 ? data : defaultData

  return (
    <div style={{ width: 600, height: 400, padding: '20px 10px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="none" stroke="transparent" />
          <XAxis 
            dataKey="day" 
            stroke="#9ca3af"
            fontSize={11}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af' }}
          />
          <YAxis 
            stroke="#9ca3af"
            fontSize={11}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af' }}
            domain={[0, 'auto']}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: '12px'
            }}
          />
          <Legend />
          <Bar 
            dataKey="granted" 
            fill="#10b981" 
            name="Entered"
            barSize={30}
            radius={[6, 6, 0, 0]}
          />
          <Bar 
            dataKey="denied" 
            fill="#ef4444" 
            name="Denied"
            barSize={30}
            radius={[6, 6, 0, 0]}
          />
          <Bar 
            dataKey="exited" 
            fill="#3b82f6" 
            name="Exited"
            barSize={30}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default AccessChart
