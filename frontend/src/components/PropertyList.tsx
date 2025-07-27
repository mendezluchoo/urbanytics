import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Container, TextField, Button, Box, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';

type Property = {
  serial_number: number;
  town: string;
  sale_amount: number;
  property_type: string;
};

function PropertyList() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTown, setFilterTown] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:8080/properties', {
          params: { town: searchTerm || null }
        });
        setProperties(response.data);
      } catch (err) {
        setError('Failed to fetch properties.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchTerm]);

  const handleSearch = () => {
    setSearchTerm(filterTown);
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
        <Typography variant="h4" component="h1">
          Urbanytics Property List
        </Typography>
        <Button component={Link} to="/dashboard" variant="contained">Ir al Dashboard</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField 
          label="Filtrar por Ciudad" 
          variant="outlined"
          value={filterTown}
          onChange={(e) => setFilterTown(e.target.value)}
          size="small"
        />
        <Button variant="contained" onClick={handleSearch}>Buscar</Button>
      </Box>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && (
        <List>
          {properties.map((prop) => (
            <ListItem key={prop.serial_number} disablePadding>
              <ListItemButton component={Link} to={`/properties/${prop.serial_number}`}>
                <ListItemText 
                  primary={`${prop.town} (${prop.property_type})`}
                  secondary={`$${prop.sale_amount.toLocaleString()}`}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
}

export default PropertyList;