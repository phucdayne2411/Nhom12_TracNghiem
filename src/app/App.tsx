import { RouterProvider } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './context/auth-context';
import { router } from './routes';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </AuthProvider>
  );
}

export default App;