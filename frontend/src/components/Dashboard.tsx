import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box } from '@mui/material';

type TownAnalytics = {
  town: string;
  average_price: number;
};

function Dashboard() {
  const [data, setData] = useState<TownAnalytics[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8080/analytics/avg-price-by-town');
        setData(response.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <Container>
      <Box sx={{ my: 2 }}>
        <Typography variant="h4" component="h1">
          Dashboard Analítico
        </Typography>
        <Button component={Link} to="/" variant="contained" sx={{ my: 1 }}>
          Volver a la lista
        </Button>
      </Box>
      
      <Typography variant="h6">Precio Promedio por Ciudad</Typography>
      <Box sx={{ width: '100%', height: 400, mt: 2 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="town" />
            <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} />
            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="average_price" fill="#8884d8" name="Precio Promedio" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}

export default Dashboard;