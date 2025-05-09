import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound = () => {
  return (
    <Container>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" sx={{ mb: 2, fontSize: { xs: '5rem', sm: '8rem' } }}>
          404
        </Typography>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '500px' }}>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          startIcon={<HomeIcon />}
        >
          Back to Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound; 