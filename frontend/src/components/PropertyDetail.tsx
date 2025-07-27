import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
// Importaciones de Material-UI (con Box incluido)
import { Container, Typography, Button, Box } from '@mui/material';

type Property = {
  serial_number: number;
  town: string;
  sale_amount: number;
  property_type: string;
};

function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:8080/properties/${id}`);
        setProperty(response.data);
      } catch (err) {
        setError('Property not found.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <Container>
      {property && (
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Detalle de la Propiedad: {property.serial_number}
          </Typography>
          <Typography variant="h6"><strong>Ciudad:</strong> {property.town}</Typography>
          <Typography variant="h6"><strong>Tipo:</strong> {property.property_type}</Typography>
          <Typography variant="h6"><strong>Precio de Venta:</strong> ${property.sale_amount.toLocaleString()}</Typography>
        </Box>
      )}
      <Button component={Link} to="/" variant="contained">Volver a la lista</Button>
    </Container>
  );
}

export default PropertyDetail;