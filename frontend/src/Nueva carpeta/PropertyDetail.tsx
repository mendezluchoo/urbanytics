// src/components/PropertyDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // Importar useParams
import axios from 'axios';

type Property = {
  serial_number: number;
  town: string;
  sale_amount: number;
  property_type: string;
};

function PropertyDetail() {
  const { id } = useParams<{ id: string }>(); // Obtiene el 'id' de la URL
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
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
  }, [id]); // Se ejecuta cada vez que el 'id' de la URL cambie

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {property && (
        <>
          <h1>Detalle de la Propiedad: {property.serial_number}</h1>
          <p><strong>Ciudad:</strong> {property.town}</p>
          <p><strong>Tipo:</strong> {property.property_type}</p>
          <p><strong>Precio de Venta:</strong> ${property.sale_amount.toLocaleString()}</p>
        </>
      )}
      <br />
      <Link to="/">Volver a la lista</Link>
    </div>
  );
}

export default PropertyDetail;